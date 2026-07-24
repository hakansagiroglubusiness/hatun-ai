import { NextResponse } from "next/server";
import promptLibrary from "@/app/data/prompt-library.json";
import { withReferenceIdentityLock } from "@/lib/identity-lock";
import { getPromptTitle } from "@/lib/prompt-title";

export async function GET() {
  return NextResponse.json(
    {
      prompts: promptLibrary.map(item => ({
        ...item,
        title: getPromptTitle(item.title, item.prompt, item.category),
        prompt: withReferenceIdentityLock(item.prompt),
      })),
    },
    { headers: { "Cache-Control": "private, max-age=3600" } },
  );
}
