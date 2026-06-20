import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import LangToggle from "../components/ui/LangToggle";
import type { Spot } from "../types";

interface Area {
  id: string;
  name: string;
  name_en: string | null;
}
interface Category {
  id: string;
  name: string;
  name_en: string | null;
}

type SacredFilter = "all" | "sacred" | "non_sacred";

export default function SpotListPage() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");

  const [spots, setSpots] = useState<Spot[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sacredFilter, setSacredFilter] = useState<SacredFilter>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [significanceTags, setSignificanceTags] = useState<
    { id: string; name: string; name_en: string | null }[]
  >([]);
  const [spotTags, setSpotTags] = useState<
    { spot_id: string; tag_id: string }[]
  >([]);
  const [tagFilter, setTagFilter] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      const [spotsRes, areasRes, categoriesRes, tagsRes, spotTagsRes] =
        await Promise.all([
          supabase.from("spots").select("*").eq("is_published", true),
          supabase.from("areas").select("id, name, name_en").order("name"),
          supabase.from("categories").select("id, name, name_en").order("name"),
          supabase
            .from("significance_tags")
            .select("id, name, name_en, sort_order")
            .order("sort_order"),
          supabase.from("spot_significance_tags").select("spot_id, tag_id"),
        ]);
      if (spotsRes.data) setSpots(spotsRes.data);
      if (areasRes.data) setAreas(areasRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (tagsRes.data) setSignificanceTags(tagsRes.data);
      if (spotTagsRes.data) setSpotTags(spotTagsRes.data);
    };
    fetchData();
  }, []);

  useEffect(() => {
    document.title = isEn
      ? "Spot List | Zombie Land Saga Pilgrimage"
      : "スポット一覧 | ゾンビランドサガ 聖地巡礼";
  }, [isEn]);

  const sacredTagId = significanceTags.find((t) => t.name === "聖地")?.id;
  const isSpotSacred = useCallback(
    (spot: Spot): boolean => {
      if (!sacredTagId) return false;
      return spotTags.some(
        (st) => st.spot_id === spot.id && st.tag_id === sacredTagId,
      );
    },
    [spotTags, sacredTagId],
  );

  const filteredSpots = useMemo(() => {
    return spots.filter((spot) => {
      if (sacredFilter === "sacred" && !isSpotSacred(spot)) return false;
      if (sacredFilter === "non_sacred" && isSpotSacred(spot)) return false;
      if (areaFilter !== "all" && spot.area_id !== areaFilter) return false;
      if (categoryFilter !== "all" && spot.category_id !== categoryFilter)
        return false;
      if (tagFilter !== "all") {
        const hasTag = spotTags.some(
          (st) => st.spot_id === spot.id && st.tag_id === tagFilter,
        );
        if (!hasTag) return false;
      }
      return true;
    });
  }, [
    spots,
    sacredFilter,
    areaFilter,
    categoryFilter,
    tagFilter,
    spotTags,
    isSpotSacred,
  ]);

  const getAreaName = (areaId: string | null) => {
    if (!areaId) return "";
    const area = areas.find((a) => a.id === areaId);
    return isEn ? (area?.name_en ?? area?.name ?? "") : (area?.name ?? "");
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "";
    const cat = categories.find((c) => c.id === categoryId);
    return isEn ? (cat?.name_en ?? cat?.name ?? "") : (cat?.name ?? "");
  };

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <Link to="/" style={{ fontSize: "13px", color: "#666" }}>
          ← {t("route.backToMap")}
        </Link>
        <LangToggle />
      </div>

      <h1 style={{ fontSize: "22px", marginBottom: "0.5rem" }}>
        {isEn
          ? "Zombie Land Saga Pilgrimage Spots"
          : "ゾンビランドサガ 聖地・スポット一覧"}
      </h1>
      <p style={{ fontSize: "13px", color: "#999", marginBottom: "1.5rem" }}>
        {isEn
          ? "All locations featured in Zombie Land Saga, located in Saga Prefecture."
          : "佐賀県内のゾンビランドサガ聖地・関連スポットの一覧です。"}
      </p>

      {/* フィルタ */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: "4px" }}>
          {(
            [
              ["all", isEn ? "All" : "すべて"],
              ["sacred", isEn ? "Sacred only" : "聖地のみ"],
              ["non_sacred", isEn ? "Spots only" : "観光のみ"],
            ] as [SacredFilter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setSacredFilter(value)}
              style={{
                padding: "6px 12px",
                fontSize: "13px",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: sacredFilter === value ? "#2196F3" : "#ddd",
                background: sacredFilter === value ? "#E3F2FD" : "white",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          style={{
            padding: "6px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            fontSize: "13px",
          }}
        >
          <option value="all">{isEn ? "Area: All" : "エリア：すべて"}</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {isEn ? (area.name_en ?? area.name) : area.name}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: "6px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            fontSize: "13px",
          }}
        >
          <option value="all">
            {isEn ? "Category: All" : "カテゴリ：すべて"}
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {isEn ? (cat.name_en ?? cat.name) : cat.name}
            </option>
          ))}
        </select>

        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          style={{
            padding: "6px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            fontSize: "13px",
          }}
        >
          <option value="all">{isEn ? "Tag: All" : "登場度：すべて"}</option>
          {significanceTags
            .filter((t) => t.name !== "聖地")
            .map((tag) => (
              <option key={tag.id} value={tag.id}>
                {isEn ? (tag.name_en ?? tag.name) : tag.name}
              </option>
            ))}
        </select>
      </div>

      <p style={{ fontSize: "12px", color: "#999", marginBottom: "0.5rem" }}>
        {filteredSpots.length} {isEn ? "spots" : "件"}
      </p>

      {/* スポットカード一覧 */}
      <div style={{ display: "grid", gap: "10px" }}>
        {filteredSpots.map((spot) => (
          <Link
            key={spot.id}
            to={`/spots/${spot.id}`}
            style={{
              display: "block",
              padding: "14px",
              background: "white",
              border: "1px solid #eee",
              borderRadius: "10px",
              textDecoration: "none",
              color: "inherit",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontWeight: "bold",
                    fontSize: "15px",
                  }}
                >
                  {isEn ? (spot.name_en ?? spot.name) : spot.name}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    fontSize: "11px",
                    color: "#999",
                  }}
                >
                  <span>{getAreaName(spot.area_id)}</span>
                  {spot.category_id && (
                    <span>・{getCategoryName(spot.category_id)}</span>
                  )}
                </div>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  background: isSpotSacred(spot) ? "#FFEBEE" : "#E3F2FD",
                  color: isSpotSacred(spot) ? "#C62828" : "#1565C0",
                  whiteSpace: "nowrap",
                }}
              >
                {isSpotSacred(spot)
                  ? isEn
                    ? "Sacred"
                    : "聖地"
                  : isEn
                    ? "Spot"
                    : "観光"}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {filteredSpots.length === 0 && (
        <p
          style={{
            textAlign: "center",
            color: "#999",
            fontSize: "14px",
            marginTop: "2rem",
          }}
        >
          {isEn
            ? "No spots match your filters."
            : "条件に合うスポットがありません"}
        </p>
      )}
    </div>
  );
}
