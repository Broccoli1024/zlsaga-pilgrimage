import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import AdSenseUnit from "../components/ads/AdSenseUnit";
import RakutenAdBanner from "../components/ads/RakutenAdBanner";
import { RAKUTEN_ADS } from "../data/rakutenAds";
import type { Spot } from "../types";

interface RouteState {
  spots: Spot[];
  travelTimes: Record<string, number>;
  totalMin: number;
  availableMinutes: number;
  transportMode: string;
}

interface RouteSpotRow {
  spot_id: string;
  order_index: number;
  travel_min_from_prev: number | null;
  spots: Spot;
}

export default function RouteResultPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");

  const initialState = location.state as RouteState | null;
  const [routeData, setRouteData] = useState<RouteState | null>(initialState);
  const [loading, setLoading] = useState(!initialState);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (initialState || !id) return;
    const fetchRoute = async () => {
      setLoading(true);
      const { data: route, error: routeError } = await supabase
        .from("routes")
        .select("*")
        .eq("id", id)
        .single();
      if (routeError || !route) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: routeSpots, error: routeSpotsError } = await supabase
        .from("route_spots")
        .select("spot_id, order_index, travel_min_from_prev, spots(*)")
        .eq("route_id", id)
        .order("order_index", { ascending: true })
        .returns<RouteSpotRow[]>();

      if (routeSpotsError || !routeSpots) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const spots = routeSpots.map((rs) => rs.spots);
      const travelTimes: Record<string, number> = {};
      routeSpots.forEach((rs, i) => {
        if (i > 0 && rs.travel_min_from_prev !== null) {
          travelTimes[`${routeSpots[i - 1].spot_id}_${rs.spot_id}`] =
            rs.travel_min_from_prev;
        }
      });

      setRouteData({
        spots,
        travelTimes,
        totalMin: route.total_minutes ?? 0,
        availableMinutes: route.total_minutes ?? 0,
        transportMode: route.transport_mode,
      });
      setLoading(false);
    };
    fetchRoute();
  }, [id, initialState]);

  if (loading) {
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

  if (notFound || !routeData) {
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
            {t("result.noData")}
          </p>
          <button
            onClick={() => navigate("/")}
            style={{
              color: "var(--color-primary)",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {t("result.backToMap")}
          </button>
        </div>
      </div>
    );
  }

  const { spots, travelTimes, totalMin, availableMinutes, transportMode } =
    routeData;
  const isOverTime = totalMin > availableMinutes;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <div
        style={{
          maxWidth: "480px",
          margin: "0 auto",
          padding: "var(--space-xl) var(--space-lg)",
        }}
      >
        {/* タイトル */}
        <div
          style={{
            borderLeft: "3px solid var(--color-primary)",
            paddingLeft: "var(--space-md)",
            marginBottom: "var(--space-xl)",
          }}
        >
          <h1
            style={{
              margin: "0 0 2px",
              fontSize: "var(--font-size-xl)",
              fontWeight: "500",
              color: "var(--color-text-main)",
            }}
          >
            {t("result.title")}
          </h1>
        </div>

        {/* サマリー */}
        <div
          style={{
            background: "var(--color-card)",
            borderRadius: "var(--radius-md)",
            borderLeft: `3px solid ${isOverTime ? "var(--color-warning)" : "var(--color-success)"}`,
            padding: "var(--space-md) var(--space-lg)",
            marginBottom: "var(--space-xl)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <p
            style={{
              margin: "0 0 var(--space-xs)",
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-muted)",
            }}
          >
            {t(`route.${transportMode}`)}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "var(--font-size-md)",
              color: "var(--color-text-main)",
            }}
          >
            {t("result.totalTime")}：
            <strong
              style={{
                color: isOverTime
                  ? "var(--color-warning)"
                  : "var(--color-success)",
                fontSize: "var(--font-size-lg)",
              }}
            >
              {Math.floor(totalMin / 60)}
              {t("route.hours")}
              {totalMin % 60}
              {t("route.minutes")}
            </strong>
            {isOverTime && (
              <span
                style={{
                  color: "var(--color-warning)",
                  fontSize: "var(--font-size-xs)",
                  marginLeft: "var(--space-sm)",
                }}
              >
                ⚠️ {t("result.overTime")}
              </span>
            )}
          </p>
        </div>

        {/* スポット一覧 */}
        {spots.map((spot, i) => (
          <div key={spot.id}>
            {i > 0 && (
              <div
                style={{
                  padding: "var(--space-xs) 0 var(--space-xs) 28px",
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                {t(`route.${transportMode}`)} {t("result.travelTime")}
                {travelTimes[`${spots[i - 1].id}_${spot.id}`] ?? "?"}
                {t("route.minutes")}
              </div>
            )}
            <div
              style={{
                background: "var(--color-card)",
                borderRadius: "var(--radius-md)",
                borderLeft: "3px solid var(--color-primary)",
                padding: "var(--space-md) var(--space-lg)",
                marginBottom: "var(--space-xs)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-md)",
                }}
              >
                <span
                  style={{
                    width: "24px",
                    height: "24px",
                    background: "var(--color-primary)",
                    color: "var(--color-white)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "var(--font-size-xs)",
                    fontWeight: "bold",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
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
                    {isEn ? (spot.name_en ?? spot.name) : spot.name}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "var(--font-size-xs)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    ⏱ {t("result.stayTime")}
                    {spot.duration_min ?? 30}
                    {t("route.minutes")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* ボタン */}
        <div
          style={{
            marginTop: "var(--space-xl)",
            display: "flex",
            gap: "var(--space-sm)",
          }}
        >
          <button
            onClick={() => navigate(`/?restoreRoute=${id}`)}
            style={{
              flex: 1,
              padding: "10px",
              background: "var(--color-card)",
              border: "0.5px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-sub)",
            }}
          >
            {t("result.changeCondition")}
          </button>
          <button
            onClick={() => navigate("/")}
            style={{
              flex: 1,
              padding: "10px",
              background: "var(--color-primary)",
              color: "var(--color-white)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              fontSize: "var(--font-size-sm)",
              fontWeight: "500",
            }}
          >
            {t("result.backToMap")}
          </button>
        </div>

        {/* 広告エリア */}
        <div
          style={{
            marginTop: "var(--space-xl)",
            paddingTop: "var(--space-lg)",
            borderTop: "0.5px solid var(--color-border)",
          }}
        >
          <p
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-sm)",
            }}
          >
            {isEn ? "Nearby hotels" : "近くの宿を探す"}
          </p>
          <RakutenAdBanner html={RAKUTEN_ADS.apaHotelSaga} />
          <div style={{ marginTop: "var(--space-md)" }}>
            <AdSenseUnit slot="0000000000" />
          </div>
        </div>
      </div>
    </div>
  );
}
