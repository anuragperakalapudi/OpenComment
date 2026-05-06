import { NextResponse } from "next/server";
import { buildRegulationsUrl, mapApiResponse } from "@/lib/regulationsApi";
import {
  isLLMConfigured,
  isSupabaseConfigured,
} from "@/lib/config";
import { currentModel, generate } from "@/lib/llm/client";
import { generateWithGate } from "@/lib/llm/postprocess";
import { buildShortSummaryPrompt } from "@/lib/llm/prompts/shortSummary";
import {
  getCachedShortSummaries,
  upsertRegulationCache,
} from "@/lib/db/cache";
import { ensureRegulationEmbedding } from "@/lib/semantic";

// Vercel Cron protection: when running on Vercel, requests carry a known
// "x-vercel-cron" header. Locally / via curl we accept a bearer token.
function isAuthorized(req: Request): boolean {
  if (req.headers.get("x-vercel-cron")) return true;
  const auth = req.headers.get("authorization");
  const token = process.env.CRON_SECRET;
  return !!token && auth === `Bearer ${token}`;
}

const MAX_GENERATIONS_PER_RUN = 80;
const MAX_EMBEDDINGS_PER_RUN = 80;

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isLLMConfigured || !isSupabaseConfigured) {
    return NextResponse.json(
      { error: "not_configured" },
      { status: 501 },
    );
  }

  const apiKey = process.env.REGULATIONS_GOV_API_KEY ?? "DEMO_KEY";
  const apiUrl = buildRegulationsUrl();

  let regulations: ReturnType<typeof mapApiResponse> = [];
  try {
    const res = await fetch(apiUrl, {
      headers: { "X-Api-Key": apiKey, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`regulations.gov returned ${res.status}`);
    const json = (await res.json()) as { data?: unknown[] };
    const items = Array.isArray(json.data) ? json.data : [];
    regulations = mapApiResponse(items as never[], []);
  } catch (err) {
    return NextResponse.json(
      { error: "fetch_failed", message: err instanceof Error ? err.message : "unknown" },
      { status: 502 },
    );
  }

  const ids = regulations.map((r) => r.id);
  const cached = await getCachedShortSummaries(ids);
  const cold = regulations.filter((r) => !cached.has(r.id));
  const targets = cold.slice(0, MAX_GENERATIONS_PER_RUN);

  let generated = 0;
  let failed = 0;
  for (const reg of targets) {
    const { systemInstruction, prompt } = buildShortSummaryPrompt(reg);
    try {
      const result = await generateWithGate(
        () =>
          generate(prompt, {
            task: "fast",
            systemInstruction,
            temperature: 0.5,
            maxOutputTokens: 120,
          }),
        { maxRetries: 1 },
      );
      await upsertRegulationCache({
        documentId: reg.id,
        docketId: reg.docketId,
        shortSummary: result.text,
        modelVersion: currentModel("fast"),
      });
      generated++;
    } catch {
      failed++;
    }
  }

  let embeddingsGenerated = 0;
  let embeddingsFailed = 0;
  for (const reg of regulations) {
    if (embeddingsGenerated >= MAX_EMBEDDINGS_PER_RUN) break;
    try {
      const didGenerate = await ensureRegulationEmbedding(reg);
      if (didGenerate) embeddingsGenerated++;
    } catch {
      embeddingsFailed++;
    }
  }

  return NextResponse.json({
    ok: true,
    fetched: regulations.length,
    alreadyCached: cached.size,
    coldRemaining: cold.length - generated,
    generated,
    failed,
    embeddingsGenerated,
    embeddingsFailed,
  });
}
