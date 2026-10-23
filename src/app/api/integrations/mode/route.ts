import { NextResponse } from "next/server";
import { transitionIntegrationMode, ProviderName, IntegrationMode } from "@/integrations/mode";
import { requireOwnerSession } from "@/lib/auth";
import { z } from "zod";

const TransitionSchema = z.object({
  provider: z.enum(["GITHUB", "GMAIL", "LINKEDIN"]),
  targetMode: z.enum([
    "DEMO",
    "REAL_CONNECTED_READ_ONLY",
    "REAL_DRAFT_ONLY",
    "REAL_APPROVAL_REQUIRED",
    "REAL_WRITE_ENABLED",
  ]),
});

export async function POST(request: Request) {
  try {
    const session = await requireOwnerSession();
    const body = await request.json();
    const { provider, targetMode } = TransitionSchema.parse(body);

    const updated = await transitionIntegrationMode(
      session.id,
      provider as ProviderName,
      targetMode as IntegrationMode
    );

    return NextResponse.json({
      success: true,
      integration: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
