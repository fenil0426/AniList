import React, { useState, useEffect } from 'react';
import { CharacterDetail, FavCharacter } from '../types/anime';
import {
  getCharacterOfTheDay,
  getRandomCharacter,
  searchCharacters,
} from '../services/anilist';
import {
  Heart,
  Dices,
  Search,
  Sparkles,
  Bookmark,
  Trash2,
  RefreshCw,
} from 'lucide-react';

interface CharactersViewProps {
  favCharacters: Record<number, FavCharacter>;
  onToggleFav: (char: CharacterDetail | FavCharacter) => void;
  onSelectAnimeId: (animeId: number) => void;
}

export const CharactersView: React.FC<CharactersViewProps> = ({
  favCharacters,
  onToggleFav,
  onSelectAnimeId,
}) => {
  const [dailyChar, setDailyChar] = useState<CharacterDetail | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(true);

  const [discoveredChar, setDiscoveredChar] = useState<CharacterDetail | null>(null);
  const [rollingRandom, setRollingRandom] = useState(false);

  const [charSearchQuery, setCharSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CharacterDetail[]>([]);
  const [searching, setSearching] = useState(false);

  // Load Daily Character
  useEffect(() => {
    let isMounted = true;
    getCharacterOfTheDay()
      .then((c) => {
        if (isMounted) {
          setDailyChar(c);
          setLoadingDaily(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingDaily(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRollRandom = async () => {
    setRollingRandom(true);
    try {
      const c = await getRandomCharacter();
      setDiscoveredChar(c);
    } catch (e) {
      console.error(e);
    } finally {
      setRollingRandom(false);
    }
  };

  const handleSearchCharacters = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!charSearchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchCharacters(charSearchQuery);
      setSearchResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const savedList = Object.values(favCharacters);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white light:text-slate-900 tracking-tight flex items-center gap-2">
            <span>Anime Characters Hub</span>
            <Sparkles className="w-6 h-6 text-[#ff6b9d]" />
          </h1>
          <p className="text-sm text-slate-400 light:text-slate-600 mt-1">
            Discover a featured character each day, roll random discoveries, and bookmark your favorites.
          </p>
        </div>

        <button
          onClick={handleRollRandom}
          disabled={rollingRandom}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#e0457b] to-[#8b5cf6] hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-pink-500/20 flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto disabled:opacity-60"
        >
          <Dices className={`w-4 h-4 ${rollingRandom ? 'animate-spin' : ''}`} />
          <span>{rollingRandom ? 'Summoning...' : '🎲 Discover Random Character'}</span>
        </button>
      </div>

      {/* Discovered Random Character (if rolled) */}
      {discoveredChar && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
              Discovered via Random Roll
            </span>
            <button
              onClick={() => setDiscoveredChar(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
          <CharacterHero
            char={discoveredChar}
            isSaved={!!favCharacters[discoveredChar.id]}
            onToggleSave={() => onToggleFav(discoveredChar)}
            onSelectAnimeId={onSelectAnimeId}
            eyebrow="Special Discovery"
          />
        </section>
      )}

      {/* Character of the Day Hero */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#ff6b9d]">
            Spotlight
          </span>
          <span className="text-xs text-slate-400 font-medium">
            · {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {loadingDaily ? (
          <div className="p-8 rounded-3xl bg-[#181527] border border-[#2e2946] flex items-center justify-center min-h-[300px]">
            <div className="flex items-center gap-3 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin text-[#ff6b9d]" />
              <span>Fetching today&apos;s featured character...</span>
            </div>
          </div>
        ) : dailyChar ? (
          <CharacterHero
            char={dailyChar}
            isSaved={!!favCharacters[dailyChar.id]}
            onToggleSave={() => onToggleFav(dailyChar)}
            onSelectAnimeId={onSelectAnimeId}
            eyebrow="Character of the Day"
          />
        ) : (
          <div className="p-6 rounded-2xl bg-[#181527] text-slate-400 text-sm">
            Unable to load character of the day. Please check connection.
          </div>
        )}
      </section>

      {/* Search Characters Bar */}
      <section className="flex flex-col gap-4 pt-2">
        <h2 className="text-xl font-bold text-white light:text-slate-900">
          Find Any Anime Character
        </h2>
        <form onSubmit={handleSearchCharacters} className="relative max-w-xl">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={charSearchQuery}
            onChange={(e) => setCharSearchQuery(e.target.value)}
            placeholder="Search characters (e.g. Satoru Gojo, Frieren, Luffy, Makima)..."
            className="w-full pl-11 pr-24 py-3 text-sm bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-300 rounded-2xl text-white light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#ff6b9d]"
          />
          <button
            type="submit"
            disabled={searching || !charSearchQuery.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#e0457b] hover:bg-[#ff6b9d] text-white text-xs font-bold cursor-pointer disabled:opacity-40"
          >
            {searching ? 'Finding...' : 'Search'}
          </button>
        </form>

        {/* Character search results */}
        {searchResults.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mt-2">
            {searchResults.map((char) => (
              <div
                key={char.id}
                className="group p-3 rounded-2xl bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-200 flex flex-col justify-between gap-3 shadow hover:shadow-xl hover:border-[#ff6b9d]/50 transition-all"
              >
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-800">
                  <img
                    src={char.image}
                    alt={char.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white light:text-slate-900 truncate">
                    {char.name}
                  </h4>
                  {char.nativeName && (
                    <p className="text-[10px] text-slate-400 truncate">{char.nativeName}</p>
                  )}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2e2946]/50">
                    <span className="text-[10px] text-pink-400 flex items-center gap-1">
                      <Heart className="w-2.5 h-2.5 fill-pink-400" />
                      <span>{char.favorites.toLocaleString()}</span>
                    </span>
                    <button
                      onClick={() => onToggleFav(char)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                      title={favCharacters[char.id] ? 'Unsave' : 'Save character'}
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 ${
                          favCharacters[char.id] ? 'fill-[#ff6b9d] text-[#ff6b9d]' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Saved / Favorite Characters Library */}
      <section className="flex flex-col gap-4 pt-4 border-t border-[#2e2946]">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold text-white light:text-slate-900 flex items-center gap-2">
            <span>Saved Characters</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-[#ff6b9d]">
              {savedList.length}
            </span>
          </h2>
        </div>

        {savedList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {savedList.map((char) => (
              <div
                key={char.id}
                className="group relative p-3 rounded-2xl bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-200 flex flex-col justify-between gap-2 shadow"
              >
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-800">
                  <img
                    src={char.image}
                    alt={char.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white light:text-slate-900 truncate">
                    {char.name}
                  </h4>
                  {char.mediaTitle && (
                    <p className="text-[10px] text-slate-400 truncate">{char.mediaTitle}</p>
                  )}
                </div>
                <button
                  onClick={() => onToggleFav(char)}
                  className="w-full py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-3xl border border-dashed border-[#2e2946] text-slate-400 text-xs">
            No saved characters yet. Tap &ldquo;Save Character&rdquo; on any character you love to build your personal collection!
          </div>
        )}
      </section>
    </div>
  );
};

// Reusable Character Hero card
const CharacterHero: React.FC<{
  char: CharacterDetail;
  isSaved: boolean;
  onToggleSave: () => void;
  onSelectAnimeId: (id: number) => void;
  eyebrow: string;
}> = ({ char, isSaved, onToggleSave, onSelectAnimeId, eyebrow }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="p-5 sm:p-7 rounded-3xl bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-200 shadow-xl flex flex-col md:flex-row gap-6 items-start">
      {/* Portrait */}
      <div className="w-44 sm:w-52 shrink-0 mx-auto md:mx-0">
        <div className="aspect-[3/4.2] rounded-2xl overflow-hidden border border-[#2e2946] shadow-lg bg-[#221e35]">
          <img
            src={char.image}
            alt={char.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
        </div>
      </div>

      {/* Info & Bio */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#ff6b9d]">
            {eyebrow}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white light:text-slate-900 leading-tight">
            {char.name}
            {char.nativeName && (
              <span className="text-slate-400 font-medium text-lg ml-2 font-serif">
                ({char.nativeName})
              </span>
            )}
          </h2>

          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
            <span className="flex items-center gap-1 text-[#ff6b9d] font-bold">
              <Heart className="w-3.5 h-3.5 fill-[#ff6b9d]" />
              <span>{char.favorites.toLocaleString()} fans on AniList</span>
            </span>

            {char.nicknames.length > 0 && (
              <span>· aka {char.nicknames.slice(0, 3).join(', ')}</span>
            )}
          </div>
        </div>

        {/* Anime appearances */}
        {char.media.length > 0 && (
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">
              Featured In:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {char.media.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onSelectAnimeId(m.id)}
                  className="px-2.5 py-1 rounded-xl bg-[#221e35] light:bg-slate-100 hover:bg-[#2e2946] text-xs font-semibold text-slate-300 light:text-slate-700 border border-[#2e2946] cursor-pointer transition-colors text-left"
                >
                  <span>{m.title}</span>
                  <span className="ml-1 text-[10px] text-slate-400 capitalize">({m.role})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bio */}
        {char.about && (
          <div className="mt-1">
            <p className="text-xs sm:text-sm text-slate-300 light:text-slate-600 leading-relaxed whitespace-pre-line">
              {expanded || char.about.length < 320
                ? char.about
                : `${char.about.slice(0, 320)}...`}
            </p>
            {char.about.length >= 320 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1 text-xs text-[#ff6b9d] font-bold hover:underline cursor-pointer"
              >
                {expanded ? 'Show less' : 'Read full biography'}
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[#2e2946]/50">
          <button
            onClick={onToggleSave}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
              isSaved
                ? 'bg-gradient-to-r from-[#e0457b] to-[#ff6b9d] text-white shadow'
                : 'bg-[#221e35] hover:bg-[#2e2946] text-slate-200 border border-[#2e2946]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
            <span>{isSaved ? 'Saved in Collection' : 'Save Character'}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
