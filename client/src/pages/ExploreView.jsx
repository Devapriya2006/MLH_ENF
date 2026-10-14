import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, MapPin, ChevronRight } from 'lucide-react';
import MapLibreMap from '../components/MapLibreMap';
import { api } from '../api';
import { MAP_CENTER, CATEGORIES, normalizeCategory, normalizeStatus, formatTimeAgo, band, isClosed } from '../constants';
import { StatusBadge, PriorityBadge, Thumb } from '../components/Badges';

export default function ExploreView() {
  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    api('/complaints')
      .then(data => {
        const rows = data || [];
        setComplaints(rows);
        if (rows.length > 0) setSelectedIssue(rows[0]);
      })
      .catch(() => setComplaints([]));
  }, []);

  const filters = ['All', 'Roads', 'Streetlights', 'Garbage', 'Drainage'];

  const filtered = complaints.filter(c => {
    const matchesSearch = !search || 
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    if (activeFilter === 'All') return true;

    const norm = normalizeCategory(c.category);
    return CATEGORIES[norm]?.label.toLowerCase() === activeFilter.toLowerCase();
  });

  const getMarkerColor = (c) => {
    if (isClosed(c.status)) return '#10B981'; // Green
    const p = Number.isFinite(c.priority) ? c.priority : null;
    if (p === null) return '#64748B';
    if (p >= 70) return '#EF4444'; // Red
    if (p >= 40) return '#F59E0B'; // Amber
    return '#0066FF'; // Blue
  };

  const mapMarkers = filtered.filter(c =>
    Number.isFinite(c.location?.coordinates?.[1]) && Number.isFinite(c.location?.coordinates?.[0])
  ).map(c => {
    const norm = normalizeCategory(c.category);
    const cat = CATEGORIES[norm] || CATEGORIES.other;
    return {
      id: c._id,
      lat: c.location.coordinates[1],
      lng: c.location.coordinates[0],
      color: getMarkerColor(c),
      icon: cat.icon,
      title: c.title,
      popupHTML: `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
          <b style="color: #0F172A; display: block; margin-bottom: 2px;">${c.title}</b>
          <span style="color: #64748B; font-size: 11px;">${cat.label} • Priority ${Number.isFinite(c.priority) ? c.priority : 'unavailable'}</span>
        </div>
      `,
      onClick: () => setSelectedIssue(c),
    };
  });

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
          Explore Reported Issues
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          See issues reported by citizens around your area.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search location or issue type"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 pr-10 !py-2.5 text-xs rounded-2xl"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {filters.map(f => {
          const isActive = activeFilter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#0066FF] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* MapLibre Map Container Card */}
      <div className="card !p-2 h-[52vh] sm:h-[58vh] relative overflow-hidden">
        <MapLibreMap
          center={MAP_CENTER || (mapMarkers.length ? [mapMarkers[0].lat, mapMarkers[0].lng] : null)}
          zoom={13}
          markers={mapMarkers}
          interactive={true}
          className="h-full w-full rounded-2xl"
        />

        {/* Floating Map Legend */}
        <div className="absolute top-4 right-4 z-[10] bg-white/90 backdrop-blur-md rounded-2xl p-2.5 shadow-md border border-slate-100 flex items-center gap-3 text-[11px] text-slate-600 font-semibold pointer-events-none">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Critical
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Moderate
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Open
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Resolved
          </span>
        </div>
      </div>

      {/* "Nearby Issues" Card (matches Image 4 right) */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-[#0F172A]">Nearby Issues</h3>
          <Link to="/reports" className="text-xs font-semibold text-[#0066FF] hover:underline">
            View All
          </Link>
        </div>

        {selectedIssue ? (
          <Link
            to={`/complaint/${selectedIssue._id}`}
            className="group flex items-center justify-between gap-3 p-2 hover:bg-slate-50 rounded-2xl transition"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <Thumb
                url={selectedIssue.beforeImage?.url}
                category={selectedIssue.category}
                className="h-14 w-14 shrink-0"
              />
              <div className="min-w-0 space-y-0.5">
                <h4 className="text-xs font-bold text-[#0F172A] truncate group-hover:text-[#0066FF] transition">
                  {selectedIssue.title}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {selectedIssue.ticketId || `ID ${selectedIssue._id}`} • {formatTimeAgo(selectedIssue.createdAt)}
                </p>
                <div className="pt-0.5">
                  <StatusBadge status={selectedIssue.status} />
                </div>
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#0066FF] transition shrink-0" />
          </Link>
        ) : (
          <p className="text-xs text-slate-400 py-3 text-center">Tap any map marker to see nearby details.</p>
        )}
      </div>
    </div>
  );
}
