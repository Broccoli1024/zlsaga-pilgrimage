import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Map, { Marker } from "react-map-gl/mapbox";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";
import LangToggle from "../components/ui/LangToggle";
import type { Spot } from "../types";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

interface Area {
  id: string;
  name: string;
  name_en: string | null;
}
interface Category {
  id: string;
  name: string;
  name_en: string | null;
}
interface CharacterInfo {
  id: string;
  name: string;
  name_en: string | null;
  color_code: string | null;
}
interface EpisodeInfo {
  id: string;
  media_type: string;
  season: number;
  episode_number: number;
  title: string;
  title_en: string | null;
  scene_description: string | null;
  scene_description_en: string | null;
}

const seasonLabel = (
  season: number,
  mediaType: string,
  t: (key: string) => string,
) => {
  if (mediaType === "movie") return t("detail.seasonMovie");
  if (season === 1) return t("detail.seasonS1");
  if (season === 2) return t("detail.seasonS2");
  return `シーズン${season}`;
};

export default function SpotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");
  const user = useAuthStore((state) => state.user);

  const [spot, setSpot] = useState<Spot | null>(null);
  const [area, setArea] = useState<Area | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [characters, setCharacters] = useState<CharacterInfo[]>([]);
  const [episodes, setEpisodes] = useState<EpisodeInfo[]>([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [significanceTags, setSignificanceTags] = useState<
    { id: string; name: string; name_en: string | null }[]
  >([]);
  const [spotTagIds, setSpotTagIds] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchSpot = async () => {
      const { data: spotData, error } = await supabase
        .from("spots")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .single();
      if (error || !spotData) {
        setNotFound(true);
        return;
      }
      setSpot(spotData);

      if (spotData.area_id) {
        const { data } = await supabase
          .from("areas")
          .select("id, name, name_en")
          .eq("id", spotData.area_id)
          .single();
        setArea(data ?? null);
      }
      if (spotData.category_id) {
        const { data } = await supabase
          .from("categories")
          .select("id, name, name_en")
          .eq("id", spotData.category_id)
          .single();
        setCategory(data ?? null);
      }

      const { data: charLinks } = await supabase
        .from("spot_characters")
        .select("character_id")
        .eq("spot_id", spotData.id);
      if (charLinks && charLinks.length > 0) {
        const { data: chars } = await supabase
          .from("characters")
          .select("id, name, name_en, color_code")
          .in(
            "id",
            charLinks.map((c) => c.character_id),
          )
          .order("sort_order");
        setCharacters(chars ?? []);
      }

      const { data: epLinks } = await supabase
        .from("spot_episodes")
        .select("episode_id, scene_description, scene_description_en")
        .eq("spot_id", spotData.id);
      if (epLinks && epLinks.length > 0) {
        const { data: eps } = await supabase
          .from("episodes")
          .select("id, media_type, season, episode_number, title, title_en")
          .in(
            "id",
            epLinks.map((e) => e.episode_id),
          );
        setEpisodes(
          (eps ?? []).map((ep) => {
            const link = epLinks.find((l) => l.episode_id === ep.id);
            return {
              ...ep,
              scene_description: link?.scene_description ?? null,
              scene_description_en: link?.scene_description_en ?? null,
            };
          }),
        );
      }

      const { data: tagLinks } = await supabase
        .from("spot_significance_tags")
        .select("tag_id")
        .eq("spot_id", spotData.id);
      if (tagLinks) setSpotTagIds(tagLinks.map((t) => t.tag_id));
      const { data: allTags } = await supabase
        .from("significance_tags")
        .select("id, name, name_en")
        .order("sort_order");
      if (allTags) setSignificanceTags(allTags);
    };
    fetchSpot();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    const fetchCheckin = async () => {
      const { data } = await supabase
        .from("spot_checkins")
        .select("is_favorite")
        .eq("user_id", user.id)
        .eq("spot_id", id)
        .maybeSingle();
      if (data) {
        setCheckedIn(true);
        setIsFavorite(data.is_favorite);
      }
    };
    fetchCheckin();
  }, [user, id]);

  useEffect(() => {
    if (!spot) return;
    const name = isEn ? (spot.name_en ?? spot.name) : spot.name;
    document.title = isEn
      ? `${name} | Pilgrimage App`
      : `${name} | 聖地巡礼アプリ`;
  }, [spot, isEn]);

  const handleCheckin = async () => {
    if (!user || !spot) return;
    setCheckingIn(true);
    await supabase
      .from("visit_logs")
      .insert({ user_id: user.id, spot_id: spot.id });
    const { error } = await supabase
      .from("spot_checkins")
      .upsert(
        { user_id: user.id, spot_id: spot.id },
        { onConflict: "user_id,spot_id" },
      );
    if (!error) {
      setCheckedIn(true);
      setIsFavorite(false);
    }
    setCheckingIn(false);
  };

  const handleUnCheckin = async () => {
    if (!user || !spot) return;
    if (!window.confirm(`「${spot.name}」${t("map.uncheckinConfirm")}`)) return;
    setCheckingIn(true);
    const { error } = await supabase
      .from("spot_checkins")
      .delete()
      .eq("user_id", user.id)
      .eq("spot_id", spot.id);
    if (!error) setCheckedIn(false);
    setCheckingIn(false);
  };

  const handleToggleFavorite = async () => {
    if (!user || !spot) return;
    const { error } = await supabase
      .from("spot_checkins")
      .update({ is_favorite: !isFavorite })
      .eq("user_id", user.id)
      .eq("spot_id", spot.id);
    if (!error) setIsFavorite(!isFavorite);
  };

  if (notFound) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "var(--color-card)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-xl)",
            textAlign: "center",
            borderTop: "2px solid var(--color-primary)",
          }}
        >
          <p
            style={{
              color: "var(--color-text-sub)",
              marginBottom: "var(--space-md)",
            }}
          >
            {isEn ? "Spot not found." : "スポットが見つかりません。"}
          </p>
          <Link
            to="/spots"
            style={{
              color: "var(--color-primary)",
              textDecoration: "underline",
            }}
          >
            {isEn ? "Back to list" : "一覧に戻る"}
          </Link>
        </div>
      </div>
    );
  }

  if (!spot) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "var(--color-text-muted)" }}>
          {t("result.loading")}
        </p>
      </div>
    );
  }

  const isSacred = significanceTags.some(
    (t) => t.name === "聖地" && spotTagIds.includes(t.id),
  );
  const otherTags = significanceTags.filter(
    (t) => t.name !== "聖地" && spotTagIds.includes(t.id),
  );
  const name = isEn ? (spot.name_en ?? spot.name) : spot.name;
  const description = isEn
    ? (spot.description_en ?? spot.description)
    : spot.description;
  const address = isEn ? (spot.address_en ?? spot.address) : spot.address;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <div
        style={{
          maxWidth: "560px",
          margin: "0 auto",
          padding: "var(--space-xl) var(--space-lg)",
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--space-xl)",
          }}
        >
          <Link
            to="/spots"
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
              textDecoration: "none",
            }}
          >
            ← {isEn ? "Spot List" : "スポット一覧"}
          </Link>
          <LangToggle />
        </div>

        {/* スポット名 */}
        <div
          style={{
            borderLeft: "3px solid var(--color-primary)",
            paddingLeft: "var(--space-md)",
            marginBottom: "var(--space-md)",
          }}
        >
          <h1
            style={{
              margin: "0 0 var(--space-sm)",
              fontSize: "var(--font-size-xl)",
              fontWeight: "500",
              color: "var(--color-text-main)",
            }}
          >
            {name}
          </h1>
          <div
            style={{
              display: "flex",
              gap: "var(--space-xs)",
              flexWrap: "wrap",
            }}
          >
            {area && (
              <span
                style={{
                  fontSize: "var(--font-size-xs)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-bg)",
                  color: "var(--color-text-sub)",
                  border: "0.5px solid var(--color-border)",
                }}
              >
                {isEn ? (area.name_en ?? area.name) : area.name}
              </span>
            )}
            {category && (
              <span
                style={{
                  fontSize: "var(--font-size-xs)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-bg)",
                  color: "var(--color-text-sub)",
                  border: "0.5px solid var(--color-border)",
                }}
              >
                {isEn ? (category.name_en ?? category.name) : category.name}
              </span>
            )}
            <span
              style={{
                fontSize: "var(--font-size-xs)",
                padding: "2px 8px",
                borderRadius: "var(--radius-sm)",
                background: isSacred
                  ? "var(--color-primary-light)"
                  : "var(--color-bg)",
                color: isSacred
                  ? "var(--color-primary)"
                  : "var(--color-text-sub)",
                border: `0.5px solid ${isSacred ? "var(--color-primary)" : "var(--color-border)"}`,
              }}
            >
              {isSacred ? t("detail.sacred") : t("detail.nonSacred")}
            </span>
          </div>
        </div>

        {/* 重要度タグ */}
        {otherTags.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "var(--space-xs)",
              flexWrap: "wrap",
              marginBottom: "var(--space-md)",
            }}
          >
            {otherTags.map((tag) => (
              <span
                key={tag.id}
                style={{
                  fontSize: "var(--font-size-xs)",
                  background: "var(--color-primary-light)",
                  color: "var(--color-primary)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "0.5px solid var(--color-primary)",
                }}
              >
                {isEn ? (tag.name_en ?? tag.name) : tag.name}
              </span>
            ))}
          </div>
        )}

        {/* 説明 */}
        {description && (
          <p
            style={{
              fontSize: "var(--font-size-md)",
              color: "var(--color-text-sub)",
              lineHeight: 1.7,
              marginBottom: "var(--space-md)",
            }}
          >
            {description}
          </p>
        )}

        {/* 住所・滞在時間 */}
        {address && (
          <p
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-xs)",
            }}
          >
            📍 {address}
          </p>
        )}
        {spot.duration_min && (
          <p
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-md)",
            }}
          >
            {t("detail.stayTime", { min: spot.duration_min })}
          </p>
        )}

        {/* 登場キャラクター */}
        {characters.length > 0 && (
          <div
            style={{
              background: "var(--color-card)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-md) var(--space-lg)",
              marginBottom: "var(--space-md)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <p
              style={{
                margin: "0 0 var(--space-sm)",
                fontSize: "var(--font-size-xs)",
                fontWeight: "500",
                color: "var(--color-text-muted)",
              }}
            >
              {t("detail.characters")}
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--space-xs)",
              }}
            >
              {characters.map((c) => (
                <span
                  key={c.id}
                  style={{
                    fontSize: "var(--font-size-xs)",
                    padding: "3px 10px",
                    borderRadius: "var(--radius-sm)",
                    background: c.color_code
                      ? `${c.color_code}22`
                      : "var(--color-bg)",
                    border: `0.5px solid ${c.color_code ?? "var(--color-border)"}`,
                    color: "var(--color-text-main)",
                  }}
                >
                  {isEn ? (c.name_en ?? c.name) : c.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 登場エピソード */}
        {episodes.length > 0 && (
          <div
            style={{
              background: "var(--color-card)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-md) var(--space-lg)",
              marginBottom: "var(--space-md)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <p
              style={{
                margin: "0 0 var(--space-sm)",
                fontSize: "var(--font-size-xs)",
                fontWeight: "500",
                color: "var(--color-text-muted)",
              }}
            >
              {t("detail.episodes")}
            </p>
            {episodes.map((ep) => (
              <div
                key={ep.id}
                style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-sub)",
                  marginBottom: "var(--space-sm)",
                  paddingLeft: "var(--space-xs)",
                  borderLeft: "2px solid var(--color-primary-light)",
                }}
              >
                <strong style={{ color: "var(--color-primary)" }}>
                  {seasonLabel(ep.season, ep.media_type, t)}
                  {ep.media_type !== "movie" &&
                    ` ${t("detail.episodeNum", { num: ep.episode_number })}`}
                </strong>{" "}
                {ep.title}
                {(isEn ? ep.scene_description_en : ep.scene_description) && (
                  <div
                    style={{
                      color: "var(--color-text-muted)",
                      fontSize: "var(--font-size-xs)",
                      marginTop: "2px",
                    }}
                  >
                    {isEn ? ep.scene_description_en : ep.scene_description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 地図 */}
        <div
          style={{
            height: "220px",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            marginBottom: "var(--space-md)",
            border: "0.5px solid var(--color-border)",
          }}
        >
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{
              longitude: spot.lng,
              latitude: spot.lat,
              zoom: 14,
            }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
          >
            <Marker longitude={spot.lng} latitude={spot.lat} anchor="bottom">
              <div style={{ fontSize: "26px" }}>{isSacred ? "📍" : "🗺️"}</div>
            </Marker>
          </Map>
        </div>

        {/* 地図で見るボタン */}
        <button
          onClick={() => navigate(`/?spot=${spot.id}`)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "var(--space-md)",
            background: "var(--color-card)",
            border: "0.5px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-sub)",
          }}
        >
          🗺️ {isEn ? "View on full map" : "地図で見る"}
        </button>

        {/* チェックインボタン */}
        {user ? (
          checkedIn ? (
            <div style={{ display: "flex", gap: "var(--space-sm)" }}>
              <button
                onClick={handleToggleFavorite}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--font-size-sm)",
                  background: isFavorite ? "#F5C842" : "var(--color-bg)",
                  color: isFavorite
                    ? "var(--color-white)"
                    : "var(--color-text-sub)",
                }}
              >
                {isFavorite
                  ? `⭐ ${isEn ? "Favorited" : "お気に入り"}`
                  : `☆ ${isEn ? "Favorite" : "お気に入り"}`}
              </button>
              <button
                onClick={handleUnCheckin}
                disabled={checkingIn}
                style={{
                  flex: 1,
                  padding: "10px",
                  cursor: "pointer",
                  background: "var(--color-error-light)",
                  color: "var(--color-error)",
                  border: "0.5px solid var(--color-error)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--font-size-sm)",
                }}
              >
                {checkingIn ? t("map.processing") : `✅ ${t("map.uncheckin")}`}
              </button>
            </div>
          ) : (
            <button
              onClick={handleCheckin}
              disabled={checkingIn}
              style={{
                width: "100%",
                padding: "10px",
                cursor: "pointer",
                background: "var(--color-primary)",
                color: "var(--color-white)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--font-size-md)",
                fontWeight: "500",
              }}
            >
              {checkingIn ? t("map.recording") : `📍 ${t("map.checkin")}`}
            </button>
          )
        ) : (
          <p
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
              textAlign: "center",
            }}
          >
            {t("map.loginRequired")}
          </p>
        )}
      </div>
    </div>
  );
}
