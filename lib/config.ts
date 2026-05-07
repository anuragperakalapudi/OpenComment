// Central place for "is this service configured?" flags. Server-side only.
// Used by API routes and middleware to gracefully degrade when env vars are
// unset, so the app keeps running before Clerk/Supabase/Gemini are wired up.

export const isClerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !!process.env.CLERK_SECRET_KEY;

export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isGeminiConfigured = !!process.env.GEMINI_API_KEY;

export const isGroqConfigured = !!process.env.GROQ_API_KEY;
export const isMistralConfigured = !!process.env.MISTRAL_API_KEY;

// True if any text-generation provider is ready. Use this to gate LLM routes.
// (isGeminiConfigured is kept separate for embedding-only gates in semantic.ts.)
export const isLLMConfigured =
  isGeminiConfigured || isGroqConfigured || isMistralConfigured;

export const LLM_PROVIDER = (
  process.env.LLM_PROVIDER ?? "gemini"
) as "gemini" | "groq" | "mistral";

export const isResendConfigured = !!process.env.RESEND_API_KEY;

export const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "OpenComment <hello@opencomment.org>";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const isRedisConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

export const NOT_CONFIGURED = "not_configured";
