import { findGuideArticle, guideArticles } from "./src/data/guideArticles";

export const config = {
  matcher: [
    "/",
    "/spots",
    "/spots/:id*",
    "/guide",
    "/guide/:path*",
    "/about",
    "/faq",
    "/privacy",
    "/terms",
    "/license",
    "/routes/:path*",
    "/mypage",
    "/login",
    "/reset-password",
    "/admin",
  ],
};

const NOINDEX_PATHS = new Set([
  "/mypage",
  "/login",
  "/reset-password",
  "/admin",
]);

function shouldNoIndex(pathname: string): boolean {
  return NOINDEX_PATHS.has(pathname) || pathname.startsWith("/routes/");
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

interface PageMeta {
  title: string;
  description: string;
}

const STATIC_META: Record<string, PageMeta> = {
  "/": {
    title: "ゾンビランドサガ 聖地巡礼マップ | ピルグリマップ",
    description:
      "ピルグリマップは、ゾンビランドサガの聖地（ロケ地・モデル地）を佐賀県内で検索し、巡礼ルートを計画できる地図アプリです。",
  },
  "/spots": {
    title: "スポット一覧 | ピルグリマップ",
    description:
      "ピルグリマップに登録されている、ゾンビランドサガの聖地スポット一覧です。",
  },
  "/guide": {
    title: "聖地巡礼ガイド | ピルグリマップ",
    description:
      "ゾンビランドサガの聖地を探し、無理のない巡礼ルートを組み、現地で気持ちよく楽しむためのガイドです。",
  },
  "/about": {
    title: "このアプリについて | ピルグリマップ",
    description:
      "「ピルグリマップ」は、アニメ・漫画などの作品に登場する聖地を地図上でめぐるための聖地巡礼支援アプリです。",
  },
  "/faq": {
    title: "よくある質問 | ピルグリマップ",
    description: "ピルグリマップに関するよくある質問をまとめています。",
  },
  "/privacy": {
    title: "プライバシーポリシー | ピルグリマップ",
    description: "ピルグリマップのプライバシーポリシーです。",
  },
  "/terms": {
    title: "利用規約 | ピルグリマップ",
    description: "ピルグリマップの利用規約です。",
  },
  "/license": {
    title: "ライセンス | ピルグリマップ",
    description:
      "ピルグリマップで利用しているOSS・サービスのライセンス情報です。",
  },
};

function renderGuideIndex(): string {
  const links = guideArticles
    .map(
      (article) =>
        `<li><a href="/guide/${escapeHtml(article.slug)}">${escapeHtml(article.titleJa)}</a><p>${escapeHtml(article.descriptionJa)}</p></li>`,
    )
    .join("");

  return `<main data-server-content="true"><h1>ゾンビランドサガ 聖地巡礼ガイド</h1><p>佐賀県内の聖地を、移動時間や現地での過ごし方まで考えて無理なく巡るための実用ガイドです。地図上の場所を集めるだけでなく、目的に合う場所を選び、地域の日常に配慮した計画を作る方法を紹介します。</p><h2>目的別・エリア別ガイド</h2><ul>${links}</ul><p><a href="/spots">登録スポットの一覧を見る</a></p></main>`;
}

function renderGuideArticle(pathname: string): string | null {
  const match = pathname.match(/^\/guide\/([^/]+)$/);
  if (!match) return null;
  const article = findGuideArticle(match[1]);
  if (!article) return null;

  const sections = article.sections
    .map(
      (section) =>
        `<section><h2>${escapeHtml(section.headingJa)}</h2>${section.paragraphsJa
          .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
          .join("")}</section>`,
    )
    .join("");
  const spots = article.spots.length
    ? `<section><h2>このガイドで紹介したスポット</h2><ul>${article.spots
        .map(
          (spot) =>
            `<li><a href="/spots/${encodeURIComponent(spot.id)}">${escapeHtml(spot.ja)}</a></li>`,
        )
        .join("")}</ul></section>`
    : "";

  return `<main data-server-content="true"><article><h1>${escapeHtml(article.titleJa)}</h1><p>${escapeHtml(article.introJa)}</p>${sections}${spots}<p><a href="/guide">聖地巡礼ガイドへ戻る</a></p></article></main>`;
}

function renderStaticFallback(pathname: string, meta?: PageMeta): string {
  if (pathname === "/guide") return renderGuideIndex();
  const article = renderGuideArticle(pathname);
  if (article) return article;

  const title = meta?.title ?? "ピルグリマップ";
  const description =
    meta?.description ??
    "ゾンビランドサガの聖地と周辺の観光スポットを探し、巡礼ルートを計画できる地図サービスです。";
  return `<main data-server-content="true"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><nav aria-label="主要ページ"><ul><li><a href="/guide">聖地巡礼ガイド</a></li><li><a href="/spots">スポット一覧</a></li><li><a href="/about">このアプリについて</a></li><li><a href="/faq">よくある質問</a></li></ul></nav></main>`;
}

async function fetchSpotMeta(spotId: string): Promise<PageMeta | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/spots?id=eq.${encodeURIComponent(
        spotId,
      )}&select=name,description&is_published=eq.true`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as {
      name: string;
      description: string | null;
    }[];
    const spot = rows[0];
    if (!spot) return null;
    return {
      title: `${spot.name} | ピルグリマップ`,
      description:
        spot.description ??
        `${spot.name} - ピルグリマップに登録されている聖地スポット`,
    };
  } catch {
    return null;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  let meta: PageMeta | undefined = STATIC_META[pathname];

  const spotMatch = pathname.match(/^\/spots\/([^/]+)$/);
  if (spotMatch) {
    meta = (await fetchSpotMeta(spotMatch[1])) ?? {
      title: "スポット詳細 | ピルグリマップ",
      description: "ピルグリマップのスポット詳細ページです。",
    };
  }

  const guideMatch = pathname.match(/^\/guide\/([^/]+)$/);
  if (guideMatch) {
    const article = findGuideArticle(guideMatch[1]);
    if (article) {
      meta = {
        title: `${article.titleJa} | ピルグリマップ`,
        description: article.descriptionJa,
      };
    }
  }

  // 元のindex.htmlを取得（このURLはmiddlewareのmatcherに含まれないため無限ループしない）
  const indexRes = await fetch(new URL("/index.html", url.origin));
  let html = await indexRes.text();

  if (meta) {
    const title = escapeHtml(meta.title);
    const description = escapeHtml(meta.description);
    const canonical = `${url.origin}${pathname}`;

    html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
    html = html.replace(
      "</head>",
      `<meta name="description" content="${description}" />\n` +
        `<link rel="canonical" href="${canonical}" />\n` +
        `<meta property="og:title" content="${title}" />\n` +
        `<meta property="og:description" content="${description}" />\n` +
        `<meta property="og:url" content="${canonical}" />\n` +
        `</head>`,
    );
  }

  if (shouldNoIndex(pathname)) {
    html = html.replace(
      "</head>",
      '<meta name="robots" content="noindex, follow" />\n</head>',
    );
  }

  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${renderStaticFallback(pathname, meta)}</div>`,
  );

  return new Response(html, {
    status: indexRes.status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
