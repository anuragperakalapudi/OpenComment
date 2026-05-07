import { NextResponse } from "next/server";
import { isLLMConfigured } from "@/lib/config";
import { currentModel, generate } from "@/lib/llm/client";
import { generateWithGate } from "@/lib/llm/postprocess";
import {
  buildCommentPrompt,
  type CommentVariant,
} from "@/lib/llm/prompts/comment";
import type { Regulation, UserProfile } from "@/lib/types";

interface RequestBody {
  regulation: Regulation;
  profile: UserProfile;
  variant: CommentVariant;
}

export async function POST(req: Request) {
  if (!isLLMConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }
  const body = (await req.json()) as RequestBody;
  if (!body?.regulation || !body?.profile || !body?.variant) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const { systemInstruction, prompt } = buildCommentPrompt(
    body.regulation,
    body.profile,
    body.variant,
  );

  try {
    const result = await generateWithGate(
      (attempt) =>
        generate(prompt, {
          task: "quality",
          systemInstruction,
          temperature: 0.7 + attempt * 0.1,
          maxOutputTokens: 1500,
        }),
      { maxRetries: 2 },
    );

    return NextResponse.json({
      text: result.text,
      flags: result.flags,
      ok: result.ok,
      model: currentModel("quality"),
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
