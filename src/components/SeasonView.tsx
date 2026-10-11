import React, { useState, useEffect, useMemo } from 'react';
import { AnimeMedia, WatchlistItem } from '../types/anime';
import { AnimeCard } from './AnimeCard';
import {
  getCurrentSeasonInfo,
  getNextSeasonInfo,
  getPrevSeasonInfo,
  formatAiringDate,
  formatAiringTime,
  formatCountdown,
} from '../utils/format';
import { getSeasonalSchedule, getCurrentlyReleasingAnime } from '../services/anilist';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  Sparkles,
  RefreshCw,
  Calendar,
} from 'lucide-react';

interface SeasonViewProps {
  watchlist: Record<number, WatchlistItem>;
  onSelectAnime: (anime: AnimeMedia) => void;
  onQuickAdd: (anime: AnimeMedia, e: React.MouseEvent) => void;
}

export const SeasonView: React.FC<SeasonViewProps> = ({
  watchlist,
  onSelectAnime,
  onQuickAdd,
}) => {
  const defaultSeason = useMemo(() => getCurrentSeasonInfo(), []);
  const [season, setSeason] = useState(defaultSeason.season);
  const [year, setYear] = useState(defaultSeason.year);

  const [animeList, setAnimeList] = useState<AnimeMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [onlyMine, setOnlyMine] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [nowTick, setNowTick] = useState(Date.now());

  // Ticker for countdowns
  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const loadSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch seasonal schedule
      const { media } = await getSeasonalSchedule(season, year, 1, 50);

      // If viewing current season, also load long-running shows still airing (e.g. One Piece)
      let combined = media;
      if (season === defaultSeason.season && year === defaultSeason.year) {
        try {
          const ongoing = await getCurrentlyReleasingAnime(25);
          const seen = new Set(media.map((m) => m.id));
          const additions = ongoing.filter((m) => !seen.has(m.id));
          combined = [...media, ...additions];
        } catch {
          // ignore supplemental error
        }
      }

      setAnimeList(combined);
    } catch (err: any) {
      setError(err.message || 'Failed to load seasonal schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [season, year]);

  const handlePrevSeason = () => {
    const prev = getPrevSeasonInfo(season, year);
    setSeason(prev.season);
    setYear(prev.year);
  };

  const handleNextSeason = () => {
    const next = getNextSeasonInfo(season, year);
    setSeason(next.season);
    setYear(next.year);
  };

  const handleCurrentSeason = () => {
    const cur = getCurrentSeasonInfo();
    setSeason(cur.season);
    setYear(cur.year);
  };

  // Filtered pool
  const filteredAnime = useMemo(() => {
    let pool = animeList;
    if (onlyMine) {
      pool = pool.filter((a) => !!watchlist[a.id]);
    }
    if (selectedGenre !== 'All') {
      pool = pool.filter((a) => a.genres.includes(selectedGenre));
    }
    return pool;
  }, [animeList, onlyMine, selectedGenre, watchlist]);

  // Group by day of week / airing bucket
  const dayGroups = useMemo(() => {
    const todayStart = new Date(nowTick);
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();
    const dayMs = 86400 * 1000;

    const groups: Record<string, { label: string; sub: string; items: AnimeMedia[] }> = {};
    const unscheduled: AnimeMedia[] = [];

    filteredAnime.forEach((a) => {
      if (!a.nextAiring) {
        unscheduled.push(a);
        return;
      }

      const airingTime = a.nextAiring.at;
      const targetStart = new Date(airingTime);
      targetStart.setHours(0, 0, 0, 0);
      const targetMs = targetStart.getTime();

      const diffDays = Math.round((targetMs - todayMs) / dayMs);

      let key = 'later';
      let label = 'Airing Later';
      let sub = 'Upcoming premieres & schedule breaks';

      if (diffDays === 0) {
        key = '0';
        label = 'Today';
        sub = `${formatAiringDate(airingTime)} · Airing today`;
      } else if (diffDays === 1) {
        key = '1';
        label = 'Tomorrow';
        sub = `${formatAiringDate(airingTime)} · Airing tomorrow`;
      } else if (diffDays >= 2 && diffDays <= 6) {
        key = String(diffDays);
        label = new Date(airingTime).toLocaleDateString([], { weekday: 'long' });
        sub = `${formatAiringDate(airingTime)}`;
      }

      if (!groups[key]) {
        groups[key] = { label, sub, items: [] };
      }
      groups[key].items.push(a);
    });

    // Sort items inside groups by airing time
    Object.values(groups).forEach((g) => {
      g.items.sort((x, y) => (x.nextAiring?.at || 0) - (y.nextAiring?.at || 0));
    });

    // Sort unscheduled by score or popularity
    unscheduled.sort((x, y) => (y.score || 0) - (x.score || 0));

    return { groups, unscheduled };
  }, [filteredAnime, nowTick]);

  // Available genres in this season
  const genres = useMemo(() => {
    const set = new Set<string>();
    animeList.forEach((a) => a.genres.forEach((g) => set.add(g)));
    return ['All', ...Array.from(set).sort()];
  }, [animeList]);

  const currentSeasonLabel = `${season.charAt(0)}${season.slice(1).toLowerCase()} ${year}`;
  const isViewingCurrent = season === defaultSeason.season && year === defaultSeason.year;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-white light:text-slate-900 tracking-tight">
              Seasonal Anime Calendar
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ff6b9d]/20 text-[#ff6b9d] border border-[#ff6b9d]/30">
              {currentSeasonLabel}
            </span>
          </div>
          <p className="text-sm text-slate-400 light:text-slate-600 mt-1">
            Browse anime airing this season in your local timezone with live episode countdowns.
          </p>
        </div>

        {/* Season Navigators & Watchlist toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Season switcher */}
          <div className="flex items-center bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-300 rounded-xl p-1 shadow-sm">
            <button
              onClick={handlePrevSeason}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-[#221e35] cursor-pointer transition-colors"
              title="Previous Season"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 text-xs font-bold text-white light:text-slate-900 whitespace-nowrap">
              {currentSeasonLabel}
            </span>

            <button
              onClick={handleNextSeason}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-[#221e35] cursor-pointer transition-colors"
              title="Next Season"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {!isViewingCurrent && (
            <button
              onClick={handleCurrentSeason}
              className="px-3 py-1.5 rounded-xl bg-[#221e35] light:bg-slate-100 hover:bg-[#2e2946] text-xs font-bold text-[#ff6b9d] border border-[#2e2946] cursor-pointer transition-colors"
            >
              Jump to This Season
            </button>
          )}

          {/* Toggle "Only in my list" */}
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-300 text-xs font-semibold text-slate-300 light:text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyMine}
              onChange={(e) => setOnlyMine(e.target.checked)}
              className="w-4 h-4 accent-[#ff6b9d] rounded cursor-pointer"
            />
            <span>Only in my list</span>
          </label>
        </div>
      </div>

      {/* Genre Filter Chips */}
      {genres.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {genres.slice(0, 16).map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedGenre === g
                  ? 'bg-gradient-to-r from-[#e0457b] to-[#ff6b9d] text-white shadow-md shadow-pink-500/20'
                  : 'bg-[#181527] light:bg-white text-slate-400 hover:text-white light:text-slate-600 light:hover:text-slate-900 border border-[#2e2946] light:border-slate-200'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Content Rendering */}
      {loading ? (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin text-[#ff6b9d]" />
            <span>Loading {currentSeasonLabel} airing calendar...</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl aspect-[2/3.5] bg-gradient-to-tr from-[#181527] to-[#221e35] animate-pulse border border-[#2e2946]"
              />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between gap-4">
          <div>
            <div className="font-bold text-sm">Failed to load schedule</div>
            <div className="text-xs opacity-80 mt-0.5">{error}</div>
          </div>
          <button
            onClick={loadSchedule}
            className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-xs font-bold border border-rose-500/40 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : filteredAnime.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-[#2e2946] light:border-slate-200 bg-[#181527]/30 flex flex-col items-center justify-center">
          <Calendar className="w-12 h-12 text-slate-500 mb-3" />
          <h3 className="text-lg font-bold text-white light:text-slate-900">
            {onlyMine
              ? 'None of your watchlist anime are airing in this season'
              : 'No shows found matching criteria'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            {onlyMine
              ? 'Uncheck "Only in my list" to explore everything airing in this season.'
              : 'Try selecting a different genre or another season.'}
          </p>
        </div>
      ) : (
        /* Calendar Sections Grouped by Airing Day */
        <div className="flex flex-col gap-10">
          {['0', '1', '2', '3', '4', '5', '6', 'later'].map((key) => {
            const group = dayGroups.groups[key];
            if (!group || group.items.length === 0) return null;

            return (
              <section key={key} className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between border-b border-[#2e2946]/70 light:border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-black text-white light:text-slate-900 tracking-tight">
                      {group.label}
                    </h2>
                    <span className="text-xs text-slate-400 font-medium">
                      ({group.items.length} shows)
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{group.sub}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {group.items.map((anime) => (
                    <AnimeCard
                      key={anime.id}
                      anime={anime}
                      watchlistItem={watchlist[anime.id]}
                      onSelect={onSelectAnime}
                      onQuickAdd={onQuickAdd}
                      showAiringInfo={true}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Also This Season / Movies / Unscheduled */}
          {dayGroups.unscheduled.length > 0 && (
            <section className="flex flex-col gap-3 pt-4">
              <div className="flex items-baseline justify-between border-b border-[#2e2946]/70 light:border-slate-200 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-black text-white light:text-slate-900 tracking-tight">
                    Also This Season
                  </h2>
                  <span className="text-xs text-slate-400 font-medium">
                    (Movies, finished & unscheduled · {dayGroups.unscheduled.length} shows)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {dayGroups.unscheduled.map((anime) => (
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
            </section>
          )}
        </div>
      )}
    </div>
  );
};
