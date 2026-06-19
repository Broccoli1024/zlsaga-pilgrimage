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

const seasonLabel = (season: number, mediaType: string, isEn: boolean) => {
  if (mediaType === "movie") return isEn ? "Movie" : "劇場版";
  if (season === 1) return isEn ? "Original" : "無印";
  if (season === 2) return isEn ? "Revenge" : "リベンジ";
  return isEn ? `Season ${season}` : `シーズン${season}`;
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
        const charIds = charLinks.map((c) => c.character_id);
        const { data: chars } = await supabase
          .from("characters")
          .select("id, name, name_en, color_code")
          .in("id", charIds);
        setCharacters(chars ?? []);
      }

      const { data: epLinks } = await supabase
        .from("spot_episodes")
        .select("episode_id, scene_description, scene_description_en")
        .eq("spot_id", spotData.id);
      if (epLinks && epLinks.length > 0) {
        const epIds = epLinks.map((e) => e.episode_id);
        const { data: eps } = await supabase
          .from("episodes")
          .select("id, media_type, season, episode_number, title, title_en")
          .in("id", epIds);
        const merged = (eps ?? []).map((ep) => {
          const link = epLinks.find((l) => l.episode_id === ep.id);
          return {
            ...ep,
            scene_description: link?.scene_description ?? null,
            scene_description_en: link?.scene_description_en ?? null,
          };
        });
        setEpisodes(merged);
      }
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
      ? `${name} | Zombie Land Saga Pilgrimage`
      : `${name} | ゾンビランドサガ 聖地巡礼`;
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
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>{isEn ? "Spot not found." : "スポットが見つかりません。"}</p>
        <Link to="/spots">{isEn ? "Back to list" : "一覧に戻る"}</Link>
      </div>
    );
  }

  if (!spot) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>読み込み中...</div>
    );
  }

  const name = isEn ? (spot.name_en ?? spot.name) : spot.name;
  const description = isEn
    ? (spot.description_en ?? spot.description)
    : spot.description;
  const address = isEn ? (spot.address_en ?? spot.address) : spot.address;

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto", padding: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <Link to="/spots" style={{ fontSize: "13px", color: "#666" }}>
          ← {isEn ? "Spot List" : "スポット一覧"}
        </Link>
        <LangToggle />
      </div>

      <h1 style={{ fontSize: "22px", marginBottom: "0.5rem" }}>{name}</h1>

      <div
        style={{
          display: "flex",
          gap: "6px",
          marginBottom: "1rem",
          fontSize: "12px",
        }}
      >
        {area && (
          <span
            style={{
              background: "#f0f0f0",
              padding: "2px 10px",
              borderRadius: "10px",
            }}
          >
            {isEn ? (area.name_en ?? area.name) : area.name}
          </span>
        )}
        {category && (
          <span
            style={{
              background: "#f0f0f0",
              padding: "2px 10px",
              borderRadius: "10px",
            }}
          >
            {isEn ? (category.name_en ?? category.name) : category.name}
          </span>
        )}
        <span
          style={{
            background: spot.is_sacred ? "#FFEBEE" : "#E3F2FD",
            color: spot.is_sacred ? "#C62828" : "#1565C0",
            padding: "2px 10px",
            borderRadius: "10px",
          }}
        >
          {spot.is_sacred ? (isEn ? "Sacred" : "聖地") : isEn ? "Spot" : "観光"}
        </span>
      </div>

      {description && (
        <p
          style={{
            fontSize: "14px",
            color: "#444",
            lineHeight: 1.7,
            marginBottom: "1rem",
          }}
        >
          {description}
        </p>
      )}

      {address && (
        <p style={{ fontSize: "13px", color: "#777", marginBottom: "0.5rem" }}>
          📍 {address}
        </p>
      )}

      {spot.duration_min && (
        <p style={{ fontSize: "13px", color: "#777", marginBottom: "1rem" }}>
          ⏱ {isEn ? "Approx." : "滞在目安：約"} {spot.duration_min}{" "}
          {isEn ? "min" : "分"}
        </p>
      )}

      {/* 登場キャラクター */}
      {characters.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <p
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              color: "#777",
              marginBottom: "6px",
            }}
          >
            {isEn ? "Characters" : "登場キャラクター"}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {characters.map((c) => (
              <span
                key={c.id}
                style={{
                  fontSize: "12px",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  background: c.color_code ? `${c.color_code}33` : "#eee",
                  border: `1px solid ${c.color_code ?? "#ccc"}`,
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
        <div style={{ marginBottom: "1rem" }}>
          <p
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              color: "#777",
              marginBottom: "6px",
            }}
          >
            {isEn ? "Featured Episodes" : "登場エピソード"}
          </p>
          {episodes.map((ep) => (
            <div
              key={ep.id}
              style={{
                fontSize: "13px",
                color: "#555",
                marginBottom: "6px",
                padding: "8px",
                background: "#fafafa",
                borderRadius: "6px",
              }}
            >
              <strong>
                {seasonLabel(ep.season, ep.media_type, isEn)}
                {ep.media_type !== "movie" &&
                  (isEn
                    ? ` Ep.${ep.episode_number}`
                    : ` 第${ep.episode_number}話`)}
              </strong>{" "}
              {isEn ? (ep.title_en ?? ep.title) : ep.title}
              {(isEn ? ep.scene_description_en : ep.scene_description) && (
                <div style={{ color: "#999", marginTop: "2px" }}>
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
          borderRadius: "10px",
          overflow: "hidden",
          marginBottom: "1rem",
          border: "1px solid #eee",
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
            <div style={{ fontSize: "26px" }}>
              {spot.is_sacred ? "📍" : "🗺️"}
            </div>
          </Marker>
        </Map>
      </div>

      <button
        onClick={() => navigate(`/?spot=${spot.id}`)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "1rem",
          background: "white",
          border: "1px solid #ddd",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "13px",
        }}
      >
        🗺️ {isEn ? "View on full map" : "地図で見る"}
      </button>

      {/* チェックインボタン */}
      {user ? (
        checkedIn ? (
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleToggleFavorite}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                background: isFavorite ? "#FFC107" : "#f5f5f5",
                color: isFavorite ? "white" : "#777",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
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
                background: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
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
              background: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            {checkingIn ? t("map.recording") : `📍 ${t("map.checkin")}`}
          </button>
        )
      ) : (
        <p style={{ fontSize: "13px", color: "#999", textAlign: "center" }}>
          {t("map.loginRequired")}
        </p>
      )}
    </div>
  );
}
