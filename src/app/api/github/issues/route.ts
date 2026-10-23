import { NextResponse } from "next/server";
import { createGitHubAdapter } from "@/integrations/factory";
import { getIntegrationMode, isRealMode } from "@/integrations/mode";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get("repo") || "badrisatyam1-ctrl/wafer-defect-classification";
    const modeState = await getIntegrationMode("GITHUB");
    const { adapter, mode } = await createGitHubAdapter();

    logger.info("GITHUB_API_ISSUES", `Fetching issues for ${repo} in mode ${mode}`);

    const res = await adapter.listIssues(repo);

    if (!res.success || !res.data) {
      return NextResponse.json(
        {
          success: false,
          error: res.error?.message || "Failed to fetch issues",
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
      repo,
      totalCount: res.data.length,
      meta: res.meta,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("GITHUB_API_ISSUES", `Failed: ${message}`);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
