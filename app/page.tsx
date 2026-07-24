"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight, Blocks, Check, Command, Copy, Download, Expand, HomeIcon,
  ImageIcon, Images, Library, LoaderCircle, Menu, MoreHorizontal, Plus,
  RefreshCw, Search, Sparkles, Trash2, Upload, WandSparkles, X,
} from "lucide-react";

type View = "home" | "studio" | "gallery" | "prompts" | "tools" | "pricing";
type StudioTool = "image" | "clone" | "upscale";
type Creation = {
  id: string;
  type: "Görsel" | "Video";
  title: string;
  status: string;
  assetUrl?: string | null;
  prompt?: string | null;
  error?: string | null;
  createdAt?: string | number | Date;
  color?: string;
};
type AccountResponse = {
  error?: string;
  user: { credits: number; displayName: string };
  generations: Creation[];
};
type PromptResponse = { error?: string; prompt?: string };
type UploadResponse = { error?: string; uploads?: Array<{ id: string }> };
type GenerateResponse = {
  error?: string;
  credits: number;
  generation: Creation;
  clonedPrompt?: string;
  safeFallbackApplied?: boolean;
  safePrompt?: string;
};
type LibraryPrompt = {
  id: string;
  title: string;
  category: string;
  format: string;
  prompt: string;
  previewUrl: string;
  sourceUrl: string;
};

const tools = [
  { id: "image", title: "Görsel üret", text: "Metin ve referanslardan yüksek kaliteli görseller", icon: ImageIcon, type: "Görsel" },
  { id: "clone", title: "Prompt klonla", text: "Bir görseli yeniden üretecek promptu çıkar", icon: Command, type: "Prompt" },
  { id: "upscale", title: "Görsel iyileştir", text: "Keskinlik, detay ve çözünürlüğü yükselt", icon: Expand, type: "Görsel" },
] as const;

const models: Record<StudioTool, string[]> = {
  image: ["GPT Image 2"],
  clone: ["Hatun Vision"],
  upscale: ["Hatun HD"],
};

const costs: Record<StudioTool, number> = {
  image: 60, clone: 5, upscale: 40,
};

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
  const [promptCards, setPromptCards] = useState<LibraryPrompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<LibraryPrompt | null>(null);
  const [selectedCreation, setSelectedCreation] = useState<Creation | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [galleryFilter, setGalleryFilter] = useState("Tümü");
  const [mobileNav, setMobileNav] = useState(false);
  const [ratio, setRatio] = useState("9:16");
  const [quality, setQuality] = useState("2K");

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
    const hasPending = creations.some(item => ["queued", "in_progress", "processing", "finalizing"].includes(item.status));
    if (!hasPending) return;
    const timer = window.setInterval(async () => {
      const pending = creations.filter(item => ["queued", "in_progress", "processing", "finalizing"].includes(item.status));
      await Promise.all(pending.map(item => fetch(`/api/generations/${item.id}`, { cache: "no-store" })));
      await loadAccount();
    }, 7000);
    return () => window.clearInterval(timer);
  }, [creations]);

  useEffect(() => {
    if (view !== "prompts" || promptCards.length) return;
    void fetch("/api/prompts")
      .then(async response => {
        if (!response.ok) throw new Error("Prompt kütüphanesi yüklenemedi.");
        return response.json() as Promise<{ prompts?: LibraryPrompt[] }>;
      })
      .then(data => setPromptCards(data.prompts || []))
      .catch(() => setNotice("Prompt kütüphanesi yüklenemedi."));
  }, [view, promptCards.length]);

  const filteredPrompts = promptCards.filter(item =>
    `${item.title} ${item.prompt} ${item.category} ${item.format}`.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr")),
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
      const data = await response.json().catch(() => ({})) as PromptResponse;
      if (!response.ok) {
        throw new Error(data.error || "Prompt şu anda geliştirilemedi. Lütfen kısa bir süre sonra yeniden deneyin.");
      }
      if (typeof data.prompt !== "string" || !data.prompt.trim()) {
        throw new Error("Prompt geliştirildi ancak geçerli bir sonuç alınamadı. Metniniz korunuyor; lütfen yeniden deneyin.");
      }
      setPrompt(data.prompt);
      setNotice("Prompt Hatun AI tarafından geliştirildi.");
    } catch (error) {
      setNotice(error instanceof Error
        ? error.message
        : "Prompt şu anda geliştirilemedi. Metniniz korunuyor; lütfen yeniden deneyin.");
    } finally {
      setBusy(false);
    }
  };

  const uploadReferences = async () => {
    if (!selectedFiles.length) return [];
    const form = new FormData();
    selectedFiles.forEach(file => form.append("files", file));
    form.set("purpose", tool);
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
    if (tool === "image" && !prompt.trim()) return setNotice("Üretim için bir prompt yaz.");
    if (["upscale", "clone"].includes(tool) && !selectedFiles.length && !uploadIds.length) {
      return setNotice("Bu araç için en az bir dosya ekle.");
    }
    setBusy(true);
    setNotice("Üretim hazırlanıyor…");
    try {
      const ids = uploadIds.length ? uploadIds : await uploadReferences();
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool, model, prompt, ratio, quality,
          uploadIds: ids,
        }),
      });
      const data = await response.json() as GenerateResponse;
      if (!response.ok) throw new Error(data.error || "Üretim başlatılamadı.");
      setCredits(data.credits);
      setCreations(prev => [{ ...data.generation, createdAt: Date.now(), color: "rose" }, ...prev]);
      if (data.clonedPrompt) setPrompt(data.clonedPrompt);
      setNotice(
        data.safeFallbackApplied
          ? "İlk istek güvenlik kontrolüne takıldı. Sahne ve kompozisyon korunarak daha güvenli bir promptla üretildi."
          : data.generation.status === "completed"
            ? "Üretim tamamlandı."
            : "Üretim kuyruğa alındı; durum otomatik güncellenecek.",
      );
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

  const editCreation = (item: Creation) => {
    openTool("image");
    setPrompt(item.prompt || item.title);
    setNotice("Üretimin promptu düzenleme için stüdyoya taşındı.");
  };

  const recreateCreation = (item: Creation) => {
    editCreation(item);
    setNotice("Aynı prompt hazır. Yeni referans görselini ekleyip tekrar üretebilirsin.");
    setSelectedCreation(null);
  };

  const deleteCreation = async (item: Creation) => {
    if (!window.confirm("Bu üretim ve dosyası kalıcı olarak silinsin mi?")) return;
    try {
      const response = await fetch(`/api/generations/${item.id}`, { method: "DELETE" });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Üretim silinemedi.");
      setCreations(previous => previous.filter(creation => creation.id !== item.id));
      if (selectedCreation?.id === item.id) setSelectedCreation(null);
      setNotice("Üretim galeriden silindi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Üretim silinemedi.");
    }
  };

  const initials = displayName.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase() || "H";

  return (
    <div className="app-shell">
      <aside className={mobileNav ? "sidebar open" : "sidebar"}>
        <div className="side-brand"><Logo /><strong>Hatun</strong><button className="nav-close icon-button" aria-label="Menüyü kapat" onClick={() => setMobileNav(false)}><X size={18} /></button></div>
        <button className="create-btn" onClick={() => openTool("image")}><Plus size={17} /> Yeni üretim</button>
        <nav className="side-nav" aria-label="Ana menü">
          <button className={view === "home" ? "active" : ""} onClick={() => { setView("home"); setMobileNav(false); }}><HomeIcon size={17} /><span>Ana sayfa</span></button>
          <button className={view === "gallery" ? "active" : ""} onClick={() => { setView("gallery"); setMobileNav(false); }}><Images size={17} /><span>Galeri</span></button>
          <button className={view === "prompts" ? "active" : ""} onClick={() => { setView("prompts"); setMobileNav(false); }}><Library size={17} /><span>Prompt kütüphanesi</span></button>
        </nav>
        <div className="nav-label">ARAÇLAR</div>
        <nav className="side-nav compact">
          <button className={view === "tools" ? "active" : ""} onClick={() => { setView("tools"); setMobileNav(false); }}><Blocks size={17} /><span>Tüm araçlar</span></button>
          <button onClick={() => openTool("image")}><ImageIcon size={17} /><span>Görsel üret</span></button>
          <button onClick={() => openTool("clone")}><Command size={17} /><span>Prompt klonla</span></button>
        </nav>
        <div className="side-bottom">
          <div className="reward"><span>Haftalık ödül</span><strong>Yakında · +400</strong></div>
          <button className="profile"><span>{initials}</span><div><strong>{displayName}</strong><small>{credits.toLocaleString("tr-TR")} kredi</small></div><MoreHorizontal size={17} /></button>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Menüyü aç" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
          <div><h1>{view === "home" ? "Ana sayfa" : view === "studio" ? "Üretim stüdyosu" : view === "gallery" ? "Galeri" : view === "prompts" ? "Prompt kütüphanesi" : view === "tools" ? "Tüm araçlar" : "Paketler"}</h1></div>
          <div className="top-actions"><button className="search-pill" onClick={() => setView("prompts")}><Search size={15} /><span>Ara</span><kbd>⌘ K</kbd></button><button className="credit-pill" onClick={() => setView("pricing")}><Sparkles size={15} />{credits.toLocaleString("tr-TR")}</button><button className="avatar">{initials}</button></div>
        </header>

        {view === "home" && (
          <div className="page home-page">
            <section className="welcome">
              <div><span className="welcome-tag">HATUN CREATOR STUDIO</span><h2>Bugün ne<br />üretiyoruz?</h2><p>Karakterini oluştur, aynı yüzü koru ve içerik üretimini tek merkezden yönet.</p></div>
              <div className="welcome-orb"><Logo /><span className="orbit o1" /><span className="orbit o2" /></div>
            </section>
            <section className="quick-grid">
              {tools.slice(0, 4).map(item => { const ToolIcon = item.icon; return <button key={item.id} onClick={() => openTool(item.id as StudioTool)}><span className="tool-icon"><ToolIcon size={18} /></span><div><strong>{item.title}</strong><small>{item.text}</small></div><ArrowUpRight size={16} /></button>; })}
            </section>
            <section className="dashboard-grid">
              <div className="panel">
                <div className="panel-title"><div><span>SON ÜRETİMLER</span><h3>Kaldığın yerden devam et</h3></div><button onClick={() => setView("gallery")}>Tümünü gör</button></div>
                <CreationGrid creations={creations.slice(0, 4)} compact onOpen={item => { setView("gallery"); setSelectedCreation(item); }} onRecreate={recreateCreation} />
              </div>
              <aside className="usage-card"><span>AYLIK KULLANIM</span><h3>{credits.toLocaleString("tr-TR")}</h3><p>kalan kredi</p><div className="meter"><i style={{ width: `${Math.min(100, credits / 120)}%` }} /></div><small>Creator planı · 12.000 kredi</small><button onClick={() => setView("pricing")}>Paketi yükselt</button></aside>
            </section>
          </div>
        )}

        {view === "studio" && (
          <div className="page studio-page">
            <div className="studio-tabs"><button className="active">{tools.find(item => item.id === tool)?.title}</button><button className="icon-button" aria-label="Yeni görsel aracı" onClick={() => openTool("image")}><Plus size={17} /></button></div>
            <div className="studio-layout">
              <section className="config-panel">
                <div className="field"><label>Araç</label><select value={tool} onChange={event => openTool(event.target.value as StudioTool)}>{tools.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
                <div className="field"><label>Model</label><select value={model} onChange={event => setModel(event.target.value)}>{models[tool].map(item => <option key={item}>{item}</option>)}</select></div>
                <div className="field"><label>Referanslar <span>{selectedFiles.length}/8</span></label><label className="upload"><input type="file" multiple accept="image/jpeg,image/png,image/webp" onClick={event => { event.currentTarget.value = ""; }} onChange={event => { const files = Array.from(event.target.files || []).slice(0, 8); const oversized = files.find(file => file.size > 900 * 1024); if (oversized) { setSelectedFiles([]); setUploadIds([]); setNotice(`${oversized.name} yükleme sınırını aşıyor. Her dosya en fazla 900 KB olabilir.`); return; } setSelectedFiles(files); setUploadIds([]); setNotice(""); }} /><b><Upload size={17} /></b><span>{selectedFiles.length ? selectedFiles.map(file => file.name).join(", ") : "Referans görselleri ekle"}</span></label>{tool === "image" && <small>İlk görsel ana karakter/kompozisyon, diğerleri stil, kıyafet veya sahne referansı olarak kullanılır.</small>}</div>
                {tool !== "upscale" && <div className="field prompt-field"><label>Prompt</label><textarea value={prompt} onChange={event => setPrompt(event.target.value)} placeholder={tool === "clone" ? "Referans görselden çıkarılacak sahneyi açıklayabilirsin." : "Sahneyi, karakteri, ışığı ve kamera açısını anlat…"} /><button className="enhance" disabled={busy} onClick={enhancePrompt}>{busy ? <><LoaderCircle className="spin" size={15} /> İşleniyor…</> : <><WandSparkles size={15} /> Hatun AI ile geliştir</>}</button></div>}
                <div className="inline-options"><label>Oran<select value={ratio} onChange={event => setRatio(event.target.value)}><option>9:16</option><option>1:1</option><option>16:9</option><option>3:4</option></select></label><label>Kalite<select value={quality} onChange={event => setQuality(event.target.value)}><option>2K</option><option>1K</option><option>HD</option></select></label></div>
                <div className="estimate"><div><span>Tahmini maliyet</span><strong>{costs[tool]} kredi</strong></div><button onClick={generate} disabled={busy}>{busy ? <><LoaderCircle className="spin" size={17} /> İşleniyor…</> : <>{tool === "clone" ? "Promptu klonla" : "Üret"} <ArrowUpRight size={16} /></>}</button></div>
                {notice && <div className={`notice ${busy ? "processing" : ""}`}>{notice}</div>}
              </section>
              <section className="results-panel">
                <div className="panel-title"><div><span>CREATIONS</span><h3>Üretimler</h3></div><button className="text-icon-button" onClick={() => void loadAccount()}><RefreshCw size={14} /> Yenile</button></div>
                <CreationGrid creations={creations.slice(0, 8)} />
              </section>
            </div>
          </div>
        )}

        {view === "tools" && <div className="page"><div className="page-intro"><span>ÜRETİM MERKEZİ</span><h2>Tek platform.<br />Tüm yaratıcı araçlar.</h2><p>Hatun&apos;un güvenli üretim araçlarıyla fikirden yayına kadar bütün süreci yönet.</p></div><div className="all-tools">{tools.map(item => { const ToolIcon = item.icon; return <button key={item.id} onClick={() => openTool(item.id as StudioTool)}><span><ToolIcon size={20} /></span><em>{item.type}</em><h3>{item.title}</h3><p>{item.text}</p><b>Aracı aç <ArrowUpRight size={14} /></b></button>; })}</div></div>}

        {view === "prompts" && <div className="page"><div className="page-intro row"><div><span>İLHAM KÜTÜPHANESİ</span><h2>Hazır promptlar</h2><p>{promptCards.length} lisanslı promptu ara, incele ve tek tıkla stüdyoya taşı.</p></div><input className="library-search" placeholder="Promptlarda ara…" value={search} onChange={event => setSearch(event.target.value)} /></div><div className="library-count">{filteredPrompts.length} prompt gösteriliyor</div><div className="prompt-grid">{filteredPrompts.map(item => <article key={item.id}><button className="prompt-preview" onClick={() => setSelectedPrompt(item)} aria-label={`${item.title} ayrıntılarını aç`}><img src={item.previewUrl} alt={item.title} loading="lazy" /><span>{item.format.toUpperCase()} · {item.id.replace("aiml-", "#")}</span></button><h3>{item.title}</h3><p>{item.prompt}</p><div className="prompt-actions"><button onClick={() => setSelectedPrompt(item)}>Tam prompt</button><button onClick={() => { setPrompt(item.prompt); openTool("image"); }}>Stüdyoda kullan ↗</button></div></article>)}</div></div>}

        {selectedPrompt && <div className="prompt-modal" role="dialog" aria-modal="true" aria-label={selectedPrompt.title}><button className="modal-backdrop" aria-label="Kapat" onClick={() => setSelectedPrompt(null)} /><div className="prompt-modal-card"><button className="modal-close" onClick={() => setSelectedPrompt(null)} aria-label="Kapat"><X size={17} /></button><img src={selectedPrompt.previewUrl} alt={selectedPrompt.title} /><div className="prompt-modal-content"><span>{selectedPrompt.format.toUpperCase()} · {selectedPrompt.category}</span><h3>{selectedPrompt.title}</h3><div className="prompt-code-wrap"><button className="prompt-copy-icon" title="Promptu kopyala" aria-label="Promptu kopyala" onClick={() => { void navigator.clipboard.writeText(selectedPrompt.prompt); setCopiedPromptId(selectedPrompt.id); window.setTimeout(() => setCopiedPromptId(null), 1600); }}>{copiedPromptId === selectedPrompt.id ? <Check size={17} /> : <Copy size={17} />}</button><pre>{selectedPrompt.prompt}</pre></div><div className="prompt-modal-actions"><button onClick={() => { setPrompt(selectedPrompt.prompt); setSelectedPrompt(null); openTool("image"); }}>Stüdyoda kullan <ArrowUpRight size={15} /></button></div></div></div></div>}

        {view === "gallery" && <div className="page"><div className="page-intro row"><div><span>İÇERİK ARŞİVİ</span><h2>Galeri</h2><p>Tüm üretimlerini filtrele, görüntüle ve indir.</p></div><div className="gallery-filters">{["Tümü", "Görsel", "Video"].map(filter => <button className={galleryFilter === filter ? "active" : ""} key={filter} onClick={() => setGalleryFilter(filter)}>{filter}</button>)}</div></div><div className="gallery-grid">{filteredCreations.map((item, index) => <article key={item.id} role="button" tabIndex={0} onClick={() => setSelectedCreation(item)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") setSelectedCreation(item); }} className={`gallery-card ${["rose", "violet", "amber", "cyan"][index % 4]}`}>{item.assetUrl ? item.type === "Video" ? <video src={item.assetUrl} controls onClick={event => event.stopPropagation()} /> : <img src={item.assetUrl} alt={item.title} /> : <div className="fake-portrait"><span>{item.status === "failed" ? "!" : "H"}</span></div>}<div><em>{item.type} · {statusLabel(item.status)}</em><small>{relativeTime(item.createdAt)}</small><div className="gallery-actions">{item.assetUrl && <a href={`${item.assetUrl}?download=1`} download aria-label="İndir" title="İndir" onClick={event => event.stopPropagation()}><Download size={16} /></a>}<button onClick={event => { event.stopPropagation(); recreateCreation(item); }} aria-label="Yeni referansla yeniden oluştur" title="Yeni referansla yeniden oluştur"><RefreshCw size={16} /></button><button className="delete" onClick={event => { event.stopPropagation(); void deleteCreation(item); }} aria-label="Sil" title="Sil"><Trash2 size={16} /></button></div></div></article>)}</div></div>}

        {selectedCreation && <div className="creation-modal" role="dialog" aria-modal="true" aria-label="Üretim detayı"><button className="modal-backdrop" aria-label="Kapat" onClick={() => setSelectedCreation(null)} /><div className="creation-modal-card"><button className="modal-close" onClick={() => setSelectedCreation(null)} aria-label="Kapat"><X size={17} /></button><div className="creation-modal-media">{selectedCreation.assetUrl ? selectedCreation.type === "Video" ? <video src={selectedCreation.assetUrl} controls autoPlay /> : <img src={selectedCreation.assetUrl} alt="Üretilen içerik" /> : <div className="fake-portrait"><span>H</span></div>}</div><div className="creation-modal-info"><span>{selectedCreation.type} · {statusLabel(selectedCreation.status)}</span><h3>Üretim detayı</h3><p>{relativeTime(selectedCreation.createdAt)}</p><div className="creation-detail-actions">{selectedCreation.assetUrl && <a href={`${selectedCreation.assetUrl}?download=1`} download><Download size={16} /> İndir</a>}<button onClick={() => recreateCreation(selectedCreation)}><RefreshCw size={16} /> Yeni referansla oluştur</button><button className="delete" onClick={() => void deleteCreation(selectedCreation)}><Trash2 size={16} /> Sil</button></div></div></div></div>}

        {view === "pricing" && <div className="page pricing-page"><div className="page-intro center"><span>ESNEK KAPASİTE</span><h2>Üretim hacmine göre büyü.</h2><p>İstediğin zaman yükselt, iptal et veya ek kredi al.</p>{notice && <div className="notice">{notice}</div>}</div><div className="pricing-grid">{plans.map(plan => <article key={plan.name} className={plan.popular ? "popular" : ""}>{plan.popular && <em>EN POPÜLER</em>}<h3>{plan.name}</h3><p>{plan.note}</p><div className="plan-price"><strong>{plan.price}</strong><span>/ay</span></div><div className="plan-credits">{plan.credits} kredi / ay</div><ul><li>✓ Hızlı üretim kuyruğu</li><li>✓ Ticari kullanım</li><li>✓ 180 gün galeri</li><li>✓ Güvenli yetişkin doğrulaması</li></ul><button disabled={busy || plan.current} onClick={() => void startCheckout(plan.id)}>{plan.current ? "Mevcut plan" : "Paketi seç"}</button></article>)}</div><button className="extra-credit" disabled={busy} onClick={() => void startCheckout("credits")}>10.000 ek kredi satın al</button></div>}
      </main>
    </div>
  );
}

function statusLabel(status: string) {
  return status === "completed" ? "Tamamlandı" : status === "failed" ? "Başarısız" : "İşleniyor";
}

function CreationGrid({ creations, compact = false, onOpen, onRecreate }: {
  creations: Creation[];
  compact?: boolean;
  onOpen?: (item: Creation) => void;
  onRecreate?: (item: Creation) => void;
}) {
  if (!creations.length) {
    return <div className="empty-state">Henüz bir üretim yok. İlk içeriğini oluşturmaya başla.</div>;
  }
  return <div className={compact ? "creation-strip" : "result-grid"}>{creations.map((item, index) => {
    const className = compact ? `creation ${["rose", "violet", "amber", "cyan"][index % 4]}` : `result-card ${["rose", "violet", "amber", "cyan"][index % 4]}`;
    return <article key={item.id} className={className} role={onOpen ? "button" : undefined} tabIndex={onOpen ? 0 : undefined} onClick={() => onOpen?.(item)} onKeyDown={event => { if (onOpen && (event.key === "Enter" || event.key === " ")) onOpen(item); }}>
      {item.assetUrl ? item.type === "Video" ? <video src={item.assetUrl} muted /> : <img src={item.assetUrl} alt={item.title} /> : <div className="fake-portrait"><span>{item.status === "failed" ? "!" : "H"}</span></div>}
      <div className="creation-meta"><em>{item.type} · {statusLabel(item.status)}</em><small>{relativeTime(item.createdAt)}</small>{compact && <div className="creation-actions">{item.assetUrl && <a href={`${item.assetUrl}?download=1`} download title="İndir" aria-label="İndir" onClick={event => event.stopPropagation()}><Download size={15} /></a>}<button title="Yeni referansla yeniden oluştur" aria-label="Yeni referansla yeniden oluştur" onClick={event => { event.stopPropagation(); onRecreate?.(item); }}><RefreshCw size={15} /></button></div>}</div>
    </article>;
  })}</div>;
}
