import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN_EMAILS = ["rikurin2016@gmail.com"];

function base64url(input: ArrayBuffer | string): string {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);
  const str = btoa(String.fromCharCode(...bytes));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getAccessToken(): Promise<string> {
  const email = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL")!;
  const privateKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY")!;

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: email,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const pemContents = privateKey
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken),
  );

  const jwt = `${unsignedToken}.${base64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`トークン取得失敗: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

// 短縮URLを展開し、最終的なURLを返す
async function resolveShortUrl(url: string): Promise<string> {
  if (!url) return url;
  if (!url.includes("goo.gl") && !url.includes("maps.app")) {
    return url;
  }
  try {
    const res = await fetch(url, { redirect: "follow" });
    return res.url;
  } catch {
    return url;
  }
}

// URLから緯度経度を抽出
function extractCoordinates(url: string): { lat: string; lng: string } | null {
  const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (!match) return null;
  return { lat: match[1], lng: match[2] };
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser();

    if (
      userError ||
      !userData.user?.email ||
      !ADMIN_EMAILS.includes(userData.user.email)
    ) {
      return new Response(JSON.stringify({ error: "権限がありません" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // service_roleクライアントで既取得タイムスタンプを確認
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: loggedResponses } = await supabaseAdmin
      .from("form_response_log")
      .select("response_timestamp");

    const loggedTimestamps = new Set(
      (loggedResponses ?? []).map((r: any) => r.response_timestamp),
    );

    const accessToken = await getAccessToken();
    const sheetId = Deno.env.get("GOOGLE_SHEET_ID")!;
    const range = "フォームの回答 1";

    const sheetRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const sheetData = await sheetRes.json();

    if (!sheetData.values) {
      return new Response(
        JSON.stringify({
          error: "データが取得できませんでした",
          detail: sheetData,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        },
      );
    }

    const [headerRow, ...rows] = sheetData.values;
    const records = await Promise.all(
      rows.map(async (row: string[]) => {
        const obj: Record<string, string> = {};
        const seenKeys: Record<string, number> = {};

        headerRow.forEach((key: string, i: number) => {
          const count = seenKeys[key] ?? 0;
          seenKeys[key] = count + 1;
          const uniqueKey = count === 0 ? key : `${key}__${count}`;
          obj[uniqueKey] = row[i] ?? "";
        });

        const mapUrlKey = Object.keys(obj).find((k) =>
          k.startsWith("Googleマップ"),
        );
        if (mapUrlKey && obj[mapUrlKey]) {
          const resolvedUrl = await resolveShortUrl(obj[mapUrlKey]);
          const coords = extractCoordinates(resolvedUrl);
          obj["_resolved_url"] = resolvedUrl;
          obj["_lat"] = coords?.lat ?? "";
          obj["_lng"] = coords?.lng ?? "";
        }

        return obj;
      }),
    );

    // 未取得（form_response_logに記録のない）回答だけに絞る
    const newRecords = records.filter((r: Record<string, string>) => {
      const ts = r["タイムスタンプ"];
      return ts && !loggedTimestamps.has(ts);
    });

    // 新しい回答をログに記録（fetchした時点で記録する）
    if (newRecords.length > 0) {
      await supabaseAdmin.from("form_response_log").insert(
        newRecords.map((r: Record<string, string>) => ({
          response_timestamp: r["タイムスタンプ"],
          spot_name: r["スポット名"] || r["スポット名__1"] || "",
          status: "fetched",
        })),
      );
    }

    return new Response(JSON.stringify({ records: newRecords }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});
