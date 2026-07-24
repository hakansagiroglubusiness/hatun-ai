"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";

type View = "home" | "studio" | "gallery" | "prompts" | "tools" | "pricing";
type StudioTool = "image" | "video" | "motion" | "clone" | "tryon" | "swap" | "upscale";
type Creation = {
  id: string;
  type: "Görsel" | "Video";
  title: string;
  status: string;
  assetUrl?: string | null;
  error?: string | null;
  createdAt?: string | number | Date;
  color?: string;
};
type AccountResponse = {
  error?: string;
  user: { credits: number; displayName: string };
  generations: Creation[];
};
type PromptResponse = { error?: string; prompt: string };
type UploadResponse = { error?: string; uploads?: Array<{ id: string }> };
type GenerateResponse = {
  error?: string;
  credits: number;
  generation: Creation;
  clonedPrompt?: string;
};

const tools = [
  { id: "image", title: "Görsel üret", text: "Metin ve referanslardan yüksek kaliteli görseller", icon: "✦", type: "Görsel" },
  { id: "video", title: "Video üret", text: "Metinden akıcı ve sinematik videolar", icon: "▶", type: "Video" },
  { id: "motion", title: "Motion Control", text: "Referans hareketi karakterine aktar", icon: "◉", type: "Video" },
  { id: "clone", title: "Prompt klonla", text: "Bir görseli yeniden üretecek promptu çıkar", icon: "⌘", type: "Prompt" },
  { id: "tryon", title: "Sanal giydirme", text: "Kıyafeti izinli yetişkin modele uygula", icon: "♢", type: "Görsel" },
  { id: "swap", title: "İzinli yüz değişimi", text: "Yalnızca açık rızalı yetişkin içeriklerinde", icon: "◎", type: "Görsel" },
  { id: "upscale", title: "Görsel iyileştir", text: "Keskinlik, detay ve çözünürlüğü yükselt", icon: "↗", type: "Görsel" },
] as const;

const models: Record<StudioTool, string[]> = {
  image: ["GPT Image 1"],
  video: ["Sora 2"],
  motion: ["Hatun Motion"],
  clone: ["Hatun Vision"],
  tryon: ["Hatun Try-On"],
  swap: ["Hatun Consent Swap"],
  upscale: ["Hatun HD"],
};

const costs: Record<StudioTool, number> = {
  image: 60, video: 350, motion: 350, clone: 5, tryon: 75, swap: 90, upscale: 40,
};

const promptCards = [
  ["Gün batımı portresi", "Yumuşak altın saat ışığında, 35 mm lens hissi veren doğal ve samimi yetişkin portresi."],
  ["Şehir gecesi", "Neon ışıklı modern şehir sokağında, spontan telefon fotoğrafı estetiğinde yetişkin içerik üreticisi."],
  ["Minimal stüdyo", "Kırık beyaz fonda, yumuşak gölgeli ve temiz ürün kampanyası estetiğinde portre."],
  ["Sahil yaşamı", "Sabah ışığında sahil yürüyüşü, doğal rüzgâr ve gerçek telefon kamerası dokusu."],
  ["Lüks otel", "Sıcak iç mekân ışığında modern otel lobisi, rahat ve kendinden emin poz."],
  ["Fitness UGC", "Aydınlık spor salonunda doğal, reklam gibi görünmeyen mobil UGC karesi."],
];

const plans = [
  { id: "creator", name: "Creator", price: "$19.90", credits: "12.000", note: "Bireysel üreticiler", current: true },
  { id: "pro", name: "Pro", price: "$39.90", credits: "30.000", note: "Düzenli içerik üretimi", popular: true },
  { id: "advanced", name: "Advanced", price: "$54.90", credits: "50.000", note: "Yüksek hacimli ekipler" },
  { id: "studio", name: "Studio", price: "$79.90", credits: "80.000", note: "Ajanslar ve ekipler" },
];

function Logo() {
  return <div className="hatun-logo"><span>H</span></div>;
}

function relativeTime(value?: string | number | Date) {
  if (!value) return "Az önce";
  const date = new Date(value);
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Az önce";
  if (minutes < 60) return `${minutes} dakika önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [tool, setTool] = useState<StudioTool>("image");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(models.image[0]);
  const [credits, setCredits] = useState(0);
  const [displayName, setDisplayName] = useState("Hatun kullanıcısı");
  const [creations, setCreations] = useState<Creation[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadIds, setUploadIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [galleryFilter, setGalleryFilter] = useState("Tümü");
  const [mobileNav, setMobileNav] = useState(false);
  const [ratio, setRatio] = useState("9:16");
  const [quality, setQuality] = useState("2K");
  const [seconds, setSeconds] = useState("8");
  const [consentConfirmed, setConsentConfirmed] = useState(false);

  const loadAccount = async () => {
    try {
      const response = await fetch("/api/account", { cache: "no-store" });
      const data = await response.json() as AccountResponse;
      if (!response.ok) throw new Error(data.error || "Hesap yüklenemedi.");
      setCredits(data.user.credits);
      setDisplayName(data.user.displayName);
      setCreations(data.generations);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Hesap yüklenemedi.");
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAccount(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const hasPending = creations.some(item => ["queued", "in_progress", "processing"].includes(item.status));
    if (!hasPending) return;
    const timer = window.setInterval(async () => {
      const pending = creations.filter(item => ["queued", "in_progress", "processing"].includes(item.status));
      await Promise.all(pending.map(item => fetch(`/api/generations/${item.id}`, { cache: "no-store" })));
      await loadAccount();
    }, 7000);
    return () => window.clearInterval(timer);
  }, [creations]);

  const filteredPrompts = promptCards.filter(([title, text]) =>
    `${title} ${text}`.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr")),
  );
  const filteredCreations = useMemo(
    () => creations.filter(item => galleryFilter === "Tümü" || item.type === galleryFilter),
    [creations, galleryFilter],
  );

  const openTool = (next: StudioTool) => {
    setTool(next);
    setModel(models[next][0]);
    setView("studio");
    setSelectedFiles([]);
    setUploadIds([]);
    setConsentConfirmed(false);
    setNotice("");
    setMobileNav(false);
  };

  const enhancePrompt = async () => {
    if (!prompt.trim()) return setNotice("Önce kısa bir fikir yaz.");
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mode: tool }),
      });
      const data = await response.json() as PromptResponse;
      if (!response.ok) throw new Error(data.error || "Prompt geliştirilemedi.");
      setPrompt(data.prompt);
      setNotice("Prompt Hatun AI tarafından geliştirildi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Bir hata oluştu.");
    } finally {
      setBusy(false);
    }
  };

  const uploadReferences = async () => {
    if (!selectedFiles.length) return [];
    const form = new FormData();
    selectedFiles.forEach(file => form.append("files", file));
    form.set("purpose", tool);
    form.set("consentConfirmed", String(consentConfirmed));
    const response = await fetch("/api/uploads", { method: "POST", body: form });
    const raw = await response.text();
    let data: UploadResponse = {};
    try {
      data = JSON.parse(raw) as UploadResponse;
    } catch {
      if (response.status === 413) {
        throw new Error("Dosya yükleme sınırını aşıyor. Her dosya en fazla 900 KB olabilir.");
      }
    }
    if (!response.ok) throw new Error(data.error || "Dosyalar yüklenemedi.");
    const ids = (data.uploads || []).map((item: { id: string }) => item.id);
    if (!ids.length) throw new Error("Dosyalar yüklenemedi.");
    setUploadIds(ids);
    return ids;
  };

  const generate = async () => {
    if (credits < costs[tool]) return setNotice("Bu işlem için yeterli kredin yok.");
    if (["image", "video", "motion"].includes(tool) && !prompt.trim()) return setNotice("Üretim için bir prompt yaz.");
    if (["motion", "tryon", "swap", "upscale", "clone"].includes(tool) && !selectedFiles.length && !uploadIds.length) {
      return setNotice("Bu araç için en az bir dosya ekle.");
    }
    if (["tryon", "swap"].includes(tool) && !consentConfirmed) {
      return setNotice("Yetişkinlik ve açık rıza onayı zorunludur.");
    }
    setBusy(true);
    setNotice("Üretim hazırlanıyor…");
    try {
      const ids = uploadIds.length ? uploadIds : await uploadReferences();
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool, model, prompt, ratio, quality, seconds,
          uploadIds: ids,
          consentConfirmed,
        }),
      });
      const data = await response.json() as GenerateResponse;
      if (!response.ok) throw new Error(data.error || "Üretim başlatılamadı.");
      setCredits(data.credits);
      setCreations(prev => [{ ...data.generation, createdAt: Date.now(), color: "rose" }, ...prev]);
      if (data.clonedPrompt) setPrompt(data.clonedPrompt);
      setNotice(data.generation.status === "completed" ? "Üretim tamamlandı." : "Üretim kuyruğa alındı; durum otomatik güncellenecek.");
      if (data.generation.status === "completed") await loadAccount();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Üretim tamamlanamadı.");
    } finally {
      setBusy(false);
    }
  };

  const startCheckout = async (plan: string) => {
    setBusy(true);
    setNotice("Güvenli ödeme sayfası hazırlanıyor…");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json() as { error?: string; url?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "Ödeme başlatılamadı.");
      window.location.assign(data.url);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Ödeme başlatılamadı.");
      setBusy(false);
    }
  };

  const initials = displayName.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase() || "H";

  return (
    <div className="app-shell">
      <aside className={mobileNav ? "sidebar open" : "sidebar"}>
        <div className="side-brand"><Logo /><strong>Hatun</strong><button className="nav-close" onClick={() => setMobileNav(false)}>×</button></div>
        <button className="create-btn" onClick={() => openTool("image")}><span>＋</span> Yeni üretim</button>
        <nav className="side-nav" aria-label="Ana menü">
          <button className={view === "home" ? "active" : ""} onClick={() => { setView("home"); setMobileNav(false); }}>⌂ <span>Ana sayfa</span></button>
          <button className={view === "gallery" ? "active" : ""} onClick={() => { setView("gallery"); setMobileNav(false); }}>▦ <span>Galeri</span></button>
          <button className={view === "prompts" ? "active" : ""} onClick={() => { setView("prompts"); setMobileNav(false); }}>⌘ <span>Prompt kütüphanesi</span></button>
        </nav>
        <div className="nav-label">ARAÇLAR</div>
        <nav className="side-nav compact">
          <button className={view === "tools" ? "active" : ""} onClick={() => { setView("tools"); setMobileNav(false); }}>✣ <span>Tüm araçlar</span></button>
          <button onClick={() => openTool("image")}>✦ <span>Görsel üret</span></button>
          <button onClick={() => openTool("video")}>▶ <span>Video üret</span></button>
          <button onClick={() => openTool("clone")}>⌘ <span>Prompt klonla</span></button>
        </nav>
        <div className="side-bottom">
          <div className="reward"><span>Haftalık ödül</span><strong>Yakında · +400</strong></div>
          <button className="profile"><span>{initials}</span><div><strong>{displayName}</strong><small>{credits.toLocaleString("tr-TR")} kredi</small></div><b>•••</b></button>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)}>☰</button>
          <div><h1>{view === "home" ? "Ana sayfa" : view === "studio" ? "Üretim stüdyosu" : view === "gallery" ? "Galeri" : view === "prompts" ? "Prompt kütüphanesi" : view === "tools" ? "Tüm araçlar" : "Paketler"}</h1></div>
          <div className="top-actions"><button className="search-pill" onClick={() => setView("prompts")}>⌕ <span>Ara</span><kbd>⌘ K</kbd></button><button className="credit-pill" onClick={() => setView("pricing")}><span>✦</span>{credits.toLocaleString("tr-TR")}</button><button className="avatar">{initials}</button></div>
        </header>

        {view === "home" && (
          <div className="page home-page">
            <section className="welcome">
              <div><span className="welcome-tag">HATUN CREATOR STUDIO</span><h2>Bugün ne<br />üretiyoruz?</h2><p>Karakterini oluştur, aynı yüzü koru ve içerik üretimini tek merkezden yönet.</p></div>
              <div className="welcome-orb"><Logo /><span className="orbit o1" /><span className="orbit o2" /></div>
            </section>
            <section className="quick-grid">
              {tools.slice(0, 4).map(item => <button key={item.id} onClick={() => openTool(item.id as StudioTool)}><span className="tool-icon">{item.icon}</span><div><strong>{item.title}</strong><small>{item.text}</small></div><b>↗</b></button>)}
            </section>
            <section className="dashboard-grid">
              <div className="panel">
                <div className="panel-title"><div><span>SON ÜRETİMLER</span><h3>Kaldığın yerden devam et</h3></div><button onClick={() => setView("gallery")}>Tümünü gör</button></div>
                <CreationGrid creations={creations.slice(0, 4)} compact />
              </div>
              <aside className="usage-card"><span>AYLIK KULLANIM</span><h3>{credits.toLocaleString("tr-TR")}</h3><p>kalan kredi</p><div className="meter"><i style={{ width: `${Math.min(100, credits / 120)}%` }} /></div><small>Creator planı · 12.000 kredi</small><button onClick={() => setView("pricing")}>Paketi yükselt</button></aside>
            </section>
          </div>
        )}

        {view === "studio" && (
          <div className="page studio-page">
            <div className="studio-tabs"><button className="active">{tools.find(item => item.id === tool)?.title}</button><button onClick={() => openTool("image")}>＋</button></div>
            <div className="studio-layout">
              <section className="config-panel">
                <div className="field"><label>Araç</label><select value={tool} onChange={event => openTool(event.target.value as StudioTool)}>{tools.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
                <div className="field"><label>Model</label><select value={model} onChange={event => setModel(event.target.value)}>{models[tool].map(item => <option key={item}>{item}</option>)}</select></div>
                <div className="field"><label>Referanslar <span>{selectedFiles.length}/8</span></label><label className="upload"><input type="file" multiple accept="image/*,video/*,.pdf" onClick={event => { event.currentTarget.value = ""; }} onChange={event => { const files = Array.from(event.target.files || []).slice(0, 8); const oversized = files.find(file => file.size > 900 * 1024); if (oversized) { setSelectedFiles([]); setUploadIds([]); setNotice(`${oversized.name} yükleme sınırını aşıyor. Her dosya en fazla 900 KB olabilir.`); return; } setSelectedFiles(files); setUploadIds([]); setNotice(""); }} /><b>＋</b><span>{selectedFiles.length ? selectedFiles.map(file => file.name).join(", ") : tool === "motion" ? "Karakter görseli ve hareket videosu ekle" : "Referans dosyaları ekle"}</span></label></div>
                {!["motion", "tryon", "swap", "upscale"].includes(tool) && <div className="field prompt-field"><label>Prompt</label><textarea value={prompt} onChange={event => setPrompt(event.target.value)} placeholder={tool === "clone" ? "Referans görselden çıkarılacak sahneyi açıklayabilirsin." : "Sahneyi, karakteri, ışığı ve kamera açısını anlat…"} /><button className="enhance" disabled={busy} onClick={enhancePrompt}>✦ {busy ? "İşleniyor…" : "Hatun AI ile geliştir"}</button></div>}
                {["tryon", "swap"].includes(tool) && <label className="consent-check"><input type="checkbox" checked={consentConfirmed} onChange={event => setConsentConfirmed(event.target.checked)} /><span>Görüntüdeki herkesin 18 yaşından büyük olduğunu ve bu işlem için açık rızası bulunduğunu onaylıyorum.</span></label>}
                <div className="inline-options"><label>Oran<select value={ratio} onChange={event => setRatio(event.target.value)}><option>9:16</option><option>1:1</option><option>16:9</option><option>3:4</option></select></label><label>Kalite<select value={quality} onChange={event => setQuality(event.target.value)}><option>2K</option><option>1K</option><option>HD</option></select></label>{tool === "video" && <label>Süre<select value={seconds} onChange={event => setSeconds(event.target.value)}><option value="4">4 sn</option><option value="8">8 sn</option><option value="12">12 sn</option></select></label>}</div>
                <div className="estimate"><div><span>Tahmini maliyet</span><strong>{costs[tool]} kredi</strong></div><button onClick={generate} disabled={busy}>{busy ? "İşleniyor…" : tool === "clone" ? "Promptu klonla" : "Üret"} <span>↗</span></button></div>
                {notice && <div className="notice">{notice}</div>}
              </section>
              <section className="results-panel">
                <div className="panel-title"><div><span>CREATIONS</span><h3>Üretimler</h3></div><button onClick={() => void loadAccount()}>Yenile</button></div>
                <CreationGrid creations={creations.slice(0, 8)} />
              </section>
            </div>
          </div>
        )}

        {view === "tools" && <div className="page"><div className="page-intro"><span>ÜRETİM MERKEZİ</span><h2>Tek platform.<br />Tüm yaratıcı araçlar.</h2><p>Hatun&apos;un güvenli üretim araçlarıyla fikirden yayına kadar bütün süreci yönet.</p></div><div className="all-tools">{tools.map(item => <button key={item.id} onClick={() => openTool(item.id as StudioTool)}><span>{item.icon}</span><em>{item.type}</em><h3>{item.title}</h3><p>{item.text}</p><b>Aracı aç ↗</b></button>)}</div></div>}

        {view === "prompts" && <div className="page"><div className="page-intro row"><div><span>İLHAM KÜTÜPHANESİ</span><h2>Hazır promptlar</h2><p>İçeriğine göre düzenle, tek tıkla stüdyoya taşı.</p></div><input className="library-search" placeholder="Promptlarda ara…" value={search} onChange={event => setSearch(event.target.value)} /></div><div className="prompt-grid">{filteredPrompts.map(([title, text], index) => <article key={title}><div className={`prompt-cover pc${index + 1}`}><span>HATUN / {String(index + 1).padStart(2, "0")}</span></div><h3>{title}</h3><p>{text}</p><button onClick={() => { setPrompt(text); openTool("image"); }}>Stüdyoda kullan ↗</button></article>)}</div></div>}

        {view === "gallery" && <div className="page"><div className="page-intro row"><div><span>İÇERİK ARŞİVİ</span><h2>Galeri</h2><p>Tüm üretimlerini filtrele, görüntüle ve indir.</p></div><div className="gallery-filters">{["Tümü", "Görsel", "Video"].map(filter => <button className={galleryFilter === filter ? "active" : ""} key={filter} onClick={() => setGalleryFilter(filter)}>{filter}</button>)}</div></div><div className="gallery-grid">{filteredCreations.map((item, index) => <article key={item.id} className={`gallery-card ${["rose", "violet", "amber", "cyan"][index % 4]}`}>{item.assetUrl ? item.type === "Video" ? <video src={item.assetUrl} controls /> : <img src={item.assetUrl} alt={item.title} /> : <div className="fake-portrait"><span>{item.status === "failed" ? "!" : "H"}</span></div>}<div><em>{item.type} · {statusLabel(item.status)}</em><h3>{item.title}</h3><small>{relativeTime(item.createdAt)}</small>{item.assetUrl && <a href={item.assetUrl} download>İndir ↗</a>}</div></article>)}</div></div>}

        {view === "pricing" && <div className="page pricing-page"><div className="page-intro center"><span>ESNEK KAPASİTE</span><h2>Üretim hacmine göre büyü.</h2><p>İstediğin zaman yükselt, iptal et veya ek kredi al.</p>{notice && <div className="notice">{notice}</div>}</div><div className="pricing-grid">{plans.map(plan => <article key={plan.name} className={plan.popular ? "popular" : ""}>{plan.popular && <em>EN POPÜLER</em>}<h3>{plan.name}</h3><p>{plan.note}</p><div className="plan-price"><strong>{plan.price}</strong><span>/ay</span></div><div className="plan-credits">{plan.credits} kredi / ay</div><ul><li>✓ Hızlı üretim kuyruğu</li><li>✓ Ticari kullanım</li><li>✓ 180 gün galeri</li><li>✓ Güvenli yetişkin doğrulaması</li></ul><button disabled={busy || plan.current} onClick={() => void startCheckout(plan.id)}>{plan.current ? "Mevcut plan" : "Paketi seç"}</button></article>)}</div><button className="extra-credit" disabled={busy} onClick={() => void startCheckout("credits")}>10.000 ek kredi satın al</button></div>}
      </main>
    </div>
  );
}

function statusLabel(status: string) {
  return status === "completed" ? "Tamamlandı" : status === "failed" ? "Başarısız" : "İşleniyor";
}

function CreationGrid({ creations, compact = false }: { creations: Creation[]; compact?: boolean }) {
  if (!creations.length) {
    return <div className="empty-state">Henüz bir üretim yok. İlk içeriğini oluşturmaya başla.</div>;
  }
  return <div className={compact ? "creation-strip" : "result-grid"}>{creations.map((item, index) => {
    const className = compact ? `creation ${["rose", "violet", "amber", "cyan"][index % 4]}` : `result-card ${["rose", "violet", "amber", "cyan"][index % 4]}`;
    return <article key={item.id} className={className}>
      {item.assetUrl ? item.type === "Video" ? <video src={item.assetUrl} muted /> : <img src={item.assetUrl} alt={item.title} /> : <div className="fake-portrait"><span>{item.status === "failed" ? "!" : "H"}</span></div>}
      <div><em>{item.type} · {statusLabel(item.status)}</em><strong>{item.title}</strong><small>{relativeTime(item.createdAt)}</small></div>
    </article>;
  })}</div>;
}
