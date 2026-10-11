import React, { useState, useEffect } from 'react';
import { AnimeMedia, WatchlistItem, WatchStatus } from '../types/anime';
import { formatAiringDate, formatAiringTime, formatCountdown, getStatusLabel } from '../utils/format';
import {
  X,
  Star,
  Clock,
  Plus,
  Minus,
  Check,
  CheckCircle2,
  Trash2,
  Tv,
  Film,
  Building2,
  Calendar,
  Layers,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface MediaModalProps {
  anime: AnimeMedia | null;
  watchlistItem?: WatchlistItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (anime: AnimeMedia, status: WatchStatus) => void;
  onUpdateProgress: (animeId: number, newProgress: number) => void;
  onUpdateScore: (animeId: number, score: number) => void;
  onUpdateNotes: (animeId: number, notes: string) => void;
  onSubmitReview?: (anime: AnimeMedia, score: number, notes: string) => void;
  onRemoveFromList: (animeId: number) => void;
  onSelectCharacter?: (charId: number) => void;
}

const SCORE_LABELS: Record<number, string> = {
  10: 'Masterpiece (10/10)',
  9: 'Great (9/10)',
  8: 'Very Good (8/10)',
  7: 'Good (7/10)',
  6: 'Fine (6/10)',
  5: 'Average (5/10)',
  4: 'Bad (4/10)',
  3: 'Very Bad (3/10)',
  2: 'Horrible (2/10)',
  1: 'Appalling (1/10)',
};

export const MediaModal: React.FC<MediaModalProps> = ({
  anime,
  watchlistItem,
  isOpen,
  onClose,
  onUpdateStatus,
  onUpdateProgress,
  onUpdateScore,
  onUpdateNotes,
  onSubmitReview,
  onRemoveFromList,
  onSelectCharacter,
}) => {
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [selectedScore, setSelectedScore] = useState<number>(watchlistItem?.score || 0);
  const [personalNotes, setPersonalNotes] = useState(watchlistItem?.notes || '');
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);
  const [countdownText, setCountdownText] = useState('');

  useEffect(() => {
    setSelectedScore(watchlistItem?.score || 0);
    setPersonalNotes(watchlistItem?.notes || '');
    setIsSavedFeedback(false);
  }, [anime?.id, watchlistItem?.score, watchlistItem?.notes]);

  // Live countdown update
  useEffect(() => {
    if (!anime?.nextAiring) return;
    const update = () => {
      setCountdownText(formatCountdown(anime.nextAiring!.at));
    };
    update();
    const interval = setInterval(update, 20000);
    return () => clearInterval(interval);
  }, [anime]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !anime) return null;

  const isInList = !!watchlistItem;
  const currentProgress = watchlistItem ? watchlistItem.progress : 0;
  const totalEpisodes = anime.episodes;

  const statusOptions: WatchStatus[] = ['watching', 'plan', 'completed', 'on_hold', 'dropped'];

  const handleSubmitRatingAndThoughts = (e: React.FormEvent) => {
    e.preventDefault();
    if (!anime) return;

    if (onSubmitReview) {
      onSubmitReview(anime, selectedScore, personalNotes);
    } else {
      if (!isInList) {
        onUpdateStatus(anime, 'watching');
      }
      if (selectedScore > 0) {
        onUpdateScore(anime.id, selectedScore);
      }
      onUpdateNotes(anime.id, personalNotes);
    }

    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-200 rounded-3xl shadow-2xl z-10 flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner header image if present */}
        {anime.bannerImage && (
          <div className="relative h-44 sm:h-56 w-full overflow-hidden rounded-t-3xl bg-slate-900">
            <img
              src={anime.bannerImage}
              alt={anime.title}
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#181527] light:from-white via-[#181527]/40 to-transparent" />
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md cursor-pointer transition-colors shadow-lg"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 sm:p-8 flex flex-col gap-6">
          {/* Main Info Top Section */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Poster & Quick Stats */}
            <div className="w-40 sm:w-48 shrink-0 mx-auto sm:mx-0">
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-[#2e2946] shadow-xl bg-[#221e35]">
                <img
                  src={anime.image}
                  alt={anime.title}
                  className="w-full h-full object-cover"
                />
                {anime.score != null && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md text-amber-300 text-xs font-bold shadow">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{anime.score.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* YouTube Trailer Button if available */}
              {anime.trailerId && (
                <button
                  onClick={() => setShowTrailer(!showTrailer)}
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Film className="w-3.5 h-3.5 text-rose-400" />
                  <span>{showTrailer ? 'Hide Trailer' : 'Watch Trailer'}</span>
                </button>
              )}
            </div>

            {/* Title, Genres & Details */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900 leading-tight">
                {anime.title}
              </h2>

              {anime.romajiTitle && anime.romajiTitle !== anime.title && (
                <p className="text-sm text-slate-400 light:text-slate-500 font-medium mt-1">
                  {anime.romajiTitle}
                  {anime.nativeTitle && <span className="ml-2 opacity-75 font-normal">({anime.nativeTitle})</span>}
                </p>
              )}

              {/* Genre chips */}
              {anime.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {anime.genres.map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#221e35] light:bg-slate-100 text-slate-300 light:text-slate-700 border border-[#2e2946] light:border-slate-200"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Metadata Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 text-xs">
                <div className="p-2.5 rounded-xl bg-[#221e35]/60 light:bg-slate-50 border border-[#2e2946]/60 light:border-slate-200 flex items-center gap-2">
                  <Tv className="w-4 h-4 text-pink-400" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Format</span>
                    <span className="font-semibold text-white light:text-slate-800">{anime.format}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#221e35]/60 light:bg-slate-50 border border-[#2e2946]/60 light:border-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-violet-400" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Episodes</span>
                    <span className="font-semibold text-white light:text-slate-800">
                      {anime.episodes ? `${anime.episodes} eps` : 'Ongoing'}
                      {anime.duration ? ` · ${anime.duration}m` : ''}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#221e35]/60 light:bg-slate-50 border border-[#2e2946]/60 light:border-slate-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Season</span>
                    <span className="font-semibold text-white light:text-slate-800">
                      {[anime.season, anime.year].filter(Boolean).join(' ')}
                    </span>
                  </div>
                </div>

                {anime.studios.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-[#221e35]/60 light:bg-slate-50 border border-[#2e2946]/60 light:border-slate-200 flex items-center gap-2 col-span-2 sm:col-span-3">
                    <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Studio</span>
                      <span className="font-semibold text-white light:text-slate-800 truncate">
                        {anime.studios.join(', ')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Airing Announcement Box */}
              {anime.nextAiring && (
                <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-pink-500/15 to-purple-500/15 border border-pink-500/30 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-[#ff6b9d] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-white light:text-slate-900">
                      Episode {anime.nextAiring.ep} Airing Schedule
                    </div>
                    <div className="text-slate-300 light:text-slate-600 mt-0.5">
                      {formatAiringDate(anime.nextAiring.at)}, {formatAiringTime(anime.nextAiring.at)} ·{' '}
                      <span className="font-bold text-[#ff6b9d]">
                        {countdownText || formatCountdown(anime.nextAiring.at)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Embedded Trailer if open */}
          {showTrailer && anime.trailerId && (
            <div className="aspect-video w-full rounded-2xl overflow-hidden border border-[#2e2946] shadow-xl">
              <iframe
                title={`${anime.title} Trailer`}
                src={`https://www.youtube-nocookie.com/embed/${anime.trailerId}?autoplay=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* WATCHLIST INTERACTIVE STATUS & PROGRESS PANEL */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#221e35]/80 light:bg-slate-50 border border-[#2e2946] light:border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#ff6b9d]">
                Watchlist Status & Progress
              </h4>
              {isInList && (
                <button
                  onClick={() => onRemoveFromList(anime.id)}
                  className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove from list</span>
                </button>
              )}
            </div>

            {/* Status Selector Pills */}
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((st) => {
                const active = watchlistItem?.status === st;
                return (
                  <button
                    key={st}
                    onClick={() => onUpdateStatus(anime, st)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      active
                        ? 'bg-gradient-to-r from-[#e0457b] to-[#ff6b9d] text-white shadow-md shadow-pink-500/20'
                        : 'bg-[#181527] light:bg-white text-slate-300 light:text-slate-700 border border-[#2e2946] light:border-slate-200 hover:border-[#ff6b9d]/50'
                    }`}
                  >
                    {active && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>{getStatusLabel(st)}</span>
                  </button>
                );
              })}
            </div>

            {/* Episode Stepper Controls (if in list) */}
            {isInList && (
              <div className="pt-3 border-t border-[#2e2946]/60 light:border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-300 light:text-slate-700">
                    Episodes Watched:
                  </span>
                  <div className="flex items-center bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-200 rounded-xl overflow-hidden shadow-inner">
                    <button
                      onClick={() => onUpdateProgress(anime.id, Math.max(0, currentProgress - 1))}
                      disabled={currentProgress <= 0}
                      className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-[#2e2946] light:hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      title="Minus one episode"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <div className="px-3 text-sm font-bold text-white light:text-slate-900 min-w-[3.5rem] text-center font-mono">
                      {currentProgress}
                      <span className="text-slate-400 text-xs">
                        {totalEpisodes ? ` / ${totalEpisodes}` : ' / ?'}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        onUpdateProgress(
                          anime.id,
                          totalEpisodes ? Math.min(totalEpisodes, currentProgress + 1) : currentProgress + 1
                        )
                      }
                      disabled={totalEpisodes != null && currentProgress >= totalEpisodes}
                      className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-[#2e2946] light:hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      title="Plus one episode"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {totalEpisodes != null && currentProgress < totalEpisodes && (
                    <button
                      onClick={() => onUpdateProgress(anime.id, totalEpisodes)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 cursor-pointer"
                    >
                      Mark Finished
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* DEDICATED RATING & PERSONAL THOUGHTS SUBMISSION FORM */}
          <form
            onSubmit={handleSubmitRatingAndThoughts}
            className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#221e35] to-[#181527] light:from-slate-50 light:to-white border border-[#2e2946] light:border-slate-200 shadow-lg flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-white light:text-slate-900">
                  Rate & Share Your Personal Thoughts
                </h4>
              </div>

              {selectedScore > 0 && (
                <span className="text-xs font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                  {SCORE_LABELS[selectedScore] || `★ ${selectedScore}/10`}
                </span>
              )}
            </div>

            {/* Score Selector (1 to 10) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Your Rating Score (1 to 10 Stars):
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const isSelected = selectedScore === num;
                  const isBelowOrAt = selectedScore >= num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedScore(selectedScore === num ? 0 : num)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 scale-110 shadow-lg shadow-amber-400/30 ring-2 ring-amber-300'
                          : isBelowOrAt
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
                          : 'bg-[#181527] light:bg-white text-slate-400 hover:text-white border border-[#2e2946] hover:border-amber-400/40'
                      }`}
                      title={`Score ${num}/10`}
                    >
                      {num}
                    </button>
                  );
                })}

                {selectedScore > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedScore(0)}
                    className="ml-2 text-[11px] text-slate-400 hover:text-rose-400 cursor-pointer underline"
                  >
                    Clear Score
                  </button>
                )}
              </div>
            </div>

            {/* Personal Thoughts / Review Text Area */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#ff6b9d]" />
                <span>Personal Thoughts & Review:</span>
              </label>
              <textarea
                value={personalNotes}
                onChange={(e) => setPersonalNotes(e.target.value)}
                placeholder="What did you think of the story, animation, pacing, or characters? Write your personal thoughts and memorable moments here..."
                rows={3}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-300 rounded-xl text-slate-200 light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#ff6b9d] leading-relaxed transition-colors"
              />
            </div>

            {/* Action Buttons: Submit Rating with Personal Thoughts */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#2e2946]/50">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#e0457b] via-[#ff6b9d] to-[#8b5cf6] hover:brightness-110 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-pink-500/20 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Submit Rating & Thoughts</span>
              </button>

              {isSavedFeedback && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-bounce-subtle">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Rating & thoughts saved!</span>
                </div>
              )}
            </div>
          </form>

          {/* Synopsis */}
          {anime.synopsis && (
            <div>
              <h4 className="text-sm font-bold text-white light:text-slate-900 mb-2">
                Synopsis
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 light:text-slate-600 leading-relaxed whitespace-pre-line">
                {showFullSynopsis || anime.synopsis.length < 350
                  ? anime.synopsis
                  : `${anime.synopsis.slice(0, 350)}...`}
              </p>
              {anime.synopsis.length >= 350 && (
                <button
                  onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                  className="mt-1 text-xs text-[#ff6b9d] font-bold hover:underline cursor-pointer"
                >
                  {showFullSynopsis ? 'Show less' : 'Read full synopsis'}
                </button>
              )}
            </div>
          )}

          {/* Characters and Voice Actors Section */}
          {anime.characters && anime.characters.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-white light:text-slate-900 mb-3">
                Main Characters & Cast
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {anime.characters.map((char) => (
                  <div
                    key={char.id}
                    onClick={() => onSelectCharacter && onSelectCharacter(char.id)}
                    className="p-2 rounded-xl bg-[#221e35]/60 light:bg-slate-50 border border-[#2e2946]/60 light:border-slate-200 flex items-center gap-2.5 cursor-pointer hover:border-[#ff6b9d]/60 transition-colors"
                  >
                    <img
                      src={char.image}
                      alt={char.name}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 bg-slate-800"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white light:text-slate-900 truncate">
                        {char.name}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize truncate">
                        {char.role}
                      </div>
                      {char.voiceActor && (
                        <div className="text-[10px] text-[#ff6b9d] truncate">
                          VA: {char.voiceActor.name}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
