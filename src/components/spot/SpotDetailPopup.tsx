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
      const { data: charLinks } = await supabase
        .from("spot_characters")
        .select("character_id")
        .eq("spot_id", spot.id);

      if (charLinks && charLinks.length > 0) {
        const charIds = charLinks.map((c) => c.character_id);
        const { data: chars } = await supabase
          .from("characters")
          .select("id, name, name_en, color_code")
          .in("id", charIds)
          .order("sort_order");
        setCharacters(chars ?? []);
      } else {
        setCharacters([]);
      }

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
    <div
      style={{
        padding: "var(--space-sm)",
        minWidth: "260px",
        maxWidth: "280px",
        background: "var(--color-card)",
      }}
    >
      {/* スポット名 */}
      <div
        style={{
          borderLeft: "3px solid var(--color-primary)",
          paddingLeft: "var(--space-sm)",
          marginBottom: "var(--space-sm)",
        }}
      >
        <strong
          style={{
            fontSize: "var(--font-size-md)",
            color: "var(--color-text-main)",
          }}
        >
          {name}
        </strong>
      </div>

      {/* バッジ群 */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "var(--space-sm)",
          flexWrap: "wrap",
        }}
      >
        {areaName && (
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
            {areaName}
          </span>
        )}
        {categoryName && (
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
            {categoryName}
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
            color: isSacred ? "var(--color-primary)" : "var(--color-text-sub)",
            border: `0.5px solid ${isSacred ? "var(--color-primary)" : "var(--color-border)"}`,
          }}
        >
          {isSacred ? t("detail.sacred") : t("detail.nonSacred")}
        </span>
      </div>

      {/* 重要度タグ */}
      {tags.filter((t) => t.name !== "聖地").length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "4px",
            marginBottom: "var(--space-sm)",
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
                  background: "var(--color-primary-light)",
                  color: "var(--color-primary)",
                  padding: "1px 6px",
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
            margin: "0 0 var(--space-sm)",
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-sub)",
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      )}

      {/* 住所・滞在時間 */}
      {address && (
        <p
          style={{
            margin: "0 0 var(--space-xs)",
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-muted)",
          }}
        >
          📍 {address}
        </p>
      )}
      {spot.duration_min && (
        <p
          style={{
            margin: "0 0 var(--space-sm)",
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-muted)",
          }}
        >
          {t("detail.stayTime", { min: spot.duration_min })}
        </p>
      )}

      {/* 登場キャラクター */}
      {characters.length > 0 && (
        <div style={{ marginBottom: "var(--space-sm)" }}>
          <p
            style={{
              margin: "0 0 var(--space-xs)",
              fontSize: "var(--font-size-xs)",
              fontWeight: "500",
              color: "var(--color-text-sub)",
            }}
          >
            {t("detail.characters")}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {characters.map((c) => (
              <span
                key={c.id}
                style={{
                  fontSize: "var(--font-size-xs)",
                  padding: "2px 8px",
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
        <div style={{ marginBottom: "var(--space-sm)" }}>
          <p
            style={{
              margin: "0 0 var(--space-xs)",
              fontSize: "var(--font-size-xs)",
              fontWeight: "500",
              color: "var(--color-text-sub)",
            }}
          >
            {t("detail.episodes")}
          </p>
          {episodes.map((ep) => (
            <div
              key={ep.id}
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-sub)",
                marginBottom: "2px",
                paddingLeft: "var(--space-xs)",
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
                    fontSize: "10px",
                    marginTop: "1px",
                  }}
                >
                  {isEn ? ep.scene_description_en : ep.scene_description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ミニマップ */}
      <div
        style={{
          marginBottom: "var(--space-sm)",
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
          height: "100px",
          border: "0.5px solid var(--color-border)",
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
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={onToggleFavorite}
              style={{
                padding: "6px 10px",
                cursor: "pointer",
                border: "none",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--font-size-xs)",
                background: isFavorite ? "#F5C842" : "var(--color-bg)",
                color: isFavorite
                  ? "var(--color-white)"
                  : "var(--color-text-sub)",
              }}
            >
              {isFavorite ? "⭐" : "☆"} {t("detail.favorite")}
            </button>
            <button
              onClick={onUnCheckin}
              disabled={checkingIn}
              style={{
                flex: 1,
                padding: "6px 12px",
                cursor: "pointer",
                background: "var(--color-error-light)",
                color: "var(--color-error)",
                border: "0.5px solid var(--color-error)",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--font-size-xs)",
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
              width: "100%",
              padding: "8px 12px",
              cursor: "pointer",
              background: "var(--color-primary)",
              color: "var(--color-white)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--font-size-sm)",
              fontWeight: "500",
            }}
          >
            {checkingIn ? t("map.recording") : `📍 ${t("map.checkin")}`}
          </button>
        ))}
      {!canCheckin && (
        <p
          style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-muted)",
            textAlign: "center",
            margin: 0,
          }}
        >
          {t("map.loginRequired")}
        </p>
      )}
    </div>
  );
}
