import { NextRequest, NextResponse } from "next/server";
import { frontendScreeningText } from "@/lib/api-client";
import type { FrontendScreeningResponse } from "@/lib/api-types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, candidates } = body;

    if (!title || !description || !candidates?.length) {
      return NextResponse.json(
        { detail: "title, description, and candidates are required." },
        { status: 400 }
      );
    }

    const result = await frontendScreeningText(title, description, candidates) as FrontendScreeningResponse;
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Screening failed";
    return NextResponse.json({ detail: message }, { status: 502 });
  }
}
