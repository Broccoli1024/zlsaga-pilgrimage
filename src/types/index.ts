export type TransportMode = "car" | "walk" | "transit";
export type Lang = "ja" | "en";

export interface Spot {
  id: string;
  work_id: string;
  area_id: string | null;
  category_id: string | null;
  name: string;
  name_en: string | null;
  lat: number;
  lng: number;
  prefecture: string;
  address: string | null;
  address_en: string | null;
  description: string | null;
  description_en: string | null;
  access_info: string | null;
  parking_info: string | null;
  duration_min: number | null;
  nearest_station_name: string | null;
  nearest_station_walk_min: number | null;
  nearest_bus_stop_name: string | null;
  nearest_bus_stop_walk_min: number | null;
  access_notes: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SignificanceTag {
  id: string;
  name: string;
  name_en: string | null;
  sort_order: number;
}

export interface Episode {
  id: string;
  work_id: string;
  media_type: string;
  season: number;
  episode_number: number;
  title: string;
  title_en: string | null;
}

export interface Character {
  id: string;
  work_id: string;
  name: string;
  name_en: string | null;
  color_code: string | null;
}

export interface Visit {
  id: string;
  user_id: string;
  spot_id: string;
  visited_at: string;
  note: string | null;
}

export interface Route {
  id: string;
  user_id: string;
  name: string | null;
  area_id: string | null;
  transport_mode: TransportMode;
  total_minutes: number | null;
  created_at: string;
}

export interface RouteSpot {
  id: string;
  route_id: string;
  spot_id: string;
  order_index: number;
  travel_min_from_prev: number | null;
}
