import { NextResponse } from "next/server";
import { ApiError, requireApiUser } from "@/lib/hatun-db";
import { enhancePrompt } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    await requireApiUser();
    const { prompt, mode } = await request.json() as { prompt?: string; mode?: string };
    if (typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt gerekli." }, { status: 400 });
    }
    const enhanced = await enhancePrompt(prompt.trim(), String(mode || "image"));
    return NextResponse.json({ prompt: enhanced });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "İstek işlenemedi." },
      { status },
    );
  }
}
