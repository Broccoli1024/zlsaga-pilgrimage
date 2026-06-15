import { useLocation, useNavigate } from "react-router-dom";
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
  const state = location.state as RouteState | null;

  if (!state) {
    return (
      <div style={{ padding: "2rem" }}>
        <p>ルートデータが見つかりません。</p>
        <button onClick={() => navigate("/")}>地図に戻る</button>
      </div>
    );
  }

  const { spots, travelTimes, totalMin, availableMinutes, transportMode } =
    state;
  const isOverTime = totalMin > availableMinutes;

  return (
    <div style={{ padding: "2rem", maxWidth: "480px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "20px", marginBottom: "0.5rem" }}>提案ルート</h1>

      {/* 時間サマリー */}
      <div
        style={{
          padding: "12px",
          marginBottom: "1.5rem",
          background: isOverTime ? "#FFF3E0" : "#E8F5E9",
          borderRadius: "8px",
          fontSize: "14px",
        }}
      >
        <p style={{ margin: "0 0 4px" }}>
          {transportMode === "car" ? "🚗 自動車" : "🚃 公共交通機関"}
        </p>
        <p style={{ margin: "0 0 4px" }}>
          合計時間：
          <strong>
            {Math.floor(totalMin / 60)}時間{totalMin % 60}分
          </strong>
          {isOverTime && (
            <span style={{ color: "#f44336", marginLeft: "8px" }}>
              ⚠️ 利用可能時間（{Math.floor(availableMinutes / 60)}
              時間）を超えています
            </span>
          )}
        </p>
      </div>

      {/* ルート詳細 */}
      {spots.map((spot, i) => (
        <div key={spot.id}>
          {/* 移動時間 */}
          {i > 0 && (
            <div
              style={{
                padding: "4px 0 4px 24px",
                fontSize: "12px",
                color: "#999",
              }}
            >
              {transportMode === "car" ? "🚗" : "🚃"} 約
              {travelTimes[`${spots[i - 1].id}_${spot.id}`] ?? "?"}分
            </div>
          )}

          {/* スポットカード */}
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
                  滞在目安：約{spot.duration_min ?? 30}分
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
          ← 条件を変更
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
          地図に戻る
        </button>
      </div>
    </div>
  );
}
