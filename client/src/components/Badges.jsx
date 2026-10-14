import { useEffect, useState } from 'react';
import { band, normalizeStatus, CATEGORIES, normalizeCategory } from '../constants';

export const StatusBadge = ({ status, className = '' }) => {
  const norm = normalizeStatus(status);
  let style = 'bg-slate-100 text-slate-700';

  if (norm === 'Submitted') {
    style = 'bg-[#E0F2FE] text-[#0284C7] font-semibold';
  } else if (norm === 'In Progress') {
    style = 'bg-[#FEF3C7] text-[#D97706] font-semibold';
  } else if (norm === 'Resolved') {
    style = 'bg-[#DCFCE7] text-[#16A34A] font-semibold';
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs transition-colors ${style} ${className}`}>
      {norm}
    </span>
  );
};

export const PriorityBadge = ({ value }) => {
  const b = band(value);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${b.cls}`}>
      <span>{b.emoji}</span>
      <span>{b.label} · {value}</span>
    </span>
  );
};

export const CategoryChip = ({ category, showIcon = true }) => {
  const key = normalizeCategory(category);
  const c = CATEGORIES[key] || CATEGORIES.other;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
      {showIcon && <span>{c.icon}</span>}
      <span>{c.label}</span>
    </span>
  );
};

export const CategoryIconCard = ({ categoryKey, isSelected, onClick }) => {
  const cat = CATEGORIES[categoryKey] || CATEGORIES.other;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 border text-center ${
        isSelected
          ? 'bg-blue-50/80 border-[#0066FF] shadow-sm scale-105'
          : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-2 transition-transform group-hover:scale-110 ${cat.bg}`}>
        <span>{cat.icon}</span>
      </div>
      <span className="text-xs font-semibold text-slate-800 line-clamp-1">{cat.label}</span>
    </button>
  );
};

export const Thumb = ({ url, category, className = 'h-16 w-16' }) => {
  const [src, setSrc] = useState('');
  const key = normalizeCategory(category);
  const cat = CATEGORIES[key] || CATEGORIES.other;

  useEffect(() => {
    let objectUrl;
    if (!url) { setSrc(''); return; }
    if (!url.startsWith('/api/complaints/')) { setSrc(url); return; }
    const token = localStorage.getItem('cl_token');
    if (!token) { setSrc(''); return; }
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => { if (!r.ok) throw new Error('Image unavailable'); return r.blob(); })
      .then(blob => { objectUrl = URL.createObjectURL(blob); setSrc(objectUrl); })
      .catch(() => setSrc(''));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url]);

  return src ? (
    <img
      src={src}
      alt="Evidence"
      className={`${className} rounded-2xl object-cover border border-slate-100 shadow-sm`}
    />
  ) : (
    <div
      className={`${className} flex items-center justify-center rounded-2xl ${cat.bg} text-2xl border border-slate-100 shadow-sm`}
    >
      {cat.icon}
    </div>
  );
};

export const SeverityBar = ({ value }) => {
  const b = band(value);
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(5, value))}%`, background: b.color }}
      />
    </div>
  );
};
