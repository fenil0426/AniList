import React, { useState, useMemo, useRef } from 'react';
import { WatchlistItem, WatchStatus } from '../types/anime';
import { getStatusLabel, getStatusBadgeStyle } from '../utils/format';
import {
  Plus,
  Minus,
  Search,
  Download,
  Upload,
  Star,
  Trash2,
  Tv,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
  Sparkles,
  ArrowUpDown,
  BookOpen,
  MessageSquare,
  Cloud,
} from 'lucide-react';

import { User } from 'firebase/auth';

const GoogleIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
    <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.2-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
  </svg>
);

interface MyListViewProps {
  watchlist: Record<number, WatchlistItem>;
  onSelectAnimeId: (id: number) => void;
  onUpdateStatus: (id: number, status: WatchStatus) => void;
  onUpdateProgress: (id: number, progress: number) => void;
  onRemoveItem: (id: number) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onNavigateToSearch: () => void;
  onNavigateToSeason: () => void;
  onLoadStarters?: () => void;
  user?: User | null;
  onSignIn?: () => void;
}

export const MyListView: React.FC<MyListViewProps> = ({
  watchlist,
  onSelectAnimeId,
  onUpdateStatus,
  onUpdateProgress,
  onRemoveItem,
  onExport,
  onImport,
  onNavigateToSearch,
  onNavigateToSeason,
  onLoadStarters,
  user,
  onSignIn,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | WatchStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'score' | 'title' | 'progress'>('updated');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => Object.values(watchlist), [watchlist]);

  // Statistics
  const stats = useMemo(() => {
    const watching = items.filter((i) => i.status === 'watching').length;
    const completed = items.filter((i) => i.status === 'completed').length;
    const plan = items.filter((i) => i.status === 'plan').length;
    const onHold = items.filter((i) => i.status === 'on_hold').length;
    const dropped = items.filter((i) => i.status === 'dropped').length;

    const totalEpisodes = Math.max(0, items.reduce((sum, i) => sum + Math.max(0, i.progress || 0), 0));
    const hoursNum = Math.max(0, (totalEpisodes * 24) / 60);
    const estimatedHours = hoursNum % 1 === 0 ? hoursNum.toString() : hoursNum.toFixed(1);

    const scored = items.filter((i) => i.score && i.score > 0);
    const avgScore = scored.length
      ? (scored.reduce((sum, i) => sum + (i.score || 0), 0) / scored.length).toFixed(1)
      : null;

    return {
      watching,
      completed,
      plan,
      onHold,
      dropped,
      totalEpisodes,
      estimatedHours,
      avgScore,
      totalCount: items.length,
    };
  }, [items]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    let result = items;

    if (selectedFilter !== 'all') {
      result = result.filter((i) => i.status === selectedFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.romajiTitle && i.romajiTitle.toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => {
      if (sortBy === 'score') {
        return (b.score || 0) - (a.score || 0);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'progress') {
        return (b.progress || 0) - (a.progress || 0);
      }
      return b.updatedAt - a.updatedAt;
    });
  }, [items, selectedFilter, searchQuery, sortBy]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* View Header with Title and Import/Export actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white light:text-slate-900 tracking-tight">
            My Anime Watchlist
          </h1>
          <p className="text-sm text-slate-400 light:text-slate-600 mt-1">
            Track your watching progress, personal ratings, and notes in one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-[#181527] light:bg-white hover:bg-[#221e35] light:hover:bg-slate-100 border border-[#2e2946] light:border-slate-300 text-xs font-semibold text-slate-300 light:text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Import Watchlist JSON backup"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Import</span>
          </button>

          <button
            onClick={onExport}
            disabled={items.length === 0}
            className="px-3 py-1.5 rounded-xl bg-[#181527] light:bg-white hover:bg-[#221e35] light:hover:bg-slate-100 border border-[#2e2946] light:border-slate-300 text-xs font-semibold text-slate-300 light:text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
            title="Export Watchlist to JSON backup"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Cloud Sync Status Banner */}
      {user ? (
        <div className="p-3.5 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-emerald-300">
            <Cloud className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              Connected to <b>{user.displayName || user.email}</b> &mdash; your watchlist, ratings, and thoughts are synced across your devices with Google Cloud.
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-indigo-500/15 border border-pink-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-200">
            <Cloud className="w-4 h-4 shrink-0 text-[#ff6b9d]" />
            <span>
              Your watchlist is currently saved on this browser. Sign in with Google to backup and sync your list everywhere.
            </span>
          </div>
          {onSignIn && (
            <button
              onClick={onSignIn}
              className="px-3.5 py-1.5 rounded-xl bg-[#181527] light:bg-white hover:bg-[#221e35] light:hover:bg-slate-100 border border-[#2e2946] light:border-slate-300 hover:border-[#ff6b9d]/60 text-white light:text-slate-900 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm group"
            >
              <div className="w-4 h-4 rounded-md bg-white/10 light:bg-slate-100 flex items-center justify-center p-0.5 group-hover:scale-110 transition-transform">
                <GoogleIcon />
              </div>
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      )}

      {/* Analytics / Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Watching</span>
            <Tv className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-white light:text-slate-900 font-mono">
            {stats.watching}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Currently in progress</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {stats.completed}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Shows finished</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Episodes</span>
            <Sparkles className="w-4 h-4 text-pink-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-[#ff6b9d] font-mono">
            {stats.totalEpisodes}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{stats.estimatedHours} hrs spent</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Plan to Watch</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-300 font-mono">
            {stats.plan}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">In your backlog</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-200 flex flex-col justify-between col-span-2 sm:col-span-4 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Mean Score</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-white light:text-slate-900 font-mono">
            {stats.avgScore ? `★ ${stats.avgScore}` : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across rated anime</div>
        </div>
      </div>

      {/* Search & Sort Controls Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(
            [
              { key: 'all', label: 'All', count: stats.totalCount },
              { key: 'watching', label: 'Watching', count: stats.watching },
              { key: 'plan', label: 'Plan to Watch', count: stats.plan },
              { key: 'completed', label: 'Completed', count: stats.completed },
              { key: 'on_hold', label: 'On Hold', count: stats.onHold },
              { key: 'dropped', label: 'Dropped', count: stats.dropped },
            ] as const
          ).map((tab) => {
            const active = selectedFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#ff6b9d] text-white shadow-md shadow-pink-500/20'
                    : 'bg-[#181527] light:bg-white text-slate-400 hover:text-white light:text-slate-600 light:hover:text-slate-900 border border-[#2e2946] light:border-slate-200 hover:border-[#ff6b9d]/40'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    active ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Sort, View mode */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter list..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-200 rounded-xl text-white light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#ff6b9d]"
            />
          </div>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-300 light:text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="updated">Recently Updated</option>
              <option value="score">Highest Score</option>
              <option value="title">Title (A-Z)</option>
              <option value="progress">Most Watched</option>
            </select>
          </div>

          {/* Toggle List / Grid */}
          <div className="flex items-center bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-200 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#ff6b9d] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#ff6b9d] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Watchlist Items */}
      {filteredItems.length > 0 ? (
        viewMode === 'list' ? (
          <div className="flex flex-col gap-2.5">
            {filteredItems.map((item) => {
              const total = item.total;
              const pct = total ? Math.min(100, Math.round((item.progress / total) * 100)) : item.status === 'completed' ? 100 : 0;

              return (
                <div
                  key={item.id}
                  className="group relative p-3 sm:p-4 rounded-2xl bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-200 hover:border-[#ff6b9d]/40 transition-all flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() => onSelectAnimeId(item.id)}
                    className="relative w-16 h-22 sm:w-14 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-slate-800 cursor-pointer shadow group-hover:scale-102 transition-transform"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Info & Progress */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3
                          onClick={() => onSelectAnimeId(item.id)}
                          className="text-sm sm:text-base font-bold text-white light:text-slate-900 hover:text-[#ff6b9d] transition-colors cursor-pointer truncate max-w-md"
                          title={item.title}
                        >
                          {item.title}
                        </h3>
                        {item.romajiTitle && item.romajiTitle !== item.title && (
                          <p className="text-xs text-slate-400 truncate max-w-xs">
                            {item.romajiTitle}
                          </p>
                        )}
                        {item.notes && (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-pink-300 light:text-pink-600 bg-pink-500/10 light:bg-pink-50 px-2 py-0.5 rounded-md border border-pink-500/20 max-w-sm sm:max-w-md truncate">
                            <MessageSquare className="w-3 h-3 text-[#ff6b9d] shrink-0" />
                            <span className="truncate italic">&ldquo;{item.notes}&rdquo;</span>
                          </div>
                        )}
                      </div>

                      {/* Score display */}
                      {item.score && item.score > 0 && (
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-400 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{item.score}/10</span>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="w-full">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-semibold text-slate-300 light:text-slate-700">
                          {pct}% completed
                        </span>
                        <span>
                          {item.progress} / {item.total || '?'} eps
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[#221e35] light:bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            item.status === 'completed'
                              ? 'bg-emerald-400'
                              : 'bg-gradient-to-r from-[#e0457b] to-[#ff6b9d]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions & Stepper */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#2e2946]/50">
                    {/* Status Dropdown */}
                    <select
                      value={item.status}
                      onChange={(e) => onUpdateStatus(item.id, e.target.value as WatchStatus)}
                      className="text-xs bg-[#221e35] light:bg-slate-100 border border-[#2e2946] light:border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-300 light:text-slate-800 font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="watching">Watching</option>
                      <option value="plan">Plan to Watch</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
                      <option value="dropped">Dropped</option>
                    </select>

                    {/* Stepper */}
                    <div className="flex items-center bg-[#221e35] light:bg-slate-100 border border-[#2e2946] light:border-slate-300 rounded-xl overflow-hidden">
                      <button
                        onClick={() => onUpdateProgress(item.id, Math.max(0, item.progress - 1))}
                        disabled={item.progress <= 0}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Minus 1 episode"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="px-2 text-xs font-mono font-bold text-white light:text-slate-900">
                        {item.progress}
                      </span>

                      <button
                        onClick={() =>
                          onUpdateProgress(
                            item.id,
                            item.total ? Math.min(item.total, item.progress + 1) : item.progress + 1
                          )
                        }
                        disabled={item.total != null && item.progress >= item.total}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Plus 1 episode"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick remove button */}
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                      title="Remove from list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid View for Watchlist */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filteredItems.map((item) => {
              const total = item.total;
              const pct = total ? Math.min(100, Math.round((item.progress / total) * 100)) : item.status === 'completed' ? 100 : 0;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectAnimeId(item.id)}
                  className="group relative flex flex-col rounded-2xl bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-200 overflow-hidden cursor-pointer shadow hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-800">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#e0457b] text-white shadow">
                      {getStatusLabel(item.status)}
                    </div>
                    {item.score && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/75 text-amber-300 text-[10px] font-bold">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        <span>{item.score}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col gap-1.5 flex-1 justify-between">
                    <h4 className="text-xs font-bold text-white light:text-slate-900 group-hover:text-[#ff6b9d] line-clamp-2">
                      {item.title}
                    </h4>
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span>{item.progress}/{item.total || '?'}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#ff6b9d] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-[#2e2946] light:border-slate-200 bg-[#181527]/30 light:bg-slate-50 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#e0457b]/20 to-[#8b5cf6]/20 flex items-center justify-center text-3xl mb-4">
            🌸
          </div>
          <h3 className="text-xl font-bold text-white light:text-slate-900 mb-1">
            {items.length === 0
              ? 'Your watchlist is empty'
              : `No shows found for "${selectedFilter !== 'all' ? getStatusLabel(selectedFilter) : searchQuery}"`}
          </h3>
          <p className="text-sm text-slate-400 light:text-slate-600 max-w-md mb-6">
            {items.length === 0
              ? "Discover trending anime, browse this season's schedule, or search to start building your personal library."
              : 'Try selecting a different filter or clearing your search term.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onNavigateToSearch}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#e0457b] to-[#ff6b9d] text-white font-bold text-xs shadow-lg shadow-pink-500/20 hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Search Anime</span>
            </button>
            <button
              onClick={onNavigateToSeason}
              className="px-5 py-2.5 rounded-xl bg-[#221e35] light:bg-slate-200 text-slate-200 light:text-slate-800 font-bold text-xs hover:bg-[#2e2946] transition-all cursor-pointer flex items-center gap-2"
            >
              <Tv className="w-4 h-4 text-violet-400" />
              <span>Browse This Season</span>
            </button>
            {items.length === 0 && onLoadStarters && (
              <button
                onClick={onLoadStarters}
                className="px-4 py-2.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 text-[#ff6b9d] font-bold text-xs border border-pink-500/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Starter Shows</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
