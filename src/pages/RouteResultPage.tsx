import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Spot } from "../types";

interface RouteState {
  spots: Spot[];
  travelTimes: Record<string, number>;
  totalMin: number;
  availableMinutes: number;
  transportMode: string;
}

export default function RouteResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const state = location.state as RouteState | null;

  if (!state) {
    return (
      <div style={{ padding: "2rem" }}>
        <p>{t("result.noData")}</p>
        <button onClick={() => navigate("/")}>{t("result.backToMap")}</button>
      </div>
    );
  }

  const { spots, travelTimes, totalMin, availableMinutes, transportMode } =
    state;
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
            const spotIds = spots.map((s) => s.id).join(",");
            navigate(`/routes/new?spots=${spotIds}`);
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
