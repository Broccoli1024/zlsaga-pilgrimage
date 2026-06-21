import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

const ADMIN_EMAILS = ["rikurin2016@gmail.com"];

export default function AdminPage() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<"csv" | "forms">("csv");

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email);

  if (!user) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>管理ページを見るにはログインが必要です</p>
        <Link to="/login">ログインへ</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>このページへのアクセス権限がありません</p>
        <Link to="/">地図に戻る</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "1.5rem" }}>
      <Link to="/" style={{ fontSize: "13px", color: "#666" }}>
        ← 地図に戻る
      </Link>

      <h1 style={{ fontSize: "20px", margin: "1rem 0" }}>🔧 管理ページ</h1>

      <div style={{ display: "flex", gap: "4px", marginBottom: "1.5rem" }}>
        {(
          [
            ["csv", "📄 CSV投入"],
            ["forms", "📋 フォーム回答"],
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

      {activeTab === "csv" && (
        <div>
          <p style={{ color: "#999", fontSize: "13px" }}>
            CSV投入機能（実装予定）
          </p>
        </div>
      )}

      {activeTab === "forms" && (
        <div>
          <p style={{ color: "#999", fontSize: "13px" }}>
            フォーム回答確認機能（実装予定）
          </p>
        </div>
      )}
    </div>
  );
}
