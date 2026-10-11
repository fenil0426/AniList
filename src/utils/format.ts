import { WatchStatus } from '../types/anime';

export function formatCountdown(targetMs: number): string {
  const diff = targetMs - Date.now();
  if (diff <= 0) return 'Just aired';

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `in ${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `in ${hours}h ${minutes}m`;
  }
  return `in ${minutes}m`;
}

export function formatAiringTime(targetMs: number): string {
  const d = new Date(targetMs);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatAiringDate(targetMs: number): string {
  const d = new Date(targetMs);
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function getStatusLabel(status: WatchStatus): string {
  switch (status) {
    case 'watching':
      return 'Watching';
    case 'plan':
      return 'Plan to Watch';
    case 'completed':
      return 'Completed';
    case 'on_hold':
      return 'On Hold';
    case 'dropped':
      return 'Dropped';
    default:
      return status;
  }
}

export function getStatusBadgeStyle(status: WatchStatus): string {
  switch (status) {
    case 'watching':
      return 'bg-violet-500/20 text-violet-300 border-violet-500/40';
    case 'completed':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    case 'plan':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'on_hold':
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    case 'dropped':
      return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    default:
      return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
  }
}

export function getCurrentSeasonInfo(): {
  season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
  year: number;
  label: string;
} {
  const now = new Date();
  const month = now.getMonth(); // 0 to 11
  const year = now.getFullYear();

  let season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' = 'WINTER';
  if (month >= 0 && month <= 2) season = 'WINTER';
  else if (month >= 3 && month <= 5) season = 'SPRING';
  else if (month >= 6 && month <= 8) season = 'SUMMER';
  else season = 'FALL';

  const label = `${season.charAt(0)}${season.slice(1).toLowerCase()} ${year}`;
  return { season, year, label };
}

export function getNextSeasonInfo(
  currentSeason: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL',
  currentYear: number
): { season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'; year: number; label: string } {
  const order: ('WINTER' | 'SPRING' | 'SUMMER' | 'FALL')[] = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
  const idx = order.indexOf(currentSeason);
  const nextIdx = (idx + 1) % 4;
  const nextYear = nextIdx === 0 ? currentYear + 1 : currentYear;
  const season = order[nextIdx];
  return {
    season,
    year: nextYear,
    label: `${season.charAt(0)}${season.slice(1).toLowerCase()} ${nextYear}`,
  };
}

export function getPrevSeasonInfo(
  currentSeason: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL',
  currentYear: number
): { season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'; year: number; label: string } {
  const order: ('WINTER' | 'SPRING' | 'SUMMER' | 'FALL')[] = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
  const idx = order.indexOf(currentSeason);
  const prevIdx = (idx - 1 + 4) % 4;
  const prevYear = prevIdx === 3 ? currentYear - 1 : currentYear;
  const season = order[prevIdx];
  return {
    season,
    year: prevYear,
    label: `${season.charAt(0)}${season.slice(1).toLowerCase()} ${prevYear}`,
  };
}
