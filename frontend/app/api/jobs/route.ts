import { NextRequest, NextResponse } from "next/server";
import { listJobs, createJob } from "@/lib/api-client";
import type { JobsListResponse, JobResponse } from "@/lib/api-types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const result = (await listJobs(limit, offset)) as JobsListResponse;
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch jobs";
    return NextResponse.json({ detail: message }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, description } = await req.json();
    if (!title || !description) {
      return NextResponse.json(
        { detail: "title and description are required." },
        { status: 400 }
      );
    }
    const result = (await createJob(title, description)) as JobResponse;
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create job";
    return NextResponse.json({ detail: message }, { status: 502 });
  }
}
