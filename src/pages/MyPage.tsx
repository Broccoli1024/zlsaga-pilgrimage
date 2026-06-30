import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Map, { Marker } from "react-map-gl/mapbox";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";
import type { Spot, Route } from "../types";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

interface CheckinRow {
  spot_id: string;
  first_visited_at: string;
  is_favorite: boolean;
  spots: Spot;
}

interface CheckinWithSpot {
  spot_id: string;
  first_visited_at: string;
  is_favorite: boolean;
  spot: Spot;
}

interface VisitLogRow {
  id: string;
  spot_id: string;
  visited_at: string;
  spots: { name: string; name_en: string | null } | null;
}

interface VisitLog {
  id: string;
  spot_id: string;
  visited_at: string;
  spot: { name: string; name_en: string | null } | null;
}

interface Area {
  id: string;
  name: string;
  name_en: string | null;
}

export default function MyPage() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");
  const user = useAuthStore((state) => state.user);

  const [checkins, setCheckins] = useState<CheckinWithSpot[]>([]);
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [activeTab, setActiveTab] = useState<"spots" | "history" | "routes">(
    "spots",
  );
  const [significanceTags, setSignificanceTags] = useState<
    { id: string; name: string }[]
  >([]);
  const [spotTags, setSpotTags] = useState<
    { spot_id: string; tag_id: string }[]
  >([]);
  const [allSpots, setAllSpots] = useState<Spot[]>([]);
  const [showMainOnly, setShowMainOnly] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { data: checkinData } = await supabase
        .from("spot_checkins")
        .select("spot_id, first_visited_at, is_favorite, spots(*)")
        .order("first_visited_at", { ascending: false })
        .returns<CheckinRow[]>();

      if (checkinData) {
        setCheckins(
          checkinData.map((c) => ({
            spot_id: c.spot_id,
            first_visited_at: c.first_visited_at,
            is_favorite: c.is_favorite,
            spot: c.spots,
          })),
        );
      }

      const { data: logData } = await supabase
        .from("visit_logs")
        .select("id, spot_id, visited_at, spots(name, name_en)")
        .order("visited_at", { ascending: false })
        .limit(50)
        .returns<VisitLogRow[]>();

      if (logData) {
        setVisitLogs(
          logData.map((l) => ({
            id: l.id,
            spot_id: l.spot_id,
            visited_at: l.visited_at,
            spot: l.spots,
          })),
        );
      }

      const { data: routeData } = await supabase
        .from("routes")
        .select("*")
        .eq("is_saved", true)
        .order("created_at", { ascending: false });
      if (routeData) setRoutes(routeData);

      const { data: areaData } = await supabase
        .from("areas")
        .select("id, name, name_en");
      if (areaData) setAreas(areaData);

      const { data: tagsData } = await supabase
        .from("significance_tags")
        .select("id, name");
      if (tagsData) setSignificanceTags(tagsData);

      const { data: spotTagsData } = await supabase
        .from("spot_significance_tags")
        .select("spot_id, tag_id");
      if (spotTagsData) setSpotTags(spotTagsData);

      const { data: allSpotsData } = await supabase
        .from("spots")
        .select("*")
        .eq("is_published", true);
      if (allSpotsData) setAllSpots(allSpotsData);
    };

    fetchData();
  }, [user]);

  if (!user) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>{t("mypage.loginRequired")}</p>
        <Link to="/login">{t("mypage.toLogin")}</Link>
      </div>
    );
  }

  const mainTagId = significanceTags.find((t) => t.name === "メイン")?.id;

  const isMainSpot = (spotId: string): boolean => {
    if (!mainTagId) return false;
    return spotTags.some(
      (st) => st.spot_id === spotId && st.tag_id === mainTagId,
    );
  };

  // 表示モードに応じた対象スポット
  const targetSpots = showMainOnly
    ? allSpots.filter((s) => isMainSpot(s.id))
    : allSpots;

  const visitedTargetCount = checkins.filter(
    (c) => c.spot && targetSpots.some((s) => s.id === c.spot_id),
  ).length;

  const areaProgress = areas
    .map((area) => {
      const areaTargetSpots = targetSpots.filter((s) => s.area_id === area.id);
      const areaVisitedCount = checkins.filter(
        (c) =>
          c.spot?.area_id === area.id &&
          targetSpots.some((s) => s.id === c.spot_id),
      ).length;
      return { area, visited: areaVisitedCount, total: areaTargetSpots.length };
    })
    .filter((a) => a.total > 0);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "1.5rem" }}>
      <Link to="/" style={{ fontSize: "13px", color: "#666" }}>
        ← {t("route.backToMap")}
      </Link>

      <h1 style={{ fontSize: "20px", margin: "1rem 0" }}>👤 {user.email}</h1>

      <div
        style={{
          background: "#E3F2FD",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "1rem",
          textAlign: "center",
        }}
      >
        <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#1565C0" }}>
          {t("mypage.visitedSpots")}
          {showMainOnly ? "（メインのみ）" : "（全件）"}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: "bold",
            color: "#1565C0",
          }}
        >
          {visitedTargetCount}{" "}
          <span style={{ fontSize: "16px" }}>/ {targetSpots.length}</span>
          {targetSpots.length > 0 && (
            <span
              style={{ fontSize: "16px", marginLeft: "8px", color: "#1976D2" }}
            >
              ({Math.round((visitedTargetCount / targetSpots.length) * 100)}%)
            </span>
          )}
        </p>
      </div>

      <button
        onClick={() => setShowMainOnly(!showMainOnly)}
        style={{
          width: "100%",
          padding: "8px",
          marginBottom: "1.5rem",
          background: "white",
          border: "1px solid #2196F3",
          color: "#2196F3",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "13px",
        }}
      >
        🔄 {showMainOnly ? "全件表示に切替" : "メインのみ表示に切替"}
      </button>

      <div style={{ display: "flex", gap: "4px", marginBottom: "1rem" }}>
        {(
          [
            ["spots", t("mypage.tabSpots")],
            ["history", t("mypage.tabHistory")],
            ["routes", t("mypage.tabRoutes")],
          ] as [typeof activeTab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "8px",
              border: "1px solid",
              borderColor: activeTab === key ? "#2196F3" : "#ddd",
              background: activeTab === key ? "#E3F2FD" : "white",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "spots" && (
        <div>
          {checkins.length > 0 && (
            <div
              style={{
                height: "200px",
                borderRadius: "8px",
                overflow: "hidden",
                marginBottom: "1rem",
                border: "1px solid #eee",
              }}
            >
              <Map
                mapboxAccessToken={MAPBOX_TOKEN}
                initialViewState={{
                  longitude: 130.2988,
                  latitude: 33.2494,
                  zoom: 8.5,
                }}
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
              >
                {checkins
                  .filter((c) => c.spot)
                  .map((c) => (
                    <Marker
                      key={c.spot_id}
                      longitude={c.spot.lng}
                      latitude={c.spot.lat}
                      anchor="bottom"
                    >
                      <div style={{ fontSize: "20px" }}>
                        {c.is_favorite ? "⭐" : "✅"}
                      </div>
                    </Marker>
                  ))}
              </Map>
            </div>
          )}

          {areaProgress.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              {areaProgress.map(({ area, visited, total }) => (
                <div
                  key={area.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    padding: "4px 0",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <span>{isEn ? (area.name_en ?? area.name) : area.name}</span>
                  <span style={{ color: "#999" }}>
                    {visited} / {total}
                    {total > 0 && (
                      <span style={{ marginLeft: "6px", color: "#bbb" }}>
                        ({Math.round((visited / total) * 100)}%)
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {checkins.length === 0 && (
            <p style={{ textAlign: "center", color: "#999", fontSize: "14px" }}>
              {t("mypage.noVisits")}
            </p>
          )}

          {checkins
            .filter((c) => c.spot)
            .map((c) => (
              <div
                key={c.spot_id}
                style={{
                  padding: "12px",
                  marginBottom: "6px",
                  background: "white",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "18px" }}>
                  {c.is_favorite ? "⭐" : "✅"}
                </span>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: "0 0 2px",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    {isEn ? (c.spot.name_en ?? c.spot.name) : c.spot.name}
                  </p>
                  <p style={{ margin: 0, fontSize: "11px", color: "#999" }}>
                    {t("mypage.firstVisit")}
                    {new Date(c.first_visited_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}

      {activeTab === "history" && (
        <div>
          {visitLogs.length === 0 && (
            <p style={{ textAlign: "center", color: "#999", fontSize: "14px" }}>
              {t("mypage.noHistory")}
            </p>
          )}
          {visitLogs.map((log) => (
            <div
              key={log.id}
              style={{
                padding: "10px 12px",
                marginBottom: "4px",
                background: "white",
                border: "1px solid #eee",
                borderRadius: "8px",
                fontSize: "13px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>
                {log.spot
                  ? isEn
                    ? (log.spot.name_en ?? log.spot.name)
                    : log.spot.name
                  : t("mypage.deletedSpot")}
              </span>
              <span style={{ color: "#999" }}>
                {new Date(log.visited_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "routes" && (
        <div>
          {routes.length === 0 && (
            <p style={{ textAlign: "center", color: "#999", fontSize: "14px" }}>
              {t("mypage.noRoutes")}
            </p>
          )}
          {routes.map((route) => (
            <Link
              key={route.id}
              to={`/routes/${route.id}`}
              style={{
                display: "block",
                padding: "12px",
                marginBottom: "6px",
                background: "white",
                border: "1px solid #eee",
                borderRadius: "8px",
                textDecoration: "none",
                color: "inherit",
                fontSize: "13px",
              }}
            >
              <p style={{ margin: "0 0 4px", fontWeight: "bold" }}>
                {route.name ||
                  (route.transport_mode === "car"
                    ? t("mypage.carRoute")
                    : route.transport_mode === "transit"
                      ? t("route.transit")
                      : t("mypage.transitRoute"))}
              </p>
              <p style={{ margin: "0 0 2px", color: "#999", fontSize: "11px" }}>
                {route.transport_mode === "car"
                  ? t("route.car")
                  : route.transport_mode === "transit"
                    ? t("route.transit")
                    : t("route.walk")}
              </p>
              <p style={{ margin: 0, color: "#999", fontSize: "12px" }}>
                {t("mypage.total")}
                {route.total_minutes}
                {t("route.minutes")} ・{" "}
                {new Date(route.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
