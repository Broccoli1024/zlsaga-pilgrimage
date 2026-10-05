import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const publisherId = "3271827222905842";

test("AdSense ownership is declared without loading Auto ads globally", async () => {
  const html = await readFile(
    new URL("../index.html", import.meta.url),
    "utf8",
  );

  assert.match(
    html,
    new RegExp(
      `name=["']google-adsense-account["'][\\s\\S]+ca-pub-${publisherId}`,
    ),
  );
  assert.doesNotMatch(
    html,
    /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/,
  );
});

test("ads.txt authorizes only the configured Google publisher", async () => {
  const adsTxt = await readFile(
    new URL("../public/ads.txt", import.meta.url),
    "utf8",
  );

  assert.equal(
    adsTxt,
    `google.com, pub-${publisherId}, DIRECT, f08c47fec0942fa0\n`,
  );
});

test("indexed pages expose meaningful server-rendered fallback content", async () => {
  const middleware = await readFile(
    new URL("../middleware.ts", import.meta.url),
    "utf8",
  );

  assert.match(middleware, /data-server-content/);
  assert.match(middleware, /renderGuideArticle/);
  assert.match(middleware, /renderStaticFallback/);
  assert.match(middleware, /renderStaticFallback\(pathname, meta\)/);
  assert.match(middleware, /noindex, follow/);
  assert.match(middleware, /pathname\.startsWith\(["']\/routes\//);
  assert.doesNotMatch(
    middleware,
    /pagead2\.googlesyndication\.com|class=["']adsbygoogle["']/,
  );
});

test("editorial guide pages are substantial and linked from the sitemap", async () => {
  const source = await readFile(
    new URL("../src/data/guideArticles.ts", import.meta.url),
    "utf8",
  );
  const sitemap = await readFile(
    new URL("../api/sitemap.ts", import.meta.url),
    "utf8",
  );

  const slugs = [
    "saga-city",
    "karatsu",
    "ureshino-takeo",
    "planning-and-etiquette",
  ];
  for (const slug of slugs) {
    assert.match(source, new RegExp(`slug: ["']${slug}["']`));
  }
  assert.match(sitemap, /guideArticles\.map/);
  assert.ok(source.length > 12_000, "guide content should remain substantial");
});
