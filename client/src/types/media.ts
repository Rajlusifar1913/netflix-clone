export type MediaType = "movie" | "tv";

export interface MediaItem {
  id: number;
  title: string;
  name?: string;
  original_name?: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: MediaType;
  genre_ids: number[];
  adult?: boolean;
}

export interface MediaRowData {
  title: string;
  items: MediaItem[];
}

export interface BrowseData {
  featured: MediaItem;
  rows: MediaRowData[];
}
