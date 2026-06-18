import { useEffect, useState } from "react";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";
import { useTranslation } from "react-i18next";
import LangToggle from "../components/ui/LangToggle";
import SpotListPanel from "../components/spot/SpotListPanel";
import type { Spot } from "../types";
import SpotDetailPopup from "../components/spot/SpotDetailPopup";

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
interface Character {
  id: string;
  name: string;
  name_en: string | null;
}
interface SpotCharacter {
  spot_id: string;
  character_id: string;
}

export default function MapPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const [spots, setSpots] = useState<Spot[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [spotCharacters, setSpotCharacters] = useState<SpotCharacter[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [checkedInSpots, setCheckedInSpots] = useState<Record<string, boolean>>(
    {},
  );
  const [checkingIn, setCheckingIn] = useState(false);
  const [routeMode, setRouteMode] = useState(false);
  const [selectedForRoute, setSelectedForRoute] = useState<Spot[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [spotsRes, areasRes, categoriesRes, charactersRes, spotCharsRes] =
        await Promise.all([
          supabase.from("spots").select("*").eq("is_published", true),
          supabase.from("areas").select("id, name, name_en").order("name"),
          supabase.from("categories").select("id, name, name_en").order("name"),
          supabase.from("characters").select("id, name, name_en").order("name"),
          supabase.from("spot_characters").select("spot_id, character_id"),
        ]);
      if (spotsRes.data) setSpots(spotsRes.data);
      if (areasRes.data) setAreas(areasRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (charactersRes.data) setCharacters(charactersRes.data);
      if (spotCharsRes.data) setSpotCharacters(spotCharsRes.data);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchCheckins = async () => {
      const { data, error } = await supabase
        .from("spot_checkins")
        .select("spot_id, is_favorite");
      if (error) {
        console.error("チェックイン取得エラー:", error);
        return;
      }
      const map: Record<string, boolean> = {};
      data?.forEach((c) => {
        map[c.spot_id] = c.is_favorite;
      });
      setCheckedInSpots(map);
    };
    fetchCheckins();
  }, [user]);

  const handleCheckin = async (spot: Spot) => {
    if (!user) return;
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
    if (!error) setCheckedInSpots((prev) => ({ ...prev, [spot.id]: false }));
    setCheckingIn(false);
  };

  const handleUnCheckin = async (spot: Spot) => {
    if (!user) return;
    if (!window.confirm(`「${spot.name}」${t("map.uncheckinConfirm")}`)) return;
    setCheckingIn(true);
    const { error } = await supabase
      .from("spot_checkins")
      .delete()
      .eq("user_id", user.id)
      .eq("spot_id", spot.id);
    if (!error) {
      setCheckedInSpots((prev) => {
        const next = { ...prev };
        delete next[spot.id];
        return next;
      });
    }
    setCheckingIn(false);
  };

  const handleToggleFavorite = async (spot: Spot) => {
    if (!user) return;
    const current = checkedInSpots[spot.id] ?? false;
    const { error } = await supabase
      .from("spot_checkins")
      .update({ is_favorite: !current })
      .eq("user_id", user.id)
      .eq("spot_id", spot.id);
    if (!error) {
      setCheckedInSpots((prev) => ({ ...prev, [spot.id]: !current }));
    }
  };

  const handleMarkerClickForRoute = (spot: Spot) => {
    setSelectedForRoute((prev) => {
      const exists = prev.find((s) => s.id === spot.id);
      if (exists) return prev.filter((s) => s.id !== spot.id);
      return [...prev, spot];
    });
  };

  const getMarkerEmoji = (spot: Spot) => {
    if (routeMode) {
      const index = selectedForRoute.findIndex((s) => s.id === spot.id);
      if (index !== -1) return `${index + 1}️⃣`;
      return "⚪";
    }
    if (checkedInSpots[spot.id]) return "⭐";
    if (spot.id in checkedInSpots) return "✅";
    return spot.is_sacred ? "📍" : "🗺️";
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {/* ヘッダー */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 2,
          background: "white",
          padding: "8px 12px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <LangToggle />
        {user ? `👤 ${user.email}` : <a href="/login">{t("map.login")}</a>}
      </div>

      {/* スポット一覧パネル */}
      <SpotListPanel
        spots={spots}
        checkedInSpots={new Set(Object.keys(checkedInSpots))}
        areas={areas}
        categories={categories}
        characters={characters}
        spotCharacters={spotCharacters}
        onSpotClick={(spot) => {
          setSelectedSpot(spot);
          setRouteMode(false);
        }}
        onOpenChange={setIsPanelOpen}
      />

      {/* ルート作成ボタン */}
      {user && !isPanelOpen && (
        <div
          style={{
            position: "absolute",
            top: 100,
            left: 10,
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <button
            onClick={() => {
              setRouteMode(!routeMode);
              setSelectedForRoute([]);
              setSelectedSpot(null);
            }}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              background: routeMode ? "#f44336" : "#2196F3",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {routeMode ? `❌ ${t("map.cancel")}` : `🗺️ ${t("map.createRoute")}`}
          </button>

          {routeMode && (
            <div
              style={{
                background: "white",
                borderRadius: "8px",
                padding: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                minWidth: "200px",
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                {t("map.selectedSpots")}（{selectedForRoute.length}件）
              </p>
              {selectedForRoute.length === 0 && (
                <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>
                  {t("map.tapToSelect")}
                </p>
              )}
              {selectedForRoute.map((spot, i) => (
                <div
                  key={spot.id}
                  style={{
                    fontSize: "12px",
                    padding: "4px 0",
                    borderBottom: "1px solid #eee",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>{i + 1}.</span>
                  <span style={{ flex: 1 }}>{spot.name}</span>
                  <span
                    onClick={() => handleMarkerClickForRoute(spot)}
                    style={{ cursor: "pointer", color: "#f44336" }}
                  >
                    ✕
                  </span>
                </div>
              ))}
              {selectedForRoute.length >= 2 && (
                <button
                  onClick={() => {
                    const ids = selectedForRoute.map((s) => s.id).join(",");
                    window.location.href = `/routes/new?spots=${ids}`;
                  }}
                  style={{
                    marginTop: "8px",
                    width: "100%",
                    padding: "6px",
                    background: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  {t("map.next")}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: 130.2988, latitude: 33.2494, zoom: 9 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            longitude={spot.lng}
            latitude={spot.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              if (routeMode) {
                handleMarkerClickForRoute(spot);
              } else {
                setSelectedSpot(spot);
              }
            }}
          >
            <div
              style={{
                fontSize: "28px",
                cursor: "pointer",
                filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.3))",
              }}
            >
              {getMarkerEmoji(spot)}
            </div>
          </Marker>
        ))}

        {!routeMode && selectedSpot && (
          <Popup
            longitude={selectedSpot.lng}
            latitude={selectedSpot.lat}
            anchor="top"
            onClose={() => setSelectedSpot(null)}
            maxWidth="300px"
          >
            <SpotDetailPopup
              spot={selectedSpot}
              areaName={
                areas.find((a) => a.id === selectedSpot.area_id)?.name ?? ""
              }
              categoryName={
                categories.find((c) => c.id === selectedSpot.category_id)
                  ?.name ?? ""
              }
              checkedIn={selectedSpot.id in checkedInSpots}
              isFavorite={checkedInSpots[selectedSpot.id] ?? false}
              checkingIn={checkingIn}
              canCheckin={!!user}
              onCheckin={() => handleCheckin(selectedSpot)}
              onUnCheckin={() => handleUnCheckin(selectedSpot)}
              onToggleFavorite={() => handleToggleFavorite(selectedSpot)}
            />
          </Popup>
        )}
      </Map>
    </div>
  );
}
