# Hatun — AI Creator Studio

Hatun; kullanıcıların güvenli ve rızaya dayalı AI görsel/video içerikleri üretmesini, arşivlemesini ve kredi tabanlı aboneliklerle yönetmesini sağlayan Creator Studio ürünüdür.

## Ürün yetenekleri

- OpenAI GPT Image ile gerçek görsel üretimi
- Sora ile asenkron video üretimi ve otomatik durum takibi
- Referans dosyası yükleme, prompt klonlama, upscale ve izinli görsel düzenleme
- D1 üzerinde kullanıcı, üretim, abonelik ve kredi defteri
- R2 üzerinde yüklenen ve üretilen medya
- Stripe Checkout, Billing Portal ve webhook altyapısı
- Yetişkinlik/açık rıza onayı ve OpenAI moderasyonu
- Kullanıcı galerisi ve yönetim paneli

## Yerel geliştirme

Gereksinim: Node.js `>=22.13.0`.

```bash
npm ci
npm run db:generate
npm run dev
```

Üretim doğrulaması:

```bash
npm run build
npm test
npm run lint
npx tsc --noEmit
```

## Ortam değişkenleri

Gerekli değişkenler `.env.example` dosyasında listelenir. Gerçek anahtarları yalnızca git tarafından yok sayılan `.env.local` dosyasında veya Sites runtime ayarlarında saklayın.

- `OPENAI_API_KEY`: prompt, görsel, video ve moderasyon
- `HATUN_ADMIN_EMAIL`: yönetim paneline erişecek e-posta
- `STRIPE_SECRET_KEY`: Stripe sunucu anahtarı
- `STRIPE_WEBHOOK_SECRET`: webhook imza doğrulaması
- `STRIPE_PRICE_*`: paket ve ek kredi fiyat kimlikleri

## Veri ve depolama

`.openai/hosting.json` içindeki `DB` ve `ASSETS` mantıksal bağları Sites tarafından D1 ve R2 kaynaklarına bağlanır. Şema değişikliklerinden sonra `npm run db:generate` çalıştırılmalı ve oluşan `drizzle/*.sql` dosyaları kaydedilmelidir.

## Güvenlik sınırları

- Kredi bakiyesi yalnızca sunucuda değiştirilir.
- Dosya ve üretim erişimi kullanıcı sahipliğiyle kontrol edilir.
- Yüz değiştirme ve sanal giydirme açık rıza onayı olmadan başlatılmaz.
- Promptlar üretimden önce moderasyondan geçer.
- API ve ödeme anahtarları kaynak koda yazılmaz.
