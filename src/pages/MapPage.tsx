import { useEffect, useState } from "react";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";
import type { Spot } from "../types";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapPage() {
  const user = useAuthStore((state) => state.user);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [checkedInSpots, setCheckedInSpots] = useState<Set<string>>(new Set());
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    const fetchSpots = async () => {
      const { data, error } = await supabase
        .from("spots")
        .select("*")
        .eq("is_published", true);
      if (error) {
        console.error("スポット取得エラー:", error);
        return;
      }
      setSpots(data ?? []);
    };
    fetchSpots();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchCheckins = async () => {
      const { data, error } = await supabase
        .from("spot_checkins")
        .select("spot_id");
      if (error) {
        console.error("チェックイン取得エラー:", error);
        return;
      }
      setCheckedInSpots(new Set(data?.map((c) => c.spot_id) ?? []));
    };
    fetchCheckins();
  }, [user]);

  const handleCheckin = async (spot: Spot) => {
    if (!user) return;
    setCheckingIn(true);

    await supabase.from("visit_logs").insert({
      user_id: user.id,
      spot_id: spot.id,
    });

    const { error } = await supabase
      .from("spot_checkins")
      .upsert(
        { user_id: user.id, spot_id: spot.id },
        { onConflict: "user_id,spot_id" },
      );

    if (error) {
      console.error("チェックインエラー:", error);
    } else {
      setCheckedInSpots((prev) => new Set([...prev, spot.id]));
    }
    setCheckingIn(false);
  };

  const handleUnCheckin = async (spot: Spot) => {
    if (!user) return;
    if (
      !window.confirm(
        `「${spot.name}」のチェックインを取り消しますか？\n※訪問履歴は記録として残ります`,
      )
    )
      return;
    setCheckingIn(true);

    const { error } = await supabase
      .from("spot_checkins")
      .delete()
      .eq("user_id", user.id)
      .eq("spot_id", spot.id);

    if (error) {
      console.error("チェックイン取り消しエラー:", error);
    } else {
      setCheckedInSpots((prev) => {
        const next = new Set(prev);
        next.delete(spot.id);
        return next;
      });
    }
    setCheckingIn(false);
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1,
          background: "white",
          padding: "8px 12px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          fontSize: "14px",
        }}
      >
        {user ? `👤 ${user.email}` : <a href="/login">ログイン</a>}
      </div>

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
              setSelectedSpot(spot);
            }}
          >
            <div
              style={{
                fontSize: "28px",
                cursor: "pointer",
                filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.3))",
              }}
            >
              {checkedInSpots.has(spot.id)
                ? "✅"
                : spot.is_sacred
                  ? "📍"
                  : "🗺️"}
            </div>
          </Marker>
        ))}

        {selectedSpot && (
          <Popup
            longitude={selectedSpot.lng}
            latitude={selectedSpot.lat}
            anchor="top"
            onClose={() => setSelectedSpot(null)}
          >
            <div style={{ padding: "4px", minWidth: "160px" }}>
              <strong>{selectedSpot.name}</strong>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#666" }}>
                {selectedSpot.description}
              </p>
              {user &&
                (checkedInSpots.has(selectedSpot.id) ? (
                  <button
                    onClick={() => handleUnCheckin(selectedSpot)}
                    disabled={checkingIn}
                    style={{
                      marginTop: "8px",
                      padding: "4px 12px",
                      width: "100%",
                      cursor: "pointer",
                      background: "#f44336",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                    }}
                  >
                    {checkingIn ? "処理中..." : "✅ チェックイン取り消し"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleCheckin(selectedSpot)}
                    disabled={checkingIn}
                    style={{
                      marginTop: "8px",
                      padding: "4px 12px",
                      width: "100%",
                      cursor: "pointer",
                      background: "#4CAF50",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                    }}
                  >
                    {checkingIn ? "記録中..." : "📍 チェックイン"}
                  </button>
                ))}
              {!user && (
                <p
                  style={{ fontSize: "11px", color: "#999", marginTop: "8px" }}
                >
                  チェックインにはログインが必要です
                </p>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
