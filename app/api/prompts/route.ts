import { NextResponse } from "next/server";
import promptLibrary from "@/app/data/prompt-library.json";

export async function GET() {
  return NextResponse.json(
    { prompts: promptLibrary },
    { headers: { "Cache-Control": "private, max-age=3600" } },
  );
}
