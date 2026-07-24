import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt, mode } = await request.json();
    if (typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt gerekli." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI bağlantısı henüz yapılandırılmadı." }, { status: 503 });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.6-sol",
        input: [
          {
            role: "system",
            content: "Sen Hatun AI Creator Studio'nun prompt editörüsün. Kullanıcının kısa fikrini, yetişkin ve rızaya dayalı güvenli içerik sınırları içinde; özne, sahne, ışık, kamera, kompozisyon, gerçekçilik ve kaçınılacak hataları içeren tek, güçlü bir Türkçe üretim promptuna dönüştür. Açıklama ekleme, yalnızca nihai promptu döndür.",
          },
          {
            role: "user",
            content: `Üretim türü: ${mode}\nFikir: ${prompt}`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: "Hatun AI şu anda yanıt veremedi." }, { status: response.status });
    }

    const output = data.output_text || data.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content || []).map((item: { text?: string }) => item.text).filter(Boolean).join("\n");
    return NextResponse.json({ prompt: output || prompt });
  } catch {
    return NextResponse.json({ error: "İstek işlenemedi." }, { status: 500 });
  }
}
