import { NextResponse } from "next/server";
import promptLibrary from "@/app/data/prompt-library.json";
import { withReferenceIdentityLock } from "@/lib/identity-lock";

export async function GET() {
  return NextResponse.json(
    {
      prompts: promptLibrary.map(item => ({
        ...item,
        prompt: withReferenceIdentityLock(item.prompt),
      })),
    },
    { headers: { "Cache-Control": "private, max-age=3600" } },
  );
}
