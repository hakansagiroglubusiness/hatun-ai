import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { creditLedger, generations, subscriptions, users } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const identity = await requireChatGPTUser("/admin");
  const db = getDb();
  const user = await db.query.users.findFirst({
    where: eq(users.email, identity.email.toLowerCase()),
  });

  if (user?.role !== "admin") {
    return <main className="admin-shell"><section className="admin-empty"><h1>Erişim yok</h1><p>Bu sayfa yalnızca Hatun yöneticilerine açıktır.</p><Link href="/">Stüdyoya dön</Link></section></main>;
  }

  const [userCount, generationCount, activeSubscriptions, creditUsage, recent] = await Promise.all([
    db.select({ value: sql<number>`count(*)` }).from(users),
    db.select({ value: sql<number>`count(*)` }).from(generations),
    db.select({ value: sql<number>`count(*)` }).from(subscriptions).where(eq(subscriptions.status, "active")),
    db.select({ value: sql<number>`coalesce(sum(-${creditLedger.amount}), 0)` })
      .from(creditLedger)
      .where(sql`${creditLedger.reason} LIKE 'generation_%'`),
    db.select({
      id: generations.id,
      status: generations.status,
      tool: generations.tool,
      credits: generations.creditsCharged,
      createdAt: generations.createdAt,
      email: users.email,
    }).from(generations).innerJoin(users, eq(generations.userId, users.id)).orderBy(desc(generations.createdAt)).limit(20),
  ]);

  return <main className="admin-shell">
    <header className="admin-head"><div><span>HATUN OPERATIONS</span><h1>Yönetim merkezi</h1></div><Link href="/">Stüdyoya dön</Link></header>
    <section className="admin-metrics">
      <Metric label="Kullanıcı" value={userCount[0]?.value || 0} />
      <Metric label="Üretim" value={generationCount[0]?.value || 0} />
      <Metric label="Aktif abonelik" value={activeSubscriptions[0]?.value || 0} />
      <Metric label="Harcanan kredi" value={creditUsage[0]?.value || 0} />
    </section>
    <section className="admin-panel">
      <div className="admin-panel-title"><h2>Son üretimler</h2><span>Kullanıcı, araç ve durum takibi</span></div>
      <div className="admin-table">
        <div className="admin-row admin-labels"><span>Kullanıcı</span><span>Araç</span><span>Durum</span><span>Kredi</span><span>Tarih</span></div>
        {recent.map(item => <div className="admin-row" key={item.id}><span>{item.email}</span><span>{item.tool}</span><span className={`status ${item.status}`}>{item.status}</span><span>{item.status === "failed" ? 0 : item.credits}</span><span>{new Date(item.createdAt).toLocaleString("tr-TR")}</span></div>)}
      </div>
    </section>
  </main>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <article><span>{label}</span><strong>{value.toLocaleString("tr-TR")}</strong></article>;
}
