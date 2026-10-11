import React, { useState, useEffect, useRef } from 'react';
import { AnimeMedia, WatchlistItem } from '../types/anime';
import { AnimeCard } from './AnimeCard';
import { searchAnime, getTrendingAnime } from '../services/anilist';
import { Search, X, Flame, SlidersHorizontal, RefreshCw } from 'lucide-react';

interface SearchViewProps {
  watchlist: Record<number, WatchlistItem>;
  onSelectAnime: (anime: AnimeMedia) => void;
  onQuickAdd: (anime: AnimeMedia, e: React.MouseEvent) => void;
}

const GENRES = [
  'All',
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Mystery',
  'Supernatural',
  'Thriller',
  'Sports',
  'Psychological',
  'Horror',
];

const FORMATS = [
  { value: 'ALL', label: 'All Formats' },
  { value: 'TV', label: 'TV Series' },
  { value: 'MOVIE', label: 'Movie' },
  { value: 'OVA', label: 'OVA' },
  { value: 'ONA', label: 'ONA' },
  { value: 'SPECIAL', label: 'Special' },
];

const STATUSES = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'NOT_YET_RELEASED', label: '📢 Upcoming & Announced' },
  { value: 'RELEASING', label: '🟢 Airing Now' },
  { value: 'FINISHED', label: '🏁 Finished' },
];

const SORTS = [
  { value: 'POPULARITY_DESC', label: 'Most Popular' },
  { value: 'SCORE_DESC', label: 'Highest Rated' },
  { value: 'TRENDING_DESC', label: 'Trending' },
  { value: 'START_DATE_DESC', label: 'Newest First' },
];

const POPULAR_SEARCHES = [
  'Frieren',
  'Solo Leveling',
  'Demon Slayer',
  'Jujutsu Kaisen',
  'One Piece',
  'Spy x Family',
  'Chainsaw Man',
  'Attack on Titan',
];

export const SearchView: React.FC<SearchViewProps> = ({
  watchlist,
  onSelectAnime,
  onQuickAdd,
}) => {
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedSort, setSelectedSort] = useState('POPULARITY_DESC');

  const [results, setResults] = useState<AnimeMedia[]>([]);
  const [trending, setTrending] = useState<AnimeMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<any>(null);

  // Load Trending on initial mount
  useEffect(() => {
    let isMounted = true;
    getTrendingAnime(1, 18)
      .then((data) => {
        if (isMounted) setTrending(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Perform search whenever query or filters change
  useEffect(() => {
    const hasSearch = !!query.trim();
    const hasGenre = selectedGenre !== 'All';
    const hasFormat = selectedFormat !== 'ALL';
    const hasStatus = selectedStatus !== 'ALL';

    if (!hasSearch && !hasGenre && !hasFormat && !hasStatus && selectedSort === 'POPULARITY_DESC') {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const { media } = await searchAnime({
          search: query.trim() || undefined,
          genre: selectedGenre,
          format: selectedFormat,
          status: selectedStatus,
          sort: selectedSort,
          perPage: 24,
        });
        setResults(media);
      } catch (err: any) {
        setError(err.message || 'Search failed, please try again.');
      } finally {
        setLoading(false);
      }
    }, 380);

    return () => clearTimeout(debounceTimer.current);
  }, [query, selectedGenre, selectedFormat, selectedStatus, selectedSort]);

  const isBrowsingFilters =
    !!query.trim() ||
    selectedGenre !== 'All' ||
    selectedFormat !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedSort !== 'POPULARITY_DESC';

  const displayedList = isBrowsingFilters ? results : trending;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* Search Header */}
      <div>
        <h1 className="text-3xl font-black text-white light:text-slate-900 tracking-tight">
          Search & Browse Anime
        </h1>
        <p className="text-sm text-slate-400 light:text-slate-600 mt-1">
          Explore tens of thousands of anime titles, filtered by format, genre, and score.
        </p>
      </div>

      {/* Main Search Input Form */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by English or Romaji title (e.g. Frieren, Death Note, Bleach)..."
          className="w-full pl-12 pr-12 py-3.5 text-sm sm:text-base bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-300 rounded-2xl text-white light:text-slate-900 placeholder-slate-500 shadow-lg shadow-black/10 focus:outline-none focus:border-[#ff6b9d] transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Search Suggestions */}
      {!query && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-400 shrink-0 font-medium flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Popular:</span>
          </span>
          <button
            onClick={() => {
              setQuery('');
              setSelectedStatus('NOT_YET_RELEASED');
            }}
            className="px-2.5 py-1 rounded-xl bg-pink-500/20 text-[#ff6b9d] border border-pink-500/40 hover:bg-pink-500/30 transition-colors cursor-pointer shrink-0 font-bold"
          >
            📢 Announced / Upcoming
          </button>
          {POPULAR_SEARCHES.map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-2.5 py-1 rounded-xl bg-[#181527] light:bg-white hover:bg-[#221e35] text-slate-300 light:text-slate-700 border border-[#2e2946] light:border-slate-200 transition-colors cursor-pointer shrink-0"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {/* Format selector */}
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="text-xs bg-[#221e35] light:bg-slate-100 border border-[#2e2946] light:border-slate-300 rounded-xl px-3 py-2 text-slate-200 light:text-slate-800 font-semibold focus:outline-none cursor-pointer"
          >
            {FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          {/* Sort selector */}
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="text-xs bg-[#221e35] light:bg-slate-100 border border-[#2e2946] light:border-slate-300 rounded-xl px-3 py-2 text-slate-200 light:text-slate-800 font-semibold focus:outline-none cursor-pointer"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Status selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-[#221e35] light:bg-slate-100 border border-[#2e2946] light:border-slate-300 rounded-xl px-3 py-2 text-slate-200 light:text-slate-800 font-semibold focus:outline-none cursor-pointer"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Reset button if any filter applied */}
          {isBrowsingFilters && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedGenre('All');
                setSelectedFormat('ALL');
                setSelectedStatus('ALL');
                setSelectedSort('POPULARITY_DESC');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 cursor-pointer whitespace-nowrap transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 text-right">
          {loading ? (
            <span className="flex items-center gap-1.5 justify-end">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#ff6b9d]" />
              <span>Searching AniList...</span>
            </span>
          ) : isBrowsingFilters ? (
            <span>Found {displayedList.length} results</span>
          ) : (
            <span>Trending currently</span>
          )}
        </div>
      </div>

      {/* Genre Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {GENRES.map((g) => {
          const active = selectedGenre === g;
          return (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? 'bg-gradient-to-r from-[#e0457b] to-[#ff6b9d] text-white shadow-md shadow-pink-500/20'
                  : 'bg-[#181527] light:bg-white text-slate-400 hover:text-white light:text-slate-600 light:hover:text-slate-900 border border-[#2e2946] light:border-slate-200'
              }`}
            >
              {g}
            </button>
          );
        })}
      </div>

      {/* Results / Trending Grid */}
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between border-b border-[#2e2946]/70 pb-2">
          <h2 className="text-lg font-black text-white light:text-slate-900 flex items-center gap-2">
            {!isBrowsingFilters ? (
              <>
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Trending & Popular Anime</span>
              </>
            ) : (
              <span>Search Results</span>
            )}
          </h2>
          <span className="text-xs text-slate-400">
            {displayedList.length} {displayedList.length === 1 ? 'anime' : 'anime titles'}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl aspect-[2/3.5] bg-gradient-to-tr from-[#181527] to-[#221e35] animate-pulse border border-[#2e2946]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
            <div className="font-bold text-sm">Failed to fetch anime</div>
            <div className="text-xs opacity-80 mt-1">{error}</div>
          </div>
        ) : displayedList.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-[#2e2946] bg-[#181527]/30 flex flex-col items-center justify-center">
            <Search className="w-12 h-12 text-slate-500 mb-3" />
            <h3 className="text-lg font-bold text-white light:text-slate-900">
              No anime found for &ldquo;{query}&rdquo;
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Check the spelling, try the Japanese Romaji name, or reset your genre/format filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {displayedList.map((anime) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                watchlistItem={watchlist[anime.id]}
                onSelect={onSelectAnime}
                onQuickAdd={onQuickAdd}
                showAiringInfo={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
