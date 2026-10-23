import { NextResponse } from "next/server";
import { disconnectAccount } from "@/lib/oauth";
import { requireOwnerSession } from "@/lib/auth";
import { z } from "zod";

const DisconnectSchema = z.object({
  provider: z.enum(["GITHUB", "GMAIL", "LINKEDIN"]),
  externalAccountId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await requireOwnerSession();
    const body = await request.json();
    const { provider, externalAccountId } = DisconnectSchema.parse(body);

    await disconnectAccount(session.id, provider, externalAccountId);

    return NextResponse.json({
      success: true,
      message: `Successfully disconnected ${provider} account: ${externalAccountId}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
