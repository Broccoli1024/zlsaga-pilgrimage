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
          supabase
            .from("categories")
            .select("id, name, name_en")
            .order("sort_order"),
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
      ? "Spot List | Pilgrimage App"
      : "スポット一覧 | 聖地巡礼アプリ";
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

  const selectStyle = {
    padding: "7px 10px",
    borderRadius: "var(--radius-sm)",
    border: "0.5px solid var(--color-border)",
    background: "var(--color-card)",
    color: "var(--color-text-main)",
    fontSize: "var(--font-size-sm)",
    outline: "none",
  };

  const toggleBtnStyle = (active: boolean) => ({
    padding: "6px 12px",
    fontSize: "var(--font-size-sm)",
    borderRadius: "var(--radius-sm)",
    border: active
      ? "0.5px solid var(--color-primary)"
      : "0.5px solid var(--color-border)",
    background: active ? "var(--color-primary-light)" : "var(--color-card)",
    color: active ? "var(--color-primary)" : "var(--color-text-sub)",
    cursor: "pointer",
    fontWeight: active ? "500" : "normal",
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "var(--space-xl) var(--space-lg)",
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--space-xl)",
          }}
        >
          <Link
            to="/"
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
              textDecoration: "none",
            }}
          >
            ← {t("route.backToMap")}
          </Link>
          <LangToggle />
        </div>

        <div
          style={{
            borderLeft: "3px solid var(--color-primary)",
            paddingLeft: "var(--space-md)",
            marginBottom: "var(--space-sm)",
          }}
        >
          <h1
            style={{
              margin: "0 0 4px",
              fontSize: "var(--font-size-xl)",
              fontWeight: "500",
              color: "var(--color-text-main)",
            }}
          >
            {isEn ? "Pilgrimage Spots" : "聖地・スポット一覧"}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
            }}
          >
            {isEn
              ? "All locations featured in the series."
              : "佐賀県内の聖地・関連スポットの一覧です。"}
          </p>
        </div>

        {/* フィルタ */}
        <div
          style={{
            background: "var(--color-card)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-sm)",
            padding: "var(--space-md) var(--space-lg)",
            marginBottom: "var(--space-lg)",
            borderTop: "2px solid var(--color-primary)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginBottom: "var(--space-sm)",
              flexWrap: "wrap",
            }}
          >
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
                style={toggleBtnStyle(sacredFilter === value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: "var(--space-sm)",
              flexWrap: "wrap",
            }}
          >
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="all">
                {isEn ? "Area: All" : "エリア：すべて"}
              </option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {isEn ? (area.name_en ?? area.name) : area.name}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={selectStyle}
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
              style={selectStyle}
            >
              <option value="all">
                {isEn ? "Tag: All" : "登場度：すべて"}
              </option>
              {significanceTags
                .filter((t) => t.name !== "聖地")
                .map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {isEn ? (tag.name_en ?? tag.name) : tag.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <p
          style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-muted)",
            marginBottom: "var(--space-sm)",
          }}
        >
          {filteredSpots.length} {isEn ? "spots" : "件"}
        </p>

        {/* スポットカード一覧 */}
        <div style={{ display: "grid", gap: "var(--space-sm)" }}>
          {filteredSpots.map((spot) => (
            <Link
              key={spot.id}
              to={`/spots/${spot.id}`}
              style={{
                display: "block",
                background: "var(--color-card)",
                borderRadius: "var(--radius-md)",
                borderLeft:
                  "3px solid " +
                  (isSpotSacred(spot)
                    ? "var(--color-primary)"
                    : "var(--color-border)"),
                padding: "var(--space-md) var(--space-lg)",
                textDecoration: "none",
                color: "inherit",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontWeight: "500",
                      fontSize: "var(--font-size-md)",
                      color: "var(--color-text-main)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isEn ? (spot.name_en ?? spot.name) : spot.name}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: "4px",
                      fontSize: "var(--font-size-xs)",
                      color: "var(--color-text-muted)",
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
                    fontSize: "var(--font-size-xs)",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-sm)",
                    whiteSpace: "nowrap",
                    marginLeft: "var(--space-sm)",
                    background: isSpotSacred(spot)
                      ? "var(--color-primary-light)"
                      : "var(--color-bg)",
                    color: isSpotSacred(spot)
                      ? "var(--color-primary)"
                      : "var(--color-text-sub)",
                    border: `0.5px solid ${isSpotSacred(spot) ? "var(--color-primary)" : "var(--color-border)"}`,
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
              color: "var(--color-text-muted)",
              fontSize: "var(--font-size-sm)",
              marginTop: "var(--space-xl)",
            }}
          >
            {isEn
              ? "No spots match your filters."
              : "条件に合うスポットがありません"}
          </p>
        )}
      </div>
    </div>
  );
}
