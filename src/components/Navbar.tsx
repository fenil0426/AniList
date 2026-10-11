import React, { useState, useRef, useEffect } from 'react';
import { ViewTab } from '../types/anime';
import { User } from 'firebase/auth';
import {
  ListFilter,
  CalendarDays,
  Search,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  Cloud,
  CloudCheck,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface NavbarProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  watchingCount: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  syncStatus?: 'synced' | 'syncing' | 'error' | 'offline';
}

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
    <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.2-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  watchingCount,
  theme,
  onToggleTheme,
  user,
  onSignIn,
  onSignOut,
  syncStatus = 'synced',
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const userInitial = (user?.displayName || user?.email || '?').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur-xl transition-colors bg-[#0e0c18]/85 border-[#2e2946]/80 light:bg-white/85 light:border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <button
          onClick={() => onTabChange('list')}
          className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#e0457b] via-[#ff6b9d] to-[#8b5cf6] flex items-center justify-center text-white shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform">
            <span className="font-black text-lg">花</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white light:text-slate-900 group-hover:text-[#ff6b9d] transition-colors">
                AniHub
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-pink-500/20 text-[#ff6b9d] border border-pink-500/30">
                PRO
              </span>
            </div>
          </div>
        </button>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#181527] light:bg-slate-100 p-1 rounded-full border border-[#2e2946] light:border-slate-200">
          <button
            onClick={() => onTabChange('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
              currentTab === 'list'
                ? 'bg-gradient-to-r from-[#e0457b] to-[#ff6b9d] text-white shadow-md shadow-pink-500/25'
                : 'text-slate-400 hover:text-white light:text-slate-600 light:hover:text-slate-900 hover:bg-[#221e35] light:hover:bg-slate-200'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>My List</span>
            {watchingCount > 0 && (
              <span
                className={`text-xs px-1.5 py-0.2 rounded-full font-bold ${
                  currentTab === 'list'
                    ? 'bg-black/30 text-white'
                    : 'bg-pink-500/20 text-pink-300'
                }`}
              >
                {watchingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('season')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
              currentTab === 'season'
                ? 'bg-gradient-to-r from-[#e0457b] to-[#ff6b9d] text-white shadow-md shadow-pink-500/25'
                : 'text-slate-400 hover:text-white light:text-slate-600 light:hover:text-slate-900 hover:bg-[#221e35] light:hover:bg-slate-200'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>This Season</span>
          </button>

          <button
            onClick={() => onTabChange('search')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
              currentTab === 'search'
                ? 'bg-gradient-to-r from-[#e0457b] to-[#ff6b9d] text-white shadow-md shadow-pink-500/25'
                : 'text-slate-400 hover:text-white light:text-slate-600 light:hover:text-slate-900 hover:bg-[#221e35] light:hover:bg-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Search & Browse</span>
          </button>

          <button
            onClick={() => onTabChange('characters')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
              currentTab === 'characters'
                ? 'bg-gradient-to-r from-[#e0457b] to-[#ff6b9d] text-white shadow-md shadow-pink-500/25'
                : 'text-slate-400 hover:text-white light:text-slate-600 light:hover:text-slate-900 hover:bg-[#221e35] light:hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Characters</span>
          </button>
        </nav>

        {/* Right side controls: Search shortcut, Google Account, Theme toggle */}
        <div className="flex items-center gap-2">
          {/* Quick search shortcut button on desktop */}
          <button
            onClick={() => onTabChange('search')}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#181527] light:bg-slate-100 hover:border-[#ff6b9d]/60 border border-[#2e2946] light:border-slate-300 text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            title="Search anime..."
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-[#221e35] light:bg-slate-200 rounded text-slate-400 font-mono">
              /
            </kbd>
          </button>

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-[#2e2946] light:border-slate-300 bg-[#181527] light:bg-slate-100 text-slate-300 light:text-slate-700 hover:text-[#ff6b9d] hover:border-[#ff6b9d]/50 transition-all cursor-pointer"
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>

          {/* Google Sign In / Account Dropdown */}
          <div className="relative" ref={menuRef}>
            {user ? (
              <div>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-[#181527] light:bg-slate-100 border border-[#2e2946] light:border-slate-300 hover:border-[#ff6b9d]/60 cursor-pointer transition-all"
                  aria-label="User Account"
                >
                  <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-gradient-to-tr from-[#e0457b] to-[#8b5cf6] flex items-center justify-center text-white font-black text-xs">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{userInitial}</span>
                    )}

                    {/* Sync status dot */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#181527] ${
                        syncStatus === 'syncing'
                          ? 'bg-amber-400 animate-ping'
                          : syncStatus === 'error'
                          ? 'bg-rose-500'
                          : 'bg-emerald-400'
                      }`}
                    />
                  </div>

                  <span className="text-xs font-bold text-white light:text-slate-900 hidden sm:inline max-w-[85px] truncate">
                    {user.displayName?.split(' ')[0] || 'Account'}
                  </span>
                </button>

                {/* Account Menu Popup */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-200 shadow-2xl p-3 z-50 flex flex-col gap-2.5 animate-fade-in">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#2e2946]/60 light:border-slate-100">
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-tr from-[#e0457b] to-[#8b5cf6] flex items-center justify-center text-white font-bold shrink-0">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{userInitial}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white light:text-slate-900 truncate">
                          {user.displayName || 'Signed in'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    {/* Sync Status Banner */}
                    <div className="p-2 rounded-xl bg-[#221e35]/60 light:bg-slate-50 border border-[#2e2946]/50 flex items-center gap-2 text-xs">
                      {syncStatus === 'syncing' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                          <span className="text-amber-300 font-medium">Syncing with cloud...</span>
                        </>
                      ) : syncStatus === 'error' ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="text-rose-300 font-medium">Sync retry scheduled</span>
                        </>
                      ) : (
                        <>
                          <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-emerald-400 font-medium">Synced to Google Account</span>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onSignOut();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className="h-9 px-3 rounded-xl bg-[#181527] light:bg-slate-100 hover:bg-[#221e35] light:hover:bg-slate-200 border border-[#2e2946] light:border-slate-300 hover:border-[#ff6b9d]/60 text-slate-200 light:text-slate-800 font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-sm group"
                title="Sign in with Google to sync your watchlist across devices"
              >
                <div className="w-4 h-4 rounded-md bg-white/10 light:bg-white flex items-center justify-center p-0.5 group-hover:scale-110 transition-transform shrink-0">
                  <GoogleIcon />
                </div>
                <span className="hidden sm:inline font-bold">Sign in with Google</span>
                <span className="sm:hidden font-bold">Sign in</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#141124]/95 backdrop-blur-xl border-t border-[#2e2946] px-2 py-1.5 flex items-center justify-around safe-bottom">
        <button
          onClick={() => onTabChange('list')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-semibold cursor-pointer ${
            currentTab === 'list'
              ? 'text-[#ff6b9d]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <ListFilter className="w-5 h-5" />
            {watchingCount > 0 && (
              <span className="absolute -top-1 -right-2 text-[10px] w-4 h-4 bg-[#ff6b9d] text-white rounded-full flex items-center justify-center font-bold">
                {watchingCount}
              </span>
            )}
          </div>
          <span>My List</span>
        </button>

        <button
          onClick={() => onTabChange('season')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-semibold cursor-pointer ${
            currentTab === 'season'
              ? 'text-[#ff6b9d]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarDays className="w-5 h-5" />
          <span>Season</span>
        </button>

        <button
          onClick={() => onTabChange('search')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-semibold cursor-pointer ${
            currentTab === 'search'
              ? 'text-[#ff6b9d]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </button>

        <button
          onClick={() => onTabChange('characters')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-semibold cursor-pointer ${
            currentTab === 'characters'
              ? 'text-[#ff6b9d]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span>Characters</span>
        </button>
      </div>
    </header>
  );
};
