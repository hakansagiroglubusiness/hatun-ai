import { NextResponse } from "next/server";
import { ApiError, listGenerations, requireApiUser } from "@/lib/hatun-db";

export async function GET() {
  try {
    const user = await requireApiUser();
    const items = await listGenerations(user.id);
    return NextResponse.json({
      user: {
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        plan: user.plan,
        credits: user.creditBalance,
      },
      generations: items.map(item => ({
        id: item.id,
        type: item.kind === "video" ? "Video" : "Görsel",
        tool: item.tool,
        prompt: item.prompt,
        title: item.prompt?.slice(0, 54) || "Yeni üretim",
        status: item.status,
        createdAt: item.createdAt,
        assetUrl: item.assetKey ? `/api/assets/${item.id}` : null,
        error: item.errorMessage,
      })),
    });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Hesap yüklenemedi." },
      { status },
    );
  }
}
