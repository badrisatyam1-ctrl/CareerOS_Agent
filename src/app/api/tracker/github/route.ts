import { NextResponse } from "next/server";
import { liveTrackerService } from "@/modules/tracker/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username") || "badrisatyam1-ctrl";

  const stats = await liveTrackerService.getGitHubStats(username);
  return NextResponse.json(stats);
}
