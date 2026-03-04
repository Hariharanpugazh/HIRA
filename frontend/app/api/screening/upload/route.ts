import { NextRequest, NextResponse } from "next/server";
import type { FrontendScreeningResponse } from "@/lib/api-types";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const API_KEY = process.env.BACKEND_API_KEY || "change-this-api-key";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const resumes = formData.getAll("resumes") as File[];

    if (!title || !description || resumes.length === 0) {
      return NextResponse.json(
        { detail: "title, description, and at least one resume file are required." },
        { status: 400 }
      );
    }

    // Forward the multipart form to backend
    const backendForm = new FormData();
    backendForm.append("title", title);
    backendForm.append("description", description);
    for (const file of resumes) {
      backendForm.append("resumes", file);
    }

    const res = await fetch(`${BACKEND_URL}/api/v1/frontend/screening/upload`, {
      method: "POST",
      headers: { "X-API-Key": API_KEY },
      body: backendForm,
    });

    if (!res.ok) {
      const errorBody = await res.text();
      let detail: string;
      try {
        detail = JSON.parse(errorBody).detail ?? errorBody;
      } catch {
        detail = errorBody;
      }
      return NextResponse.json({ detail }, { status: res.status });
    }

    const result = (await res.json()) as FrontendScreeningResponse;
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload screening failed";
    return NextResponse.json({ detail: message }, { status: 502 });
  }
}
