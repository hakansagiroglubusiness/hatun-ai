import { ApiError } from "./hatun-db";
import { REFERENCE_IDENTITY_LOCK } from "./identity-lock";

const API_ROOT = "https://api.openai.com/v1";
export const IMAGE_MODEL = "gpt-image-2";
export type ImageResult = {
  bytes: Uint8Array;
  contentType: string;
  safeFallbackApplied?: boolean;
  safePrompt?: string;
};

function key() {
  const value = process.env.OPENAI_API_KEY;
  if (!value) throw new ApiError(503, "OpenAI bağlantısı yapılandırılmadı.");
  return value;
}

async function openAI(path: string, init: RequestInit) {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key()}`,
      ...(init.headers || {}),
    },
  });
  const data = await response.json().catch(() => null) as {
    error?: { message?: string };
    [key: string]: unknown;
  } | null;
  if (!response.ok) {
    const message = data?.error?.message || "AI sağlayıcısı isteği tamamlayamadı.";
    throw new ApiError(response.status >= 500 ? 502 : 400, message);
  }
  return data || {};
}

export async function moderateText(input: string) {
  const data = await openAI("/moderations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "omni-moderation-latest", input }),
  }) as { results?: Array<{ flagged?: boolean }> };
  if (data.results?.[0]?.flagged) {
    throw new ApiError(400, "Bu istek güvenlik politikalarımız kapsamında üretilemez.");
  }
}

export async function enhancePrompt(prompt: string, mode: string) {
  await moderateText(prompt);
  const data = await openAI("/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.1",
      input: [
        {
          role: "system",
          content: `Sen Hatun AI Creator Studio'nun prompt editörüsün. Kullanıcının kısa fikrini, yalnızca yetişkin ve rızaya dayalı güvenli içerik sınırlarında; özne, sahne, ışık, kamera, kompozisyon ve gerçekçilik ayrıntıları içeren tek güçlü Türkçe üretim promptuna dönüştür. Referans kişinin görünüşünü değiştiren yeni saç, ten, göz, etnik köken, yüz veya vücut özelliği ekleme. Promptun başında şu kilidi aynen koru: ${REFERENCE_IDENTITY_LOCK} Açıklama ekleme.`,
        },
        { role: "user", content: `Üretim türü: ${mode}\nFikir: ${prompt}` },
      ],
    }),
  }) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };
  return data.output_text || data.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content || []).map((item: { text?: string }) => item.text).filter(Boolean).join("\n") || prompt;
}

async function generateImageOnce(prompt: string, size: string, quality: string): Promise<ImageResult> {
  await moderateText(prompt);
  const allowedSizes: Record<string, string> = {
    "1:1": "1024x1024",
    "9:16": "1024x1536",
    "3:4": "1024x1536",
    "16:9": "1536x1024",
  };
  const data = await openAI("/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      size: allowedSizes[size] || "1024x1024",
      quality: quality === "HD" ? "high" : quality === "1K" ? "medium" : "high",
      output_format: "webp",
    }),
  }) as { data?: Array<{ b64_json?: string }> };
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new ApiError(502, "Görsel çıktısı alınamadı.");
  return { bytes: Uint8Array.from(atob(b64), c => c.charCodeAt(0)), contentType: "image/webp" };
}

export async function generateImage(prompt: string, size: string, quality: string): Promise<ImageResult> {
  return generateWithSafeFallback(
    prompt,
    safePrompt => generateImageOnce(safePrompt, size, quality),
  );
}

export async function createVideo(prompt: string, seconds: string, size: string, reference?: File) {
  await moderateText(prompt);
  const form = new FormData();
  form.set("model", "sora-2");
  form.set("prompt", prompt);
  form.set("seconds", ["4", "8", "12"].includes(seconds) ? seconds : "8");
  form.set("size", size === "16:9" ? "1280x720" : "720x1280");
  if (reference) form.set("input_reference", reference);
  return openAI("/videos", { method: "POST", body: form }) as Promise<{
    id: string;
    status?: string;
  }>;
}

export async function describeImage(file: File) {
  const base64 = bytesToBase64(new Uint8Array(await file.arrayBuffer()));
  const data = await openAI("/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.1",
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: "Bu görseli yeniden üretmek için; özne, kompozisyon, kamera, lens, ışık, renk, ortam ve stil ayrıntılarını içeren tek bir güçlü Türkçe prompt yaz. Kimlik tahmini yapma. Yalnızca promptu döndür." },
          { type: "input_image", image_url: `data:${file.type};base64,${base64}` },
        ],
      }],
    }),
  }) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };
  return data.output_text || data.output?.flatMap(item => item.content || []).map(item => item.text).filter(Boolean).join("\n") || "Görsel açıklanamadı.";
}

async function editImageOnce(files: File[], prompt: string, size: string): Promise<ImageResult> {
  await moderateText(prompt);
  const form = new FormData();
  form.set("model", IMAGE_MODEL);
  form.set("prompt", prompt);
  form.set("size", size === "16:9" ? "1536x1024" : size === "1:1" ? "1024x1024" : "1024x1536");
  form.set("quality", "high");
  form.set("output_format", "webp");
  files.forEach(file => form.append("image[]", file));
  const data = await openAI("/images/edits", { method: "POST", body: form }) as {
    data?: Array<{ b64_json?: string }>;
  };
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new ApiError(502, "Düzenlenmiş görsel alınamadı.");
  return { bytes: Uint8Array.from(atob(b64), c => c.charCodeAt(0)), contentType: "image/webp" };
}

export async function editImage(files: File[], prompt: string, size: string): Promise<ImageResult> {
  return generateWithSafeFallback(
    prompt,
    safePrompt => editImageOnce(files, safePrompt, size),
  );
}

async function generateWithSafeFallback(
  prompt: string,
  generate: (safePrompt: string) => Promise<ImageResult>,
): Promise<ImageResult> {
  try {
    return await generate(prompt);
  } catch (error) {
    if (!isSafetyBlock(error)) throw error;
  }

  const minimallySoftened = await rewritePromptForSafety(prompt, false);
  try {
    const result = await generate(minimallySoftened);
    return { ...result, safeFallbackApplied: true, safePrompt: minimallySoftened };
  } catch (error) {
    if (!isSafetyBlock(error)) throw error;
  }

  const conservative = await rewritePromptForSafety(prompt, true);
  const result = await generate(conservative);
  return { ...result, safeFallbackApplied: true, safePrompt: conservative };
}

async function rewritePromptForSafety(prompt: string, conservative: boolean) {
  const data = await openAI("/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.1",
      input: [
        {
          role: "system",
          content: [
            "Rewrite the image prompt into a clearly policy-compliant, non-explicit version.",
            "Preserve the original scene, identity lock, camera, composition, lighting, mood, gaze, expression, pose direction, and overall creative goal wherever safe.",
            "Change only details likely to trigger sexual or other safety filters.",
            "Use opaque everyday clothing, non-explicit anatomy, natural non-suggestive posing, and an unmistakably adult subject.",
            "Do not mention moderation, safety filters, refusals, or policy in the rewritten prompt.",
            conservative
              ? "Use a conservative lifestyle-photography interpretation: fully covered outfit, neutral framing, and no emphasis on intimate body areas."
              : "Make the smallest safe changes possible while keeping the intended visual result recognizable.",
            "Return only the rewritten production prompt.",
          ].join(" "),
        },
        { role: "user", content: prompt },
      ],
    }),
  }) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };
  const rewritten = data.output_text
    || data.output?.flatMap(item => item.content || []).map(item => item.text).filter(Boolean).join("\n");
  if (!rewritten?.trim()) {
    throw new ApiError(400, "İstek güvenli bir üretim promptuna dönüştürülemedi.");
  }
  return rewritten.trim();
}

function isSafetyBlock(error: unknown) {
  if (!(error instanceof Error)) return false;
  return /(safety|moderation|policy|sexual|blocked|rejected|güvenlik|üretilemez)/i.test(error.message);
}

export async function retrieveVideo(id: string) {
  return openAI(`/videos/${encodeURIComponent(id)}`, { method: "GET" }) as Promise<{
    id: string;
    status?: string;
    error?: { message?: string };
  }>;
}

export async function downloadVideo(id: string) {
  const response = await fetch(`${API_ROOT}/videos/${encodeURIComponent(id)}/content`, {
    headers: { Authorization: `Bearer ${key()}` },
  });
  if (!response.ok) throw new ApiError(502, "Video indirilemedi.");
  return new Uint8Array(await response.arrayBuffer());
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
