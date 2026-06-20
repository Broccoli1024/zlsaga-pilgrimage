import { useEffect, useState } from "react";
import Map, { Marker } from "react-map-gl/mapbox";
import { useTranslation } from "react-i18next";
import { supabase } from "../../lib/supabase";
import type { Spot, SignificanceTag } from "../../types";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

interface Props {
  spot: Spot;
  areaName: string;
  categoryName: string;
  isSacred: boolean;
  tags: SignificanceTag[];
  checkedIn: boolean;
  isFavorite: boolean;
  checkingIn: boolean;
  canCheckin: boolean;
  onCheckin: () => void;
  onUnCheckin: () => void;
  onToggleFavorite: () => void;
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

interface Character {
  id: string;
  name: string;
  name_en: string | null;
  color_code: string | null;
}

const seasonLabel = (season: number, mediaType: string) => {
  if (mediaType === "movie") return "劇場版";
  if (season === 1) return "無印";
  if (season === 2) return "リベンジ";
  return `シーズン${season}`;
};

export default function SpotDetailPopup({
  spot,
  areaName,
  categoryName,
  isSacred,
  tags,
  checkedIn,
  isFavorite,
  checkingIn,
  canCheckin,
  onCheckin,
  onUnCheckin,
  onToggleFavorite,
}: Props) {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");

  const [characters, setCharacters] = useState<Character[]>([]);
  const [episodes, setEpisodes] = useState<EpisodeInfo[]>([]);

  useEffect(() => {
    const fetchDetails = async () => {
      // 登場キャラクター
      const { data: charLinks } = await supabase
        .from("spot_characters")
        .select("character_id")
        .eq("spot_id", spot.id);

      if (charLinks && charLinks.length > 0) {
        const charIds = charLinks.map((c) => c.character_id);
        const { data: chars } = await supabase
          .from("characters")
          .select("id, name, name_en, color_code")
          .in("id", charIds);
        setCharacters(chars ?? []);
      } else {
        setCharacters([]);
      }

      // 登場エピソード
      const { data: epLinks } = await supabase
        .from("spot_episodes")
        .select("episode_id, scene_description, scene_description_en")
        .eq("spot_id", spot.id);

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
      } else {
        setEpisodes([]);
      }
    };
    fetchDetails();
  }, [spot.id]);

  const name = isEn ? (spot.name_en ?? spot.name) : spot.name;
  const description = isEn
    ? (spot.description_en ?? spot.description)
    : spot.description;
  const address = isEn ? (spot.address_en ?? spot.address) : spot.address;

  return (
    <div style={{ padding: "4px", minWidth: "260px", maxWidth: "280px" }}>
      <strong style={{ fontSize: "15px" }}>{name}</strong>

      <div
        style={{
          display: "flex",
          gap: "6px",
          margin: "6px 0",
          fontSize: "11px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            background: "#f0f0f0",
            padding: "2px 8px",
            borderRadius: "10px",
          }}
        >
          {areaName}
        </span>
        {categoryName && (
          <span
            style={{
              background: "#f0f0f0",
              padding: "2px 8px",
              borderRadius: "10px",
            }}
          >
            {categoryName}
          </span>
        )}
        <span
          style={{
            background: isSacred ? "#FFEBEE" : "#E3F2FD",
            color: isSacred ? "#C62828" : "#1565C0",
            padding: "2px 8px",
            borderRadius: "10px",
          }}
        >
          {isSacred ? "聖地" : "観光"}
        </span>
      </div>

      {/* 重要度タグ */}
      {tags.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "4px",
            margin: "4px 0",
            flexWrap: "wrap",
          }}
        >
          {tags
            .filter((t) => t.name !== "聖地")
            .map((tag) => (
              <span
                key={tag.id}
                style={{
                  fontSize: "10px",
                  background: "#FFF3E0",
                  color: "#E65100",
                  padding: "1px 6px",
                  borderRadius: "8px",
                }}
              >
                {tag.name}
              </span>
            ))}
        </div>
      )}

      {description && (
        <p
          style={{
            margin: "6px 0",
            fontSize: "12px",
            color: "#555",
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}

      {address && (
        <p style={{ margin: "6px 0", fontSize: "11px", color: "#999" }}>
          📍 {address}
        </p>
      )}

      {spot.duration_min && (
        <p style={{ margin: "6px 0", fontSize: "11px", color: "#999" }}>
          ⏱ 滞在目安：約{spot.duration_min}分
        </p>
      )}

      {/* 登場キャラクター */}
      {characters.length > 0 && (
        <div style={{ margin: "8px 0" }}>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: "11px",
              fontWeight: "bold",
              color: "#777",
            }}
          >
            登場キャラクター
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {characters.map((c) => (
              <span
                key={c.id}
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "10px",
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
        <div style={{ margin: "8px 0" }}>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: "11px",
              fontWeight: "bold",
              color: "#777",
            }}
          >
            登場エピソード
          </p>
          {episodes.map((ep) => (
            <div
              key={ep.id}
              style={{ fontSize: "11px", color: "#555", marginBottom: "2px" }}
            >
              <strong>
                {seasonLabel(ep.season, ep.media_type)}
                {ep.media_type !== "movie" && ` 第${ep.episode_number}話`}
              </strong>{" "}
              {isEn ? (ep.title_en ?? ep.title) : ep.title}
              {(isEn ? ep.scene_description_en : ep.scene_description) && (
                <div style={{ color: "#999", marginLeft: "4px" }}>
                  - {isEn ? ep.scene_description_en : ep.scene_description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ミニマップ */}
      <div
        style={{
          margin: "8px 0",
          borderRadius: "8px",
          overflow: "hidden",
          height: "100px",
          border: "1px solid #eee",
        }}
      >
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: spot.lng,
            latitude: spot.lat,
            zoom: 13,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          interactive={false}
        >
          <Marker longitude={spot.lng} latitude={spot.lat} anchor="bottom">
            <div style={{ fontSize: "20px" }}>{isSacred ? "📍" : "🗺️"}</div>
          </Marker>
        </Map>
      </div>

      {/* チェックインボタン */}
      {canCheckin &&
        (checkedIn ? (
          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            <button
              onClick={onToggleFavorite}
              style={{
                padding: "6px 10px",
                cursor: "pointer",
                background: isFavorite ? "#FFC107" : "#f5f5f5",
                color: isFavorite ? "white" : "#777",
                border: "none",
                borderRadius: "4px",
                fontSize: "13px",
              }}
            >
              {isFavorite ? "⭐ お気に入り" : "☆ お気に入り"}
            </button>
            <button
              onClick={onUnCheckin}
              disabled={checkingIn}
              style={{
                flex: 1,
                padding: "6px 12px",
                cursor: "pointer",
                background: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "4px",
              }}
            >
              {checkingIn ? t("map.processing") : `✅ ${t("map.uncheckin")}`}
            </button>
          </div>
        ) : (
          <button
            onClick={onCheckin}
            disabled={checkingIn}
            style={{
              marginTop: "8px",
              padding: "6px 12px",
              width: "100%",
              cursor: "pointer",
              background: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            {checkingIn ? t("map.recording") : `📍 ${t("map.checkin")}`}
          </button>
        ))}
    </div>
  );
}
