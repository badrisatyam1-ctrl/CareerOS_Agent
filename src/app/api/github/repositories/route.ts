import { NextResponse } from "next/server";
import { createGitHubAdapter } from "@/integrations/factory";
import { getIntegrationMode, isRealMode } from "@/integrations/mode";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const modeState = await getIntegrationMode("GITHUB");
    const { adapter, mode } = await createGitHubAdapter();

    const username = searchParams.get("username") || modeState.externalAccountId || "badrisatyam1-ctrl";

    logger.info("GITHUB_API_REPOS", `Fetching repositories for ${username} in mode ${mode}`);

    const res = await adapter.listRepositories(username);

    if (!res.success || !res.data) {
      return NextResponse.json(
        {
          success: false,
          error: res.error?.message || "Failed to fetch repositories",
          mode,
          isReal: isRealMode(mode),
        },
        { status: res.error?.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: res.data,
      mode,
      isReal: isRealMode(mode),
      username,
      totalCount: res.data.length,
      meta: res.meta,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("GITHUB_API_REPOS", `Failed: ${message}`);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
