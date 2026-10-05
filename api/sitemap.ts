import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// VercelのNode FunctionからフロントエンドのTSモジュールを直接読むと、
// デプロイ環境でESM解決に失敗するため、公開URLだけをここで明示する。
const GUIDE_SLUGS = [
  "saga-city",
  "karatsu",
  "ureshino-takeo",
  "planning-and-etiquette",
];

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!,
);

const BASE_URL = "https://pilgrimapp.jp";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { data: spots, error } = await supabase
    .from("spots")
    .select("id, updated_at")
    .eq("is_published", true);

  if (error) {
    return res.status(500).send("Failed to generate sitemap");
  }

  const staticPages = [
    "",
    "/spots",
    "/guide",
    "/about",
    "/faq",
    "/privacy",
    "/terms",
    "/license",
  ];

  const urls = [
    ...staticPages.map((page) => ({
      loc: `${BASE_URL}${page}`,
      lastmod: new Date().toISOString().split("T")[0],
    })),
    ...GUIDE_SLUGS.map((slug) => ({
      loc: `${BASE_URL}/guide/${slug}`,
      lastmod: new Date().toISOString().split("T")[0],
    })),
    ...(spots ?? []).map((spot) => ({
      loc: `${BASE_URL}/spots/${spot.id}`,
      lastmod: spot.updated_at?.split("T")[0],
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `
  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ""}
  </url>`,
  )
  .join("")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate",
  );

  res.status(200).send(xml);
}
