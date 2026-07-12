import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Spot } from "../../types";
import BottomSheet from "../ui/BottomSheet";
import type { SnapPoint } from "../ui/BottomSheet";
import { useIsMobile } from "../../hooks/useIsMobile";

export type SacredFilter = "all" | "sacred" | "non_sacred";
export type CheckinFilter = "all" | "visited" | "not_visited";

export interface SpotFilters {
  sacredFilter: SacredFilter;
  areaFilter: string;
  categoryFilter: string;
  characterFilter: string;
  tagFilter: string;
  checkinFilter: CheckinFilter;
  favoriteOnly: boolean;
  searchQuery: string;
}

interface Props {
  spots: Spot[];
  filteredSpots: Spot[];
  checkedInSpotsMap: Record<string, boolean>;
  areas: { id: string; name: string; name_en: string | null }[];
  categories: { id: string; name: string; name_en: string | null }[];
  characters: { id: string; name: string; name_en: string | null }[];
  significanceTags: { id: string; name: string; name_en: string | null }[];
  filters: SpotFilters;
  onFiltersChange: (filters: SpotFilters) => void;
  onSpotClick: (spot: Spot) => void;
  onOpenChange: (isOpen: boolean) => void;
  isSpotSacred: (spot: Spot) => boolean;
}

const PANEL_WIDTH = 300;

export default function SpotListPanel({
  filteredSpots,
  checkedInSpotsMap,
  areas,
  categories,
  characters,
  significanceTags,
  filters,
  onFiltersChange,
  onSpotClick,
  onOpenChange,
  isSpotSacred,
}: Props) {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const [snap, setSnap] = useState<SnapPoint>("mid");

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

  const hasActiveFilter =
    filters.sacredFilter !== "all" ||
    filters.areaFilter !== "all" ||
    filters.categoryFilter !== "all" ||
    filters.characterFilter !== "all" ||
    filters.tagFilter !== "all" ||
    filters.checkinFilter !== "all" ||
    filters.favoriteOnly ||
    filters.searchQuery !== "";

  const selectStyle = {
    width: "100%",
    padding: "7px 10px",
    marginBottom: "6px",
    borderRadius: "var(--radius-sm)",
    border: "0.5px solid var(--color-border)",
    background: "var(--color-card)",
    color: "var(--color-text-main)",
    fontSize: "var(--font-size-sm)",
    outline: "none",
  };

  const toggleBtnStyle = (active: boolean) => ({
    flex: 1,
    padding: "5px 0",
    fontSize: "var(--font-size-xs)",
    borderRadius: "var(--radius-sm)",
    border: active
      ? "0.5px solid var(--color-primary)"
      : "0.5px solid var(--color-border)",
    background: active ? "var(--color-primary-light)" : "var(--color-card)",
    color: active ? "var(--color-primary)" : "var(--color-text-sub)",
    cursor: "pointer",
    fontWeight: active ? "500" : "normal",
  });

  const filterSection = (
    <div
      style={{
        padding: "var(--space-lg)",
        borderBottom: "2px solid var(--color-primary)",
        background: "var(--color-card)",
      }}
    >
      <p
        style={{
          margin: "0 0 var(--space-md)",
          fontWeight: "500",
          fontSize: "var(--font-size-md)",
          color: "var(--color-text-main)",
        }}
      >
        {t("list.spotList")}
        <span
          style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-muted)",
            marginLeft: "8px",
            fontWeight: "normal",
          }}
        >
          {t("list.count", { count: filteredSpots.length })}
        </span>
      </p>

      {/* 検索 */}
      <input
        type="text"
        value={filters.searchQuery}
        onChange={(e) =>
          onFiltersChange({ ...filters, searchQuery: e.target.value })
        }
        placeholder={t("list.search")}
        style={{
          ...selectStyle,
          marginBottom: "var(--space-sm)",
        }}
      />

      {/* 聖地フィルタ */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "var(--space-sm)",
        }}
      >
        {(
          [
            ["all", t("list.all")],
            ["sacred", t("list.sacredOnly")],
            ["non_sacred", t("list.nonSacredOnly")],
          ] as [SacredFilter, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => onFiltersChange({ ...filters, sacredFilter: value })}
            style={toggleBtnStyle(filters.sacredFilter === value)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* エリア・カテゴリ・キャラクター・登場度 */}
      <select
        value={filters.areaFilter}
        onChange={(e) =>
          onFiltersChange({ ...filters, areaFilter: e.target.value })
        }
        style={selectStyle}
      >
        <option value="all">{t("list.areaAll")}</option>
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
        style={selectStyle}
      >
        <option value="all">{t("list.categoryAll")}</option>
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
        style={selectStyle}
      >
        <option value="all">{t("list.characterAll")}</option>
        {characters.map((char) => (
          <option key={char.id} value={char.id}>
            {isEn ? (char.name_en ?? char.name) : char.name}
          </option>
        ))}
      </select>

      <select
        value={filters.tagFilter}
        onChange={(e) =>
          onFiltersChange({ ...filters, tagFilter: e.target.value })
        }
        style={{ ...selectStyle, marginBottom: "var(--space-sm)" }}
      >
        <option value="all">{t("list.tagAll")}</option>
        {significanceTags
          .filter((t) => t.name !== "聖地")
          .map((tag) => (
            <option key={tag.id} value={tag.id}>
              {isEn ? (tag.name_en ?? tag.name) : tag.name}
            </option>
          ))}
      </select>

      {/* チェックイン状態 */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "var(--space-sm)",
        }}
      >
        {(
          [
            ["all", t("list.all")],
            ["visited", t("list.visited")],
            ["not_visited", t("list.notVisited")],
          ] as [CheckinFilter, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() =>
              onFiltersChange({ ...filters, checkinFilter: value })
            }
            style={toggleBtnStyle(filters.checkinFilter === value)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* お気に入り */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-sub)",
          cursor: "pointer",
          marginBottom: "var(--space-xs)",
        }}
      >
        <input
          type="checkbox"
          checked={filters.favoriteOnly}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              favoriteOnly: e.target.checked,
            })
          }
        />
        {t("list.favoriteOnly")}
      </label>

      {/* リセット */}
      {hasActiveFilter && (
        <button
          onClick={() =>
            onFiltersChange({
              sacredFilter: "all",
              areaFilter: "all",
              categoryFilter: "all",
              characterFilter: "all",
              tagFilter: "all",
              checkinFilter: "all",
              favoriteOnly: false,
              searchQuery: "",
            })
          }
          style={{
            width: "100%",
            marginTop: "var(--space-xs)",
            padding: "6px",
            fontSize: "var(--font-size-xs)",
            borderRadius: "var(--radius-sm)",
            border: "0.5px solid var(--color-primary)",
            background: "var(--color-card)",
            color: "var(--color-primary)",
            cursor: "pointer",
          }}
        >
          {t("list.resetFilter")}
        </button>
      )}
    </div>
  );

  const listSection = (
    <div style={{ flex: 1, overflowY: "auto" }}>
      {filteredSpots.length === 0 && (
        <p
          style={{
            padding: "var(--space-lg)",
            color: "var(--color-text-muted)",
            fontSize: "var(--font-size-sm)",
            textAlign: "center",
          }}
        >
          {t("list.noResults")}
        </p>
      )}
      {filteredSpots.map((spot) => (
        <div
          key={spot.id}
          onClick={() => {
            onSpotClick(spot);
            setIsOpen(false);
            onOpenChange(false);
          }}
          style={{
            padding: "var(--space-md) var(--space-lg)",
            borderBottom: "0.5px solid var(--color-border-light)",
            cursor: "pointer",
            background: "var(--color-card)",
            transition: "background 0.1s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--color-primary-light)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--color-card)")
          }
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            {/* アクセントライン */}
            <div
              style={{
                width: "2px",
                minHeight: "36px",
                background: isSpotSacred(spot)
                  ? "var(--color-primary)"
                  : "var(--color-border)",
                borderRadius: "1px",
                flexShrink: 0,
                marginTop: "2px",
              }}
            />
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
                    fontWeight: "500",
                    fontSize: "var(--font-size-md)",
                    color: "var(--color-text-main)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isEn ? (spot.name_en ?? spot.name) : spot.name}
                </span>
                {spot.id in checkedInSpotsMap && (
                  <span
                    style={{
                      fontSize: "var(--font-size-xs)",
                      background: checkedInSpotsMap[spot.id]
                        ? "var(--color-warning-light)"
                        : "var(--color-success-light)",
                      color: checkedInSpotsMap[spot.id]
                        ? "var(--color-warning)"
                        : "var(--color-success)",
                      padding: "1px 6px",
                      borderRadius: "var(--radius-sm)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {checkedInSpotsMap[spot.id] ? "⭐" : "✅"}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-text-muted)",
                  display: "flex",
                  gap: "4px",
                }}
              >
                <span>{getAreaName(spot.area_id)}</span>
                {spot.category_id && (
                  <span>・{getCategoryName(spot.category_id)}</span>
                )}
                <span>
                  ・
                  {isSpotSacred(spot) ? t("list.sacred") : t("list.nonSacred")}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    onOpenChange(next);
    if (next) setSnap("mid");
  };

  if (isMobile) {
    return (
      <>
        {!isOpen && (
          <button
            onClick={handleToggle}
            style={{
              position: "absolute",
              top: 16,
              left: 10,
              zIndex: 3,
              padding: "8px 14px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: "var(--color-card)",
              color: "var(--color-text-main)",
              cursor: "pointer",
              fontWeight: "500",
              boxShadow: "var(--shadow-md)",
              fontSize: "var(--font-size-sm)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {t("list.open")}
            {hasActiveFilter && (
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--color-primary)",
                  display: "inline-block",
                }}
              />
            )}
          </button>
        )}

        <BottomSheet
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            onOpenChange(false);
          }}
          snap={snap}
          onSnapChange={setSnap}
          heights={{ min: 20, mid: 53, full: 92 }}
          zIndex={4}
          header={
            <div style={{ position: "relative" }}>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenChange(false);
                }}
                style={{
                  position: "absolute",
                  top: "var(--space-md)",
                  right: "var(--space-md)",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: "0.5px solid var(--color-border)",
                  background: "var(--color-card)",
                  color: "var(--color-text-sub)",
                  fontSize: "var(--font-size-xs)",
                  cursor: "pointer",
                  zIndex: 1,
                }}
              >
                {t("list.close")}
              </button>
              {filterSection}
            </div>
          }
        >
          {listSection}
        </BottomSheet>
      </>
    );
  }

  return (
    <>
      {/* 開閉ボタン */}
      <button
        onClick={handleToggle}
        style={{
          position: "absolute",
          top: 16,
          left: isOpen ? PANEL_WIDTH + 8 : 10,
          zIndex: 3,
          padding: "8px 14px",
          borderRadius: "var(--radius-sm)",
          border: "none",
          background: "var(--color-card)",
          color: "var(--color-text-main)",
          cursor: "pointer",
          fontWeight: "500",
          boxShadow: "var(--shadow-md)",
          fontSize: "var(--font-size-sm)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          transition: "left 0.2s",
        }}
      >
        {isOpen ? t("list.close") : t("list.open")}
        {hasActiveFilter && !isOpen && (
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--color-primary)",
              display: "inline-block",
            }}
          />
        )}
      </button>

      {/* サイドパネル */}
      {isOpen && (
        <div
          className="spot-list-panel"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 2,
            width: `${PANEL_WIDTH}px`,
            height: "100vh",
            background: "var(--color-bg)",
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {filterSection}
          {listSection}
        </div>
      )}
    </>
  );
}
