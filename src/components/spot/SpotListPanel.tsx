import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Spot } from "../../types";

export type SacredFilter = "all" | "sacred" | "non_sacred";

export interface SpotFilters {
  sacredFilter: SacredFilter;
  areaFilter: string;
  categoryFilter: string;
  characterFilter: string;
}

interface Props {
  spots: Spot[];
  filteredSpots: Spot[];
  checkedInSpots: Set<string>;
  areas: { id: string; name: string; name_en: string | null }[];
  categories: { id: string; name: string; name_en: string | null }[];
  characters: { id: string; name: string; name_en: string | null }[];
  filters: SpotFilters;
  onFiltersChange: (filters: SpotFilters) => void;
  onSpotClick: (spot: Spot) => void;
  onOpenChange: (isOpen: boolean) => void;
}

export default function SpotListPanel({
  filteredSpots,
  checkedInSpots,
  areas,
  categories,
  characters,
  filters,
  onFiltersChange,
  onSpotClick,
  onOpenChange,
}: Props) {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");

  const [isOpen, setIsOpen] = useState(false);

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
    <>
      <button
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          onOpenChange(next);
        }}
        style={{
          position: "absolute",
          top: 16,
          left: isOpen ? 270 : 10,
          zIndex: 2,
          padding: "8px 14px",
          borderRadius: "8px",
          border: "none",
          background: "#fff",
          cursor: "pointer",
          fontWeight: "bold",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          fontSize: "13px",
        }}
      >
        {isOpen ? "✕" : "📋 一覧"}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 1,
            width: "300px",
            height: "100vh",
            background: "white",
            boxShadow: "2px 0 8px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "16px", borderBottom: "1px solid #eee" }}>
            <p
              style={{
                margin: "0 0 12px",
                fontWeight: "bold",
                fontSize: "15px",
              }}
            >
              スポット一覧（{filteredSpots.length}件）
            </p>

            <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
              {(
                [
                  ["all", "すべて"],
                  ["sacred", "聖地のみ"],
                  ["non_sacred", "非聖地のみ"],
                ] as [SacredFilter, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() =>
                    onFiltersChange({ ...filters, sacredFilter: value })
                  }
                  style={{
                    flex: 1,
                    padding: "4px 0",
                    fontSize: "11px",
                    borderRadius: "6px",
                    border: "1px solid",
                    borderColor:
                      filters.sacredFilter === value ? "#2196F3" : "#ddd",
                    background:
                      filters.sacredFilter === value ? "#E3F2FD" : "white",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <select
              value={filters.areaFilter}
              onChange={(e) =>
                onFiltersChange({ ...filters, areaFilter: e.target.value })
              }
              style={{
                width: "100%",
                padding: "6px",
                marginBottom: "6px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                fontSize: "13px",
              }}
            >
              <option value="all">エリア：すべて</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {isEn ? (area.name_en ?? area.name) : area.name}
                </option>
              ))}
            </select>

            <select
              value={filters.categoryFilter}
              onChange={(e) =>
                onFiltersChange({ ...filters, categoryFilter: e.target.value })
              }
              style={{
                width: "100%",
                padding: "6px",
                marginBottom: "6px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                fontSize: "13px",
              }}
            >
              <option value="all">カテゴリ：すべて</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {isEn ? (cat.name_en ?? cat.name) : cat.name}
                </option>
              ))}
            </select>

            <select
              value={filters.characterFilter}
              onChange={(e) =>
                onFiltersChange({ ...filters, characterFilter: e.target.value })
              }
              style={{
                width: "100%",
                padding: "6px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                fontSize: "13px",
              }}
            >
              <option value="all">キャラクター：すべて</option>
              {characters.map((char) => (
                <option key={char.id} value={char.id}>
                  {isEn ? (char.name_en ?? char.name) : char.name}
                </option>
              ))}
            </select>

            {/* リセットボタン */}
            {(filters.sacredFilter !== "all" ||
              filters.areaFilter !== "all" ||
              filters.categoryFilter !== "all" ||
              filters.characterFilter !== "all") && (
              <button
                onClick={() =>
                  onFiltersChange({
                    sacredFilter: "all",
                    areaFilter: "all",
                    categoryFilter: "all",
                    characterFilter: "all",
                  })
                }
                style={{
                  width: "100%",
                  marginTop: "6px",
                  padding: "6px",
                  fontSize: "12px",
                  borderRadius: "6px",
                  border: "1px solid #f44336",
                  background: "white",
                  color: "#f44336",
                  cursor: "pointer",
                }}
              >
                🔄 フィルタをリセット
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredSpots.map((spot) => (
              <div
                key={spot.id}
                onClick={() => {
                  onSpotClick(spot);
                  setIsOpen(false);
                  onOpenChange(false);
                }}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #f0f0f0",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f5f5f5")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "white")
                }
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "2px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: "bold",
                        fontSize: "14px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isEn ? (spot.name_en ?? spot.name) : spot.name}
                    </span>
                    {checkedInSpots.has(spot.id) && (
                      <span
                        style={{
                          fontSize: "12px",
                          background: "#E8F5E9",
                          color: "#2E7D32",
                          padding: "1px 6px",
                          borderRadius: "10px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ✅ 訪問済
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#999",
                      display: "flex",
                      gap: "6px",
                    }}
                  >
                    <span>{getAreaName(spot.area_id)}</span>
                    {spot.category_id && (
                      <span>・{getCategoryName(spot.category_id)}</span>
                    )}
                    <span>・{spot.is_sacred ? "聖地" : "観光"}</span>
                  </div>
                </div>
              </div>
            ))}
            {filteredSpots.length === 0 && (
              <p
                style={{
                  padding: "16px",
                  color: "#999",
                  fontSize: "13px",
                  textAlign: "center",
                }}
              >
                条件に合うスポットがありません
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
