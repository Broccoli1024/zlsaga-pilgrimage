import { useEffect, useState, useCallback } from "react";
import Map, { Marker, Popup, Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";
import LangToggle from "../components/ui/LangToggle";
import SpotListPanel from "../components/spot/SpotListPanel";
import SpotDetailPopup from "../components/spot/SpotDetailPopup";
import type { SpotFilters } from "../components/spot/SpotListPanel";
import type { Spot, SignificanceTag } from "../types";

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
type TransportMode = "car" | "walk";

interface LegResult {
  fromId: string;
  toId: string;
  minutes: number;
  geometry: GeoJSON.LineString;
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
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [filters, setFilters] = useState<SpotFilters>({
    sacredFilter: "all",
    areaFilter: "all",
    categoryFilter: "all",
    characterFilter: "all",
    tagFilter: "all",
  });
  const [significanceTags, setSignificanceTags] = useState<SignificanceTag[]>(
    [],
  );
  const [spotTags, setSpotTags] = useState<
    { spot_id: string; tag_id: string }[]
  >([]);

  // ルート作成関連
  const [routeMode, setRouteMode] = useState(false);
  const [selectedForRoute, setSelectedForRoute] = useState<Spot[]>([]);
  const [transportMode, setTransportMode] = useState<TransportMode>("car");
  const [availableMinutes, setAvailableMinutes] = useState<number>(240);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // 生成済みルート
  const [routeResult, setRouteResult] = useState<{
    orderedSpots: Spot[];
    legs: LegResult[];
    totalMin: number;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [
        spotsRes,
        areasRes,
        categoriesRes,
        charactersRes,
        spotCharsRes,
        tagsRes,
        spotTagsRes,
      ] = await Promise.all([
        supabase.from("spots").select("*").eq("is_published", true),
        supabase.from("areas").select("id, name, name_en").order("name"),
        supabase.from("categories").select("id, name, name_en").order("name"),
        supabase.from("characters").select("id, name, name_en").order("name"),
        supabase.from("spot_characters").select("spot_id, character_id"),
        supabase
          .from("significance_tags")
          .select("id, name, name_en, sort_order")
          .order("sort_order"),
        supabase.from("spot_significance_tags").select("spot_id, tag_id"),
      ]);
      if (spotsRes.data) setSpots(spotsRes.data);
      if (areasRes.data) setAreas(areasRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (charactersRes.data) setCharacters(charactersRes.data);
      if (spotCharsRes.data) setSpotCharacters(spotCharsRes.data);
      if (tagsRes.data) setSignificanceTags(tagsRes.data);
      if (spotTagsRes.data) setSpotTags(spotTagsRes.data);
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
    if (!error) setCheckedInSpots((prev) => ({ ...prev, [spot.id]: !current }));
  };

  const handleMarkerClickForRoute = (spot: Spot) => {
    setSelectedForRoute((prev) => {
      const exists = prev.find((s) => s.id === spot.id);
      if (exists) return prev.filter((s) => s.id !== spot.id);
      return [...prev, spot];
    });
  };

  const exitRouteMode = useCallback(() => {
    setRouteMode(false);
    setSelectedForRoute([]);
    setSelectedSpot(null);
    setRouteResult(null);
    setGenError(null);
  }, []);

  const sacredTagId = significanceTags.find((t) => t.name === "聖地")?.id;

  const isSpotSacred = (spot: Spot): boolean => {
    if (!sacredTagId) return false;
    return spotTags.some(
      (st) => st.spot_id === spot.id && st.tag_id === sacredTagId,
    );
  };

  const matchesFilter = useCallback(
    (spot: Spot): boolean => {
      if (filters.sacredFilter === "sacred" && !isSpotSacred(spot))
        return false;
      if (filters.sacredFilter === "non_sacred" && isSpotSacred(spot))
        return false;
      if (filters.areaFilter !== "all" && spot.area_id !== filters.areaFilter)
        return false;
      if (
        filters.categoryFilter !== "all" &&
        spot.category_id !== filters.categoryFilter
      )
        return false;
      if (filters.characterFilter !== "all") {
        const hasChar = spotCharacters.some(
          (sc) =>
            sc.spot_id === spot.id &&
            sc.character_id === filters.characterFilter,
        );
        if (!hasChar) return false;
      }
      if (filters.tagFilter !== "all") {
        const hasTag = spotTags.some(
          (st) => st.spot_id === spot.id && st.tag_id === filters.tagFilter,
        );
        if (!hasTag) return false;
      }
      return true;
    },
    [filters, spotCharacters, spotTags, sacredTagId],
  );

  const filteredSpots = spots.filter(matchesFilter);

  const getMarkerEmoji = (spot: Spot) => {
    if (routeMode) {
      if (routeResult) {
        const idx = routeResult.orderedSpots.findIndex((s) => s.id === spot.id);
        if (idx !== -1) return `${idx + 1}️⃣`;
        return "⚪";
      }
      const index = selectedForRoute.findIndex((s) => s.id === spot.id);
      if (index !== -1) return `${index + 1}️⃣`;
      return "⚪";
    }
    if (checkedInSpots[spot.id]) return "⭐";
    if (spot.id in checkedInSpots) return "✅";
    return isSpotSacred(spot) ? "📍" : "🗺️";
  };

  // Mapbox Directions APIで移動時間とジオメトリを取得
  // 移動時間とジオメトリを取得（キャッシュ優先）
  const fetchLeg = async (
    from: Spot,
    to: Spot,
    mode: TransportMode,
  ): Promise<LegResult> => {
    // ① キャッシュを検索
    const { data: cached } = await supabase
      .from("travel_times")
      .select("minutes, geometry, expires_at")
      .eq("from_spot_id", from.id)
      .eq("to_spot_id", to.id)
      .eq("transport_mode", mode)
      .is("day_of_week", null)
      .is("time_of_day", null)
      .maybeSingle();

    const isValid =
      cached &&
      cached.geometry &&
      (!cached.expires_at || new Date(cached.expires_at) > new Date());

    if (isValid) {
      return {
        fromId: from.id,
        toId: to.id,
        minutes: cached.minutes,
        geometry: cached.geometry as GeoJSON.LineString,
      };
    }

    // ② キャッシュがなければMapbox APIを呼ぶ
    const profile = mode === "car" ? "driving" : "walking";
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    const route = data.routes?.[0];

    const leg: LegResult = {
      fromId: from.id,
      toId: to.id,
      minutes: Math.ceil((route?.duration ?? 0) / 60),
      geometry: route?.geometry ?? { type: "LineString", coordinates: [] },
    };

    // ③ 取得結果をキャッシュに保存
    await supabase.from("travel_times").upsert(
      {
        from_spot_id: from.id,
        to_spot_id: to.id,
        transport_mode: mode,
        minutes: leg.minutes,
        geometry: leg.geometry,
        source: "mapbox" as const,
        expires_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      {
        onConflict:
          "from_spot_id,to_spot_id,transport_mode,day_of_week,time_of_day",
      },
    );

    return leg;
  };

  // Greedy法でルートを最適化
  const optimizeOrder = (
    targetSpots: Spot[],
    times: Record<string, number>,
  ): Spot[] => {
    if (targetSpots.length <= 2) return targetSpots;
    const unvisited = [...targetSpots.slice(1)];
    const result = [targetSpots[0]];
    while (unvisited.length > 0) {
      const current = result[result.length - 1];
      let minTime = Infinity;
      let nearestIndex = 0;
      unvisited.forEach((spot, i) => {
        const time = times[`${current.id}_${spot.id}`] ?? Infinity;
        if (time < minTime) {
          minTime = time;
          nearestIndex = i;
        }
      });
      result.push(unvisited[nearestIndex]);
      unvisited.splice(nearestIndex, 1);
    }
    return result;
  };

  const handleGenerateRoute = async () => {
    if (selectedForRoute.length < 2) {
      setGenError(t("route.needMoreSpots"));
      return;
    }
    setGenerating(true);
    setGenError(null);

    try {
      // 全ペアの移動時間を先に取得（Greedy最適化用）
      const timeMap: Record<string, number> = {};
      for (let i = 0; i < selectedForRoute.length; i++) {
        for (let j = 0; j < selectedForRoute.length; j++) {
          if (i === j) continue;
          const leg = await fetchLeg(
            selectedForRoute[i],
            selectedForRoute[j],
            transportMode,
          );
          timeMap[`${selectedForRoute[i].id}_${selectedForRoute[j].id}`] =
            leg.minutes;
        }
      }

      const ordered = optimizeOrder(selectedForRoute, timeMap);

      // 確定した順序でジオメトリ付きのlegsを取得
      const legs: LegResult[] = [];
      for (let i = 0; i < ordered.length - 1; i++) {
        const leg = await fetchLeg(ordered[i], ordered[i + 1], transportMode);
        legs.push(leg);
      }

      const totalTravelMin = legs.reduce((sum, leg) => sum + leg.minutes, 0);
      const totalStayMin = ordered.reduce(
        (sum, s) => sum + (s.duration_min ?? 30),
        0,
      );
      const totalMin = totalTravelMin + totalStayMin;

      setRouteResult({ orderedSpots: ordered, legs, totalMin });

      // DB保存（ログイン時のみ）
      if (user) {
        const { data: routeData, error: routeError } = await supabase
          .from("routes")
          .insert({
            user_id: user.id,
            transport_mode: transportMode,
            total_minutes: totalMin,
          })
          .select()
          .single();

        if (!routeError && routeData) {
          const routeSpots = ordered.map((spot, i) => ({
            route_id: routeData.id,
            spot_id: spot.id,
            order_index: i,
            travel_min_from_prev: i === 0 ? null : legs[i - 1].minutes,
          }));
          await supabase.from("route_spots").insert(routeSpots);
        }
      }
    } catch (err) {
      console.error("ルート生成エラー:", err);
      setGenError(t("route.error"));
    }
    setGenerating(false);
  };

  // ルートのGeoJSON（複数legを結合）
  const routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> | null = routeResult
    ? {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: routeResult.legs.flatMap(
            (leg) => leg.geometry.coordinates,
          ),
        },
      }
    : null;

  const isOverTime = routeResult
    ? routeResult.totalMin > availableMinutes
    : false;

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
        {user ? (
          <Link
            to="/mypage"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            👤 {user.email}
          </Link>
        ) : (
          <a href="/login">{t("map.login")}</a>
        )}
      </div>

      {/* スポット一覧パネル */}
      <SpotListPanel
        spots={spots}
        filteredSpots={filteredSpots}
        checkedInSpots={new Set(Object.keys(checkedInSpots))}
        areas={areas}
        categories={categories}
        characters={characters}
        significanceTags={significanceTags}
        filters={filters}
        onFiltersChange={setFilters}
        onSpotClick={(spot) => setSelectedSpot(spot)}
        onOpenChange={setIsPanelOpen}
        isSpotSacred={isSpotSacred}
      />

      {/* ルート作成パネル */}
      {user && (
        <div
          style={{
            position: "absolute",
            top: 100,
            left: isPanelOpen ? 310 : 10,
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
          }}
        >
          <button
            onClick={() => {
              if (routeMode) {
                exitRouteMode();
              } else {
                setRouteMode(true);
                setSelectedSpot(null);
              }
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

          {routeMode && !routeResult && (
            <div
              style={{
                background: "white",
                borderRadius: "8px",
                padding: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                minWidth: "220px",
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
                <>
                  {/* 移動手段 */}
                  <p
                    style={{
                      margin: "10px 0 4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    {t("route.transport")}
                  </p>
                  <div
                    style={{ display: "flex", gap: "6px", marginBottom: "8px" }}
                  >
                    {(["car", "walk"] as TransportMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setTransportMode(mode)}
                        style={{
                          flex: 1,
                          padding: "6px",
                          fontSize: "12px",
                          borderRadius: "6px",
                          border: "1px solid",
                          borderColor:
                            transportMode === mode ? "#2196F3" : "#ddd",
                          background:
                            transportMode === mode ? "#E3F2FD" : "white",
                          cursor: "pointer",
                        }}
                      >
                        {t(`route.${mode}`)}
                      </button>
                    ))}
                  </div>

                  {/* 利用可能時間 */}
                  <p style={{ margin: "0 0 4px", fontSize: "12px" }}>
                    {t("route.availableTime")}：
                    <strong>
                      {Math.floor(availableMinutes / 60)}
                      {t("route.hours")}
                      {availableMinutes % 60 > 0
                        ? `${availableMinutes % 60}${t("route.minutes")}`
                        : ""}
                    </strong>
                  </p>
                  <input
                    type="range"
                    min={60}
                    max={600}
                    step={30}
                    value={availableMinutes}
                    onChange={(e) =>
                      setAvailableMinutes(Number(e.target.value))
                    }
                    style={{ width: "100%", marginBottom: "8px" }}
                  />

                  {genError && (
                    <p
                      style={{
                        color: "red",
                        fontSize: "11px",
                        margin: "0 0 6px",
                      }}
                    >
                      {genError}
                    </p>
                  )}

                  <button
                    onClick={handleGenerateRoute}
                    disabled={generating}
                    style={{
                      width: "100%",
                      padding: "8px",
                      background: generating ? "#ccc" : "#4CAF50",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: generating ? "not-allowed" : "pointer",
                      fontWeight: "bold",
                      fontSize: "13px",
                    }}
                  >
                    {generating ? t("route.generating") : t("route.generate")}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ルート結果表示 */}
          {routeResult && (
            <div
              style={{
                background: "white",
                borderRadius: "8px",
                padding: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                minWidth: "220px",
              }}
            >
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: "13px",
                  fontWeight: "bold",
                }}
              >
                {t("result.title")}
              </p>
              <div
                style={{
                  padding: "8px",
                  marginBottom: "8px",
                  borderRadius: "6px",
                  background: isOverTime ? "#FFF3E0" : "#E8F5E9",
                  fontSize: "12px",
                }}
              >
                {t(`route.${transportMode}`)} ・ {t("result.totalTime")}：
                <strong>
                  {Math.floor(routeResult.totalMin / 60)}
                  {t("route.hours")}
                  {routeResult.totalMin % 60}
                  {t("route.minutes")}
                </strong>
                {isOverTime && (
                  <div style={{ color: "#f44336", marginTop: "2px" }}>
                    ⚠️ {t("result.overTime")}
                  </div>
                )}
              </div>

              {routeResult.orderedSpots.map((spot, i) => (
                <div
                  key={spot.id}
                  style={{ fontSize: "12px", marginBottom: "4px" }}
                >
                  {i > 0 && (
                    <div
                      style={{
                        color: "#999",
                        paddingLeft: "20px",
                        fontSize: "11px",
                      }}
                    >
                      {t(`route.${transportMode}`)} {t("result.travelTime")}
                      {routeResult.legs[i - 1].minutes}
                      {t("route.minutes")}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        width: "18px",
                        height: "18px",
                        background: "#2196F3",
                        color: "white",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span>{spot.name}</span>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setRouteResult(null)}
                style={{
                  width: "100%",
                  marginTop: "8px",
                  padding: "6px",
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                {t("result.changeCondition")}
              </button>
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
        {/* ルートの線 */}
        {routeGeoJSON && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                "line-color": "#2196F3",
                "line-width": 5,
                "line-opacity": 0.8,
              }}
              layout={{ "line-cap": "round", "line-join": "round" }}
            />
          </Source>
        )}

        {spots.map((spot) => {
          const matched = matchesFilter(spot);
          return (
            <Marker
              key={spot.id}
              longitude={spot.lng}
              latitude={spot.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                if (!matched) return; // フィルタ非一致は操作不可
                if (routeMode) {
                  if (!routeResult) handleMarkerClickForRoute(spot);
                } else {
                  setSelectedSpot(spot);
                }
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  cursor: matched ? "pointer" : "default",
                  filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.3))",
                  opacity: matched ? 1 : 0.25,
                }}
              >
                {getMarkerEmoji(spot)}
              </div>
            </Marker>
          );
        })}

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
              isSacred={isSpotSacred(selectedSpot)}
              tags={significanceTags.filter((t) =>
                spotTags.some(
                  (st) => st.spot_id === selectedSpot.id && st.tag_id === t.id,
                ),
              )}
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
