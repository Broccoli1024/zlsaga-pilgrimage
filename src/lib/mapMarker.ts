export const categorySymbols: Record<string, string> = {
  温泉: "♨️", 神社: "⛩️", "宿泊施設・旅館": "🛏️", 駅: "🚉",
  学校: "🏫", 商店街: "🛍️", "城・史跡": "🏯", "海岸・自然": "🌊",
  グルメ: "🍴", イベント会場: "🎤", "公園・交流施設": "🌳",
  "博物館・文化施設": "🏛️", 空港: "✈️", その他: "📍",
};
export function getMarkerAppearance(input: {
  categoryName: string; checkedIn: boolean; favorite: boolean; showCheckins: boolean;
  routeMode: boolean; routeIndex: number; matched: boolean;
}) {
  return {
    symbol: categorySymbols[input.categoryName] ?? "📍",
    badge: input.routeMode && input.routeIndex >= 0 ? String(input.routeIndex + 1)
      : input.showCheckins && input.checkedIn ? input.favorite ? "★" : "✓" : null,
    opacity: !input.matched ? 0.25 : input.routeMode && input.routeIndex < 0 ? 0.45 : 1,
  };
}

export function getPinColor(sacred: boolean, manhole: boolean): string {
  return manhole ? "#7c3aed" : sacred ? "#b43d59" : "#246778";
}
