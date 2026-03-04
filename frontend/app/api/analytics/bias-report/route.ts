import { NextRequest, NextResponse } from "next/server";
import { getBiasReport } from "@/lib/api-client";
import type { BiasReportResponse } from "@/lib/api-types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("job_id") ?? undefined;

    const result = (await getBiasReport(jobId)) as BiasReportResponse;
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch bias report";
    return NextResponse.json({ detail: message }, { status: 502 });
  }
}
