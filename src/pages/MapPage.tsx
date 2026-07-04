import { useEffect, useState, useCallback } from "react";
import Map, { Marker, Popup, Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";
import LangToggle from "../components/ui/LangToggle";
import SpotListPanel from "../components/spot/SpotListPanel";
import SpotDetailPopup from "../components/spot/SpotDetailPopup";
import type { SpotFilters } from "../components/spot/SpotListPanel";
import type { Spot, SignificanceTag } from "../types";
import { Link, useSearchParams } from "react-router-dom";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const PANEL_WIDTH = 300;

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
interface Character {
  id: string;
  name: string;
  name_en: string | null;
}
interface SpotCharacter {
  spot_id: string;
  character_id: string;
}
type TransportMode = "car" | "walk" | "transit";

interface LegResult {
  fromId: string;
  toId: string;
  minutes: number;
  geometry: GeoJSON.LineString;
}

interface TransitOption {
  departureSecs: number;
  arrivalSecs: number;
  durationSecs: number;
  transferCount: number;
  accessWalkSecs?: number;
  egressWalkSecs?: number;
  legs: {
    kind: "transit" | "walk";
    routeName?: string;
    mode?: string;
    headsign?: string;
    from: { name: string };
    to: { name: string };
    departureSecs: number;
    arrivalSecs: number;
  }[];
}

export default function MapPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const [spots, setSpots] = useState<Spot[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [spotCharacters, setSpotCharacters] = useState<SpotCharacter[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [checkedInSpots, setCheckedInSpots] = useState<Record<string, boolean>>(
    {},
  );
  const [checkingIn, setCheckingIn] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [filters, setFilters] = useState<SpotFilters>({
    sacredFilter: "all",
    areaFilter: "all",
    categoryFilter: "all",
    characterFilter: "all",
    tagFilter: "all",
    checkinFilter: "all",
    favoriteOnly: false,
    searchQuery: "",
  });
  const [significanceTags, setSignificanceTags] = useState<SignificanceTag[]>(
    [],
  );
  const [spotTags, setSpotTags] = useState<
    { spot_id: string; tag_id: string }[]
  >([]);

  // ルート作成関連
  const [routeMode, setRouteMode] = useState(false);
  const [selectedForRoute, setSelectedForRoute] = useState<Spot[]>([]);
  const [transportMode, setTransportMode] = useState<TransportMode>("car");
  const [availableMinutes, setAvailableMinutes] = useState<number>(240);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [useTolls, setUseTolls] = useState(true);
  const [orderMode, setOrderMode] = useState<"auto" | "manual">("auto");
  const [userDurations, setUserDurations] = useState<Record<string, number>>(
    {},
  );
  const [departureDateTime, setDepartureDateTime] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10); // 10分後をデフォルトに
    return now.toISOString().slice(0, 16);
  });
  const [transitLegs, setTransitLegs] = useState<(TransitOption | null)[]>([]);
  const [editingLegIndex, setEditingLegIndex] = useState<number | null>(null);
  const [legCandidates, setLegCandidates] = useState<TransitOption[]>([]);
  const [currentRouteId, setCurrentRouteId] = useState<string | null>(null);
  const [routeNameInput, setRouteNameInput] = useState<string>("");
  const [savingRoute, setSavingRoute] = useState(false);
  // 生成済みルート
  const [routeResult, setRouteResult] = useState<{
    orderedSpots: Spot[];
    legs: LegResult[];
    totalMin: number;
  } | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const fetchData = async () => {
      const [
        spotsRes,
        areasRes,
        categoriesRes,
        charactersRes,
        spotCharsRes,
        tagsRes,
        spotTagsRes,
      ] = await Promise.all([
        supabase.from("spots").select("*").eq("is_published", true),
        supabase.from("areas").select("id, name, name_en").order("name"),
        supabase
          .from("categories")
          .select("id, name, name_en")
          .order("sort_order"),
        supabase
          .from("characters")
          .select("id, name, name_en")
          .order("sort_order"),
        supabase.from("spot_characters").select("spot_id, character_id"),
        supabase
          .from("significance_tags")
          .select("id, name, name_en, sort_order")
          .order("sort_order"),
        supabase.from("spot_significance_tags").select("spot_id, tag_id"),
      ]);
      if (spotsRes.data) setSpots(spotsRes.data);
      if (areasRes.data) setAreas(areasRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (charactersRes.data) setCharacters(charactersRes.data);
      if (spotCharsRes.data) setSpotCharacters(spotCharsRes.data);
      if (tagsRes.data) setSignificanceTags(tagsRes.data);
      if (spotTagsRes.data) setSpotTags(spotTagsRes.data);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchCheckins = async () => {
      const { data, error } = await supabase
        .from("spot_checkins")
        .select("spot_id, is_favorite");
      if (error) {
        console.error("チェックイン取得エラー:", error);
        return;
      }
      const map: Record<string, boolean> = {};
      data?.forEach((c) => {
        map[c.spot_id] = c.is_favorite;
      });
      setCheckedInSpots(map);
    };
    fetchCheckins();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchUserDurations = async () => {
      const { data } = await supabase
        .from("user_spot_durations")
        .select("spot_id, duration_min");
      const map: Record<string, number> = {};
      data?.forEach((d) => {
        map[d.spot_id] = d.duration_min;
      });
      setUserDurations(map);
    };
    fetchUserDurations();
  }, [user]);

  useEffect(() => {
    const restoreRouteId = searchParams.get("restoreRoute");
    if (!restoreRouteId || spots.length === 0) return;

    const restoreRoute = async () => {
      const { data: routeData } = await supabase
        .from("routes")
        .select("*")
        .eq("id", restoreRouteId)
        .single();

      if (!routeData) return;

      const { data: routeSpotsData } = await supabase
        .from("route_spots")
        .select("spot_id, order_index")
        .eq("route_id", restoreRouteId)
        .order("order_index", { ascending: true });

      if (!routeSpotsData) return;

      const restoredSpots = routeSpotsData
        .map((rs) => spots.find((s) => s.id === rs.spot_id))
        .filter((s): s is Spot => !!s);

      if (restoredSpots.length === 0) return;

      setSelectedForRoute(restoredSpots);
      setTransportMode(routeData.transport_mode as TransportMode);
      setOrderMode("manual"); // 復元時は常に手動扱い
      setRouteMode(true);
      setRouteResult(null);

      // URLパラメータをクリア（再読み込み時の誤動作防止）
      searchParams.delete("restoreRoute");
      setSearchParams(searchParams, { replace: true });
    };

    restoreRoute();
  }, [searchParams, spots]);

  const handleCheckin = async (spot: Spot) => {
    if (!user) return;
    setCheckingIn(true);
    await supabase
      .from("visit_logs")
      .insert({ user_id: user.id, spot_id: spot.id });
    const { error } = await supabase
      .from("spot_checkins")
      .upsert(
        { user_id: user.id, spot_id: spot.id },
        { onConflict: "user_id,spot_id" },
      );
    if (!error) setCheckedInSpots((prev) => ({ ...prev, [spot.id]: false }));
    setCheckingIn(false);
  };

  const handleUnCheckin = async (spot: Spot) => {
    if (!user) return;
    if (!window.confirm(`「${spot.name}」${t("map.uncheckinConfirm")}`)) return;
    setCheckingIn(true);
    const { error } = await supabase
      .from("spot_checkins")
      .delete()
      .eq("user_id", user.id)
      .eq("spot_id", spot.id);
    if (!error) {
      setCheckedInSpots((prev) => {
        const next = { ...prev };
        delete next[spot.id];
        return next;
      });
    }
    setCheckingIn(false);
  };

  const handleToggleFavorite = async (spot: Spot) => {
    if (!user) return;
    const current = checkedInSpots[spot.id] ?? false;
    const { error } = await supabase
      .from("spot_checkins")
      .update({ is_favorite: !current })
      .eq("user_id", user.id)
      .eq("spot_id", spot.id);
    if (!error) setCheckedInSpots((prev) => ({ ...prev, [spot.id]: !current }));
  };

  const handleMarkerClickForRoute = (spot: Spot) => {
    setSelectedForRoute((prev) => {
      const exists = prev.find((s) => s.id === spot.id);
      if (exists) return prev.filter((s) => s.id !== spot.id);
      return [...prev, spot];
    });
  };

  const exitRouteMode = useCallback(() => {
    setRouteMode(false);
    setSelectedForRoute([]);
    setSelectedSpot(null);
    setRouteResult(null);
    setGenError(null);
  }, []);

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

  const getSpotTagNames = useCallback(
    (spot: Spot): string[] => {
      const tagIds = spotTags
        .filter((st) => st.spot_id === spot.id)
        .map((st) => st.tag_id);
      return significanceTags
        .filter((t) => tagIds.includes(t.id))
        .map((t) => t.name);
    },
    [spotTags, significanceTags],
  );

  const matchesFilter = useCallback(
    (spot: Spot): boolean => {
      if (filters.sacredFilter === "sacred" && !isSpotSacred(spot))
        return false;
      if (filters.sacredFilter === "non_sacred" && isSpotSacred(spot))
        return false;
      if (filters.areaFilter !== "all" && spot.area_id !== filters.areaFilter)
        return false;
      if (
        filters.categoryFilter !== "all" &&
        spot.category_id !== filters.categoryFilter
      )
        return false;
      if (filters.characterFilter !== "all") {
        const hasChar = spotCharacters.some(
          (sc) =>
            sc.spot_id === spot.id &&
            sc.character_id === filters.characterFilter,
        );
        if (!hasChar) return false;
      }
      if (filters.tagFilter !== "all") {
        const hasTag = spotTags.some(
          (st) => st.spot_id === spot.id && st.tag_id === filters.tagFilter,
        );
        if (!hasTag) return false;
      }
      // チェックインフィルタ
      if (filters.checkinFilter === "visited" && !(spot.id in checkedInSpots))
        return false;
      if (filters.checkinFilter === "not_visited" && spot.id in checkedInSpots)
        return false;
      // お気に入りフィルタ
      if (filters.favoriteOnly && !checkedInSpots[spot.id]) return false;
      // 検索フィルタ
      if (filters.searchQuery.trim() !== "") {
        const query = filters.searchQuery.trim().toLowerCase();
        const nameMatch =
          spot.name.toLowerCase().includes(query) ||
          (spot.name_en?.toLowerCase().includes(query) ?? false);
        const descMatch =
          (spot.description?.toLowerCase().includes(query) ?? false) ||
          (spot.description_en?.toLowerCase().includes(query) ?? false);
        const tagMatch = getSpotTagNames(spot).some((name) =>
          name.toLowerCase().includes(query),
        );
        if (!nameMatch && !descMatch && !tagMatch) return false;
      }
      return true;
    },
    [
      filters,
      spotCharacters,
      spotTags,
      checkedInSpots,
      isSpotSacred,
      getSpotTagNames,
    ],
  );

  const getDurationForSpot = (spot: Spot): number => {
    return userDurations[spot.id] ?? spot.duration_min ?? 30;
  };

  const filteredSpots = spots.filter(matchesFilter);

  const getMarkerEmoji = (spot: Spot) => {
    if (routeMode) {
      if (routeResult) {
        const idx = routeResult.orderedSpots.findIndex((s) => s.id === spot.id);
        if (idx !== -1) return `${idx + 1}️⃣`;
        return "⚪";
      }
      const index = selectedForRoute.findIndex((s) => s.id === spot.id);
      if (index !== -1) return `${index + 1}️⃣`;
      return "⚪";
    }
    if (checkedInSpots[spot.id]) return "⭐";
    if (spot.id in checkedInSpots) return "✅";
    return isSpotSacred(spot) ? "📍" : "🗺️";
  };

  // Mapbox Directions APIで移動時間とジオメトリを取得
  // 移動時間とジオメトリを取得（キャッシュ優先）
  const fetchLeg = async (
    from: Spot,
    to: Spot,
    mode: TransportMode,
  ): Promise<LegResult> => {
    const tollsValue = mode === "car" ? useTolls : true; // walkはtollsと無関係なので固定値

    // ① キャッシュを検索
    const { data: cached } = await supabase
      .from("travel_times")
      .select("minutes, geometry, expires_at")
      .eq("from_spot_id", from.id)
      .eq("to_spot_id", to.id)
      .eq("transport_mode", mode)
      .eq("use_tolls", tollsValue)
      .is("day_of_week", null)
      .is("time_of_day", null)
      .maybeSingle();

    const isValid =
      cached &&
      cached.geometry &&
      (!cached.expires_at || new Date(cached.expires_at) > new Date());

    if (isValid) {
      return {
        fromId: from.id,
        toId: to.id,
        minutes: cached.minutes,
        geometry: cached.geometry as GeoJSON.LineString,
      };
    }

    // ② キャッシュがなければMapbox APIを呼ぶ
    const profile = mode === "car" ? "driving" : "walking";
    const excludeParam = mode === "car" && !useTolls ? "&exclude=toll" : "";
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson${excludeParam}&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    const route = data.routes?.[0];

    const leg: LegResult = {
      fromId: from.id,
      toId: to.id,
      minutes: Math.ceil((route?.duration ?? 0) / 60),
      geometry: route?.geometry ?? { type: "LineString", coordinates: [] },
    };

    // ③ 取得結果をキャッシュに保存
    await supabase.from("travel_times").upsert(
      {
        from_spot_id: from.id,
        to_spot_id: to.id,
        transport_mode: mode,
        minutes: leg.minutes,
        geometry: leg.geometry,
        use_tolls: tollsValue,
        source: "mapbox" as const,
        expires_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      {
        onConflict:
          "from_spot_id,to_spot_id,transport_mode,day_of_week,time_of_day,use_tolls",
      },
    );

    return leg;
  };

  // 秒数（その日0時からの経過秒）を HH:MM 形式に変換
  const secsToTimeStr = (secs: number): string => {
    const normalizedSecs = ((secs % 86400) + 86400) % 86400; // 負値・86400超対応
    const h = Math.floor(normalizedSecs / 3600);
    const m = Math.floor((normalizedSecs % 3600) / 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // 日時文字列（YYYY-MM-DDTHH:MM）から date(YYYYMMDD)とtime(HH:MM)を抽出
  const parseDateTimeInput = (
    datetimeStr: string,
  ): { date: string; time: string } => {
    const [datePart, timePart] = datetimeStr.split("T");
    const date = datePart.replace(/-/g, "");
    return { date, time: timePart };
  };

  // Transit APIで公共交通機関の経路を検索（複数候補）
  const fetchTransitOptions = async (
    from: Spot,
    to: Spot,
    date: string,
    time: string,
  ): Promise<TransitOption[]> => {
    const url = `https://api.transit.ls8h.com/api/v1/plan?from=geo:${from.lat},${from.lng}&to=geo:${to.lat},${to.lng}&date=${date}&time=${time}&type=departure&numItineraries=3`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const journeys: TransitOption[] = data.journeys ?? [];
      return journeys.filter((j) => !isWalkOnly(j));
    } catch (err) {
      console.error("Transit API エラー:", err);
      return [];
    }
  };

  // 候補が「電車・バスを一切使わない（徒歩のみ）」かどうかを判定
  const isWalkOnly = (option: TransitOption): boolean => {
    return option.legs.every((l) => l.kind === "walk");
  };

  // 確定した順序のスポットに対して、各区間の最速候補を連鎖的に計算
  const calculateTransitChain = async (
    orderedSpots: Spot[],
    startDateTime: string,
  ): Promise<(TransitOption | null)[]> => {
    const { date, time } = parseDateTimeInput(startDateTime);
    let currentDate = date;
    let currentTime = time;
    const legs: (TransitOption | null)[] = [];

    for (let i = 0; i < orderedSpots.length - 1; i++) {
      const options = await fetchTransitOptions(
        orderedSpots[i],
        orderedSpots[i + 1],
        currentDate,
        currentTime,
      );
      const best = options[0] ?? null;
      legs.push(best);

      if (best) {
        const stayMin = getDurationForSpot(orderedSpots[i + 1]);
        const nextDepartureSecs = best.arrivalSecs + stayMin * 60;
        currentTime = secsToTimeStr(nextDepartureSecs);
        if (nextDepartureSecs >= 86400) {
          const d = new Date(
            `${currentDate.slice(0, 4)}-${currentDate.slice(4, 6)}-${currentDate.slice(6, 8)}`,
          );
          d.setDate(d.getDate() + 1);
          currentDate = d.toISOString().slice(0, 10).replace(/-/g, "");
        }
      }
      // bestがnullの場合（見つからない区間）は、currentTimeを更新せず次の区間も同じ時刻で検索を試みる
    }

    return legs;
  };

  // 未保存ルートが多くなりすぎないよう、直近5件を超えたら古いものを削除
  const cleanupUnsavedRoutes = async () => {
    if (!user) return;
    const { data: unsavedRoutes } = await supabase
      .from("routes")
      .select("id, created_at")
      .eq("user_id", user.id)
      .eq("is_saved", false)
      .order("created_at", { ascending: false });

    if (unsavedRoutes && unsavedRoutes.length >= 5) {
      const toDelete = unsavedRoutes.slice(4); // 直近4件を残し、5件目以降を削除（このあと1件追加されるため）
      const idsToDelete = toDelete.map((r) => r.id);
      if (idsToDelete.length > 0) {
        await supabase.from("routes").delete().in("id", idsToDelete);
      }
    }
  };

  const handleSaveRoute = async () => {
    if (!currentRouteId || !routeNameInput.trim()) return;
    setSavingRoute(true);
    const { error } = await supabase
      .from("routes")
      .update({ name: routeNameInput.trim(), is_saved: true })
      .eq("id", currentRouteId);
    if (!error) {
      alert("ルートを保存しました！");
    }
    setSavingRoute(false);
  };

  // スポット名から「A→B→C」形式のデフォルトルート名を生成
  const generateDefaultRouteName = (spots: Spot[]): string => {
    return spots.map((s) => s.name).join("→");
  };

  // 指定した区間の候補を3つ取得し、選択UIを表示する
  const handleEditLeg = async (legIndex: number) => {
    if (!routeResult) return;
    const fromSpot = routeResult.orderedSpots[legIndex];
    const toSpot = routeResult.orderedSpots[legIndex + 1];

    // その区間の出発時刻は、前の区間の到着時刻＋滞在時間（最初の区間はdepartureDateTimeを使う）
    let date: string, time: string;
    if (legIndex === 0) {
      const parsed = parseDateTimeInput(departureDateTime);
      date = parsed.date;
      time = parsed.time;
    } else {
      const prevLeg = transitLegs[legIndex - 1];
      const stayMin = getDurationForSpot(fromSpot);
      const departSecs = prevLeg.arrivalSecs + stayMin * 60;
      time = secsToTimeStr(departSecs);
      date = parseDateTimeInput(departureDateTime).date; // 簡易的に同日扱い（日付超えは別途対応）
    }

    const options = await fetchTransitOptions(fromSpot, toSpot, date, time);
    setLegCandidates(options);
    setEditingLegIndex(legIndex);
  };

  // 候補を選択し、それ以降の区間を再計算する
  const handleSelectCandidate = async (selected: TransitOption) => {
    if (editingLegIndex === null || !routeResult) return;

    const newLegs = [...transitLegs];
    newLegs[editingLegIndex] = selected;

    // 選んだ区間より後ろを再計算
    const remainingSpots = routeResult.orderedSpots.slice(editingLegIndex + 1);
    let currentArrivalSecs = selected.arrivalSecs;
    let currentDate = parseDateTimeInput(departureDateTime).date;

    for (let i = 0; i < remainingSpots.length - 1; i++) {
      const stayMin = getDurationForSpot(remainingSpots[i]);
      const departSecs = currentArrivalSecs + stayMin * 60;
      const time = secsToTimeStr(departSecs);
      if (departSecs >= 86400) {
        const d = new Date(
          `${currentDate.slice(0, 4)}-${currentDate.slice(4, 6)}-${currentDate.slice(6, 8)}`,
        );
        d.setDate(d.getDate() + 1);
        currentDate = d.toISOString().slice(0, 10).replace(/-/g, "");
      }
      const options = await fetchTransitOptions(
        remainingSpots[i],
        remainingSpots[i + 1],
        currentDate,
        time,
      );
      const best = options[0];
      if (!best) break;
      newLegs[editingLegIndex + 1 + i] = best;
      currentArrivalSecs = best.arrivalSecs;
    }

    setTransitLegs(newLegs);
    setEditingLegIndex(null);
    setLegCandidates([]);

    // 合計時間を再計算
    const totalTravelMin = newLegs.reduce(
      (sum, l) => sum + l.durationSecs / 60,
      0,
    );
    const totalStayMin = routeResult.orderedSpots.reduce(
      (sum, s) => sum + getDurationForSpot(s),
      0,
    );
    setRouteResult({
      ...routeResult,
      totalMin: Math.round(totalTravelMin + totalStayMin),
    });
  };

  // Greedy法でルートを最適化
  const optimizeOrder = (
    targetSpots: Spot[],
    times: Record<string, number>,
  ): Spot[] => {
    if (targetSpots.length <= 2) return targetSpots;
    const unvisited = [...targetSpots.slice(1)];
    const result = [targetSpots[0]];
    while (unvisited.length > 0) {
      const current = result[result.length - 1];
      let minTime = Infinity;
      let nearestIndex = 0;
      unvisited.forEach((spot, i) => {
        const time = times[`${current.id}_${spot.id}`] ?? Infinity;
        if (time < minTime) {
          minTime = time;
          nearestIndex = i;
        }
      });
      result.push(unvisited[nearestIndex]);
      unvisited.splice(nearestIndex, 1);
    }
    return result;
  };

  const handleGenerateRoute = async () => {
    if (selectedForRoute.length < 2) {
      setGenError(t("route.needMoreSpots"));
      return;
    }
    setGenerating(true);
    setGenError(null);
    try {
      if (transportMode === "transit") {
        // 公共交通機関の場合：順序決定→連鎖的に最速候補を計算
        let ordered = selectedForRoute;

        if (orderMode === "auto") {
          // 順序決定用に徒歩の概算移動時間を使う（Transit APIを毎ペア叩くのは重いため簡易的に徒歩距離で近似）
          const timeMap: Record<string, number> = {};
          for (let i = 0; i < selectedForRoute.length; i++) {
            for (let j = 0; j < selectedForRoute.length; j++) {
              if (i === j) continue;
              const leg = await fetchLeg(
                selectedForRoute[i],
                selectedForRoute[j],
                "walk",
              );
              timeMap[`${selectedForRoute[i].id}_${selectedForRoute[j].id}`] =
                leg.minutes;
            }
          }
          ordered = optimizeOrder(selectedForRoute, timeMap);
        }

        const transitLegsResult = await calculateTransitChain(
          ordered,
          departureDateTime,
        );

        if (transitLegsResult.length === 0) {
          setGenError("公共交通機関のルートが見つかりませんでした");
          setGenerating(false);
          return;
        }

        const totalTravelMin = transitLegsResult.reduce(
          (sum, l) => sum + (l ? l.durationSecs / 60 : 0),
          0,
        );
        const totalStayMin = ordered.reduce(
          (sum, s) => sum + getDurationForSpot(s),
          0,
        );
        const totalMin = Math.round(totalTravelMin + totalStayMin);

        setTransitLegs(transitLegsResult);
        setRouteResult({ orderedSpots: ordered, legs: [], totalMin });
        setRouteNameInput(generateDefaultRouteName(ordered));

        if (user) {
          await cleanupUnsavedRoutes();
          const { data: routeData, error: routeError } = await supabase
            .from("routes")
            .insert({
              user_id: user.id,
              transport_mode: "transit",
              total_minutes: totalMin,
              is_saved: false,
            })
            .select()
            .single();
          if (!routeError && routeData) {
            setCurrentRouteId(routeData.id);
            const routeSpots = ordered.map((spot, i) => ({
              route_id: routeData.id,
              spot_id: spot.id,
              order_index: i,
              travel_min_from_prev:
                i === 0
                  ? null
                  : transitLegsResult[i - 1]
                    ? Math.round(transitLegsResult[i - 1]!.durationSecs / 60)
                    : null,
            }));
            await supabase.from("route_spots").insert(routeSpots);
          }
        }
      } else {
        // 自動車・徒歩の場合：既存のロジック
        const timeMap: Record<string, number> = {};
        for (let i = 0; i < selectedForRoute.length; i++) {
          for (let j = 0; j < selectedForRoute.length; j++) {
            if (i === j) continue;
            const leg = await fetchLeg(
              selectedForRoute[i],
              selectedForRoute[j],
              transportMode,
            );
            timeMap[`${selectedForRoute[i].id}_${selectedForRoute[j].id}`] =
              leg.minutes;
          }
        }
        const ordered =
          orderMode === "auto"
            ? optimizeOrder(selectedForRoute, timeMap)
            : selectedForRoute;

        const legs: LegResult[] = [];
        for (let i = 0; i < ordered.length - 1; i++) {
          const leg = await fetchLeg(ordered[i], ordered[i + 1], transportMode);
          legs.push(leg);
        }

        const totalTravelMin = legs.reduce((sum, leg) => sum + leg.minutes, 0);
        const totalStayMin = ordered.reduce(
          (sum, s) => sum + getDurationForSpot(s),
          0,
        );
        const totalMin = totalTravelMin + totalStayMin;

        setRouteResult({ orderedSpots: ordered, legs, totalMin });
        setTransitLegs([]);
        setRouteNameInput(generateDefaultRouteName(ordered));

        if (user) {
          await cleanupUnsavedRoutes();
          const { data: routeData, error: routeError } = await supabase
            .from("routes")
            .insert({
              user_id: user.id,
              transport_mode: transportMode,
              total_minutes: totalMin,
              is_saved: false,
            })
            .select()
            .single();
          if (!routeError && routeData) {
            setCurrentRouteId(routeData.id);
            const routeSpots = ordered.map((spot, i) => ({
              route_id: routeData.id,
              spot_id: spot.id,
              order_index: i,
              travel_min_from_prev: i === 0 ? null : legs[i - 1].minutes,
            }));
            await supabase.from("route_spots").insert(routeSpots);
          }
        }
      }
    } catch (err) {
      console.error("ルート生成エラー:", err);
      setGenError(t("route.error"));
    }
    setGenerating(false);
  };

  // ルートのGeoJSON（複数legを結合）
  const routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> | null = routeResult
    ? {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: routeResult.legs.flatMap(
            (leg) => leg.geometry.coordinates,
          ),
        },
      }
    : null;

  const isOverTime = routeResult
    ? routeResult.totalMin > availableMinutes
    : false;

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {/* ヘッダー */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 2,
          background: "var(--color-card)",
          padding: "8px 14px",
          borderRadius: "var(--radius-sm)",
          boxShadow: "var(--shadow-md)",
          fontSize: "var(--font-size-sm)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          borderTop: "2px solid var(--color-primary)",
        }}
      >
        <LangToggle />
        <div
          style={{
            width: "1px",
            height: "16px",
            background: "var(--color-border)",
          }}
        />
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link
              to="/mypage"
              style={{
                textDecoration: "none",
                color: "var(--color-text-main)",
                fontSize: "var(--font-size-sm)",
              }}
            >
              👤 {user.email}
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
              }}
              style={{
                padding: "3px 8px",
                fontSize: "var(--font-size-xs)",
                border: "0.5px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-card)",
                color: "var(--color-text-muted)",
                cursor: "pointer",
              }}
            >
              ログアウト
            </button>
          </div>
        ) : (
          <a
            href="/login"
            style={{
              color: "var(--color-primary)",
              fontSize: "var(--font-size-sm)",
              textDecoration: "none",
            }}
          >
            {t("map.login")}
          </a>
        )}
      </div>

      {/* スポット一覧パネル */}
      <SpotListPanel
        spots={spots}
        filteredSpots={filteredSpots}
        checkedInSpotsMap={checkedInSpots}
        areas={areas}
        categories={categories}
        characters={characters}
        significanceTags={significanceTags}
        filters={filters}
        onFiltersChange={setFilters}
        onSpotClick={(spot) => setSelectedSpot(spot)}
        onOpenChange={setIsPanelOpen}
        isSpotSacred={isSpotSacred}
      />

      {/* ルート作成パネル */}
      {user && (
        <div
          style={{
            position: "absolute",
            top: 56,
            left: isPanelOpen ? PANEL_WIDTH + 8 : 10,
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            maxHeight: "calc(100vh - 76px)",
            overflowY: "auto",
            transition: "left 0.2s",
          }}
        >
          {/* ルート作成 / キャンセルボタン */}
          <button
            onClick={() => {
              if (routeMode) {
                exitRouteMode();
              } else {
                setRouteMode(true);
                setSelectedSpot(null);
              }
            }}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-sm)",
              border: routeMode ? "0.5px solid var(--color-primary)" : "none",
              background: routeMode
                ? "var(--color-card)"
                : "var(--color-primary)",
              color: routeMode ? "var(--color-primary)" : "var(--color-white)",
              cursor: "pointer",
              fontWeight: "500",
              boxShadow: "var(--shadow-md)",
              fontSize: "var(--font-size-sm)",
            }}
          >
            {routeMode ? `✕ ${t("map.cancel")}` : `🗺️ ${t("map.createRoute")}`}
          </button>

          {routeMode && !routeResult && (
            <div
              style={{
                background: "var(--color-card)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-md)",
                borderTop: "2px solid var(--color-primary)",
                minWidth: "220px",
                overflow: "hidden",
              }}
            >
              {/* 選択スポット一覧 */}
              <div
                style={{
                  padding: "var(--space-md) var(--space-lg)",
                  borderBottom: "0.5px solid var(--color-border-light)",
                }}
              >
                <p
                  style={{
                    margin: "0 0 var(--space-sm)",
                    fontWeight: "500",
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text-main)",
                  }}
                >
                  {t("map.selectedSpots")}
                  <span
                    style={{
                      fontSize: "var(--font-size-xs)",
                      color: "var(--color-text-muted)",
                      marginLeft: "6px",
                      fontWeight: "normal",
                    }}
                  >
                    {selectedForRoute.length}件
                  </span>
                </p>
                {selectedForRoute.length === 0 && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "var(--font-size-xs)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {t("map.tapToSelect")}
                  </p>
                )}
                {selectedForRoute.map((spot, i) => (
                  <div
                    key={spot.id}
                    style={{
                      fontSize: "var(--font-size-xs)",
                      padding: "6px 0",
                      borderBottom: "0.5px solid var(--color-border-light)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: "var(--color-primary)",
                        color: "var(--color-white)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, color: "var(--color-text-main)" }}>
                      {spot.name}
                    </span>
                    <input
                      type="number"
                      value={getDurationForSpot(spot)}
                      onChange={(e) => {
                        const newVal = Number(e.target.value);
                        setUserDurations((prev) => ({
                          ...prev,
                          [spot.id]: newVal,
                        }));
                      }}
                      onBlur={async (e) => {
                        if (!user) return;
                        const newVal = Number(e.target.value);
                        await supabase.from("user_spot_durations").upsert(
                          {
                            user_id: user.id,
                            spot_id: spot.id,
                            duration_min: newVal,
                          },
                          { onConflict: "user_id,spot_id" },
                        );
                      }}
                      style={{
                        width: "36px",
                        fontSize: "10px",
                        padding: "2px",
                        textAlign: "right",
                        border: "0.5px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "10px",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      分
                    </span>
                    <span
                      onClick={() => handleMarkerClickForRoute(spot)}
                      style={{
                        cursor: "pointer",
                        color: "var(--color-primary)",
                        fontSize: "12px",
                      }}
                    >
                      ✕
                    </span>
                  </div>
                ))}
              </div>

              {selectedForRoute.length >= 2 && (
                <div style={{ padding: "var(--space-md) var(--space-lg)" }}>
                  {/* 順序モード */}
                  <p
                    style={{
                      margin: "0 0 var(--space-xs)",
                      fontSize: "var(--font-size-xs)",
                      fontWeight: "500",
                      color: "var(--color-text-sub)",
                    }}
                  >
                    巡礼順
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: "4px",
                      marginBottom: "var(--space-md)",
                    }}
                  >
                    {(
                      [
                        ["auto", "🤖 自動最適化"],
                        ["manual", "✋ 選んだ順"],
                      ] as [typeof orderMode, string][]
                    ).map(([mode, label]) => (
                      <button
                        key={mode}
                        onClick={() => setOrderMode(mode)}
                        style={{
                          flex: 1,
                          padding: "5px 0",
                          fontSize: "var(--font-size-xs)",
                          borderRadius: "var(--radius-sm)",
                          border:
                            orderMode === mode
                              ? "0.5px solid var(--color-primary)"
                              : "0.5px solid var(--color-border)",
                          background:
                            orderMode === mode
                              ? "var(--color-primary-light)"
                              : "var(--color-card)",
                          color:
                            orderMode === mode
                              ? "var(--color-primary)"
                              : "var(--color-text-sub)",
                          cursor: "pointer",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* 移動手段 */}
                  <p
                    style={{
                      margin: "0 0 var(--space-xs)",
                      fontSize: "var(--font-size-xs)",
                      fontWeight: "500",
                      color: "var(--color-text-sub)",
                    }}
                  >
                    {t("route.transport")}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: "4px",
                      marginBottom: "var(--space-sm)",
                    }}
                  >
                    {(["car", "walk", "transit"] as TransportMode[]).map(
                      (mode) => (
                        <button
                          key={mode}
                          onClick={() => setTransportMode(mode)}
                          style={{
                            flex: 1,
                            padding: "5px 0",
                            fontSize: "var(--font-size-xs)",
                            borderRadius: "var(--radius-sm)",
                            border:
                              transportMode === mode
                                ? "0.5px solid var(--color-primary)"
                                : "0.5px solid var(--color-border)",
                            background:
                              transportMode === mode
                                ? "var(--color-primary-light)"
                                : "var(--color-card)",
                            color:
                              transportMode === mode
                                ? "var(--color-primary)"
                                : "var(--color-text-sub)",
                            cursor: "pointer",
                          }}
                        >
                          {t(`route.${mode}`)}
                        </button>
                      ),
                    )}
                  </div>

                  {/* 有料道路 */}
                  {transportMode === "car" && (
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-sub)",
                        marginBottom: "var(--space-sm)",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={useTolls}
                        onChange={(e) => setUseTolls(e.target.checked)}
                      />
                      有料道路を使う
                    </label>
                  )}

                  {/* 出発日時（公共交通機関） */}
                  {transportMode === "transit" && (
                    <div style={{ marginBottom: "var(--space-sm)" }}>
                      <p
                        style={{
                          margin: "0 0 var(--space-xs)",
                          fontSize: "var(--font-size-xs)",
                          color: "var(--color-text-sub)",
                        }}
                      >
                        出発日時
                      </p>
                      <input
                        type="datetime-local"
                        value={departureDateTime}
                        onChange={(e) => setDepartureDateTime(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "6px",
                          fontSize: "var(--font-size-xs)",
                          borderRadius: "var(--radius-sm)",
                          border: "0.5px solid var(--color-border)",
                          background: "var(--color-card)",
                          color: "var(--color-text-main)",
                        }}
                      />
                    </div>
                  )}

                  {/* 利用可能時間 */}
                  <p
                    style={{
                      margin: "0 0 var(--space-xs)",
                      fontSize: "var(--font-size-xs)",
                      color: "var(--color-text-sub)",
                    }}
                  >
                    {t("route.availableTime")}：
                    <strong style={{ color: "var(--color-text-main)" }}>
                      {Math.floor(availableMinutes / 60)}
                      {t("route.hours")}
                      {availableMinutes % 60 > 0
                        ? `${availableMinutes % 60}${t("route.minutes")}`
                        : ""}
                    </strong>
                  </p>
                  <input
                    type="range"
                    min={60}
                    max={600}
                    step={30}
                    value={availableMinutes}
                    onChange={(e) =>
                      setAvailableMinutes(Number(e.target.value))
                    }
                    style={{
                      width: "100%",
                      marginBottom: "var(--space-md)",
                      accentColor: "var(--color-primary)",
                    }}
                  />

                  {genError && (
                    <p
                      style={{
                        color: "var(--color-error)",
                        fontSize: "var(--font-size-xs)",
                        margin: "0 0 var(--space-sm)",
                      }}
                    >
                      {genError}
                    </p>
                  )}

                  <button
                    onClick={handleGenerateRoute}
                    disabled={generating}
                    style={{
                      width: "100%",
                      padding: "8px",
                      background: generating
                        ? "var(--color-border)"
                        : "var(--color-primary)",
                      color: "var(--color-white)",
                      border: "none",
                      borderRadius: "var(--radius-sm)",
                      cursor: generating ? "not-allowed" : "pointer",
                      fontWeight: "500",
                      fontSize: "var(--font-size-sm)",
                    }}
                  >
                    {generating ? t("route.generating") : t("route.generate")}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ルート結果表示 */}
          {routeResult && (
            <div
              style={{
                background: "var(--color-card)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-md)",
                borderTop: "2px solid var(--color-primary)",
                minWidth: "220px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "var(--space-md) var(--space-lg)",
                  borderBottom: "0.5px solid var(--color-border-light)",
                }}
              >
                <p
                  style={{
                    margin: "0 0 var(--space-xs)",
                    fontWeight: "500",
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text-main)",
                  }}
                >
                  {t("result.title")}
                </p>
                <div
                  style={{
                    padding: "var(--space-sm) var(--space-md)",
                    borderRadius: "var(--radius-sm)",
                    background: isOverTime
                      ? "var(--color-warning-light)"
                      : "var(--color-success-light)",
                    fontSize: "var(--font-size-xs)",
                    color: isOverTime
                      ? "var(--color-warning)"
                      : "var(--color-success)",
                  }}
                >
                  {t(`route.${transportMode}`)} ・ 合計{" "}
                  <strong>
                    {Math.floor(routeResult.totalMin / 60)}
                    {t("route.hours")}
                    {routeResult.totalMin % 60}
                    {t("route.minutes")}
                  </strong>
                  {isOverTime && <div>⚠️ {t("result.overTime")}</div>}
                </div>
              </div>

              <div
                style={{
                  padding: "var(--space-md) var(--space-lg)",
                  maxHeight: "40vh",
                  overflowY: "auto",
                }}
              >
                {routeResult.orderedSpots.map((spot, i) => (
                  <div
                    key={spot.id}
                    style={{
                      fontSize: "var(--font-size-xs)",
                      marginBottom: "var(--space-xs)",
                    }}
                  >
                    {i > 0 && (
                      <div
                        style={{
                          paddingLeft: "20px",
                          marginBottom: "var(--space-xs)",
                        }}
                      >
                        {transportMode === "transit" ? (
                          transitLegs[i - 1] ? (
                            <div
                              style={{
                                background: "var(--color-bg)",
                                borderRadius: "var(--radius-sm)",
                                padding: "6px 8px",
                                fontSize: "11px",
                                color: "var(--color-text-sub)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginBottom: "2px",
                                }}
                              >
                                <span>
                                  🚃{" "}
                                  {secsToTimeStr(
                                    transitLegs[i - 1]!.departureSecs,
                                  )}{" "}
                                  発 →{" "}
                                  {secsToTimeStr(
                                    transitLegs[i - 1]!.arrivalSecs,
                                  )}{" "}
                                  着
                                  {transitLegs[i - 1]!.transferCount > 0 &&
                                    ` （乗換${transitLegs[i - 1]!.transferCount}回）`}
                                </span>
                                <button
                                  onClick={() => handleEditLeg(i - 1)}
                                  style={{
                                    fontSize: "10px",
                                    padding: "2px 6px",
                                    border: "0.5px solid var(--color-primary)",
                                    background: "var(--color-card)",
                                    color: "var(--color-primary)",
                                    borderRadius: "var(--radius-sm)",
                                    cursor: "pointer",
                                  }}
                                >
                                  🔄
                                </button>
                              </div>
                              {transitLegs[i - 1]!.accessWalkSecs ? (
                                <div
                                  style={{
                                    color: "var(--color-text-muted)",
                                    fontSize: "10px",
                                  }}
                                >
                                  🚶 最寄り駅まで徒歩
                                  {Math.round(
                                    transitLegs[i - 1]!.accessWalkSecs! / 60,
                                  )}
                                  分
                                </div>
                              ) : null}
                              {transitLegs[i - 1]!.legs.filter(
                                (l) => l.kind === "transit",
                              ).map((leg, li) => (
                                <div
                                  key={li}
                                  style={{
                                    color: "var(--color-text-muted)",
                                    fontSize: "10px",
                                  }}
                                >
                                  {leg.routeName ?? leg.mode} {leg.from.name}→
                                  {leg.to.name}
                                </div>
                              ))}
                              {transitLegs[i - 1]!.egressWalkSecs ? (
                                <div
                                  style={{
                                    color: "var(--color-text-muted)",
                                    fontSize: "10px",
                                  }}
                                >
                                  🚶 駅から目的地まで徒歩
                                  {Math.round(
                                    transitLegs[i - 1]!.egressWalkSecs! / 60,
                                  )}
                                  分
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <div
                              style={{
                                background: "var(--color-warning-light)",
                                borderRadius: "var(--radius-sm)",
                                padding: "6px 8px",
                                fontSize: "11px",
                                color: "var(--color-warning)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span>⚠️ ルートが見つかりません</span>
                              <button
                                onClick={() => handleEditLeg(i - 1)}
                                style={{
                                  fontSize: "10px",
                                  padding: "2px 6px",
                                  border: "0.5px solid var(--color-warning)",
                                  background: "var(--color-card)",
                                  color: "var(--color-warning)",
                                  borderRadius: "var(--radius-sm)",
                                  cursor: "pointer",
                                }}
                              >
                                🔄
                              </button>
                            </div>
                          )
                        ) : (
                          <div
                            style={{
                              color: "var(--color-text-muted)",
                              fontSize: "11px",
                            }}
                          >
                            {t(`route.${transportMode}`)}{" "}
                            {t("result.travelTime")}
                            {routeResult.legs[i - 1]?.minutes}
                            {t("route.minutes")}
                          </div>
                        )}
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          width: "18px",
                          height: "18px",
                          background: "var(--color-primary)",
                          color: "var(--color-white)",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          color: "var(--color-text-main)",
                          fontWeight: "500",
                        }}
                      >
                        {spot.name}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        ⏱ {getDurationForSpot(spot)}分
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* ルート保存 */}
              {currentRouteId && (
                <div
                  style={{
                    padding: "var(--space-md) var(--space-lg)",
                    borderTop: "0.5px solid var(--color-border-light)",
                    background: "var(--color-bg)",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 var(--space-xs)",
                      fontSize: "var(--font-size-xs)",
                      color: "var(--color-text-sub)",
                    }}
                  >
                    このルートを保存
                  </p>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="text"
                      value={routeNameInput}
                      onChange={(e) => setRouteNameInput(e.target.value)}
                      placeholder="ルート名を入力"
                      style={{
                        flex: 1,
                        padding: "6px",
                        fontSize: "var(--font-size-xs)",
                        borderRadius: "var(--radius-sm)",
                        border: "0.5px solid var(--color-border)",
                        background: "var(--color-card)",
                      }}
                    />
                    <button
                      onClick={handleSaveRoute}
                      disabled={savingRoute || !routeNameInput.trim()}
                      style={{
                        padding: "6px 10px",
                        fontSize: "var(--font-size-xs)",
                        background: routeNameInput.trim()
                          ? "var(--color-primary)"
                          : "var(--color-border)",
                        color: "var(--color-white)",
                        border: "none",
                        borderRadius: "var(--radius-sm)",
                        cursor: routeNameInput.trim()
                          ? "pointer"
                          : "not-allowed",
                        whiteSpace: "nowrap",
                      }}
                    >
                      💾 保存
                    </button>
                  </div>
                </div>
              )}

              <div style={{ padding: "var(--space-sm) var(--space-lg)" }}>
                <button
                  onClick={() => setRouteResult(null)}
                  style={{
                    width: "100%",
                    padding: "6px",
                    background: "var(--color-card)",
                    border: "0.5px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-sub)",
                  }}
                >
                  {t("result.changeCondition")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: 130.2988, latitude: 33.2494, zoom: 9 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {/* ルートの線 */}
        {routeGeoJSON && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                "line-color": "#2196F3",
                "line-width": 5,
                "line-opacity": 0.8,
              }}
              layout={{ "line-cap": "round", "line-join": "round" }}
            />
          </Source>
        )}

        {spots.map((spot) => {
          const matched = matchesFilter(spot);
          return (
            <Marker
              key={spot.id}
              longitude={spot.lng}
              latitude={spot.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                if (!matched) return; // フィルタ非一致は操作不可
                if (routeMode) {
                  if (!routeResult) handleMarkerClickForRoute(spot);
                } else {
                  setSelectedSpot(spot);
                }
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  cursor: matched ? "pointer" : "default",
                  filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.3))",
                  opacity: matched ? 1 : 0.25,
                }}
              >
                {getMarkerEmoji(spot)}
              </div>
            </Marker>
          );
        })}

        {!routeMode && selectedSpot && (
          <Popup
            longitude={selectedSpot.lng}
            latitude={selectedSpot.lat}
            anchor="top"
            onClose={() => setSelectedSpot(null)}
            maxWidth="300px"
          >
            <SpotDetailPopup
              spot={selectedSpot}
              areaName={
                areas.find((a) => a.id === selectedSpot.area_id)?.name ?? ""
              }
              categoryName={
                categories.find((c) => c.id === selectedSpot.category_id)
                  ?.name ?? ""
              }
              isSacred={isSpotSacred(selectedSpot)}
              tags={significanceTags.filter((t) =>
                spotTags.some(
                  (st) => st.spot_id === selectedSpot.id && st.tag_id === t.id,
                ),
              )}
              checkedIn={selectedSpot.id in checkedInSpots}
              isFavorite={checkedInSpots[selectedSpot.id] ?? false}
              checkingIn={checkingIn}
              canCheckin={!!user}
              onCheckin={() => handleCheckin(selectedSpot)}
              onUnCheckin={() => handleUnCheckin(selectedSpot)}
              onToggleFavorite={() => handleToggleFavorite(selectedSpot)}
            />
          </Popup>
        )}
      </Map>
      {/* 候補選択モーダル */}
      {editingLegIndex !== null && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "16px",
              maxWidth: "360px",
              width: "90%",
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
            <p
              style={{
                margin: "0 0 12px",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              候補を選択
            </p>
            {legCandidates.length === 0 && (
              <p style={{ fontSize: "13px", color: "#999" }}>
                候補が見つかりません
              </p>
            )}
            {legCandidates.map((option, i) => (
              <button
                key={i}
                onClick={() => handleSelectCandidate(option)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px",
                  marginBottom: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: "bold" }}>
                  {secsToTimeStr(option.departureSecs)} 発 →{" "}
                  {secsToTimeStr(option.arrivalSecs)} 着
                </div>
                <div
                  style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}
                >
                  所要 {Math.round(option.durationSecs / 60)}分
                  {option.transferCount > 0 &&
                    ` ・乗換${option.transferCount}回`}
                </div>
                {option.accessWalkSecs ? (
                  <div style={{ fontSize: "10px", color: "#999" }}>
                    🚶 最寄り駅まで徒歩{Math.round(option.accessWalkSecs / 60)}
                    分
                  </div>
                ) : null}
                {option.legs
                  .filter((l) => l.kind === "transit")
                  .map((leg, li) => (
                    <div key={li} style={{ fontSize: "10px", color: "#999" }}>
                      {leg.routeName ?? leg.mode} {leg.from.name}→{leg.to.name}
                    </div>
                  ))}
                {option.egressWalkSecs ? (
                  <div style={{ fontSize: "10px", color: "#999" }}>
                    🚶 駅から目的地まで徒歩
                    {Math.round(option.egressWalkSecs / 60)}分
                  </div>
                ) : null}
                {option.legs
                  .filter((l) => l.kind === "transit")
                  .map((leg, li) => (
                    <div key={li} style={{ fontSize: "10px", color: "#999" }}>
                      {leg.routeName ?? leg.mode} {leg.from.name}→{leg.to.name}
                    </div>
                  ))}
              </button>
            ))}
            <button
              onClick={() => {
                setEditingLegIndex(null);
                setLegCandidates([]);
              }}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "4px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                background: "white",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
