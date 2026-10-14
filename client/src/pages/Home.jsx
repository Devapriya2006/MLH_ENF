import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Camera, ChevronRight, FileText, Clock, CheckCircle2, 
  MapPin, ArrowRight, Leaf, Compass 
} from 'lucide-react';
import MapLibreMap from '../components/MapLibreMap';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  CATEGORIES, MAP_CENTER, normalizeCategory, normalizeStatus, 
  formatTimeAgo, band, isClosed 
} from '../constants';
import { StatusBadge, PriorityBadge, Thumb, CategoryIconCard } from '../components/Badges';

export default function Home({ onOpenReport }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [mySummary, setMySummary] = useState({ submitted: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    api('/complaints')
      .then(data => {
        setComplaints(data || []);
      })
      .catch(() => {
        setComplaints([]);
      })
      .finally(() => setLoading(false));
    api('/complaints/mine/summary').then(setMySummary).catch(() => {});
  }, []);

  const userName = user?.name?.split(' ')[0];

  // Counts for My Reports cards
  const submittedCount = mySummary.submitted;
  const inProgressCount = mySummary.inProgress;
  const resolvedCount = mySummary.resolved;

  const [mapCenter, setMapCenter] = useState(MAP_CENTER);
  const [userLoc, setUserLoc] = useState(null);
  const [locating, setLocating] = useState(false);

  const detectHomeLocation = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => {
          const coords = [p.coords.latitude, p.coords.longitude];
          setMapCenter(coords);
          setUserLoc(coords);
          setLocating(false);
        },
        () => {
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setLocating(false);
    }
  };

  useEffect(() => {
    detectHomeLocation();
  }, []);

  useEffect(() => {
    if (mapCenter || userLoc) return;
    const firstLocated = complaints.find(c =>
      Number.isFinite(c.location?.coordinates?.[1]) && Number.isFinite(c.location?.coordinates?.[0])
    );
    if (firstLocated) setMapCenter([firstLocated.location.coordinates[1], firstLocated.location.coordinates[0]]);
  }, [complaints, mapCenter, userLoc]);

  const filteredComplaints = selectedCategory
    ? complaints.filter(c => normalizeCategory(c.category) === selectedCategory)
    : complaints;

  // Map markers for MapLibre
  const complaintMarkers = complaints.filter(c => Number.isFinite(c.location?.coordinates?.[1]) && Number.isFinite(c.location?.coordinates?.[0])).slice(0, 10).map(c => {
    const norm = normalizeStatus(c.status);
    const color = norm === 'Resolved' ? '#16A34A' : norm === 'In Progress' ? '#D97706' : '#0284C7';
    const normCat = normalizeCategory(c.category);
    const cat = CATEGORIES[normCat] || CATEGORIES.other;

    return {
      id: c._id,
      lat: c.location.coordinates[1],
      lng: c.location.coordinates[0],
      color,
      icon: cat.icon,
      title: c.title,
      onClick: () => navigate(`/complaint/${c._id}`),
    };
  });

  const mapMarkers = [
    ...(userLoc ? [{
      id: 'current-pos-marker',
      lat: userLoc[0],
      lng: userLoc[1],
      color: '#0066FF',
      icon: '📍',
      title: 'Your Location',
    }] : []),
    ...complaintMarkers,
  ];

  return (
    <div className="space-y-5 max-w-lg lg:max-w-7xl mx-auto">
      {/* Responsive layout: on mobile stacks naturally, on desktop 2-col (left 65% / right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left main column on desktop */}
        <div className="lg:col-span-2 space-y-5">
          {/* 1. Hero Card: Greeting + "Report an Issue" (matches Desktop Image 5 & Mobile Screen 4) */}
          <div className="card relative overflow-hidden bg-gradient-to-r from-[#F0F6FF] via-white to-blue-50/20 p-5 sm:p-6 border border-blue-100/70 shadow-sm">
            <div className="relative z-10 max-w-md space-y-4">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  {userName ? `Hello, ${userName}` : 'Your neighborhood, at a glance'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Together, we can build a cleaner, safer and better community.
                </p>
              </div>

              {/* Blue Hero Action Button: "Report an Issue" */}
              <div
                onClick={onOpenReport || (() => navigate('/report'))}
                className="group relative cursor-pointer overflow-hidden rounded-2xl bg-[#0066FF] p-4 text-white shadow-[0_8px_25px_rgba(0,102,255,0.3)] transition-all duration-200 hover:shadow-[0_12px_30px_rgba(0,102,255,0.45)] hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#0066FF] shadow-sm">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold tracking-tight">Report an Issue</h2>
                      <p className="text-[11px] sm:text-xs text-blue-100 leading-tight">
                        Report a problem in your area and help improve your community.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/90 group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              </div>
            </div>

            {/* Decorative Skyline & Road on Desktop (matches Image 5) */}
            <div className="hidden sm:block absolute right-0 bottom-0 top-0 w-80 pointer-events-none opacity-90 select-none overflow-hidden">
              <svg className="absolute right-0 bottom-0 h-full w-full object-cover" viewBox="0 0 350 200" fill="none" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                {/* City buildings */}
                <rect x="180" y="70" width="35" height="130" rx="3" fill="#BFDBFE" opacity="0.6" />
                <rect x="220" y="40" width="40" height="160" rx="3" fill="#93C5FD" opacity="0.7" />
                <rect x="265" y="90" width="30" height="110" rx="3" fill="#BFDBFE" opacity="0.5" />
                <rect x="300" y="60" width="45" height="140" rx="3" fill="#60A5FA" opacity="0.4" />
                
                {/* Greenery / Trees */}
                <circle cx="160" cy="165" r="24" fill="#86EFAC" opacity="0.7" />
                <circle cx="185" cy="160" r="28" fill="#4ADE80" opacity="0.8" />
                <circle cx="215" cy="168" r="22" fill="#22C55E" opacity="0.85" />
                <circle cx="320" cy="165" r="30" fill="#16A34A" opacity="0.7" />

                {/* Streetlight pole */}
                <path d="M250 180 V100 Q250 90 260 90 H270" stroke="#64748B" strokeWidth="2.5" fill="none" />
                <ellipse cx="270" cy="90" rx="4" ry="2" fill="#FBBF24" />

                {/* Road */}
                <path d="M120 200 L240 180 L350 180 L350 200 Z" fill="#94A3B8" opacity="0.3" />
                <path d="M120 200 L350 200" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 4" />
              </svg>
            </div>
          </div>

          {/* 2. Issue Categories Section (4x2 on mobile, 8x1 on desktop) */}
          <div className="card">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="font-bold text-sm text-[#0F172A]">Issue Categories</h3>
              {selectedCategory ? (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs font-semibold text-[#0066FF] hover:underline"
                >
                  Clear filter
                </button>
              ) : (
                <span className="text-xs font-semibold text-[#0066FF] hover:underline cursor-pointer">
                  View All
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 lg:grid-cols-8 gap-2.5">
              {Object.keys(CATEGORIES).map(catKey => (
                <CategoryIconCard
                  key={catKey}
                  categoryKey={catKey}
                  isSelected={selectedCategory === catKey}
                  onClick={() => setSelectedCategory(selectedCategory === catKey ? null : catKey)}
                />
              ))}
            </div>
          </div>

          {/* 3. My Reports Summary Cards (Displayed here on mobile before Recent Reports!) */}
          <div className="card lg:hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-[#0F172A]">My Reports</h3>
              <Link to="/reports" className="text-xs font-semibold text-[#0066FF] hover:underline">
                View All
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Submitted */}
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#E0F2FE]/50 border border-[#BAE6FD]/60 text-center">
                <div className="h-8 w-8 rounded-full bg-[#BAE6FD] text-[#0284C7] flex items-center justify-center mb-1">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="text-lg font-extrabold text-[#0284C7]">{submittedCount}</span>
                <span className="text-[11px] font-semibold text-slate-600">Submitted</span>
              </div>

              {/* In Progress */}
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FEF3C7]/50 border border-[#FDE68A]/60 text-center">
                <div className="h-8 w-8 rounded-full bg-[#FDE68A] text-[#D97706] flex items-center justify-center mb-1">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-lg font-extrabold text-[#D97706]">{inProgressCount}</span>
                <span className="text-[11px] font-semibold text-slate-600">In Progress</span>
              </div>

              {/* Resolved */}
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#DCFCE7]/50 border border-[#BBF7D0]/60 text-center">
                <div className="h-8 w-8 rounded-full bg-[#BBF7D0] text-[#16A34A] flex items-center justify-center mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-lg font-extrabold text-[#16A34A]">{resolvedCount}</span>
                <span className="text-[11px] font-semibold text-slate-600">Resolved</span>
              </div>
            </div>
          </div>

          {/* 4. Recent Reports Section (Desktop Table / Mobile Cards) */}
          <div className="card">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="font-bold text-sm text-[#0F172A]">Recent Reports</h3>
              <Link to="/reports" className="text-xs font-semibold text-[#0066FF] hover:underline flex items-center gap-0.5">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loading ? (
              <p className="py-6 text-center text-xs text-slate-400">Loading issues...</p>
            ) : filteredComplaints.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-slate-500">No issues reported in this category yet.</p>
                <button
                  type="button"
                  onClick={onOpenReport || (() => navigate('/report'))}
                  className="btn-primary !py-2 !px-4 text-xs"
                >
                  Report an Issue
                </button>
              </div>
            ) : (
              <>
                {/* Desktop Table View (matches Image 5) */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                        <th className="pb-3 pl-1 font-medium">Image</th>
                        <th className="pb-3 font-medium">Issue Title</th>
                        <th className="pb-3 font-medium">Category</th>
                        <th className="pb-3 font-medium">Location</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Reported On</th>
                        <th className="pb-3 pr-1 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredComplaints.slice(0, 5).map(c => {
                        const normCat = normalizeCategory(c.category);
                        const cat = CATEGORIES[normCat] || CATEGORIES.other;
                        const locationText = c.location?.address || c.address || 'Location not provided';

                        return (
                          <tr key={c._id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="py-3 pl-1">
                              <Thumb
                                url={c.beforeImage?.url}
                                category={c.category}
                                className="h-11 w-11 rounded-xl shadow-xs"
                              />
                            </td>
                            <td className="py-3 pr-2 font-bold text-[#0F172A] max-w-[170px] truncate group-hover:text-[#0066FF] transition">
                              {c.title}
                            </td>
                            <td className="py-3 pr-2">
                              <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                                {cat.label}
                              </span>
                            </td>
                            <td className="py-3 pr-2 text-slate-500 max-w-[150px] truncate">
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="truncate">{locationText}</span>
                              </span>
                            </td>
                            <td className="py-3 pr-2">
                              <StatusBadge status={c.status} />
                            </td>
                            <td className="py-3 pr-2 text-slate-500 whitespace-nowrap">
                              {formatTimeAgo(c.createdAt)}
                            </td>
                            <td className="py-3 pr-1 text-right">
                              <Link
                                to={`/complaint/${c._id}`}
                                className="inline-flex items-center justify-center px-3.5 py-1 rounded-full text-xs font-bold text-[#0066FF] bg-[#EBF5FF] hover:bg-[#0066FF] hover:text-white transition-all shadow-2xs"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card List View (matches Screen 4 left) */}
                <div className="lg:hidden divide-y divide-slate-100">
                  {filteredComplaints.slice(0, 4).map(c => {
                    return (
                      <Link
                        key={c._id}
                        to={`/complaint/${c._id}`}
                        className="group py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 -mx-1 px-1 rounded-xl transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Thumb
                            url={c.beforeImage?.url}
                            category={c.category}
                            className="h-14 w-14 shrink-0 rounded-2xl"
                          />
                          <div className="min-w-0 space-y-0.5">
                            <h4 className="text-xs font-bold text-[#0F172A] truncate group-hover:text-[#0066FF] transition">
                              {c.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate">
                              {c.ticketId || `ID ${c._id}`} • {formatTimeAgo(c.createdAt)}
                            </p>
                            <div className="pt-0.5">
                              <StatusBadge status={c.status} />
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#0066FF] transition shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column on Desktop (matches Image 5) */}
        <div className="space-y-5">
          {/* Desktop My Reports Card */}
          <div className="card hidden lg:block">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-[#0F172A]">My Reports</h3>
              <Link to="/reports" className="text-xs font-semibold text-[#0066FF] hover:underline">
                View All
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#E0F2FE]/50 border border-[#BAE6FD]/60 text-center">
                <div className="h-8 w-8 rounded-full bg-[#BAE6FD] text-[#0284C7] flex items-center justify-center mb-1">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="text-lg font-extrabold text-[#0284C7]">{submittedCount}</span>
                <span className="text-[11px] font-semibold text-slate-600">Submitted</span>
              </div>

              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FEF3C7]/50 border border-[#FDE68A]/60 text-center">
                <div className="h-8 w-8 rounded-full bg-[#FDE68A] text-[#D97706] flex items-center justify-center mb-1">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-lg font-extrabold text-[#D97706]">{inProgressCount}</span>
                <span className="text-[11px] font-semibold text-slate-600">In Progress</span>
              </div>

              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#DCFCE7]/50 border border-[#BBF7D0]/60 text-center">
                <div className="h-8 w-8 rounded-full bg-[#BBF7D0] text-[#16A34A] flex items-center justify-center mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-lg font-extrabold text-[#16A34A]">{resolvedCount}</span>
                <span className="text-[11px] font-semibold text-slate-600">Resolved</span>
              </div>
            </div>
          </div>

          {/* Desktop Explore Map Preview */}
          <div className="card !p-3">
            <div className="flex items-center justify-between mb-2.5 px-1 pt-1">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-[#0066FF]" />
                <h3 className="font-bold text-sm text-[#0F172A]">Explore Reported Issues</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={detectHomeLocation}
                  className="text-xs font-semibold text-[#0066FF] hover:underline flex items-center gap-1"
                >
                  <MapPin className="h-3 w-3" /> {locating ? 'Locating…' : 'Locate Me'}
                </button>
                <Link to="/explore" className="text-slate-400 hover:text-slate-700">
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="h-56 w-full rounded-2xl overflow-hidden relative border border-slate-100">
              <MapLibreMap
                center={mapCenter}
                zoom={13}
                interactive={true}
                markers={mapMarkers}
                className="h-full w-full"
              />
            </div>

            {/* Category legend pills at bottom (matching Image 5!) */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600 px-1">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500" /> Roads
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> Streetlights
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Garbage
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> Drainage
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-purple-500" /> Other
              </span>
            </div>
          </div>

          {/* "Make a Difference" Card */}
          <div className="rounded-3xl bg-emerald-50/70 border border-emerald-100 p-4 sm:p-5 flex items-start gap-3.5">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Leaf className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h4 className="font-bold text-[#0F172A] text-xs sm:text-sm">Make a Difference</h4>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-1 leading-relaxed">
                Your reports help authorities take action and make our community cleaner, safer and better.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
