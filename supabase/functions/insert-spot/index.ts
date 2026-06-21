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
    // ① 呼び出し元の認証確認（管理者のみ許可）
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

    // ② service_roleクライアントでRLSをバイパスして書き込み
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { rows } = await req.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(
        JSON.stringify({ error: "登録するデータがありません" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        },
      );
    }

    let successCount = 0;
    let failCount = 0;
    const failedDetails: { name: string; error: string }[] = [];

    for (const row of rows) {
      const { data: insertedSpot, error } = await supabaseAdmin
        .from("spots")
        .insert({
          work_id: row.work_id,
          area_id: row.area_id,
          category_id: row.category_id,
          name: row.name,
          name_en: row.name_en || null,
          lat: row.lat,
          lng: row.lng,
          address: row.address || null,
          address_en: row.address_en || null,
          description: row.description || null,
          description_en: row.description_en || null,
          access_info: row.access_info || null,
          parking_info: row.parking_info || null,
          duration_min: row.duration_min || null,
          nearest_station_name: row.nearest_station_name || null,
          nearest_station_walk_min: row.nearest_station_walk_min || null,
          nearest_bus_stop_name: row.nearest_bus_stop_name || null,
          nearest_bus_stop_walk_min: row.nearest_bus_stop_walk_min || null,
          access_notes: row.access_notes || null,
          is_published: row.is_published,
        })
        .select()
        .single();

      if (error || !insertedSpot) {
        failCount++;
        failedDetails.push({
          name: row.name,
          error: error?.message ?? "unknown",
        });
        continue;
      }

      if (row.tag_ids && row.tag_ids.length > 0) {
        await supabaseAdmin.from("spot_significance_tags").insert(
          row.tag_ids.map((tagId: string) => ({
            spot_id: insertedSpot.id,
            tag_id: tagId,
          })),
        );
      }

      if (row.character_ids && row.character_ids.length > 0) {
        const { error: charError } = await supabaseAdmin
          .from("spot_characters")
          .insert(
            row.character_ids.map((characterId: string) => ({
              spot_id: insertedSpot.id,
              character_id: characterId,
            })),
          );
        if (charError) {
          console.error("キャラクター登録エラー:", charError);
        }
      }

      if (row.episode_ids && row.episode_ids.length > 0) {
        const { error: epError } = await supabaseAdmin
          .from("spot_episodes")
          .insert(
            row.episode_ids.map((episodeId: string) => ({
              spot_id: insertedSpot.id,
              episode_id: episodeId,
            })),
          );
        if (epError) {
          console.error("エピソード登録エラー:", epError);
        }
      }

      successCount++;
    }

    return new Response(
      JSON.stringify({ successCount, failCount, failedDetails }),
      {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});
