import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { generations } from "@/db/schema";
import {
  ApiError,
  getOwnedUpload,
  refundCredits,
  requireApiUser,
  reserveCredits,
  storeBytes,
  TOOL_COSTS,
  type ToolId,
} from "@/lib/hatun-db";
import { withReferenceIdentityLock } from "@/lib/identity-lock";
import {
  createVideo,
  describeImage,
  editImage,
  generateImage,
  IMAGE_MODEL,
  type ImageResult,
} from "@/lib/openai";

const VALID_TOOLS = new Set(Object.keys(TOOL_COSTS));

export async function POST(request: Request) {
  let reservation: { userId: string; id: string; cost: number } | null = null;
  try {
    const user = await requireApiUser();
    const body = await request.json() as {
      tool?: string;
      prompt?: string;
      ratio?: string;
      quality?: string;
      seconds?: string;
      uploadIds?: string[];
      consentConfirmed?: boolean;
    };
    const tool = String(body.tool || "") as ToolId;
    const prompt = String(body.prompt || "").trim();
    if (!VALID_TOOLS.has(tool)) throw new ApiError(400, "Geçersiz üretim aracı.");
    if (!prompt && ["image", "video", "motion"].includes(tool)) {
      throw new ApiError(400, "Üretim için bir prompt gerekli.");
    }
    if (["swap", "tryon"].includes(tool) && body.consentConfirmed !== true) {
      throw new ApiError(400, "Bu araç için yetişkinlik ve açık rıza onayı zorunludur.");
    }
    const uploadIds = Array.isArray(body.uploadIds) ? body.uploadIds : [];
    const referenceFiles: File[] = [];
    for (const uploadId of uploadIds) {
      const upload = await getOwnedUpload(user.id, uploadId);
      if (!upload) throw new ApiError(404, "Referans dosyası bulunamadı.");
      const object = await env.MEDIA?.get(upload.objectKey);
      if (!object) throw new ApiError(404, "Referans dosyası depolamada bulunamadı.");
      referenceFiles.push(new File([await object.arrayBuffer()], upload.filename, { type: upload.contentType }));
    }
    const imageReferenceFiles = referenceFiles.filter(file => file.type.startsWith("image/"));
    if (["motion", "clone", "tryon", "swap", "upscale"].includes(tool) && !referenceFiles.length) {
      throw new ApiError(400, "Bu araç için en az bir referans dosyası gerekli.");
    }
    if (["image", "clone", "tryon", "swap", "upscale"].includes(tool) && referenceFiles.length && !imageReferenceFiles.length) {
      throw new ApiError(400, "Bu araç için en az bir görsel referans dosyası gerekli.");
    }

    const db = getDb();
    const id = crypto.randomUUID();
    const { cost, balance } = await reserveCredits(user.id, tool, id);
    reservation = { userId: user.id, id, cost };
    const now = new Date();
    const kind = tool === "video" || tool === "motion" ? "video" : tool === "clone" ? "prompt" : "image";
    const provider = "openai";
    const model = tool === "video" || tool === "motion" ? "sora-2" : tool === "clone" ? "gpt-5.1" : IMAGE_MODEL;

    await db.insert(generations).values({
      id,
      userId: user.id,
      kind,
      tool,
      model,
      prompt,
      status: "processing",
      provider,
      creditsCharged: cost,
      metadataJson: JSON.stringify({
        ratio: body.ratio || "9:16",
        quality: body.quality || "2K",
        seconds: body.seconds || "8",
        uploadIds,
      }),
      createdAt: now,
      updatedAt: now,
    });

    if (tool === "clone") {
      const clonedPrompt = await describeImage(referenceFiles[0]);
      await db.update(generations).set({
        status: "completed",
        prompt: clonedPrompt,
        metadataJson: JSON.stringify({ uploadIds, clonedPrompt }),
        updatedAt: new Date(),
      }).where((await import("drizzle-orm")).eq(generations.id, id));
      reservation = null;
      return NextResponse.json({
        generation: { id, type: "Görsel", status: "completed", title: clonedPrompt },
        clonedPrompt,
        credits: balance,
      }, { status: 201 });
    }

    if (["image", "tryon", "swap", "upscale"].includes(tool)) {
      let result: ImageResult;
      if (tool === "image") {
        if (imageReferenceFiles.length) {
          const referencePrompt = [
            withReferenceIdentityLock(prompt),
            "The first image is the identity reference. Any later images are secondary references only for outfit, product, style, or setting.",
          ].join("\n");
          result = await editImage(imageReferenceFiles, referencePrompt, String(body.ratio || "9:16"));
        } else {
          result = await generateImage(prompt, String(body.ratio || "9:16"), String(body.quality || "2K"));
        }
      } else {
        const instructions: Record<string, string> = {
          tryon: "İlk görseldeki yetişkin kişiye diğer referanstaki kıyafeti doğal biçimde giydir. Kişinin kimliğini, yüzünü ve vücut oranlarını koru. Gerçekçi ışık, kumaş ve gölgeler kullan.",
          swap: "Açık rıza verilmiş yetişkin referanslar arasında yüz değişimini gerçekçi biçimde uygula. Yüz dışındaki kompozisyonu, pozu, ışığı ve arka planı koru.",
          upscale: "Görseli doğal ayrıntıları koruyarak yüksek çözünürlüklü hâle getir. Keskinliği ve dokuyu iyileştir; kimliği, kompozisyonu ve renkleri değiştirme.",
        };
        const editPrompt = prompt || instructions[tool];
        result = await editImage(
          imageReferenceFiles,
          withReferenceIdentityLock(editPrompt),
          String(body.ratio || "9:16"),
        );
      }
      const assetKey = `users/${user.id}/generations/${id}.webp`;
      await storeBytes(assetKey, result.bytes, result.contentType);
      await db.update(generations).set({
        status: "completed",
        assetKey,
        metadataJson: JSON.stringify({
          ratio: body.ratio || "9:16",
          quality: body.quality || "2K",
          uploadIds,
          safeFallbackApplied: result.safeFallbackApplied === true,
          safePrompt: result.safePrompt,
        }),
        updatedAt: new Date(),
      }).where((await import("drizzle-orm")).eq(generations.id, id));
      reservation = null;
      return NextResponse.json({
        generation: { id, type: "Görsel", status: "completed", assetUrl: `/api/assets/${id}`, title: prompt.slice(0, 54) },
        credits: balance,
        safeFallbackApplied: result.safeFallbackApplied === true,
        safePrompt: result.safePrompt,
      }, { status: 201 });
    }

    const baseVideoPrompt = tool === "motion"
      ? `${prompt}. Referans karakterin görünüşünü koruyarak doğal, akıcı ve sinematik hareket üret.`
      : prompt;
    const reference = referenceFiles.find(file => file.type.startsWith("image/"));
    const videoPrompt = reference ? withReferenceIdentityLock(baseVideoPrompt) : baseVideoPrompt;
    const video = await createVideo(videoPrompt, String(body.seconds || "8"), String(body.ratio || "9:16"), reference);
    await db.update(generations).set({
      status: String(video.status || "queued"),
      providerJobId: video.id,
      updatedAt: new Date(),
    }).where((await import("drizzle-orm")).eq(generations.id, id));
    reservation = null;
    return NextResponse.json({
      generation: { id, type: "Video", status: video.status || "queued", title: prompt.slice(0, 54) },
      credits: balance,
    }, { status: 202 });
  } catch (error) {
    if (reservation) {
      try {
        await refundCredits(reservation.userId, reservation.id, reservation.cost);
        const db = getDb();
        const { eq } = await import("drizzle-orm");
        await db.update(generations).set({
          status: "failed",
          creditsCharged: 0,
          errorMessage: error instanceof Error ? error.message : "Üretim başarısız.",
          updatedAt: new Date(),
        }).where(eq(generations.id, reservation.id));
      } catch {
        // The original error remains the user-facing failure.
      }
    }
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Üretim tamamlanamadı." },
      { status },
    );
  }
}
