import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJobStatus, deleteJob } from "@/lib/api-client";
import type { JobResponse } from "@/lib/api-types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const result = (await getJob(jobId)) as JobResponse;
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch job";
    return NextResponse.json({ detail: message }, { status: 502 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const { status } = await req.json();
    const result = (await updateJobStatus(jobId, status)) as JobResponse;
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update job";
    return NextResponse.json({ detail: message }, { status: 502 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const result = await deleteJob(jobId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete job";
    return NextResponse.json({ detail: message }, { status: 502 });
  }
}