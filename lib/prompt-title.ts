const specificTitles: Array<[RegExp, string]> = [
  [/\b(after shower|post-shower|bathrobe|towel wrap)\b/i, "Duş Sonrası Portresi"],
  [/\b(poolside|swimming pool|by the pool)\b/i, "Havuz Kenarı Portresi"],
  [/\b(beach bar|cocktail bar)\b/i, "Sahil Barı"],
  [/\b(late[- ]night beach|beach party)\b/i, "Gece Plaj Partisi"],
  [/\b(yacht|sailboat|speedboat|on a boat)\b/i, "Teknede Yaz Portresi"],
  [/\b(canyon|stone arch)\b/i, "Kanyon Gezisi"],
  [/\b(golden hour|sunset)\b.*\b(beach|ocean|sea)\b|\b(beach|ocean|sea)\b.*\b(golden hour|sunset)\b/i, "Gün Batımı Sahili"],
  [/\b(mirror selfie|bathroom mirror)\b/i, "Ayna Selfie'si"],
  [/\b(elevator selfie)\b/i, "Asansör Selfie'si"],
  [/\b(car selfie|inside (a |the )?car)\b/i, "Araba Selfie'si"],
  [/\b(bed selfie|in bed|lounging.*bed|bedroom selfie)\b/i, "Yatak Odası Selfie'si"],
  [/\b(kitchen|cooking|breakfast counter)\b/i, "Mutfakta Günlük An"],
  [/\b(brunch|café|cafe|coffee shop)\b/i, "Kafe Buluşması"],
  [/\b(restaurant|dinner table)\b/i, "Akşam Yemeği Portresi"],
  [/\b(gym|workout|fitness studio)\b/i, "Spor Sonrası Portresi"],
  [/\b(airport|airplane|flight cabin)\b/i, "Seyahat Günü"],
  [/\b(hotel room|hotel suite)\b/i, "Otel Odası Portresi"],
  [/\b(rooftop|roof terrace)\b/i, "Teras Portresi"],
  [/\b(city street|urban street|crosswalk|sidewalk)\b/i, "Şehir Sokakları"],
  [/\b(snow|ski resort|winter cabin)\b/i, "Kış Kaçamağı"],
  [/\b(festival|concert|nightclub|dance floor)\b/i, "Gece Eğlencesi"],
  [/\b(pilates|yoga)\b/i, "Stüdyo Egzersizi"],
  [/\b(shopping|boutique|fitting room)\b/i, "Alışveriş Günü"],
  [/\b(balcony|terrace)\b/i, "Balkon Portresi"],
  [/\b(garden|greenhouse|flower field)\b/i, "Bahçe Portresi"],
  [/\b(desert|sand dunes)\b/i, "Çöl Portresi"],
  [/\b(waterfall|lake|river)\b/i, "Doğada Su Kenarı"],
  [/\b(bathtub|bubble bath)\b/i, "Küvet Portresi"],
];

const fallbackTitles: Array<[RegExp, string]> = [
  [/\b(selfie|front camera|phone camera)\b/i, "Doğal Selfie"],
  [/\b(close-up|close up|headshot)\b/i, "Yakın Plan Portre"],
  [/\b(full body|full-body)\b/i, "Tam Boy Portre"],
  [/\b(low angle|low-angle)\b/i, "Alçak Açı Portresi"],
  [/\b(over the shoulder|over-the-shoulder)\b/i, "Omuz Üstü Portre"],
  [/\b(editorial|fashion shoot|fashion photography)\b/i, "Moda Editoryali"],
  [/\b(candid|lifestyle photography)\b/i, "Günlük Yaşam Portresi"],
  [/\b(night|neon|flash photography)\b/i, "Gece Portresi"],
  [/\b(outdoor|natural light|daylight)\b/i, "Doğal Işık Portresi"],
];

export function getPromptTitle(title: string, prompt: string, category: string) {
  if (!/^(?:json\s+)?prompt\s*\d+$/i.test(title.trim())) return title;

  const scenePrompt = prompt.replace(/^IDENTITY LOCK[\s\S]*?\n\n/i, "");
  for (const [pattern, label] of specificTitles) {
    if (pattern.test(scenePrompt)) return label;
  }
  for (const [pattern, label] of fallbackTitles) {
    if (pattern.test(scenePrompt)) return label;
  }

  const categoryFallbacks: Record<string, string> = {
    influencer: "Influencer Portresi",
    fashion: "Stil Portresi",
    lifestyle: "Günlük Yaşam Portresi",
    travel: "Seyahat Portresi",
    beauty: "Güzellik Portresi",
  };
  return categoryFallbacks[category.toLocaleLowerCase("tr")] || "Yaratıcı Portre";
}
