import React from 'react';
import { AnimeMedia, WatchlistItem } from '../types/anime';
import { formatCountdown, getStatusLabel } from '../utils/format';
import { Star, Plus, Check, Clock, PlayCircle } from 'lucide-react';

interface AnimeCardProps {
  anime: AnimeMedia;
  watchlistItem?: WatchlistItem;
  onSelect: (anime: AnimeMedia) => void;
  onQuickAdd: (anime: AnimeMedia, e: React.MouseEvent) => void;
  showAiringInfo?: boolean;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({
  anime,
  watchlistItem,
  onSelect,
  onQuickAdd,
  showAiringInfo = true,
}) => {
  const isInList = !!watchlistItem;

  const metaString = [
    anime.format,
    anime.episodes ? `${anime.episodes} eps` : anime.status === 'Airing' ? 'Ongoing' : null,
    anime.year,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article
      onClick={() => onSelect(anime)}
      className="group relative flex flex-col rounded-2xl bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-200 overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:shadow-pink-500/10 hover:-translate-y-1.5 transition-all duration-200"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(anime);
        }
      }}
      aria-label={anime.title}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#221e35] light:bg-slate-100">
        {anime.image ? (
          <img
            src={anime.image}
            alt={anime.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            <PlayCircle className="w-10 h-10 opacity-30" />
          </div>
        )}

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

        {/* Top Badges: Score */}
        {anime.score != null && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-amber-300 text-xs font-bold shadow">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{anime.score.toFixed(1)}</span>
          </div>
        )}

        {/* Quick Add / In-List Button */}
        <button
          onClick={(e) => onQuickAdd(anime, e)}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer ${
            isInList
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-black/70 hover:bg-[#ff6b9d] text-white backdrop-blur-md hover:scale-110'
          }`}
          title={
            isInList
              ? `In List: ${getStatusLabel(watchlistItem.status)} (Click card for details)`
              : 'Add to Plan to Watch'
          }
          aria-label={isInList ? 'In list' : 'Add to watchlist'}
        >
          {isInList ? (
            <Check className="w-4 h-4 stroke-[3]" />
          ) : (
            <Plus className="w-4 h-4 stroke-[2.5]" />
          )}
        </button>

        {/* Watchlist status tag if present */}
        {isInList && (
          <div className="absolute bottom-2.5 left-2.5">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#e0457b] text-white shadow">
              {getStatusLabel(watchlistItem.status)}
              {watchlistItem.status === 'watching' && watchlistItem.progress > 0 && (
                <span className="ml-1 opacity-90">({watchlistItem.progress}{watchlistItem.total ? `/${watchlistItem.total}` : ''})</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1 gap-1">
        <h3
          className="text-sm font-bold text-white light:text-slate-900 group-hover:text-[#ff6b9d] transition-colors line-clamp-2 leading-snug"
          title={anime.title}
        >
          {anime.title}
        </h3>

        {metaString && (
          <p className="text-xs text-slate-400 light:text-slate-500 line-clamp-1">
            {metaString}
          </p>
        )}

        {/* Airing countdown ticker if applicable */}
        {showAiringInfo && anime.nextAiring && (
          <div className="mt-auto pt-2 flex items-center gap-1.5 text-xs text-[#ff6b9d] font-semibold border-t border-[#2e2946]/50 light:border-slate-100">
            <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse" />
            <span className="truncate">
              Ep {anime.nextAiring.ep} · {formatCountdown(anime.nextAiring.at)}
            </span>
          </div>
        )}
      </div>
    </article>
  );
};
