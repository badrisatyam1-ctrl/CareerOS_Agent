import { NextResponse } from "next/server";
import { liveTrackerService } from "@/modules/tracker/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username") || "Badri1888";

  const stats = await liveTrackerService.getLeetCodeStats(username);
  return NextResponse.json(stats);
}
