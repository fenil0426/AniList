import { AnimeMedia, CharacterDetail, CharacterPreview } from '../types/anime';

const API_ENDPOINT = 'https://graphql.anilist.co';

let lastCall = 0;
let chain: Promise<any> = Promise.resolve();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchAniListGQL<T = any>(
  query: string,
  variables: Record<string, any> = {}
): Promise<T> {
  const runner = async (): Promise<T> => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const wait = lastCall + 320 - Date.now();
      if (wait > 0) await sleep(wait);
      lastCall = Date.now();

      try {
        const res = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ query, variables }),
        });

        if (res.status === 429) {
          const retryAfter = Number(res.headers.get('Retry-After')) || 2 * (attempt + 1);
          await sleep(Math.min(retryAfter, 15) * 1000);
          continue;
        }

        if (res.status >= 500) {
          await sleep(1000 * (attempt + 1));
          continue;
        }

        const json = await res.json();
        if (!res.ok || json.errors) {
          const msg = json.errors?.[0]?.message || `AniList API error (${res.status})`;
          throw new Error(msg);
        }

        return json.data as T;
      } catch (err: any) {
        if (attempt === 2) throw err;
        await sleep(500 * (attempt + 1));
      }
    }
    throw new Error('Unable to connect to AniList. Please check your connection.');
  };

  const next = chain.then(runner, runner);
  chain = next.catch(() => {});
  return next;
}

// Clean markdown/html from AniList synopses
export function cleanSynopsis(raw?: string | null): string {
  if (!raw) return '';
  return raw
    .replace(/~!([\s\S]*?)!~/g, '') // strip spoilers
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](link) -> text
    .replace(/(__|\*\*)(.*?)\1/g, '$2') // bold
    .replace(/(_|\*)(.*?)\1/g, '$2') // italic
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\(Source:[^)]*\)/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const MEDIA_FIELDS = `
  id
  type
  format
  status
  title {
    romaji
    english
    native
  }
  coverImage {
    extraLarge
    large
    medium
  }
  bannerImage
  episodes
  duration
  averageScore
  popularity
  season
  seasonYear
  startDate {
    year
  }
  genres
  studios(isMain: true) {
    nodes {
      name
    }
  }
  trailer {
    id
    site
  }
  description(asHtml: false)
  siteUrl
  nextAiringEpisode {
    airingAt
    episode
  }
`;

export function mapRawMediaToAnime(m: any): AnimeMedia {
  const englishTitle = m.title?.english;
  const romajiTitle = m.title?.romaji || englishTitle || 'Untitled Anime';
  const displayTitle = englishTitle || romajiTitle;

  const studios = (m.studios?.nodes || []).map((s: any) => s.name).filter(Boolean);

  let trailerId: string | undefined = undefined;
  if (m.trailer && m.trailer.site === 'youtube') {
    trailerId = m.trailer.id;
  }

  const statusMap: Record<string, string> = {
    RELEASING: 'Airing',
    FINISHED: 'Finished',
    NOT_YET_RELEASED: 'Upcoming',
    CANCELLED: 'Cancelled',
    HIATUS: 'On Hiatus',
  };

  const formatMap: Record<string, string> = {
    TV: 'TV Series',
    TV_SHORT: 'TV Short',
    MOVIE: 'Movie',
    SPECIAL: 'Special',
    OVA: 'OVA',
    ONA: 'ONA',
    MUSIC: 'Music',
  };

  return {
    id: m.id,
    kind: 'anime',
    title: displayTitle,
    romajiTitle: romajiTitle,
    nativeTitle: m.title?.native,
    image: m.coverImage?.extraLarge || m.coverImage?.large || m.coverImage?.medium || '',
    bannerImage: m.bannerImage || undefined,
    score: m.averageScore ? Number((m.averageScore / 10).toFixed(1)) : null,
    popularity: m.popularity,
    format: formatMap[m.format] || m.format || 'Anime',
    status: statusMap[m.status] || m.status || 'Unknown',
    year: m.seasonYear || m.startDate?.year || null,
    season: m.season ? `${m.season.charAt(0)}${m.season.slice(1).toLowerCase()}` : undefined,
    episodes: m.episodes || null,
    duration: m.duration || null,
    genres: m.genres || [],
    studios,
    synopsis: cleanSynopsis(m.description),
    trailerId,
    siteUrl: m.siteUrl || `https://anilist.co/anime/${m.id}`,
    nextAiring: m.nextAiringEpisode
      ? {
          at: m.nextAiringEpisode.airingAt * 1000,
          ep: m.nextAiringEpisode.episode,
        }
      : null,
  };
}

// Memory cache for quick lookups
export const animeCache = new Map<number, AnimeMedia>();

// Fetch Single Anime with Characters
export async function getAnimeDetails(id: number): Promise<AnimeMedia> {
  const cached = animeCache.get(id);
  if (cached && cached.characters && cached.characters.length > 0) {
    return cached;
  }

  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${MEDIA_FIELDS}
        characters(page: 1, perPage: 8, sort: [ROLE, RELEVANCE]) {
          edges {
            role
            node {
              id
              name {
                full
              }
              image {
                large
              }
            }
            voiceActors(language: JAPANESE, sort: RELEVANCE) {
              name {
                full
              }
              image {
                large
              }
              language
            }
          }
        }
      }
    }
  `;

  const data = await fetchAniListGQL<{ Media: any }>(query, { id });
  const base = mapRawMediaToAnime(data.Media);

  const characters: CharacterPreview[] = (data.Media.characters?.edges || []).map((edge: any) => {
    const c = edge.node;
    const va = edge.voiceActors?.[0];
    return {
      id: c.id,
      name: c.name?.full || 'Unknown',
      image: c.image?.large || '',
      role: edge.role || 'Supporting',
      voiceActor: va
        ? {
            name: va.name?.full || '',
            image: va.image?.large || '',
            language: va.language || 'Japanese',
          }
        : undefined,
    };
  });

  const full: AnimeMedia = {
    ...base,
    characters,
  };

  animeCache.set(id, full);
  return full;
}

// Fetch Trending Anime
export async function getTrendingAnime(page = 1, perPage = 18): Promise<AnimeMedia[]> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await fetchAniListGQL<{ Page: { media: any[] } }>(query, { page, perPage });
  const results = data.Page.media.map(mapRawMediaToAnime);
  results.forEach((a) => animeCache.set(a.id, a));
  return results;
}

// Search Anime with Filters
export async function searchAnime(params: {
  search?: string;
  genre?: string;
  format?: string;
  status?: string;
  sort?: string;
  page?: number;
  perPage?: number;
}): Promise<{ media: AnimeMedia[]; hasNextPage: boolean }> {
  const { search, genre, format, status, sort = 'POPULARITY_DESC', page = 1, perPage = 24 } = params;

  const query = `
    query ($search: String, $genre: String, $format: MediaFormat, $status: MediaStatus, $sort: [MediaSort], $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
        }
        media(search: $search, genre: $genre, format: $format, status: $status, sort: $sort, type: ANIME, isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const variables: Record<string, any> = { page, perPage };
  if (search?.trim()) variables.search = search.trim();
  if (genre && genre !== 'All') variables.genre = genre;
  if (format && format !== 'ALL') variables.format = format;
  if (status && status !== 'ALL') variables.status = status;

  let sortArr = [sort];
  if (search?.trim()) {
    sortArr = ['SEARCH_MATCH', sort];
  }
  variables.sort = sortArr;

  const data = await fetchAniListGQL<{ Page: { pageInfo: { hasNextPage: boolean }; media: any[] } }>(
    query,
    variables
  );

  const media = data.Page.media.map(mapRawMediaToAnime);
  media.forEach((a) => animeCache.set(a.id, a));

  return {
    media,
    hasNextPage: data.Page.pageInfo.hasNextPage,
  };
}

// Fetch Seasonal Anime Schedule
export async function getSeasonalSchedule(
  season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL',
  year: number,
  page = 1,
  perPage = 50
): Promise<{ media: AnimeMedia[]; hasNextPage: boolean }> {
  const query = `
    query ($season: MediaSeason, $year: Int, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
        }
        media(season: $season, seasonYear: $year, type: ANIME, isAdult: false, sort: POPULARITY_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await fetchAniListGQL<{ Page: { pageInfo: { hasNextPage: boolean }; media: any[] } }>(
    query,
    { season, year, page, perPage }
  );

  const media = data.Page.media.map(mapRawMediaToAnime);
  media.forEach((a) => animeCache.set(a.id, a));

  return {
    media,
    hasNextPage: data.Page.pageInfo.hasNextPage,
  };
}

// Also fetch currently releasing long-running anime (like One Piece)
export async function getCurrentlyReleasingAnime(perPage = 30): Promise<AnimeMedia[]> {
  const query = `
    query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, status: RELEASING, isAdult: false, sort: POPULARITY_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  const data = await fetchAniListGQL<{ Page: { media: any[] } }>(query, { perPage });
  const media = data.Page.media.map(mapRawMediaToAnime);
  media.forEach((a) => animeCache.set(a.id, a));
  return media;
}

// Characters queries
const CHAR_FIELDS = `
  id
  name {
    full
    native
    alternative
  }
  image {
    large
  }
  description(asHtml: false)
  favourites
  siteUrl
  media(perPage: 6, sort: POPULARITY_DESC, type: ANIME) {
    edges {
      characterRole
      node {
        id
        title {
          romaji
          english
        }
        coverImage {
          medium
        }
      }
    }
  }
`;

function mapRawCharacter(c: any): CharacterDetail {
  return {
    id: c.id,
    name: c.name?.full || 'Unknown',
    nativeName: c.name?.native || '',
    image: c.image?.large || '',
    favorites: c.favourites || 0,
    nicknames: (c.name?.alternative || []).filter(Boolean),
    about: cleanSynopsis(c.description),
    siteUrl: c.siteUrl || `https://anilist.co/character/${c.id}`,
    media: (c.media?.edges || []).map((e: any) => ({
      id: e.node.id,
      title: e.node.title.english || e.node.title.romaji,
      role: (e.characterRole || 'supporting').toLowerCase(),
      image: e.node.coverImage?.medium,
    })),
  };
}

export async function getCharacterOfTheDay(): Promise<CharacterDetail> {
  const day = Math.floor(Date.now() / (86400 * 1000));
  const page = (day % 15) + 1;

  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 20) {
        characters(sort: FAVOURITES_DESC) {
          ${CHAR_FIELDS}
        }
      }
    }
  `;

  const data = await fetchAniListGQL<{ Page: { characters: any[] } }>(query, { page });
  const list = data.Page.characters;
  const picked = list[(day * 7) % list.length] || list[0];
  return mapRawCharacter(picked);
}

export async function getRandomCharacter(): Promise<CharacterDetail> {
  // AniList has thousands of characters. Query a random page within top 2500 characters
  const randomPage = Math.floor(Math.random() * 120) + 1;
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 15) {
        characters(sort: FAVOURITES_DESC) {
          ${CHAR_FIELDS}
        }
      }
    }
  `;

  const data = await fetchAniListGQL<{ Page: { characters: any[] } }>(query, { page: randomPage });
  const chars = (data.Page.characters || []).filter(
    (c: any) => c.image?.large && !c.image.large.includes('default.')
  );

  if (!chars.length) throw new Error('Could not find character, please try again.');
  const pick = chars[Math.floor(Math.random() * chars.length)];
  return mapRawCharacter(pick);
}

export async function searchCharacters(searchQuery: string): Promise<CharacterDetail[]> {
  const query = `
    query ($search: String) {
      Page(page: 1, perPage: 18) {
        characters(search: $search, sort: [FAVOURITES_DESC]) {
          ${CHAR_FIELDS}
        }
      }
    }
  `;

  const data = await fetchAniListGQL<{ Page: { characters: any[] } }>(query, {
    search: searchQuery.trim(),
  });
  return data.Page.characters.map(mapRawCharacter);
}
