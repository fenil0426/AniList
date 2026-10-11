export type WatchStatus = 'watching' | 'plan' | 'completed' | 'on_hold' | 'dropped';

export type MediaKind = 'anime' | 'manga' | 'novel';

export interface WatchlistItem {
  id: number;
  kind: MediaKind;
  title: string;
  romajiTitle?: string;
  image: string;
  bannerImage?: string;
  total: number | null;
  unit: 'ep' | 'ch' | 'vol';
  status: WatchStatus;
  progress: number;
  score?: number; // 1 to 10
  notes?: string;
  addedAt: number;
  updatedAt: number;
}

export interface NextAiring {
  at: number; // millisecond timestamp
  ep: number;
}

export interface AnimeMedia {
  id: number;
  kind: MediaKind;
  title: string;
  romajiTitle: string;
  nativeTitle?: string;
  image: string;
  bannerImage?: string;
  score: number | null; // e.g. 8.4
  popularity?: number;
  format: string; // TV, MOVIE, OVA, ONA, SPECIAL, etc.
  status: string; // Airing, Finished, Upcoming, etc.
  year: number | null;
  season?: string;
  episodes: number | null;
  duration?: number | null; // minutes per ep
  genres: string[];
  studios: string[];
  synopsis: string;
  trailerId?: string; // YouTube video ID
  nextAiring: NextAiring | null;
  siteUrl: string;
  characters?: CharacterPreview[];
}

export interface CharacterPreview {
  id: number;
  name: string;
  image: string;
  role: string;
  voiceActor?: {
    name: string;
    image: string;
    language: string;
  };
}

export interface CharacterDetail {
  id: number;
  name: string;
  nativeName?: string;
  image: string;
  favorites: number;
  nicknames: string[];
  about: string;
  siteUrl: string;
  media: {
    id: number;
    title: string;
    role: string;
    image?: string;
  }[];
}

export interface FavCharacter {
  id: number;
  name: string;
  image: string;
  nativeName?: string;
  mediaTitle?: string;
  addedAt: number;
}

export type ViewTab = 'list' | 'season' | 'search' | 'characters';
