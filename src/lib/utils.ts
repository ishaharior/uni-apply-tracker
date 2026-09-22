import { OutreachStatusType } from '@/types';

export interface StatusMeta {
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
  icon: string;
}

export const STATUS_MAP: Record<OutreachStatusType, StatusMeta> = {
  not_contacted: {
    label: 'Not Contacted',
    shortLabel: 'Untouched',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.08)',
    border: 'rgba(148, 163, 184, 0.25)',
    glow: 'rgba(148, 163, 184, 0.1)',
    icon: '⚪',
  },
  drafting: {
    label: 'Drafting Email',
    shortLabel: 'Drafting',
    color: '#c084fc',
    bg: 'rgba(192, 132, 252, 0.12)',
    border: 'rgba(192, 132, 252, 0.3)',
    glow: 'rgba(192, 132, 252, 0.25)',
    icon: '📝',
  },
  emailed: {
    label: 'Emailed (Awaiting)',
    shortLabel: 'Emailed',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.35)',
    glow: 'rgba(56, 189, 248, 0.25)',
    icon: '📤',
  },
  positive: {
    label: 'Positive Reply',
    shortLabel: 'Positive ⭐',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.45)',
    glow: 'rgba(16, 185, 129, 0.35)',
    icon: '⭐',
  },
  neutral: {
    label: 'Neutral Reply',
    shortLabel: 'Neutral',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.3)',
    glow: 'rgba(148, 163, 184, 0.15)',
    icon: '💬',
  },
  negative: {
    label: 'Negative / No Funding',
    shortLabel: 'Negative',
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.12)',
    border: 'rgba(244, 63, 94, 0.3)',
    glow: 'rgba(244, 63, 94, 0.2)',
    icon: '❌',
  },
  interview: {
    label: 'Meeting / Interview',
    shortLabel: 'Interview 🤝',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.15)',
    border: 'rgba(236, 72, 153, 0.4)',
    glow: 'rgba(236, 72, 153, 0.35)',
    icon: '🤝',
  },
  applied: {
    label: 'Application Submitted',
    shortLabel: 'Applied 🎯',
    color: '#818cf8',
    bg: 'rgba(129, 140, 248, 0.15)',
    border: 'rgba(129, 140, 248, 0.4)',
    glow: 'rgba(129, 140, 248, 0.25)',
    icon: '🎯',
  },
  accepted: {
    label: 'Offer / Accepted',
    shortLabel: 'Accepted 🏆',
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.18)',
    border: 'rgba(251, 191, 36, 0.5)',
    glow: 'rgba(251, 191, 36, 0.4)',
    icon: '🏆',
  },
  rejected: {
    label: 'Application Rejected',
    shortLabel: 'Rejected',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.3)',
    glow: 'rgba(239, 68, 68, 0.15)',
    icon: '⛔',
  },
};

export function getStatusMeta(status: OutreachStatusType): StatusMeta {
  return STATUS_MAP[status] || STATUS_MAP.not_contacted;
}

export const COUNTRY_FLAGS: Record<string, string> = {
  'united states': '🇺🇸',
  usa: '🇺🇸',
  'united states of america': '🇺🇸',
  germany: '🇩🇪',
  canada: '🇨🇦',
  'united kingdom': '🇬🇧',
  uk: '🇬🇧',
  england: '🇬🇧',
  australia: '🇦🇺',
  france: '🇫🇷',
  netherlands: '🇳🇱',
  switzerland: '🇨🇭',
  sweden: '🇸🇪',
  norway: '🇳🇴',
  denmark: '🇩🇰',
  finland: '🇫🇮',
  italy: '🇮🇹',
  spain: '🇪🇸',
  portugal: '🇵🇹',
  ireland: '🇮🇪',
  austria: '🇦🇹',
  belgium: '🇧🇪',
  poland: '🇵🇱',
  japan: '🇯🇵',
  'south korea': '🇰🇷',
  korea: '🇰🇷',
  china: '🇨🇳',
  singapore: '🇸🇬',
  india: '🇮🇳',
  'hong kong': '🇭🇰',
  taiwan: '🇹🇼',
  'new zealand': '🇳🇿',
  brazil: '🇧🇷',
  'saudi arabia': '🇸🇦',
  'united arab emirates': '🇦🇪',
  uae: '🇦🇪',
  israel: '🇮🇱',
  czechia: '🇨🇿',
  'czech republic': '🇨🇿',
};

export function getCountryFlag(country: string): string {
  if (!country) return '🌐';
  return COUNTRY_FLAGS[country.trim().toLowerCase()] ?? '🌐';
}

export function isOverdueFollowup(dateEmailed?: string, status?: OutreachStatusType): boolean {
  if (status !== 'emailed' || !dateEmailed) return false;
  const sent = new Date(dateEmailed).getTime();
  const now = Date.now();
  const diffDays = (now - sent) / (1000 * 60 * 60 * 24);
  return diffDays >= 7;
}

export function formatDate(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}
