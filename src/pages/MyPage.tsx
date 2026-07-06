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
      if (checkinData)
        setCheckins(
          checkinData.map((c) => ({
            spot_id: c.spot_id,
            first_visited_at: c.first_visited_at,
            is_favorite: c.is_favorite,
            spot: c.spots,
          })),
        );

      const { data: logData } = await supabase
        .from("visit_logs")
        .select("id, spot_id, visited_at, spots(name, name_en)")
        .order("visited_at", { ascending: false })
        .limit(50)
        .returns<VisitLogRow[]>();
      if (logData)
        setVisitLogs(
          logData.map((l) => ({
            id: l.id,
            spot_id: l.spot_id,
            visited_at: l.visited_at,
            spot: l.spots,
          })),
        );

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
            boxShadow: "var(--shadow-md)",
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
            {t("mypage.loginRequired")}
          </p>
          <Link
            to="/login"
            style={{
              color: "var(--color-primary)",
              textDecoration: "underline",
            }}
          >
            {t("mypage.toLogin")}
          </Link>
        </div>
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
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <div
        style={{
          maxWidth: "600px",
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
            to="/"
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
              textDecoration: "none",
            }}
          >
            ← {t("route.backToMap")}
          </Link>
        </div>

        <div
          style={{
            borderLeft: "3px solid var(--color-primary)",
            paddingLeft: "var(--space-md)",
            marginBottom: "var(--space-xl)",
          }}
        >
          <p
            style={{
              margin: "0 0 2px",
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-muted)",
            }}
          >
            マイページ
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "var(--font-size-lg)",
              fontWeight: "500",
              color: "var(--color-text-main)",
            }}
          >
            {user.email}
          </h1>
        </div>

        {/* 進捗サマリー */}
        <div
          style={{
            background: "var(--color-card)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-sm)",
            borderTop: "2px solid var(--color-primary)",
            padding: "var(--space-lg)",
            marginBottom: "var(--space-sm)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 var(--space-xs)",
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-muted)",
            }}
          >
            {t("mypage.visitedSpots")}
            {showMainOnly ? "（メインのみ）" : "（全件）"}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: "500",
              color: "var(--color-primary)",
            }}
          >
            {visitedTargetCount}
            <span
              style={{
                fontSize: "var(--font-size-lg)",
                color: "var(--color-text-sub)",
                marginLeft: "4px",
              }}
            >
              / {targetSpots.length}
            </span>
            {targetSpots.length > 0 && (
              <span
                style={{
                  fontSize: "var(--font-size-md)",
                  color: "var(--color-text-muted)",
                  marginLeft: "8px",
                }}
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
            marginBottom: "var(--space-xl)",
            background: "var(--color-card)",
            border: "0.5px solid var(--color-primary)",
            color: "var(--color-primary)",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            fontSize: "var(--font-size-xs)",
          }}
        >
          🔄 {showMainOnly ? "全件表示に切替" : "メインのみ表示に切替"}
        </button>

        {/* タブ */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            marginBottom: "var(--space-lg)",
            borderBottom: "2px solid var(--color-primary)",
          }}
        >
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
                border: "none",
                background:
                  activeTab === key ? "var(--color-primary)" : "transparent",
                color:
                  activeTab === key
                    ? "var(--color-white)"
                    : "var(--color-text-sub)",
                cursor: "pointer",
                fontSize: "var(--font-size-sm)",
                borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
                fontWeight: activeTab === key ? "500" : "normal",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 訪問済みタブ */}
        {activeTab === "spots" && (
          <div>
            {checkins.length > 0 && (
              <div
                style={{
                  height: "200px",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  marginBottom: "var(--space-lg)",
                  border: "0.5px solid var(--color-border)",
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

            {/* エリア別進捗 */}
            {areaProgress.length > 0 && (
              <div
                style={{
                  background: "var(--color-card)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-sm)",
                  padding: "var(--space-md) var(--space-lg)",
                  marginBottom: "var(--space-lg)",
                }}
              >
                {areaProgress.map(({ area, visited, total }) => (
                  <div
                    key={area.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "var(--space-xs) 0",
                      borderBottom: "0.5px solid var(--color-border-light)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "var(--font-size-sm)",
                        color: "var(--color-text-main)",
                      }}
                    >
                      {isEn ? (area.name_en ?? area.name) : area.name}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {visited} / {total}
                      {total > 0 && (
                        <span
                          style={{
                            marginLeft: "6px",
                            color: "var(--color-primary)",
                            fontWeight: "500",
                          }}
                        >
                          {Math.round((visited / total) * 100)}%
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {checkins.length === 0 && (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                  fontSize: "var(--font-size-sm)",
                }}
              >
                {t("mypage.noVisits")}
              </p>
            )}

            {checkins
              .filter((c) => c.spot)
              .map((c) => (
                <div
                  key={c.spot_id}
                  style={{
                    background: "var(--color-card)",
                    borderRadius: "var(--radius-md)",
                    borderLeft:
                      "3px solid " +
                      (c.is_favorite ? "#F5C842" : "var(--color-border)"),
                    padding: "var(--space-md) var(--space-lg)",
                    marginBottom: "var(--space-sm)",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-md)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>
                    {c.is_favorite ? "⭐" : "✅"}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        margin: "0 0 2px",
                        fontWeight: "500",
                        fontSize: "var(--font-size-md)",
                        color: "var(--color-text-main)",
                      }}
                    >
                      {isEn ? (c.spot.name_en ?? c.spot.name) : c.spot.name}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {t("mypage.firstVisit")}
                      {new Date(c.first_visited_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* 履歴タブ */}
        {activeTab === "history" && (
          <div>
            {visitLogs.length === 0 && (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                  fontSize: "var(--font-size-sm)",
                }}
              >
                {t("mypage.noHistory")}
              </p>
            )}
            {visitLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  background: "var(--color-card)",
                  borderRadius: "var(--radius-sm)",
                  padding: "var(--space-sm) var(--space-md)",
                  marginBottom: "var(--space-xs)",
                  fontSize: "var(--font-size-sm)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <span style={{ color: "var(--color-text-main)" }}>
                  {log.spot
                    ? isEn
                      ? (log.spot.name_en ?? log.spot.name)
                      : log.spot.name
                    : t("mypage.deletedSpot")}
                </span>
                <span
                  style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-muted)",
                    whiteSpace: "nowrap",
                    marginLeft: "var(--space-sm)",
                  }}
                >
                  {new Date(log.visited_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ルートタブ */}
        {activeTab === "routes" && (
          <div>
            {routes.length === 0 && (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                  fontSize: "var(--font-size-sm)",
                }}
              >
                {t("mypage.noRoutes")}
              </p>
            )}
            {routes.map((route) => (
              <Link
                key={route.id}
                to={`/routes/${route.id}`}
                style={{
                  display: "block",
                  marginBottom: "var(--space-sm)",
                  background: "var(--color-card)",
                  borderRadius: "var(--radius-md)",
                  borderLeft: "3px solid var(--color-primary)",
                  padding: "var(--space-md) var(--space-lg)",
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <p
                  style={{
                    margin: "0 0 2px",
                    fontWeight: "500",
                    fontSize: "var(--font-size-md)",
                    color: "var(--color-text-main)",
                  }}
                >
                  {route.name ||
                    (route.transport_mode === "car"
                      ? t("mypage.carRoute")
                      : route.transport_mode === "transit"
                        ? t("route.transit")
                        : t("mypage.transitRoute"))}
                </p>
                <p
                  style={{
                    margin: "0 0 2px",
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {route.transport_mode === "car"
                    ? t("route.car")
                    : route.transport_mode === "transit"
                      ? t("route.transit")
                      : t("route.walk")}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-muted)",
                  }}
                >
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
    </div>
  );
}
