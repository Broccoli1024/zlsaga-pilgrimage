import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN_EMAILS = ["rikurin2016@gmail.com"];

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
    const supabaseAuthClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userError } =
      await supabaseAuthClient.auth.getUser();

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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { action, spotId, updates, tagIds } = await req.json();

    // ① 一覧取得
    if (action === "list") {
      const { data, error } = await supabaseAdmin
        .from("spots")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        });
      }

      // タグも一緒に取得
      const { data: spotTags } = await supabaseAdmin
        .from("spot_significance_tags")
        .select("spot_id, tag_id");

      return new Response(
        JSON.stringify({ spots: data, spotTags: spotTags ?? [] }),
        {
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        },
      );
    }

    // ② 削除
    if (action === "delete") {
      if (!spotId) {
        return new Response(JSON.stringify({ error: "spotIdが必要です" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        });
      }
      const { error } = await supabaseAdmin
        .from("spots")
        .delete()
        .eq("id", spotId);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // ③ 更新
    if (action === "update") {
      if (!spotId || !updates) {
        return new Response(
          JSON.stringify({ error: "spotIdとupdatesが必要です" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS },
          },
        );
      }
      const { error } = await supabaseAdmin
        .from("spots")
        .update(updates)
        .eq("id", spotId);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        });
      }

      // タグの更新（一旦全削除して再登録）
      if (tagIds !== undefined) {
        await supabaseAdmin
          .from("spot_significance_tags")
          .delete()
          .eq("spot_id", spotId);
        if (tagIds.length > 0) {
          await supabaseAdmin
            .from("spot_significance_tags")
            .insert(
              tagIds.map((tagId: string) => ({
                spot_id: spotId,
                tag_id: tagId,
              })),
            );
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    return new Response(JSON.stringify({ error: "不明なactionです" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});
