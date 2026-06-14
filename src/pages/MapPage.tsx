import { useEffect, useState } from "react";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "../lib/supabase";
import type { Spot } from "../types";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapPage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

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

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: 130.2988,
          latitude: 33.2494,
          zoom: 9,
        }}
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
              {spot.is_sacred ? "📍" : "🗺️"}
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
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
