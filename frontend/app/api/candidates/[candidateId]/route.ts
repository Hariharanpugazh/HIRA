import { NextRequest, NextResponse } from "next/server";
import { getCandidate } from "@/lib/api-client";
import type { ScreeningResponse } from "@/lib/api-types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const { candidateId } = await params;
    const result = (await getCandidate(candidateId)) as ScreeningResponse;
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch candidate";
    return NextResponse.json({ detail: message }, { status: 502 });
  }
}
