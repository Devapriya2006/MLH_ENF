const configuredMapCenter = import.meta.env.VITE_MAP_CENTER?.split(',').map(value => value.trim()).filter(Boolean).map(Number);
export const MAP_CENTER = configuredMapCenter?.length === 2 && configuredMapCenter.every(Number.isFinite)
  && Math.abs(configuredMapCenter[0]) <= 90 && Math.abs(configuredMapCenter[1]) <= 180
  ? configuredMapCenter
  : null;

export const CATEGORIES = {
  roads: {
    label: 'Roads',
    subLabel: 'Pothole, cracks, broken asphalt',
    icon: '🛣️',
    bg: 'bg-slate-100',
    color: '#64748B',
    textColor: 'text-slate-700',
  },
  streetlights: {
    label: 'Streetlights',
    subLabel: 'Non-functional or broken pole',
    icon: '💡',
    bg: 'bg-amber-100',
    color: '#D97706',
    textColor: 'text-amber-700',
  },
  garbage: {
    label: 'Garbage',
    subLabel: 'Waste overflow, littering',
    icon: '🗑️',
    bg: 'bg-emerald-100',
    color: '#16A34A',
    textColor: 'text-emerald-700',
  },
  drainage: {
    label: 'Drainage',
    subLabel: 'Open drain, clogged sewer',
    icon: '💧',
    bg: 'bg-blue-100',
    color: '#0284C7',
    textColor: 'text-blue-700',
  },
  water_supply: {
    label: 'Water Supply',
    subLabel: 'Pipe burst, water leakage',
    icon: '🚰',
    bg: 'bg-cyan-100',
    color: '#0891B2',
    textColor: 'text-cyan-700',
  },
  public_safety: {
    label: 'Public Safety',
    subLabel: 'Open wire, falling hazard',
    icon: '🛡️',
    bg: 'bg-rose-100',
    color: '#E11D48',
    textColor: 'text-rose-700',
  },
  parks: {
    label: 'Parks & Public Places',
    subLabel: 'Broken bench, overgrown trees',
    icon: '🌳',
    bg: 'bg-green-100',
    color: '#059669',
    textColor: 'text-green-700',
  },
  other: {
    label: 'Other',
    subLabel: 'General civic concern',
    icon: '•••',
    bg: 'bg-purple-100',
    color: '#7C3AED',
    textColor: 'text-purple-700',
  },
};

// Aliases for backend backwards compatibility
export const CATEGORY_ALIASES = {
  pothole: 'roads',
  road_damage: 'roads',
  traffic_sign: 'roads',
  streetlight: 'streetlights',
  water_leakage: 'water_supply',
  waterlogging: 'drainage',
  fallen_tree: 'parks',
};

export const normalizeCategory = (cat) => {
  if (!cat) return 'other';
  if (CATEGORIES[cat]) return cat;
  if (CATEGORY_ALIASES[cat]) return CATEGORY_ALIASES[cat];
  return 'other';
};

export const DEPARTMENTS = {
  roads: 'Road & Transport',
  streetlights: 'Electrical Department',
  garbage: 'Solid Waste Management',
  drainage: 'Drainage & Sewerage',
  water_supply: 'Water Supply Department',
  public_safety: 'Disaster & Safety Management',
  parks: 'Parks & Horticulture',
  other: 'General Administration',
};

export const STATUSES = [
  ['submitted', 'Submitted'],
  ['in_progress', 'In Progress'],
  ['resolved', 'Resolved'],
];

export const STATUS_LABEL = {
  reported: 'Submitted',
  submitted: 'Submitted',
  ai_verified: 'In Progress',
  assigned: 'In Progress',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  citizen_verified: 'Resolved',
};

export const normalizeStatus = (status) => {
  if (!status) return 'Submitted';
  return STATUS_LABEL[status] || status;
};

export const isClosed = (s) => s === 'resolved' || s === 'citizen_verified';

export function band(p) {
  if (p >= 70) return { emoji: '🔴', color: '#EF4444', label: 'Critical', cls: 'bg-red-50 text-red-600 border border-red-100' };
  if (p >= 40) return { emoji: '🟡', color: '#F59E0B', label: 'Moderate', cls: 'bg-amber-50 text-amber-700 border border-amber-100' };
  return { emoji: '🟢', color: '#10B981', label: 'Low', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-100' };
}

export function formatTimeAgo(dateInput) {
  if (!dateInput) return 'Recently';
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffDays <= 0) {
    if (diffHours <= 0) return diffMin <= 1 ? 'Just now' : `${diffMin}m ago`;
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
