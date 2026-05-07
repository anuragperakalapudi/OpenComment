import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { deleteProfile } from "@/lib/db/profiles";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);
  let event: { type: string; data: Record<string, unknown> };

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof event;
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const { type, data } = event;
  const userId = data.id as string;

  if (type === "user.deleted") {
    try {
      await deleteProfile(userId);
    } catch {
      // Non-fatal: row may not exist if user deleted before completing onboarding.
    }
  }

  return NextResponse.json({ ok: true });
}
