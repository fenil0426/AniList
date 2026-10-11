import React, { useState, useEffect, useCallback } from 'react';
import { ViewTab, AnimeMedia, WatchlistItem, FavCharacter, WatchStatus } from './types/anime';
import {
  getSavedWatchlist,
  saveWatchlist,
  getSavedFavCharacters,
  saveFavCharacters,
  getSavedTheme,
  saveTheme,
  createWatchlistItemFromAnime,
  exportBackup,
  parseImportBackup,
} from './services/storage';
import { getAnimeDetails, animeCache } from './services/anilist';
import { getStatusLabel } from './utils/format';
import { Navbar } from './components/Navbar';
import { MyListView } from './components/MyListView';
import { SeasonView } from './components/SeasonView';
import { SearchView } from './components/SearchView';
import { CharactersView } from './components/CharactersView';
import { MediaModal } from './components/MediaModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  syncUserDataToFirestore,
  fetchUserDataFromFirestore,
  subscribeToUserData,
} from './services/firebase';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('list');
  const [watchlist, setWatchlist] = useState<Record<number, WatchlistItem>>(() => getSavedWatchlist());
  const [favCharacters, setFavCharacters] = useState<Record<number, FavCharacter>>(() =>
    getSavedFavCharacters()
  );
  const [theme, setTheme] = useState<'dark' | 'light'>(() => getSavedTheme());
  const [user, setUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('synced');

  const [selectedAnime, setSelectedAnime] = useState<AnimeMedia | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Apply theme class to document
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.body.className =
        'bg-[#f6f4fb] text-[#1c1830] font-[\'Outfit\',sans-serif] antialiased selection:bg-[#ff6b9d] selection:text-white';
    } else {
      document.documentElement.classList.remove('light');
      document.body.className =
        'bg-[#0e0c18] text-[#efebfa] font-[\'Outfit\',sans-serif] antialiased selection:bg-[#ff6b9d] selection:text-white';
    }
    saveTheme(theme);
  }, [theme]);

  // Sync hash routing on popstate / initial mount
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'season' || hash === 'search' || hash === 'characters' || hash === 'list') {
        setCurrentTab(hash as ViewTab);
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  // Listen to Firebase Auth state & load user data
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (currentUser) {
        setSyncStatus('syncing');
        try {
          const cloudData = await fetchUserDataFromFirestore(currentUser.uid);
          if (cloudData) {
            // Merge cloud and current local watchlist (newest updatedAt wins)
            const currentLocal = getSavedWatchlist();
            const mergedWatchlist = { ...currentLocal };
            if (cloudData.watchlist) {
              for (const [id, item] of Object.entries(cloudData.watchlist)) {
                const numId = Number(id);
                if (!mergedWatchlist[numId] || (item.updatedAt || 0) > (mergedWatchlist[numId]?.updatedAt || 0)) {
                  mergedWatchlist[numId] = item;
                }
              }
            }
            const mergedFavs = { ...getSavedFavCharacters(), ...(cloudData.favCharacters || {}) };

            setWatchlist(mergedWatchlist);
            saveWatchlist(mergedWatchlist);
            setFavCharacters(mergedFavs);
            saveFavCharacters(mergedFavs);

            await syncUserDataToFirestore(currentUser.uid, mergedWatchlist, mergedFavs);
          } else {
            await syncUserDataToFirestore(currentUser.uid, watchlist, favCharacters);
          }
          setSyncStatus('synced');

          // Subscribe for real-time sync across devices
          unsubscribeSnapshot = subscribeToUserData(currentUser.uid, (data) => {
            if (data.watchlist) {
              setWatchlist((prev) => {
                const updated = { ...prev, ...data.watchlist };
                saveWatchlist(updated);
                return updated;
              });
            }
            if (data.favCharacters) {
              setFavCharacters((prev) => {
                const updated = { ...prev, ...data.favCharacters };
                saveFavCharacters(updated);
                return updated;
              });
            }
            setSyncStatus('synced');
          });
        } catch (err) {
          console.error(err);
          setSyncStatus('error');
        }
      } else {
        setSyncStatus('synced');
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // Keyboard shortcut '/' to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        changeTab('search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save watchlist on change & sync to cloud
  const updateWatchlist = useCallback((newList: Record<number, WatchlistItem>) => {
    setWatchlist(newList);
    saveWatchlist(newList);
    if (user) {
      setSyncStatus('syncing');
      syncUserDataToFirestore(user.uid, newList, favCharacters)
        .then(() => setSyncStatus('synced'))
        .catch(() => setSyncStatus('error'));
    }
  }, [user, favCharacters]);

  // Save fav characters on change & sync to cloud
  const updateFavCharacters = useCallback((newFavs: Record<number, FavCharacter>) => {
    setFavCharacters(newFavs);
    saveFavCharacters(newFavs);
    if (user) {
      setSyncStatus('syncing');
      syncUserDataToFirestore(user.uid, watchlist, newFavs)
        .then(() => setSyncStatus('synced'))
        .catch(() => setSyncStatus('error'));
    }
  }, [user, watchlist]);

  // Handle Google Sign In
  const handleSignIn = async () => {
    try {
      setSyncStatus('syncing');
      const loggedUser = await signInWithGoogle();
      if (loggedUser) {
        addToast(`Signed in as ${loggedUser.displayName || loggedUser.email}! ☁`);
      }
    } catch (err: any) {
      setSyncStatus('error');
      if (err?.code === 'auth/unauthorized-domain') {
        addToast('This domain needs to be authorized in Firebase Auth (see console).', 'error');
      } else {
        addToast(err?.message || 'Sign in failed. Please try again.', 'error');
      }
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await signOutUser();
      addToast('Signed out of Google account.', 'info');
    } catch {
      addToast('Sign-out failed.', 'error');
    }
  };

  // Toast notification trigger
  const addToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const changeTab = (tab: ViewTab) => {
    setCurrentTab(tab);
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Anime details modal
  const handleOpenAnime = async (animeOrId: AnimeMedia | number) => {
    let base: AnimeMedia | undefined;
    const id = typeof animeOrId === 'number' ? animeOrId : animeOrId.id;

    if (typeof animeOrId === 'object') {
      base = animeOrId;
    } else {
      base = animeCache.get(id);
    }

    if (base) {
      setSelectedAnime(base);
      setIsModalOpen(true);
    }

    // Fetch full extra details (characters, studios, trailers, etc.)
    try {
      const full = await getAnimeDetails(id);
      setSelectedAnime(full);
      setIsModalOpen(true);
    } catch {
      // If network fails but base exists, we already set base
    }
  };

  // Quick Add from cards
  const handleQuickAdd = (anime: AnimeMedia, e: React.MouseEvent) => {
    e.stopPropagation();
    const existing = watchlist[anime.id];
    if (existing) {
      handleOpenAnime(anime);
      return;
    }

    const newItem = createWatchlistItemFromAnime(anime, 'plan');
    const updated = { ...watchlist, [anime.id]: newItem };
    updateWatchlist(updated);
    addToast(`Added "${anime.title}" to Plan to Watch 🌸`);
  };

  // Status update
  const handleUpdateStatus = (anime: AnimeMedia, status: WatchStatus) => {
    const existing = watchlist[anime.id];
    const item: WatchlistItem = existing
      ? {
          ...existing,
          status,
          progress:
            status === 'completed' && existing.total
              ? existing.total
              : existing.progress,
          updatedAt: Date.now(),
        }
      : createWatchlistItemFromAnime(anime, status);

    const updated = { ...watchlist, [anime.id]: item };
    updateWatchlist(updated);
    addToast(`Moved "${anime.title}" to ${getStatusLabel(status)}`);
  };

  // Progress update (stepper)
  const handleUpdateProgress = (animeId: number, progress: number) => {
    const existing = watchlist[animeId];
    if (!existing) return;

    let newStatus = existing.status;
    if (progress > 0 && existing.status === 'plan') {
      newStatus = 'watching';
    }
    if (existing.total && progress >= existing.total && existing.status !== 'completed') {
      newStatus = 'completed';
      addToast(`Finished "${existing.title}"! 🎉`);
    }

    const item: WatchlistItem = {
      ...existing,
      progress,
      status: newStatus,
      updatedAt: Date.now(),
    };

    const updated = { ...watchlist, [animeId]: item };
    updateWatchlist(updated);
  };

  // Score update
  const handleUpdateScore = (animeId: number, score: number) => {
    const existing = watchlist[animeId];
    if (!existing) return;
    const item: WatchlistItem = { ...existing, score, updatedAt: Date.now() };
    updateWatchlist({ ...watchlist, [animeId]: item });
    addToast(score > 0 ? `Rated "${existing.title}" ★ ${score}/10` : 'Rating cleared');
  };

  // Notes update
  const handleUpdateNotes = (animeId: number, notes: string) => {
    const existing = watchlist[animeId];
    if (!existing) return;
    const item: WatchlistItem = { ...existing, notes, updatedAt: Date.now() };
    updateWatchlist({ ...watchlist, [animeId]: item });
  };

  // Submit rating and personal thoughts
  const handleSubmitReview = (anime: AnimeMedia, score: number, notes: string) => {
    const existing = watchlist[anime.id];
    const defaultStatus: WatchStatus = existing ? existing.status : 'watching';
    const item: WatchlistItem = existing
      ? {
          ...existing,
          score: score > 0 ? score : undefined,
          notes: notes.trim() || undefined,
          updatedAt: Date.now(),
        }
      : {
          ...createWatchlistItemFromAnime(anime, defaultStatus),
          score: score > 0 ? score : undefined,
          notes: notes.trim() || undefined,
          updatedAt: Date.now(),
        };

    updateWatchlist({ ...watchlist, [anime.id]: item });
    if (score > 0) {
      addToast(`Submitted rating (★ ${score}/10) & thoughts for "${anime.title}"! 🌸`);
    } else {
      addToast(`Saved personal thoughts for "${anime.title}"! 🌸`);
    }
  };

  // Remove item
  const handleRemoveItem = (animeId: number) => {
    const title = watchlist[animeId]?.title || 'anime';
    const updated = { ...watchlist };
    delete updated[animeId];
    updateWatchlist(updated);
    addToast(`Removed "${title}" from watchlist`, 'info');
  };

  // Toggle favorite character
  const handleToggleFavChar = (char: any) => {
    const isSaved = !!favCharacters[char.id];
    const updated = { ...favCharacters };

    if (isSaved) {
      delete updated[char.id];
      updateFavCharacters(updated);
      addToast(`Removed ${char.name} from saved collection`, 'info');
    } else {
      updated[char.id] = {
        id: char.id,
        name: char.name,
        image: char.image || '',
        nativeName: char.nativeName,
        mediaTitle: char.media?.[0]?.title,
        addedAt: Date.now(),
      };
      updateFavCharacters(updated);
      addToast(`Saved ${char.name} to favorites ♥`);
    }
  };

  // Export
  const handleExport = () => {
    exportBackup(watchlist, favCharacters);
    addToast('Watchlist backup downloaded 💾');
  };

  // Import
  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseImportBackup(text);
      if (parsed.watchlist) {
        const mergedList = { ...watchlist, ...parsed.watchlist };
        updateWatchlist(mergedList);
      }
      if (parsed.favCharacters) {
        const mergedFavs = { ...favCharacters, ...parsed.favCharacters };
        updateFavCharacters(mergedFavs);
      }
      const count = Object.keys(parsed.watchlist || {}).length;
      addToast(`Successfully restored ${count} anime from backup! 🎉`);
    } catch {
      addToast('Invalid backup file. Please select a valid AniHub JSON backup.', 'error');
    }
  };

  // Starter sample shows
  const handleLoadStarters = () => {
    const starters: Record<number, WatchlistItem> = {
      154587: {
        id: 154587,
        kind: 'anime',
        title: "Frieren: Beyond Journey's End",
        romajiTitle: 'Sousou no Frieren',
        image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-gvi0hkymvsTG.jpg',
        total: 28,
        unit: 'ep',
        status: 'completed',
        progress: 28,
        score: 10,
        notes: 'Masterpiece storytelling, animation, and soundtrack.',
        addedAt: Date.now() - 3600000 * 24 * 7,
        updatedAt: Date.now() - 3600000 * 5,
      },
      113415: {
        id: 113415,
        kind: 'anime',
        title: 'Jujutsu Kaisen',
        romajiTitle: 'Jujutsu Kaisen',
        image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg',
        total: 24,
        unit: 'ep',
        status: 'watching',
        progress: 18,
        score: 9,
        notes: 'The Kyoto Goodwill Event arc fights are incredible.',
        addedAt: Date.now() - 3600000 * 24 * 3,
        updatedAt: Date.now() - 3600000 * 2,
      },
      140960: {
        id: 140960,
        kind: 'anime',
        title: 'Spy x Family',
        romajiTitle: 'SPY×FAMILY',
        image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140960-vXxiyulz8Ta6.jpg',
        total: 12,
        unit: 'ep',
        status: 'plan',
        progress: 0,
        addedAt: Date.now() - 3600000 * 24,
        updatedAt: Date.now() - 3600000 * 24,
      },
    };
    updateWatchlist(starters);
    addToast('Loaded starter anime shows! 🎉');
  };

  const watchingCount = Object.values(watchlist).filter((i) => i.status === 'watching').length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={changeTab}
        watchingCount={watchingCount}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        syncStatus={syncStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'list' && (
          <MyListView
            watchlist={watchlist}
            onSelectAnimeId={handleOpenAnime}
            onUpdateStatus={(id, status) => {
              const item = watchlist[id];
              if (item) handleUpdateStatus(item as any, status);
            }}
            onUpdateProgress={handleUpdateProgress}
            onRemoveItem={handleRemoveItem}
            onExport={handleExport}
            onImport={handleImport}
            onNavigateToSearch={() => changeTab('search')}
            onNavigateToSeason={() => changeTab('season')}
            onLoadStarters={handleLoadStarters}
            user={user}
            onSignIn={handleSignIn}
          />
        )}

        {currentTab === 'season' && (
          <SeasonView
            watchlist={watchlist}
            onSelectAnime={handleOpenAnime}
            onQuickAdd={handleQuickAdd}
          />
        )}

        {currentTab === 'search' && (
          <SearchView
            watchlist={watchlist}
            onSelectAnime={handleOpenAnime}
            onQuickAdd={handleQuickAdd}
          />
        )}

        {currentTab === 'characters' && (
          <CharactersView
            favCharacters={favCharacters}
            onToggleFav={handleToggleFavChar}
            onSelectAnimeId={handleOpenAnime}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2e2946]/60 light:border-slate-200 py-8 px-4 text-center text-xs text-slate-500 light:text-slate-600 mb-14 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#ff6b9d]">AniHub</span>
            <span>· Anime watchlist, seasonal countdowns, and character discovery</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Real-time catalog sync</span>
            <span>·</span>
            <span>Auto-saved to device</span>
          </div>
        </div>
      </footer>

      {/* Anime Media Modal */}
      <MediaModal
        anime={selectedAnime}
        watchlistItem={selectedAnime ? watchlist[selectedAnime.id] : undefined}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        onUpdateProgress={handleUpdateProgress}
        onUpdateScore={handleUpdateScore}
        onUpdateNotes={handleUpdateNotes}
        onSubmitReview={handleSubmitReview}
        onRemoveFromList={(id) => {
          handleRemoveItem(id);
          setIsModalOpen(false);
        }}
        onSelectCharacter={() => {
          changeTab('characters');
          setIsModalOpen(false);
        }}
      />

      {/* Floating Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
