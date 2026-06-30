import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
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
  const { t } = useTranslation();

  const initialState = location.state as RouteState | null;
  const [routeData, setRouteData] = useState<RouteState | null>(initialState);
  const [loading, setLoading] = useState(!initialState);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // location.stateがあれば再取得不要
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
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (notFound || !routeData) {
    return (
      <div style={{ padding: "2rem" }}>
        <p>{t("result.noData")}</p>
        <button onClick={() => navigate("/")}>{t("result.backToMap")}</button>
      </div>
    );
  }

  const { spots, travelTimes, totalMin, availableMinutes, transportMode } =
    routeData;
  const isOverTime = totalMin > availableMinutes;

  return (
    <div style={{ padding: "2rem", maxWidth: "480px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "20px", marginBottom: "0.5rem" }}>
        {t("result.title")}
      </h1>

      <div
        style={{
          padding: "12px",
          marginBottom: "1.5rem",
          background: isOverTime ? "#FFF3E0" : "#E8F5E9",
          borderRadius: "8px",
          fontSize: "14px",
        }}
      >
        <p style={{ margin: "0 0 4px" }}>{t(`route.${transportMode}`)}</p>
        <p style={{ margin: "0 0 4px" }}>
          {t("result.totalTime")}：
          <strong>
            {Math.floor(totalMin / 60)}
            {t("route.hours")}
            {totalMin % 60}
            {t("route.minutes")}
          </strong>
          {isOverTime && (
            <span style={{ color: "#f44336", marginLeft: "8px" }}>
              ⚠️ {t("result.overTime")}（{Math.floor(availableMinutes / 60)}
              {t("route.hours")}）
            </span>
          )}
        </p>
      </div>

      {spots.map((spot, i) => (
        <div key={spot.id}>
          {i > 0 && (
            <div
              style={{
                padding: "4px 0 4px 24px",
                fontSize: "12px",
                color: "#999",
              }}
            >
              {t(`route.${transportMode}`)} {t("result.travelTime")}
              {travelTimes[`${spots[i - 1].id}_${spot.id}`] ?? "?"}
              {t("route.minutes")}
            </div>
          )}
          <div
            style={{
              padding: "12px",
              marginBottom: "4px",
              background: "white",
              borderRadius: "8px",
              border: "1px solid #eee",
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "24px",
                  height: "24px",
                  background: "#2196F3",
                  color: "white",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
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
                    fontWeight: "bold",
                    fontSize: "15px",
                  }}
                >
                  {spot.name}
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>
                  {t("result.stayTime")}
                  {spot.duration_min ?? 30}
                  {t("route.minutes")}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div style={{ marginTop: "1.5rem", display: "flex", gap: "8px" }}>
        <button
          onClick={() => {
            navigate(`/?restoreRoute=${id}`);
          }}
          style={{
            flex: 1,
            padding: "10px",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {t("result.changeCondition")}
        </button>
        <button
          onClick={() => navigate("/")}
          style={{
            flex: 1,
            padding: "10px",
            background: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {t("result.backToMap")}
        </button>
      </div>
    </div>
  );
}
