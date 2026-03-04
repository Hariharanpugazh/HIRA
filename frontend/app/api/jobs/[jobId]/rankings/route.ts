import { NextRequest, NextResponse } from "next/server";
import { getJobRankings } from "@/lib/api-client";
import type { RankingListResponse } from "@/lib/api-types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "100", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const result = (await getJobRankings(jobId, limit, offset)) as RankingListResponse;
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch rankings";
    return NextResponse.json({ detail: message }, { status: 502 });
  }
}
