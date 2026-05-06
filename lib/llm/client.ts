import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";
import OpenAI from "openai";
import { isGeminiConfigured, LLM_PROVIDER } from "../config";

// "fast"    → Flash-class model (summaries, why-in-feed, short tasks)
// "quality" → Pro-class model  (comment drafts, long-form generation)
export type LLMTask = "fast" | "quality";

export type GeminiEmbeddingTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

interface GenerateOpts {
  task?: LLMTask;
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
}

const GEMINI_MODELS: Record<LLMTask, string> = {
  fast: "gemini-2.5-flash",
  quality: "gemini-2.5-pro",
};

const GROQ_MODELS: Record<LLMTask, string> = {
  fast: "llama-3.1-8b-instant",
  quality: "llama-3.3-70b-versatile",
};

const MISTRAL_MODELS: Record<LLMTask, string> = {
  fast: "mistral-small-latest",
  quality: "mistral-medium-latest",
};

// Returns the actual model name string for the active provider + task.
// Use this in API responses for the `model` field.
export function currentModel(task: LLMTask = "fast"): string {
  if (LLM_PROVIDER === "groq") return GROQ_MODELS[task];
  if (LLM_PROVIDER === "mistral") return MISTRAL_MODELS[task];
  return GEMINI_MODELS[task];
}

// --- Gemini path ---

let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  return geminiClient;
}

async function generateGemini(prompt: string, opts: GenerateOpts): Promise<string> {
  const ai = getGeminiClient();
  const model = ai.getGenerativeModel({
    model: GEMINI_MODELS[opts.task ?? "fast"],
    systemInstruction: opts.systemInstruction,
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 2048,
    },
  });
  const res = await model.generateContent(prompt);
  return res.response.text().trim();
}

// --- OpenAI-compatible path (Groq + Mistral) ---

let openaiCompatClient: OpenAI | null = null;

function getOpenAICompatClient(): OpenAI {
  if (openaiCompatClient) return openaiCompatClient;
  if (LLM_PROVIDER === "groq") {
    openaiCompatClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY!,
      baseURL: "https://api.groq.com/openai/v1",
    });
  } else {
    openaiCompatClient = new OpenAI({
      apiKey: process.env.MISTRAL_API_KEY!,
      baseURL: "https://api.mistral.ai/v1",
    });
  }
  return openaiCompatClient;
}

async function generateOpenAICompat(prompt: string, opts: GenerateOpts): Promise<string> {
  const client = getOpenAICompatClient();
  const models = LLM_PROVIDER === "groq" ? GROQ_MODELS : MISTRAL_MODELS;
  const completion = await client.chat.completions.create({
    model: models[opts.task ?? "fast"],
    messages: [
      ...(opts.systemInstruction
        ? [{ role: "system" as const, content: opts.systemInstruction }]
        : []),
      { role: "user" as const, content: prompt },
    ],
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxOutputTokens ?? 2048,
  });
  return (completion.choices[0]?.message?.content ?? "").trim();
}

// --- Public API ---

export async function generate(
  prompt: string,
  opts: GenerateOpts = {},
): Promise<string> {
  if (LLM_PROVIDER === "groq" || LLM_PROVIDER === "mistral") {
    return generateOpenAICompat(prompt, opts);
  }
  if (!isGeminiConfigured) throw new Error("Gemini not configured");
  return generateGemini(prompt, opts);
}

// Embeddings are always Gemini regardless of LLM_PROVIDER —
// text-embedding-004 has no equivalent free alternative.
export async function embedText(
  text: string,
  task: GeminiEmbeddingTask,
): Promise<number[]> {
  if (!isGeminiConfigured) throw new Error("Gemini not configured; embeddings require GEMINI_API_KEY");
  const ai = getGeminiClient();
  const model = ai.getGenerativeModel({ model: "text-embedding-004" });
  const res = await model.embedContent({
    content: { role: "user", parts: [{ text }] },
    taskType:
      task === "RETRIEVAL_DOCUMENT"
        ? TaskType.RETRIEVAL_DOCUMENT
        : TaskType.RETRIEVAL_QUERY,
  });
  return res.embedding.values;
}
