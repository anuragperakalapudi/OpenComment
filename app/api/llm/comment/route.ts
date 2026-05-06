import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import {
  isClerkConfigured,
  isLLMConfigured,
  isSupabaseConfigured,
} from "@/lib/config";
import { listStories } from "@/lib/db/stories";
import { currentModel, generate } from "@/lib/llm/client";
import { generateWithGate } from "@/lib/llm/postprocess";
import {
  buildCommentPrompt,
  type CommentVariant,
} from "@/lib/llm/prompts/comment";
import { selectRelevantStories } from "@/lib/stories";
import type { Regulation, UserProfile } from "@/lib/types";

interface RequestBody {
  regulation: Regulation;
  profile: UserProfile;
  variant: CommentVariant;
}

async function relevantStoriesFor(regulation: Regulation) {
  if (!isClerkConfigured || !isSupabaseConfigured) return [];
  const userId = await currentUserId();
  if (!userId) return [];
  try {
    return selectRelevantStories(await listStories(userId), regulation, 2);
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  if (!isLLMConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }
  const body = (await req.json()) as RequestBody;
  if (!body?.regulation || !body?.profile || !body?.variant) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const stories = await relevantStoriesFor(body.regulation);
  const { systemInstruction, prompt } = buildCommentPrompt(
    body.regulation,
    body.profile,
    body.variant,
    stories,
  );

  try {
    const result = await generateWithGate(
      (attempt) =>
        generate(prompt, {
          task: "quality",
          systemInstruction,
          // Higher temperature on retries to escape repeating bad output.
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
