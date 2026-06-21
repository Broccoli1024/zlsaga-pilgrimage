import { useState } from "react";
import { Link } from "react-router-dom";
import Papa from "papaparse";
import { useAuthStore } from "../stores/authStore";
import { supabase } from "../lib/supabase";

const ADMIN_EMAILS = ["rikurin2016@gmail.com"];
const WORK_ID = "00000000-0000-0000-0000-000000000001";

interface CsvRow {
  name: string;
  name_en: string;
  lat: string;
  lng: string;
  address: string;
  address_en: string;
  area_name: string;
  category_name: string;
  description: string;
  description_en: string;
  access_info: string;
  parking_info: string;
  duration_min: string;
  nearest_station_name: string;
  nearest_station_walk_min: string;
  nearest_bus_stop_name: string;
  nearest_bus_stop_walk_min: string;
  access_notes: string;
  is_published: string;
  tags: string;
}

interface PreviewRow extends CsvRow {
  _rowIndex: number;
  _errors: string[];
}

export default function AdminPage() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<"csv" | "forms">("csv");

  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const [loadingForms, setLoadingForms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formPreviewRows, setFormPreviewRows] = useState<PreviewRow[]>([]);

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email);

  const loadMasters = async () => {
    const [areasRes, categoriesRes, tagsRes] = await Promise.all([
      supabase.from("areas").select("id, name").eq("work_id", WORK_ID),
      supabase.from("categories").select("id, name"),
      supabase.from("significance_tags").select("id, name"),
    ]);
    const loadedAreas = areasRes.data ?? [];
    const loadedCategories = categoriesRes.data ?? [];
    const loadedTags = tagsRes.data ?? [];
    setAreas(loadedAreas);
    setCategories(loadedCategories);
    setTags(loadedTags);
    return { loadedAreas, loadedCategories, loadedTags };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { loadedAreas, loadedCategories, loadedTags } = await loadMasters();
    setResultMessage(null);

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: PreviewRow[] = results.data.map((row, i) => {
          const errors: string[] = [];
          if (!row.name) errors.push("nameが空です");
          if (!row.lat || isNaN(Number(row.lat))) errors.push("latが不正です");
          if (!row.lng || isNaN(Number(row.lng))) errors.push("lngが不正です");
          if (
            row.area_name &&
            !loadedAreas.some((a) => a.name === row.area_name)
          ) {
            errors.push(`エリア「${row.area_name}」が見つかりません`);
          }
          if (
            row.category_name &&
            !loadedCategories.some((c) => c.name === row.category_name)
          ) {
            errors.push(`カテゴリ「${row.category_name}」が見つかりません`);
          }
          if (row.tags) {
            const tagNames = row.tags
              .split(";")
              .map((t) => t.trim())
              .filter(Boolean);
            tagNames.forEach((tn) => {
              if (!loadedTags.some((t) => t.name === tn))
                errors.push(`タグ「${tn}」が見つかりません`);
            });
          }
          return { ...row, _rowIndex: i + 1, _errors: errors };
        });
        setPreviewRows(rows);
      },
    });
  };

  const handleImport = async () => {
    const validRows = previewRows.filter((r) => r._errors.length === 0);
    if (validRows.length === 0) {
      setResultMessage("登録可能な行がありません");
      return;
    }
    setImporting(true);
    setResultMessage(null);

    const payload = validRows.map((row) => {
      const areaId = areas.find((a) => a.name === row.area_name)?.id ?? null;
      const categoryId =
        categories.find((c) => c.name === row.category_name)?.id ?? null;
      const tagNames = row.tags
        ? row.tags
            .split(";")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      const tagIds = tagNames
        .map((tn) => tags.find((t) => t.name === tn)?.id)
        .filter((id): id is string => !!id);

      return {
        work_id: WORK_ID,
        area_id: areaId,
        category_id: categoryId,
        name: row.name,
        name_en: row.name_en || null,
        lat: Number(row.lat),
        lng: Number(row.lng),
        address: row.address || null,
        address_en: row.address_en || null,
        description: row.description || null,
        description_en: row.description_en || null,
        access_info: row.access_info || null,
        parking_info: row.parking_info || null,
        duration_min: row.duration_min ? Number(row.duration_min) : null,
        nearest_station_name: row.nearest_station_name || null,
        nearest_station_walk_min: row.nearest_station_walk_min
          ? Number(row.nearest_station_walk_min)
          : null,
        nearest_bus_stop_name: row.nearest_bus_stop_name || null,
        nearest_bus_stop_walk_min: row.nearest_bus_stop_walk_min
          ? Number(row.nearest_bus_stop_walk_min)
          : null,
        access_notes: row.access_notes || null,
        is_published: row.is_published?.toLowerCase() === "true",
        tag_ids: tagIds,
      };
    });

    const { data, error } = await supabase.functions.invoke("insert-spot", {
      body: { rows: payload },
    });

    if (error) {
      setResultMessage(`登録エラー: ${error.message}`);
      setImporting(false);
      return;
    }

    setResultMessage(
      `登録完了：成功 ${data.successCount}件 / 失敗 ${data.failCount}件`,
    );
    if (data.failedDetails?.length > 0) {
      console.error("登録失敗の詳細:", data.failedDetails);
    }
    setPreviewRows([]);
    setImporting(false);
  };

  const handleFetchFormResponses = async () => {
    setLoadingForms(true);
    setFormError(null);

    const beforeSession = await supabase.auth.getSession();
    console.log(
      "呼び出し前のトークン:",
      beforeSession.data.session?.access_token?.slice(0, 20),
    );

    const { data, error } = await supabase.functions.invoke(
      "fetch-form-responses",
    );

    const afterSession = await supabase.auth.getSession();
    console.log(
      "呼び出し後のトークン:",
      afterSession.data.session?.access_token?.slice(0, 20),
    );

    // ...(以下既存のコード)

    if (error) {
      setFormError(`取得エラー: ${error.message}`);
      setLoadingForms(false);
      return;
    }

    if (data.error) {
      setFormError(`取得エラー: ${data.error}`);
      setLoadingForms(false);
      return;
    }

    const { loadedAreas, loadedCategories } = await loadMasters();

    const rows: PreviewRow[] = data.records.map(
      (record: Record<string, string>, i: number) => {
        const errors: string[] = [];
        const name = record["スポット名"] || "";
        const mapUrl = record["Googleマップ共有URL"] || "";
        const areaName = record["エリア"] || "";
        const categoryName = record["カテゴリ"] || "";
        const description = record["説明・どんなシーンで登場したか"] || "";
        const lat = record["_lat"] || "";
        const lng = record["_lng"] || "";

        if (!name) errors.push("スポット名が空です");
        if (!mapUrl) errors.push("Googleマップ共有URLが空です");
        if (!lat || !lng) errors.push("URLから緯度経度を抽出できません");

        if (areaName && !loadedAreas.some((a) => a.name === areaName)) {
          errors.push(`エリア「${areaName}」が見つかりません`);
        }
        if (
          categoryName &&
          !loadedCategories.some((c) => c.name === categoryName)
        ) {
          errors.push(`カテゴリ「${categoryName}」が見つかりません`);
        }

        return {
          name,
          name_en: "",
          lat,
          lng,
          address: "",
          address_en: "",
          area_name: areaName,
          category_name: categoryName,
          description,
          description_en: "",
          access_info: "",
          parking_info: "",
          duration_min: "",
          nearest_station_name: "",
          nearest_station_walk_min: "",
          nearest_bus_stop_name: "",
          nearest_bus_stop_walk_min: "",
          access_notes: record["備考"] || "",
          is_published: "false",
          tags: "",
          _rowIndex: i + 1,
          _errors: errors,
        };
      },
    );

    // セッションの整合性を確認・復元
    const { data: refreshedSession } = await supabase.auth.refreshSession();
    console.log(
      "リフレッシュ後のユーザー:",
      refreshedSession.session?.user?.email,
    );

    setFormPreviewRows(rows);
    setLoadingForms(false);
  };

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
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem" }}>
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
          <p style={{ fontSize: "13px", color: "#666", marginBottom: "1rem" }}>
            CSV列：name, name_en, lat, lng, address, address_en, area_name,
            category_name, description, description_en, access_info,
            parking_info, duration_min, nearest_station_name,
            nearest_station_walk_min, nearest_bus_stop_name,
            nearest_bus_stop_walk_min, access_notes, is_published,
            tags（;区切り）
          </p>

          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            style={{ marginBottom: "1rem" }}
          />

          {previewRows.length > 0 && (
            <div>
              <p style={{ fontSize: "13px", marginBottom: "8px" }}>
                プレビュー：{previewRows.length}件 （エラーなし：
                {previewRows.filter((r) => r._errors.length === 0).length}件）
              </p>

              <div
                style={{
                  maxHeight: "400px",
                  overflowY: "auto",
                  marginBottom: "1rem",
                }}
              >
                {previewRows.map((row) => (
                  <div
                    key={row._rowIndex}
                    style={{
                      padding: "8px",
                      marginBottom: "4px",
                      borderRadius: "6px",
                      background:
                        row._errors.length > 0 ? "#FFEBEE" : "#E8F5E9",
                      fontSize: "12px",
                    }}
                  >
                    <strong>
                      #{row._rowIndex} {row.name}
                    </strong>
                    {row._errors.length > 0 && (
                      <ul
                        style={{
                          margin: "4px 0 0",
                          paddingLeft: "16px",
                          color: "#C62828",
                        }}
                      >
                        {row._errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleImport}
                disabled={importing}
                style={{
                  padding: "10px 20px",
                  background: importing ? "#ccc" : "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: importing ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                }}
              >
                {importing
                  ? "登録中..."
                  : `エラーなしの${previewRows.filter((r) => r._errors.length === 0).length}件を登録`}
              </button>
            </div>
          )}

          {resultMessage && (
            <p
              style={{
                marginTop: "1rem",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              {resultMessage}
            </p>
          )}
        </div>
      )}

      {activeTab === "forms" && (
        <div>
          <button
            onClick={handleFetchFormResponses}
            disabled={loadingForms}
            style={{
              padding: "10px 20px",
              marginBottom: "1rem",
              background: loadingForms ? "#ccc" : "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loadingForms ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {loadingForms ? "取得中..." : "📥 フォーム回答を取得"}
          </button>

          {formError && (
            <p style={{ color: "red", fontSize: "13px", marginBottom: "1rem" }}>
              {formError}
            </p>
          )}

          {formPreviewRows.length > 0 && (
            <div>
              <p style={{ fontSize: "13px", marginBottom: "8px" }}>
                回答件数：{formPreviewRows.length}件 （エラーなし：
                {formPreviewRows.filter((r) => r._errors.length === 0).length}
                件）
              </p>

              <div
                style={{
                  maxHeight: "400px",
                  overflowY: "auto",
                  marginBottom: "1rem",
                }}
              >
                {formPreviewRows.map((row) => (
                  <div
                    key={row._rowIndex}
                    style={{
                      padding: "8px",
                      marginBottom: "4px",
                      borderRadius: "6px",
                      background:
                        row._errors.length > 0 ? "#FFEBEE" : "#E8F5E9",
                      fontSize: "12px",
                    }}
                  >
                    <strong>
                      #{row._rowIndex} {row.name}
                    </strong>
                    <div style={{ color: "#666", marginTop: "2px" }}>
                      {row.description?.slice(0, 60)}...
                    </div>
                    {row._errors.length > 0 && (
                      <ul
                        style={{
                          margin: "4px 0 0",
                          paddingLeft: "16px",
                          color: "#C62828",
                        }}
                      >
                        {row._errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setPreviewRows(formPreviewRows);
                  setActiveTab("csv");
                }}
                style={{
                  padding: "10px 20px",
                  background: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                CSV投入タブで登録する →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
