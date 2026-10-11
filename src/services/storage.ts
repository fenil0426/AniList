import { WatchlistItem, FavCharacter, WatchStatus, AnimeMedia } from '../types/anime';

const STORAGE_KEY_LIST = 'anihub_watchlist_v1';
const STORAGE_KEY_FAV_CHARS = 'anihub_fav_chars_v1';
const STORAGE_KEY_THEME = 'anihub_theme_v1';

// Initial sample items if brand new user wants a warm start, or start clean
export function getSavedWatchlist(): Record<number, WatchlistItem> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIST);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const valid: Record<number, WatchlistItem> = {};
    for (const [key, item] of Object.entries(parsed as Record<string, any>)) {
      if (item && item.id && item.title) {
        valid[Number(key)] = {
          id: Number(item.id),
          kind: item.kind || 'anime',
          title: String(item.title),
          romajiTitle: item.romajiTitle,
          image: item.image || '',
          bannerImage: item.bannerImage,
          total: item.total ? Number(item.total) : null,
          unit: item.unit || 'ep',
          status: item.status || 'watching',
          progress: Math.max(0, Number(item.progress) || 0),
          score: item.score ? Number(item.score) : undefined,
          notes: item.notes ? String(item.notes) : undefined,
          addedAt: Number(item.addedAt) || Date.now(),
          updatedAt: Number(item.updatedAt) || Date.now(),
        };
      }
    }
    return valid;
  } catch (e) {
    console.error('Failed to load watchlist from localStorage', e);
    return {};
  }
}

export function saveWatchlist(list: Record<number, WatchlistItem>): void {
  try {
    localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to persist watchlist', e);
  }
}

export function getSavedFavCharacters(): Record<number, FavCharacter> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAV_CHARS);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

export function saveFavCharacters(favs: Record<number, FavCharacter>): void {
  try {
    localStorage.setItem(STORAGE_KEY_FAV_CHARS, JSON.stringify(favs));
  } catch (e) {
    console.error('Failed to persist favorite characters', e);
  }
}

export function getSavedTheme(): 'dark' | 'light' {
  try {
    const t = localStorage.getItem(STORAGE_KEY_THEME);
    if (t === 'light' || t === 'dark') return t;
    return 'dark';
  } catch {
    return 'dark';
  }
}

export function saveTheme(theme: 'dark' | 'light'): void {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  } catch {}
}

export function createWatchlistItemFromAnime(
  anime: AnimeMedia,
  status: WatchStatus = 'plan'
): WatchlistItem {
  return {
    id: anime.id,
    kind: anime.kind,
    title: anime.title,
    romajiTitle: anime.romajiTitle,
    image: anime.image,
    bannerImage: anime.bannerImage,
    total: anime.episodes,
    unit: 'ep',
    status,
    progress: status === 'completed' && anime.episodes ? anime.episodes : 0,
    addedAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function exportBackup(list: Record<number, WatchlistItem>, favs: Record<number, FavCharacter>) {
  const data = {
    app: 'AniHub',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    watchlist: list,
    favCharacters: favs,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `anihub-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function parseImportBackup(jsonString: string): {
  watchlist?: Record<number, WatchlistItem>;
  favCharacters?: Record<number, FavCharacter>;
} {
  const parsed = JSON.parse(jsonString);
  const resultWatchlist: Record<number, WatchlistItem> = {};
  const resultFavs: Record<number, FavCharacter> = {};

  // Support both new schema and old AniHub v1/v2 schema
  const rawList = parsed.watchlist || parsed.list || {};
  for (const [k, v] of Object.entries(rawList as Record<string, any>)) {
    if (v && v.title) {
      const id = Number(v.id || k);
      resultWatchlist[id] = {
        id,
        kind: v.kind || 'anime',
        title: String(v.title),
        romajiTitle: v.romajiTitle,
        image: v.image || '',
        bannerImage: v.bannerImage,
        total: v.total ? Number(v.total) : null,
        unit: 'ep',
        status: v.status || 'watching',
        progress: Number(v.progress) || 0,
        score: v.score ? Number(v.score) : undefined,
        notes: v.notes,
        addedAt: Number(v.addedAt) || Date.now(),
        updatedAt: Number(v.updatedAt) || Date.now(),
      };
    }
  }

  const rawFavs = parsed.favCharacters || parsed.favChars || {};
  for (const [k, v] of Object.entries(rawFavs as Record<string, any>)) {
    if (v && v.name) {
      const id = Number(v.id || k);
      resultFavs[id] = {
        id,
        name: String(v.name),
        image: v.image || '',
        nativeName: v.nativeName,
        mediaTitle: v.mediaTitle,
        addedAt: Number(v.addedAt) || Date.now(),
      };
    }
  }

  return {
    watchlist: resultWatchlist,
    favCharacters: resultFavs,
  };
}
