"use client";

import { useMemo, useState } from "react";

type View = "home" | "studio" | "gallery" | "prompts" | "tools" | "pricing";
type StudioTool = "image" | "video" | "motion" | "clone" | "tryon" | "swap" | "upscale";

const tools = [
  { id: "image", title: "Görsel üret", text: "Metin ve referanslardan yüksek kaliteli görseller", icon: "✦", type: "Görsel" },
  { id: "video", title: "Video üret", text: "Görselden veya metinden akıcı videolar", icon: "▶", type: "Video" },
  { id: "motion", title: "Motion Control", text: "Bir videodaki hareketi karakterine aktar", icon: "◉", type: "Video" },
  { id: "clone", title: "Prompt klonla", text: "Bir görseli yeniden üretecek promptu çıkar", icon: "⌘", type: "Prompt" },
  { id: "tryon", title: "Sanal giydirme", text: "Kıyafeti seçtiğin yetişkin modele uygula", icon: "♢", type: "Görsel" },
  { id: "swap", title: "İzinli yüz değişimi", text: "Yalnızca açık rızalı yetişkin içeriklerinde", icon: "◎", type: "Görsel" },
  { id: "upscale", title: "Görsel iyileştir", text: "Keskinlik, detay ve çözünürlüğü yükselt", icon: "↗", type: "Görsel" },
] as const;

const models: Record<StudioTool, string[]> = {
  image: ["GPT Image 2", "Nano Banana 2", "Nano Banana Pro", "Seedream Lite", "Hatun Real"],
  video: ["Veo 3.1 Fast", "Veo 3.1 Quality", "Seedance 2", "Kling V3 Turbo", "Hatun Fast"],
  motion: ["Hatun Motion"],
  clone: ["Hatun Vision"],
  tryon: ["Hatun Try-On"],
  swap: ["Hatun Consent Swap"],
  upscale: ["Hatun HD"],
};

const costs: Record<StudioTool, number> = { image: 60, video: 350, motion: 70, clone: 5, tryon: 45, swap: 50, upscale: 25 };

const promptCards = [
  ["Gün batımı portresi", "Yumuşak altın saat ışığında, 35mm lens hissi veren doğal ve samimi yetişkin portresi."],
  ["Şehir gecesi", "Neon ışıklı modern şehir sokağında, spontan telefon fotoğrafı estetiğinde yetişkin içerik üreticisi."],
  ["Minimal stüdyo", "Kırık beyaz fonda, yumuşak gölgeli ve temiz ürün kampanyası estetiğinde portre."],
  ["Sahil yaşamı", "Sabah ışığında sahil yürüyüşü, doğal rüzgâr, gerçek telefon kamerası dokusu."],
  ["Lüks otel", "Sıcak iç mekân ışığında modern otel lobisi, rahat ve kendinden emin poz."],
  ["Fitness UGC", "Aydınlık spor salonunda doğal, reklam gibi görünmeyen mobil UGC karesi."],
];

const plans = [
  { name: "Creator", price: "$19.90", credits: "12.000", note: "Bireysel üreticiler", current: true },
  { name: "Pro", price: "$39.90", credits: "30.000", note: "Düzenli içerik üretimi", popular: true },
  { name: "Advanced", price: "$54.90", credits: "50.000", note: "Yüksek hacimli ekipler" },
  { name: "Studio", price: "$79.90", credits: "80.000", note: "Ajanslar ve ekipler" },
];

const initialCreations = [
  { id: 1, type: "Görsel", title: "Altın saat portresi", time: "12 dakika önce", color: "rose" },
  { id: 2, type: "Video", title: "Şehir yürüyüşü", time: "1 saat önce", color: "violet" },
  { id: 3, type: "Görsel", title: "Minimal stüdyo", time: "Dün", color: "amber" },
  { id: 4, type: "Görsel", title: "Sahil kampanyası", time: "2 gün önce", color: "cyan" },
];

function Logo() {
  return <div className="hatun-logo"><span>H</span></div>;
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [tool, setTool] = useState<StudioTool>("image");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(models.image[0]);
  const [credits, setCredits] = useState(12000);
  const [creations, setCreations] = useState(initialCreations);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [galleryFilter, setGalleryFilter] = useState("Tümü");
  const [mobileNav, setMobileNav] = useState(false);

  const filteredPrompts = promptCards.filter(([title, text]) => `${title} ${text}`.toLowerCase().includes(search.toLowerCase()));
  const filteredCreations = useMemo(() => creations.filter(c => galleryFilter === "Tümü" || c.type === galleryFilter), [creations, galleryFilter]);

  const openTool = (next: StudioTool) => {
    setTool(next);
    setModel(models[next][0]);
    setView("studio");
    setFiles([]);
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
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Prompt geliştirilemedi.");
      setPrompt(data.prompt);
      setNotice("Prompt Hatun AI tarafından geliştirildi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Bir hata oluştu.");
    } finally {
      setBusy(false);
    }
  };

  const generate = () => {
    const cost = costs[tool];
    if (credits < cost) return setNotice("Bu işlem için yeterli kredin yok.");
    if (["image", "video"].includes(tool) && !prompt.trim()) return setNotice("Üretim için bir prompt yaz.");
    if (["motion", "tryon", "swap", "upscale", "clone"].includes(tool) && files.length === 0) return setNotice("Bu araç için en az bir dosya ekle.");
    setBusy(true);
    setNotice("Üretim kuyruğa alındı…");
    window.setTimeout(() => {
      setCredits(v => v - cost);
      setCreations(prev => [{ id: Date.now(), type: tool === "video" || tool === "motion" ? "Video" : "Görsel", title: prompt.slice(0, 42) || tools.find(t => t.id === tool)?.title || "Yeni üretim", time: "Az önce", color: ["rose", "violet", "amber", "cyan"][prev.length % 4] }, ...prev]);
      setBusy(false);
      setNotice("Önizleme üretildi. Gerçek sağlayıcı bağlantısı yayın ortamında etkinleştirilecek.");
    }, 900);
  };

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles(Array.from(list).slice(0, 8).map(f => f.name));
  };

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
          <div className="reward"><span>Haftalık ödül</span><strong>4 gün · +400</strong></div>
          <button className="profile"><span>H</span><div><strong>Hakan</strong><small>{credits.toLocaleString("tr-TR")} kredi</small></div><b>•••</b></button>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)}>☰</button>
          <div><h1>{view === "home" ? "Ana sayfa" : view === "studio" ? "Üretim stüdyosu" : view === "gallery" ? "Galeri" : view === "prompts" ? "Prompt kütüphanesi" : view === "tools" ? "Tüm araçlar" : "Paketler"}</h1></div>
          <div className="top-actions"><button className="search-pill">⌕ <span>Ara</span><kbd>⌘ K</kbd></button><button className="credit-pill" onClick={() => setView("pricing")}><span>✦</span>{credits.toLocaleString("tr-TR")}</button><button className="avatar">H</button></div>
        </header>

        {view === "home" && (
          <div className="page home-page">
            <section className="welcome">
              <div><span className="welcome-tag">HATUN CREATOR STUDIO</span><h2>Bugün ne<br />üretiyoruz?</h2><p>Karakterini oluştur, aynı yüzü koru ve içerik üretimini tek merkezden yönet.</p></div>
              <div className="welcome-orb"><Logo /><span className="orbit o1" /><span className="orbit o2" /></div>
            </section>
            <section className="quick-grid">
              {tools.slice(0, 4).map(t => <button key={t.id} onClick={() => openTool(t.id as StudioTool)}><span className="tool-icon">{t.icon}</span><div><strong>{t.title}</strong><small>{t.text}</small></div><b>↗</b></button>)}
            </section>
            <section className="dashboard-grid">
              <div className="panel">
                <div className="panel-title"><div><span>SON ÜRETİMLER</span><h3>Kaldığın yerden devam et</h3></div><button onClick={() => setView("gallery")}>Tümünü gör</button></div>
                <div className="creation-strip">{creations.slice(0, 4).map(c => <article key={c.id} onClick={() => setView("gallery")} className={`creation ${c.color}`}><div className="fake-portrait"><span>H</span></div><em>{c.type}</em><strong>{c.title}</strong><small>{c.time}</small></article>)}</div>
              </div>
              <aside className="usage-card"><span>AYLIK KULLANIM</span><h3>{credits.toLocaleString("tr-TR")}</h3><p>kalan kredi</p><div className="meter"><i style={{ width: `${Math.min(100, credits / 120)}%` }} /></div><small>Creator planı · 12.000 kredi</small><button onClick={() => setView("pricing")}>Paketi yükselt</button></aside>
            </section>
          </div>
        )}

        {view === "studio" && (
          <div className="page studio-page">
            <div className="studio-tabs"><button className="active">{tools.find(t => t.id === tool)?.title}</button><button onClick={() => openTool("image")}>＋</button></div>
            <div className="studio-layout">
              <section className="config-panel">
                <div className="field"><label>Araç</label><select value={tool} onChange={e => openTool(e.target.value as StudioTool)}>{tools.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></div>
                <div className="field"><label>Model</label><select value={model} onChange={e => setModel(e.target.value)}>{models[tool].map(m => <option key={m}>{m}</option>)}</select></div>
                <div className="field"><label>Referanslar <span>{files.length}/8</span></label><label className="upload"><input type="file" multiple accept="image/*,video/*" onChange={e => handleFiles(e.target.files)} /><b>＋</b><span>{files.length ? files.join(", ") : tool === "motion" ? "Karakter görseli ve hareket videosu ekle" : "Referans dosyaları ekle"}</span></label></div>
                {!["motion", "tryon", "swap", "upscale"].includes(tool) && <div className="field prompt-field"><label>Prompt</label><textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={tool === "clone" ? "Görsel yüklendiğinde prompt burada oluşur." : "Sahneyi, karakteri, ışığı ve kamera açısını anlat…"} /><button className="enhance" disabled={busy} onClick={enhancePrompt}>✦ {busy ? "Geliştiriliyor…" : "Hatun AI ile geliştir"}</button></div>}
                <div className="inline-options"><label>Oran<select><option>9:16</option><option>1:1</option><option>16:9</option><option>3:4</option></select></label><label>Kalite<select><option>2K</option><option>1K</option><option>HD</option></select></label>{tool === "video" && <label>Süre<select><option>8 sn</option><option>5 sn</option><option>10 sn</option></select></label>}</div>
                <div className="estimate"><div><span>Tahmini maliyet</span><strong>{costs[tool]} kredi</strong></div><button onClick={generate} disabled={busy}>{busy ? "İşleniyor…" : tool === "clone" ? "Promptu klonla" : "Üret"} <span>↗</span></button></div>
                {notice && <div className="notice">{notice}</div>}
              </section>
              <section className="results-panel">
                <div className="panel-title"><div><span>CREATIONS</span><h3>Üretimler</h3></div><div className="mini-filters"><button className="active">Tümü</button><button>Görsel</button><button>Video</button></div></div>
                <div className="result-grid">{creations.slice(0, 6).map(c => <article className={`result-card ${c.color}`} key={c.id}><div className="fake-portrait"><span>H</span></div><div><em>{c.type}</em><strong>{c.title}</strong><small>{c.time}</small></div></article>)}</div>
              </section>
            </div>
          </div>
        )}

        {view === "tools" && (
          <div className="page">
            <div className="page-intro"><span>ÜRETİM MERKEZİ</span><h2>Tek platform.<br />Tüm yaratıcı araçlar.</h2><p>Hatun&apos;un güvenli üretim araçlarıyla fikirden yayına kadar bütün süreci yönet.</p></div>
            <div className="all-tools">{tools.map(t => <button key={t.id} onClick={() => openTool(t.id as StudioTool)}><span>{t.icon}</span><em>{t.type}</em><h3>{t.title}</h3><p>{t.text}</p><b>Aracı aç ↗</b></button>)}</div>
          </div>
        )}

        {view === "prompts" && (
          <div className="page">
            <div className="page-intro row"><div><span>İLHAM KÜTÜPHANESİ</span><h2>Hazır promptlar</h2><p>İçeriğine göre düzenle, tek tıkla stüdyoya taşı.</p></div><input className="library-search" placeholder="Promptlarda ara…" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <div className="prompt-grid">{filteredPrompts.map(([title, text], i) => <article key={title}><div className={`prompt-cover pc${i + 1}`}><span>HATUN / {String(i + 1).padStart(2, "0")}</span></div><h3>{title}</h3><p>{text}</p><button onClick={() => { setPrompt(text); openTool("image"); }}>Stüdyoda kullan ↗</button></article>)}</div>
          </div>
        )}

        {view === "gallery" && (
          <div className="page">
            <div className="page-intro row"><div><span>İÇERİK ARŞİVİ</span><h2>Galeri</h2><p>Tüm üretimlerini ara, filtrele ve yeniden kullan.</p></div><div className="gallery-filters">{["Tümü", "Görsel", "Video"].map(f => <button className={galleryFilter === f ? "active" : ""} key={f} onClick={() => setGalleryFilter(f)}>{f}</button>)}</div></div>
            <div className="gallery-grid">{filteredCreations.map(c => <article key={c.id} className={`gallery-card ${c.color}`}><div className="fake-portrait"><span>H</span></div><div><em>{c.type}</em><h3>{c.title}</h3><small>{c.time}</small><button>•••</button></div></article>)}</div>
          </div>
        )}

        {view === "pricing" && (
          <div className="page pricing-page">
            <div className="page-intro center"><span>ESNEK KAPASİTE</span><h2>Üretim hacmine göre büyü.</h2><p>İstediğin zaman yükselt, iptal et veya ek kredi al.</p></div>
            <div className="pricing-grid">{plans.map(p => <article key={p.name} className={p.popular ? "popular" : ""}>{p.popular && <em>EN POPÜLER</em>}<h3>{p.name}</h3><p>{p.note}</p><div className="plan-price"><strong>{p.price}</strong><span>/ay</span></div><div className="plan-credits">{p.credits} kredi / ay</div><ul><li>✓ Hızlı üretim kuyruğu</li><li>✓ Ticari kullanım</li><li>✓ 180 gün galeri</li><li>✓ Güvenli yetişkin doğrulaması</li></ul><button disabled={p.current}>{p.current ? "Mevcut plan" : "Paketi seç"}</button></article>)}</div>
          </div>
        )}
      </main>
    </div>
  );
}
