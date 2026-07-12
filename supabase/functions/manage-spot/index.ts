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

    const { action, spotId, updates, tagIds, characterIds, episodeIds } =
      await req.json();

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
      const { data: spotTags, error: spotTagsError } = await supabaseAdmin
        .from("spot_significance_tags")
        .select("spot_id, tag_id");

      // キャラクター・エピソードの紐付けとマスタも一緒に取得
      const { data: spotCharacters, error: spotCharactersError } =
        await supabaseAdmin
          .from("spot_characters")
          .select("spot_id, character_id");
      const { data: characters, error: charactersError } = await supabaseAdmin
        .from("characters")
        .select("id, name, name_en")
        .order("sort_order");
      const { data: spotEpisodes, error: spotEpisodesError } =
        await supabaseAdmin.from("spot_episodes").select("spot_id, episode_id");
      const { data: episodes, error: episodesError } = await supabaseAdmin
        .from("episodes")
        .select("id, media_type, season, episode_number, title")
        .order("media_type")
        .order("season")
        .order("episode_number");

      const debugErrors = {
        spotTagsError: spotTagsError?.message,
        spotCharactersError: spotCharactersError?.message,
        charactersError: charactersError?.message,
        spotEpisodesError: spotEpisodesError?.message,
        episodesError: episodesError?.message,
      };
      if (Object.values(debugErrors).some(Boolean)) {
        console.error("list action 部分エラー:", debugErrors);
      }

      return new Response(
        JSON.stringify({
          spots: data,
          spotTags: spotTags ?? [],
          spotCharacters: spotCharacters ?? [],
          characters: characters ?? [],
          spotEpisodes: spotEpisodes ?? [],
          episodes: episodes ?? [],
          _debugErrors: debugErrors,
        }),
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
      console.log("update action received", {
        spotId,
        tagIds,
        characterIds,
        episodeIds,
      });
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
          await supabaseAdmin.from("spot_significance_tags").insert(
            tagIds.map((tagId: string) => ({
              spot_id: spotId,
              tag_id: tagId,
            })),
          );
        }
      }

      // 登場キャラクターの更新（一旦全削除して再登録）
      if (characterIds !== undefined) {
        const { error: charDeleteError } = await supabaseAdmin
          .from("spot_characters")
          .delete()
          .eq("spot_id", spotId);
        if (charDeleteError) {
          return new Response(
            JSON.stringify({
              error: `キャラクター削除エラー: ${charDeleteError.message}`,
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            },
          );
        }
        if (characterIds.length > 0) {
          const { error: charInsertError } = await supabaseAdmin
            .from("spot_characters")
            .insert(
              characterIds.map((characterId: string) => ({
                spot_id: spotId,
                character_id: characterId,
              })),
            );
          if (charInsertError) {
            return new Response(
              JSON.stringify({
                error: `キャラクター登録エラー: ${charInsertError.message}`,
              }),
              {
                status: 500,
                headers: {
                  "Content-Type": "application/json",
                  ...CORS_HEADERS,
                },
              },
            );
          }
        }
      }

      // 登場エピソードの更新（一旦全削除して再登録）
      if (episodeIds !== undefined) {
        const { error: epDeleteError } = await supabaseAdmin
          .from("spot_episodes")
          .delete()
          .eq("spot_id", spotId);
        if (epDeleteError) {
          return new Response(
            JSON.stringify({
              error: `エピソード削除エラー: ${epDeleteError.message}`,
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            },
          );
        }
        if (episodeIds.length > 0) {
          const { error: epInsertError } = await supabaseAdmin
            .from("spot_episodes")
            .insert(
              episodeIds.map((episodeId: string) => ({
                spot_id: spotId,
                episode_id: episodeId,
              })),
            );
          if (epInsertError) {
            return new Response(
              JSON.stringify({
                error: `エピソード登録エラー: ${epInsertError.message}`,
              }),
              {
                status: 500,
                headers: {
                  "Content-Type": "application/json",
                  ...CORS_HEADERS,
                },
              },
            );
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          _version: "char-episode-fix-v2",
          _received: { spotId, tagIds, characterIds, episodeIds },
        }),
        {
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        },
      );
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
