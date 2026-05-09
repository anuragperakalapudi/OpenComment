import { NextResponse } from "next/server";
import {
  isLLMConfigured,
  isSupabaseConfigured,
} from "@/lib/config";
import { currentModel, generate } from "@/lib/llm/client";
import { generateWithGate } from "@/lib/llm/postprocess";
import { buildLongSummaryPrompt } from "@/lib/llm/prompts/longSummary";
import {
  buildKeyProvisionsPrompt,
  parseProvisions,
} from "@/lib/llm/prompts/keyProvisions";
import {
  getCachedRegulation,
  upsertRegulationCache,
} from "@/lib/db/cache";
import type { Regulation } from "@/lib/types";

interface RequestBody {
  regulation: Regulation;
}

export async function POST(req: Request) {
  if (!isLLMConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }
  const body = (await req.json()) as RequestBody;
  if (!body?.regulation?.id) {
    return NextResponse.json({ error: "missing regulation" }, { status: 400 });
  }
  const reg = body.regulation;

  // Cache hit?
  if (isSupabaseConfigured) {
    try {
      const cached = await getCachedRegulation(reg.id);
      if (cached?.longSummary && cached.keyProvisions) {
        return NextResponse.json({
          longSummary: cached.longSummary,
          keyProvisions: cached.keyProvisions,
          affectedGroups: [],
          model: cached.modelVersion,
          cached: true,
        });
      }
    } catch {
      // fall through to generation
    }
  }

  try {
    const longPrompt = buildLongSummaryPrompt(reg);
    const provisionsPrompt = buildKeyProvisionsPrompt(reg);

    const [longResult, provisionsRaw] = await Promise.all([
      generateWithGate(
        (attempt) =>
          generate(longPrompt.prompt, {
            task: "fast",
            systemInstruction: longPrompt.systemInstruction,
            temperature: 0.4 + attempt * 0.1,
            maxOutputTokens: 1200,
          }),
        { maxRetries: 1 },
      ),
      generate(provisionsPrompt.prompt, {
        task: "fast",
        systemInstruction: provisionsPrompt.systemInstruction,
        temperature: 0.3,
        maxOutputTokens: 800,
      }),
    ]);

    const provisions = parseProvisions(provisionsRaw);

    // Parse and strip the AFFECTED: line from the long summary.
    const affectedMatch = longResult.text.match(/^AFFECTED:\s*(.+)/im);
    const affectedGroups = affectedMatch
      ? affectedMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const longSummary = longResult.text
      .replace(/^AFFECTED:.*(\r?\n)*/im, "")
      .trim();

    if (isSupabaseConfigured) {
      try {
        await upsertRegulationCache({
          documentId: reg.id,
          docketId: reg.docketId,
          longSummary,
          keyProvisions: provisions,
          modelVersion: currentModel("fast"),
        });
      } catch {
        // non-fatal: return uncached
      }
    }

    return NextResponse.json({
      longSummary,
      keyProvisions: provisions,
      affectedGroups,
      model: currentModel("fast"),
      cached: false,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "generation_failed",
        message: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 },
    );
  }
}
