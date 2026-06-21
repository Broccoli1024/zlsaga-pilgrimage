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

interface FormPreviewRow extends PreviewRow {
  is_sacred: boolean;
  episode_ids: string[];
}

export default function AdminPage() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<"csv" | "forms" | "manage">("csv");

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
  const [formPreviewRows, setFormPreviewRows] = useState<FormPreviewRow[]>([]);
  const [manageSpots, setManageSpots] = useState<any[]>([]);
  const [manageSpotTags, setManageSpotTags] = useState<
    { spot_id: string; tag_id: string }[]
  >([]);
  const [loadingManage, setLoadingManage] = useState(false);
  const [editingSpotId, setEditingSpotId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [editTagIds, setEditTagIds] = useState<string[]>([]);
  const [editCharacterIds, setEditCharacterIds] = useState<string[]>([]);
  const [manageSpotCharacters, setManageSpotCharacters] = useState<
    { spot_id: string; character_id: string }[]
  >([]);
  const [manageCharacters, setManageCharacters] = useState<
    { id: string; name: string; name_en: string | null }[]
  >([]);
  const [editEpisodeIds, setEditEpisodeIds] = useState<string[]>([]);
  const [manageSpotEpisodes, setManageSpotEpisodes] = useState<
    { spot_id: string; episode_id: string }[]
  >([]);
  const [manageEpisodes, setManageEpisodes] = useState<
    {
      id: string;
      media_type: string;
      season: number;
      episode_number: number;
      title: string;
    }[]
  >([]);

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email);

  const loadMasters = async () => {
    const [areasRes, categoriesRes, tagsRes] = await Promise.all([
      supabase.from("areas").select("id, name").eq("work_id", WORK_ID),
      supabase.from("categories").select("id, name").order("sort_order"),
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
    console.log("送信ペイロード:", JSON.stringify(payload, null, 2));

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

  const handleImportFormRows = async () => {
    console.log("handleImportFormRows 開始");
    const validRows = formPreviewRows.filter((r) => r._errors.length === 0);
    console.log("validRows:", validRows);
    if (validRows.length === 0) {
      setFormError("登録可能な行がありません");
      return;
    }
    setLoadingForms(true);
    setFormError(null);

    // 全キャラクターIDを取得（聖地の場合の自動付与用）
    const { data: allCharacters } = await supabase
      .from("characters")
      .select("id");
    const allCharacterIds = (allCharacters ?? []).map((c) => c.id);

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
        is_published: false, // フォーム経由は確認後に手動で公開
        tag_ids: tagIds,
        character_ids: row.is_sacred ? allCharacterIds : [],
        episode_ids: row.episode_ids,
      };
    });

    console.log("送信ペイロード:", JSON.stringify(payload, null, 2));

    const { data, error } = await supabase.functions.invoke("insert-spot", {
      body: { rows: payload },
    });

    console.log("レスポンス:", data, error);

    if (error) {
      setFormError(`登録エラー: ${error.message}`);
      setLoadingForms(false);
      return;
    }

    setResultMessage(
      `フォームからの登録完了：成功 ${data.successCount}件 / 失敗 ${data.failCount}件`,
    );
    if (data.failedDetails?.length > 0) {
      console.error("登録失敗の詳細:", data.failedDetails);
    }
    setFormPreviewRows([]);
    setActiveTab("csv");
    setLoadingForms(false);
  };

  const handleLoadManageSpots = async () => {
    setLoadingManage(true);
    await loadMasters();
    const { data, error } = await supabase.functions.invoke("manage-spot", {
      body: { action: "list" },
    });
    if (error || data?.error) {
      console.error("一覧取得エラー:", error || data?.error);
      setLoadingManage(false);
      return;
    }
    setManageSpots(data.spots);
    setManageSpotTags(data.spotTags);

    const { data: spotChars } = await supabase
      .from("spot_characters")
      .select("spot_id, character_id");
    setManageSpotCharacters(spotChars ?? []);

    const { data: charsData } = await supabase
      .from("characters")
      .select("id, name, name_en")
      .order("sort_order");
    setManageCharacters(charsData ?? []);

    const { data: spotEps } = await supabase
      .from("spot_episodes")
      .select("spot_id, episode_id");
    setManageSpotEpisodes(spotEps ?? []);

    const { data: episodesData } = await supabase
      .from("episodes")
      .select("id, media_type, season, episode_number, title")
      .order("media_type")
      .order("season")
      .order("episode_number");
    setManageEpisodes(episodesData ?? []);

    setLoadingManage(false);
  };

  const handleDeleteSpot = async (spotId: string, name: string) => {
    if (
      !window.confirm(`「${name}」を削除しますか？\nこの操作は取り消せません。`)
    )
      return;
    const { data, error } = await supabase.functions.invoke("manage-spot", {
      body: { action: "delete", spotId },
    });
    if (error || data?.error) {
      alert(`削除に失敗しました: ${error?.message || data?.error}`);
      return;
    }
    setManageSpots((prev) => prev.filter((s) => s.id !== spotId));
  };

  const episodeLabel = (ep: {
    media_type: string;
    season: number;
    episode_number: number;
    title: string;
  }) => {
    const seasonName =
      ep.media_type === "movie"
        ? "劇場版"
        : ep.season === 1
          ? "無印"
          : ep.season === 2
            ? "リベンジ"
            : `S${ep.season}`;
    const epNum = ep.media_type === "movie" ? "" : ` 第${ep.episode_number}話`;
    return `${seasonName}${epNum}：${ep.title}`;
  };

  const startEdit = (spot: any) => {
    setEditingSpotId(spot.id);
    setEditForm({ ...spot });
    setEditTagIds(
      manageSpotTags.filter((t) => t.spot_id === spot.id).map((t) => t.tag_id),
    );
    setEditCharacterIds(
      manageSpotCharacters
        .filter((c) => c.spot_id === spot.id)
        .map((c) => c.character_id),
    );
    setEditEpisodeIds(
      manageSpotEpisodes
        .filter((e) => e.spot_id === spot.id)
        .map((e) => e.episode_id),
    );
  };

  const cancelEdit = () => {
    setEditingSpotId(null);
    setEditForm({});
    setEditTagIds([]);
    setEditCharacterIds([]);
    setEditEpisodeIds([]);
  };

  const saveEdit = async () => {
    if (!editingSpotId) return;
    const { data, error } = await supabase.functions.invoke("manage-spot", {
      body: {
        action: "update",
        spotId: editingSpotId,
        updates: {
          name: editForm.name,
          name_en: editForm.name_en || null,
          lat: Number(editForm.lat),
          lng: Number(editForm.lng),
          area_id: editForm.area_id || null,
          category_id: editForm.category_id || null,
          description: editForm.description || null,
          duration_min: editForm.duration_min
            ? Number(editForm.duration_min)
            : null,
          is_published: !!editForm.is_published,
        },
        tagIds: editTagIds,
      },
    });
    if (error || data?.error) {
      alert(`更新に失敗しました: ${error?.message || data?.error}`);
      return;
    }

    // キャラクターの更新（一旦全削除して再登録）
    await supabase
      .from("spot_characters")
      .delete()
      .eq("spot_id", editingSpotId);
    if (editCharacterIds.length > 0) {
      await supabase.from("spot_characters").insert(
        editCharacterIds.map((characterId) => ({
          spot_id: editingSpotId,
          character_id: characterId,
        })),
      );
    }
    // エピソードの更新（一旦全削除して再登録）
    await supabase.from("spot_episodes").delete().eq("spot_id", editingSpotId);
    if (editEpisodeIds.length > 0) {
      await supabase.from("spot_episodes").insert(
        editEpisodeIds.map((episodeId) => ({
          spot_id: editingSpotId,
          episode_id: episodeId,
        })),
      );
    }

    await handleLoadManageSpots();
    cancelEdit();
  };

  const handleFetchFormResponses = async () => {
    setLoadingForms(true);
    setFormError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const { data, error } = await supabase.functions.invoke(
      "fetch-form-responses",
    );

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

    const { loadedCategories, loadedTags } = await loadMasters();

    // エピソードマスタも取得
    const { data: episodesData } = await supabase
      .from("episodes")
      .select("id, media_type, season, episode_number");

    const otherCategoryId =
      loadedCategories.find((c) => c.name === "その他")?.id ?? null;

    // 重複列（聖地用・非聖地用で同名の質問）から値を取得するヘルパー
    const getFirstNonEmpty = (
      record: Record<string, string>,
      key: string,
    ): string => {
      const values = Object.entries(record)
        .filter(([k]) => k === key || k.startsWith(`${key}__`))
        .map(([, v]) => v)
        .filter((v) => v && v.trim() !== "");
      return values[0] ?? "";
    };

    // 「無印 第3話」「リベンジ 第5話」「劇場版」のような文字列からepisode_idを解決
    const parseEpisodeText = (text: string): string[] => {
      if (!text || !episodesData) return [];
      const ids: string[] = [];
      const parts = text
        .split(/[,、;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      parts.forEach((part) => {
        if (part.includes("劇場版")) {
          const movieEp = episodesData.find((e) => e.media_type === "movie");
          if (movieEp) ids.push(movieEp.id);
          return;
        }
        const seasonMatch = part.includes("リベンジ")
          ? 2
          : part.includes("無印")
            ? 1
            : null;
        const epNumMatch = part.match(/(\d+)\s*話/);
        if (seasonMatch && epNumMatch) {
          const epNum = Number(epNumMatch[1]);
          const ep = episodesData.find(
            (e) =>
              e.media_type === "tv" &&
              e.season === seasonMatch &&
              e.episode_number === epNum,
          );
          if (ep) ids.push(ep.id);
        }
      });
      return ids;
    };

    const rows: FormPreviewRow[] = data.records.map(
      (record: Record<string, string>, i: number) => {
        const errors: string[] = [];

        const isSacredAnswer = record["作中に登場しましたか"] || "";
        const isSacred = isSacredAnswer.trim() === "はい";

        const name = getFirstNonEmpty(record, "スポット名");
        const mapUrl = getFirstNonEmpty(record, "Googleマップ共有URL");
        const areaName = getFirstNonEmpty(record, "エリア(市町村)");
        const categoryNameRaw = getFirstNonEmpty(record, "カテゴリ");
        const description =
          getFirstNonEmpty(record, "説明・登場シーンなど") ||
          getFirstNonEmpty(record, "スポットの説明");
        const tagsRaw =
          getFirstNonEmpty(record, "タグ ") || getFirstNonEmpty(record, "タグ");
        const episodeTextRaw = getFirstNonEmpty(record, "該当エピソード");
        const durationKey = Object.keys(record).find((k) =>
          k.includes("滞在目安時間"),
        );
        const durationText = durationKey
          ? getFirstNonEmpty(record, durationKey)
          : "";
        const note = getFirstNonEmpty(record, "備考");

        const lat = record["_lat"] || "";
        const lng = record["_lng"] || "";

        if (!name) errors.push("スポット名が空です");
        if (!mapUrl) errors.push("Googleマップ共有URLが空です");
        if (!lat || !lng) errors.push("URLから緯度経度を抽出できません");

        // カテゴリのフォールバック（マスタになければ「その他」）
        let categoryName = categoryNameRaw;
        const categoryExists = loadedCategories.some(
          (c) => c.name === categoryNameRaw,
        );
        if (categoryNameRaw && !categoryExists) {
          categoryName = "その他";
        }
        if (!categoryName && otherCategoryId) {
          categoryName = "その他";
        }

        // タグ名の解析（複数選択はカンマ区切りで返ってくる）
        const tagNames = tagsRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        tagNames.forEach((tn) => {
          if (!loadedTags.some((t) => t.name === tn)) {
            errors.push(`タグ「${tn}」が見つかりません`);
          }
        });

        // エリアのバリデーション（エリアはareasマスタとの一致確認のみ、フォールバックなし）
        // ※ areasは別途masters取得が必要なため、ここではareaFilterの存在確認のみ実施想定
        // （loadMastersで取得したareasはAdminPage側のstateにあるためチェック対象外にする場合あり）

        const episodeIds = isSacred ? parseEpisodeText(episodeTextRaw) : [];
        console.log("durationText:", durationText, "record全体:", record);

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
          duration_min: durationText, // ← 変更
          nearest_station_name: "",
          nearest_station_walk_min: "",
          nearest_bus_stop_name: "",
          nearest_bus_stop_walk_min: "",
          access_notes: note,
          is_published: "false",
          tags: tagNames.join(";") + (isSacred ? ";聖地" : ""),
          is_sacred: isSacred,
          episode_ids: episodeIds,
          _rowIndex: i + 1,
          _errors: errors,
        };
      },
    );

    console.log("プレビューデータ:", rows);
    setFormPreviewRows(rows);

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
            ["manage", "🛠️ スポット管理"],
          ] as [typeof activeTab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              if (key === "manage" && manageSpots.length === 0)
                handleLoadManageSpots();
            }}
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
                onClick={handleImportFormRows}
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
                登録する
              </button>
            </div>
          )}
        </div>
      )}
      {activeTab === "manage" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <p style={{ fontSize: "13px", color: "#666" }}>
              登録済みスポット：{manageSpots.length}件
            </p>
            <button
              onClick={handleLoadManageSpots}
              disabled={loadingManage}
              style={{
                padding: "4px 12px",
                fontSize: "12px",
                border: "1px solid #2196F3",
                background: "white",
                color: "#2196F3",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {loadingManage ? "読み込み中..." : "🔄 再読み込み"}
            </button>
          </div>

          <div style={{ maxHeight: "600px", overflowY: "auto" }}>
            {manageSpots.map((spot) => (
              <div
                key={spot.id}
                style={{
                  padding: "12px",
                  marginBottom: "6px",
                  background: "white",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                }}
              >
                {editingSpotId === spot.id ? (
                  <div>
                    <input
                      value={editForm.name ?? ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      placeholder="スポット名"
                      style={{
                        width: "100%",
                        padding: "6px",
                        marginBottom: "6px",
                        fontSize: "13px",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        marginBottom: "6px",
                      }}
                    >
                      <input
                        value={editForm.lat ?? ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, lat: e.target.value })
                        }
                        placeholder="緯度"
                        style={{ flex: 1, padding: "6px", fontSize: "13px" }}
                      />
                      <input
                        value={editForm.lng ?? ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, lng: e.target.value })
                        }
                        placeholder="経度"
                        style={{ flex: 1, padding: "6px", fontSize: "13px" }}
                      />
                    </div>
                    <select
                      value={editForm.area_id ?? ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, area_id: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "6px",
                        marginBottom: "6px",
                        fontSize: "13px",
                      }}
                    >
                      <option value="">エリアなし</option>
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={editForm.category_id ?? ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          category_id: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "6px",
                        marginBottom: "6px",
                        fontSize: "13px",
                      }}
                    >
                      <option value="">カテゴリなし</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={editForm.description ?? ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="説明"
                      style={{
                        width: "100%",
                        padding: "6px",
                        marginBottom: "6px",
                        fontSize: "13px",
                        minHeight: "60px",
                      }}
                    />
                    <input
                      type="number"
                      value={editForm.duration_min ?? ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          duration_min: e.target.value,
                        })
                      }
                      placeholder="滞在目安時間（分）"
                      style={{
                        width: "100%",
                        padding: "6px",
                        marginBottom: "6px",
                        fontSize: "13px",
                      }}
                    />

                    <div style={{ marginBottom: "6px" }}>
                      <p style={{ fontSize: "12px", marginBottom: "4px" }}>
                        登場キャラクター:
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                        }}
                      >
                        {manageCharacters.map((char) => (
                          <label
                            key={char.id}
                            style={{
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={editCharacterIds.includes(char.id)}
                              onChange={(e) => {
                                if (e.target.checked)
                                  setEditCharacterIds([
                                    ...editCharacterIds,
                                    char.id,
                                  ]);
                                else
                                  setEditCharacterIds(
                                    editCharacterIds.filter(
                                      (id) => id !== char.id,
                                    ),
                                  );
                              }}
                            />
                            {char.name}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: "6px" }}>
                      <p style={{ fontSize: "12px", marginBottom: "4px" }}>
                        登場エピソード:
                      </p>
                      <div
                        style={{
                          maxHeight: "150px",
                          overflowY: "auto",
                          border: "1px solid #eee",
                          borderRadius: "6px",
                          padding: "6px",
                        }}
                      >
                        {manageEpisodes.map((ep) => (
                          <label
                            key={ep.id}
                            style={{
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              marginBottom: "2px",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={editEpisodeIds.includes(ep.id)}
                              onChange={(e) => {
                                if (e.target.checked)
                                  setEditEpisodeIds([...editEpisodeIds, ep.id]);
                                else
                                  setEditEpisodeIds(
                                    editEpisodeIds.filter((id) => id !== ep.id),
                                  );
                              }}
                            />
                            {episodeLabel(ep)}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: "6px" }}>
                      <p style={{ fontSize: "12px", marginBottom: "4px" }}>
                        タグ:
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                        }}
                      >
                        {tags.map((tag) => (
                          <label
                            key={tag.id}
                            style={{
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={editTagIds.includes(tag.id)}
                              onChange={(e) => {
                                if (e.target.checked)
                                  setEditTagIds([...editTagIds, tag.id]);
                                else
                                  setEditTagIds(
                                    editTagIds.filter((id) => id !== tag.id),
                                  );
                              }}
                            />
                            {tag.name}
                          </label>
                        ))}
                      </div>
                    </div>
                    <label
                      style={{
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        marginBottom: "8px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!!editForm.is_published}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            is_published: e.target.checked,
                          })
                        }
                      />
                      公開する
                    </label>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={saveEdit}
                        style={{
                          flex: 1,
                          padding: "6px",
                          background: "#4CAF50",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
                      >
                        保存
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          flex: 1,
                          padding: "6px",
                          background: "white",
                          border: "1px solid #ddd",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontWeight: "bold",
                          fontSize: "14px",
                        }}
                      >
                        {spot.name}
                        {!spot.is_published && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#f44336",
                              marginLeft: "6px",
                            }}
                          >
                            （非公開）
                          </span>
                        )}
                      </p>
                      <p style={{ margin: 0, fontSize: "11px", color: "#999" }}>
                        {areas.find((a) => a.id === spot.area_id)?.name ??
                          "エリア未設定"}{" "}
                        ・
                        {categories.find((c) => c.id === spot.category_id)
                          ?.name ?? "カテゴリ未設定"}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => startEdit(spot)}
                        style={{
                          padding: "4px 10px",
                          fontSize: "12px",
                          border: "1px solid #2196F3",
                          background: "white",
                          color: "#2196F3",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteSpot(spot.id, spot.name)}
                        style={{
                          padding: "4px 10px",
                          fontSize: "12px",
                          border: "1px solid #f44336",
                          background: "white",
                          color: "#f44336",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
