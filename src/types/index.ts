export type TransportMode = "car" | "transit";
export type Lang = "ja" | "en";

export interface Spot {
  id: string;
  name: string;
  name_en: string | null;
  lat: number;
  lng: number;
  prefecture: string;
  address: string | null;
  address_en: string | null;
  area: string | null;
  category: string | null;
  description: string | null;
  description_en: string | null;
  access_info: string | null;
  parking_info: string | null;
  duration_min: number | null;
  image_url: string | null;
  is_sacred: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: string;
  episode_number: number;
  title: string;
  title_en: string | null;
}

export interface Character {
  id: string;
  name: string;
  name_en: string | null;
  color_code: string | null;
}

export interface Visit {
  id: string;
  user_id: string;
  spot_id: string;
  visited_at: string;
  sacred_score: number | null;
  note: string | null;
}

export interface Route {
  id: string;
  user_id: string;
  name: string | null;
  area: string | null;
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
