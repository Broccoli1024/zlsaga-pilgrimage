import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";
import type { Spot } from "../types";

type TransportMode = "car" | "transit";

export default function RouteNewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const [spots, setSpots] = useState<Spot[]>([]);
  const [transportMode, setTransportMode] = useState<TransportMode>("car");
  const [availableMinutes, setAvailableMinutes] = useState<number>(240);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const spotIds = searchParams.get("spots")?.split(",") ?? [];

  useEffect(() => {
    if (spotIds.length === 0) return;
    const fetchSpots = async () => {
      const { data, error } = await supabase
        .from("spots")
        .select("*")
        .in("id", spotIds);
      if (error) {
        console.error("スポット取得エラー:", error);
        return;
      }
      const ordered = spotIds
        .map((id) => data?.find((s) => s.id === id))
        .filter(Boolean) as Spot[];
      setSpots(ordered);
    };
    fetchSpots();
  }, []);

  const handleGenerateRoute = async () => {
    if (!user) return;
    if (spots.length < 2) {
      setError(t("route.needMoreSpots"));
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const travelTimes = await fetchTravelTimes(spots, transportMode);
      const optimizedSpots = optimizeRoute(spots, travelTimes);
      const totalTravelMin = optimizedSpots.reduce(
        (sum, _, i) =>
          i === 0
            ? sum
            : sum +
              (travelTimes[
                `${optimizedSpots[i - 1].id}_${optimizedSpots[i].id}`
              ] ?? 0),
        0,
      );
      const totalStayMin = optimizedSpots.reduce(
        (sum, spot) => sum + (spot.duration_min ?? 30),
        0,
      );
      const totalMin = totalTravelMin + totalStayMin;

      const { data: routeData, error: routeError } = await supabase
        .from("routes")
        .insert({
          user_id: user.id,
          transport_mode: transportMode,
          total_minutes: totalMin,
        })
        .select()
        .single();
      if (routeError) throw routeError;

      const routeSpots = optimizedSpots.map((spot, i) => ({
        route_id: routeData.id,
        spot_id: spot.id,
        order_index: i,
        travel_min_from_prev:
          i === 0
            ? null
            : (travelTimes[`${optimizedSpots[i - 1].id}_${spot.id}`] ?? null),
      }));

      const { error: routeSpotsError } = await supabase
        .from("route_spots")
        .insert(routeSpots);
      if (routeSpotsError) throw routeSpotsError;

      const cacheData = Object.entries(travelTimes).map(([key, minutes]) => {
        const [from, to] = key.split("_");
        return {
          from_spot_id: from,
          to_spot_id: to,
          transport_mode: transportMode,
          minutes,
          source: "mapbox" as const,
          expires_at: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        };
      });

      await supabase
        .from("travel_times")
        .upsert(cacheData, {
          onConflict:
            "from_spot_id,to_spot_id,transport_mode,day_of_week,time_of_day",
        });

      navigate(`/routes/${routeData.id}`, {
        state: {
          spots: optimizedSpots,
          travelTimes,
          totalMin,
          availableMinutes,
          transportMode,
        },
      });
    } catch (err) {
      console.error("ルート生成エラー:", err);
      setError(t("route.error"));
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "480px", margin: "0 auto" }}>
      <button
        onClick={() => navigate("/")}
        style={{ marginBottom: "1rem", cursor: "pointer" }}
      >
        {t("route.backToMap")}
      </button>

      <h1 style={{ fontSize: "20px", marginBottom: "1.5rem" }}>
        {t("route.title")}
      </h1>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "16px", marginBottom: "8px" }}>
          {t("route.selectedSpots")}
        </h2>
        {spots.map((spot, i) => (
          <div
            key={spot.id}
            style={{
              padding: "8px 12px",
              marginBottom: "4px",
              background: "#f5f5f5",
              borderRadius: "8px",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ color: "#2196F3", fontWeight: "bold" }}>
              {i + 1}.
            </span>
            <span style={{ flex: 1 }}>{spot.name}</span>
            <span style={{ color: "#999", fontSize: "12px" }}>
              {t("route.stayTime")}
              {spot.duration_min ?? 30}
              {t("route.minutes")}
            </span>
          </div>
        ))}
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "16px", marginBottom: "8px" }}>
          {t("route.transport")}
        </h2>
        <div style={{ display: "flex", gap: "8px" }}>
          {(["car", "transit"] as TransportMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setTransportMode(mode)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "8px",
                border: "2px solid",
                borderColor: transportMode === mode ? "#2196F3" : "#ddd",
                background: transportMode === mode ? "#E3F2FD" : "white",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              {t(`route.${mode}`)}
            </button>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "16px", marginBottom: "8px" }}>
          {t("route.availableTime")}：
          <strong>
            {Math.floor(availableMinutes / 60)}
            {t("route.hours")}
            {availableMinutes % 60 > 0
              ? `${availableMinutes % 60}${t("route.minutes")}`
              : ""}
          </strong>
        </h2>
        <input
          type="range"
          min={60}
          max={600}
          step={30}
          value={availableMinutes}
          onChange={(e) => setAvailableMinutes(Number(e.target.value))}
          style={{ width: "100%" }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "#999",
          }}
        >
          <span>1{t("route.hours")}</span>
          <span>10{t("route.hours")}</span>
        </div>
      </section>

      {error && (
        <p style={{ color: "red", marginBottom: "1rem", fontSize: "14px" }}>
          {error}
        </p>
      )}

      <button
        onClick={handleGenerateRoute}
        disabled={loading || spots.length < 2}
        style={{
          width: "100%",
          padding: "12px",
          background: loading ? "#ccc" : "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: "bold",
        }}
      >
        {loading ? t("route.generating") : t("route.generate")}
      </button>
    </div>
  );
}

async function fetchTravelTimes(
  spots: Spot[],
  mode: TransportMode,
): Promise<Record<string, number>> {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  const profile = mode === "car" ? "driving" : "walking";
  const times: Record<string, number> = {};

  for (let i = 0; i < spots.length; i++) {
    for (let j = 0; j < spots.length; j++) {
      if (i === j) continue;
      const from = spots[i];
      const to = spots[j];
      const key = `${from.id}_${to.id}`;
      const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json();
      const durationSec = data.routes?.[0]?.duration ?? 0;
      times[key] = Math.ceil(durationSec / 60);
    }
  }
  return times;
}

function optimizeRoute(
  spots: Spot[],
  travelTimes: Record<string, number>,
): Spot[] {
  if (spots.length <= 2) return spots;
  const unvisited = [...spots.slice(1)];
  const result = [spots[0]];

  while (unvisited.length > 0) {
    const current = result[result.length - 1];
    let minTime = Infinity;
    let nearestIndex = 0;
    unvisited.forEach((spot, i) => {
      const time = travelTimes[`${current.id}_${spot.id}`] ?? Infinity;
      if (time < minTime) {
        minTime = time;
        nearestIndex = i;
      }
    });
    result.push(unvisited[nearestIndex]);
    unvisited.splice(nearestIndex, 1);
  }
  return result;
}
