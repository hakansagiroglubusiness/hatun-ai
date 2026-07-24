import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("defines Hatun Creator Studio product metadata and UI", async () => {
  const [layout, page] = await Promise.all([
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("app/page.tsx", root), "utf8"),
  ]);
  assert.match(layout, /Hatun — AI Creator Studio/);
  assert.match(page, /HATUN CREATOR STUDIO/);
  assert.match(page, /Bugün ne/);
  assert.doesNotMatch(`${layout}\n${page}`, /codex-preview|Your site is taking shape/);
});

test("ships persistent product routes and storage schema", async () => {
  const required = [
    "app/api/account/route.ts",
    "app/api/generate/route.ts",
    "app/api/uploads/route.ts",
    "app/api/generations/[id]/route.ts",
    "app/api/assets/[id]/route.ts",
    "app/api/billing/checkout/route.ts",
    "app/api/billing/webhook/route.ts",
    "app/admin/page.tsx",
    "drizzle/0000_amazing_shen.sql",
  ];
  await Promise.all(required.map(path => access(new URL(path, root))));
  const hosting = JSON.parse(await readFile(new URL(".openai/hosting.json", root), "utf8"));
  assert.equal(hosting.d1, "DB");
  assert.equal(hosting.r2, "MEDIA");
  const storageSources = await Promise.all([
    readFile(new URL("lib/hatun-db.ts", root), "utf8"),
    readFile(new URL("app/api/uploads/route.ts", root), "utf8"),
    readFile(new URL("app/api/assets/[id]/route.ts", root), "utf8"),
  ]);
  assert.match(storageSources.join("\n"), /env\.MEDIA\.(put|get)/);
  assert.doesNotMatch(storageSources.join("\n"), /env\.ASSETS\.(put|get)/);
});

test("contains clean Turkish copy and no mock generation timer", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  assert.match(page, /Görsel üret/);
  assert.match(page, /İzinli yüz değişimi/);
  assert.doesNotMatch(page, /GÃ¶rsel|Ãœretim|Gerçek sağlayıcı bağlantısı/);
  assert.doesNotMatch(page, /window\.setTimeout\(\(\) => \{\s*setCredits/);
});
