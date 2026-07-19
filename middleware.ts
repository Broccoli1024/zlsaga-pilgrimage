export const config = {
  matcher: [
    "/",
    "/spots",
    "/spots/:id*",
    "/about",
    "/faq",
    "/privacy",
    "/terms",
    "/license",
  ],
};

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

  return new Response(html, {
    status: indexRes.status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
