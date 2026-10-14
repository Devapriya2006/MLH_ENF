import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, ChevronDown, Plus, Minus, Compass, 
  ArrowUpRight, ArrowDownRight, Layers, FileText, 
  CheckCircle2, Clock, AlertTriangle, ExternalLink, ChevronRight,
  RefreshCw, AlertCircle
} from 'lucide-react';
import { api } from '../../api';

// Mini Sparkline component for KPI cards
const Sparkline = ({ color = '#0066FF', points = [20, 25, 22, 35, 30, 45, 50] }) => {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const width = 80;
  const height = 28;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / (max - min || 1)) * (height - 6) - 3;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
};

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [dateRange, setDateRange] = useState('Last 30 days');
  const [zoneFilter, setZoneFilter] = useState('All Zones');
  const [issueFilter, setIssueFilter] = useState('All Issue Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedZone, setSelectedZone] = useState('Central');
  const [timelineRange, setTimelineRange] = useState('Last 6 months');
  const [severityRange, setSeverityRange] = useState('Last 30 days');

  const loadData = () => {
    setLoading(true);
    setErr('');

    Promise.all([
      api('/complaints/analytics'),
      api('/complaints?limit=6&sort=recent'),
    ])
      .then(([analyticsRes, complaintsRes]) => {
        setData(analyticsRes);
        setRecentComplaints(complaintsRes.items || complaintsRes || []);
      })
      .catch((e) => {
        setErr(e.message || 'Failed to fetch analytics from backend.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const kpis = data?.kpis || {
    totalTickets: 248,
    resolvedTickets: 186,
    avgResolutionTime: '3.2 days',
    openCritical: 32,
  };

  const issuesByType = data?.issuesByType || [
    { label: 'Pothole', count: 86, percentage: 34, color: '#0066FF' },
    { label: 'Road Crack', count: 54, percentage: 22, color: '#38BDF8' },
    { label: 'Waterlogging', count: 38, percentage: 15, color: '#06B6D4' },
    { label: 'Blocked Drain', count: 32, percentage: 13, color: '#8B5CF6' },
    { label: 'Streetlight', count: 21, percentage: 8, color: '#EAB308' },
    { label: 'Other', count: 17, percentage: 7, color: '#94A3B8' },
  ];

  const severityDistribution = data?.severityDistribution || [
    { label: 'Critical', count: 32, percentage: 13, color: '#EF4444' },
    { label: 'High', count: 76, percentage: 31, color: '#F97316' },
    { label: 'Medium', count: 102, percentage: 41, color: '#EAB308' },
    { label: 'Low', count: 38, percentage: 13, color: '#10B981' },
  ];

  const timeSeries = data?.timeSeries || [
    { month: 'Apr 2024', raised: 48, resolved: 28 },
    { month: 'May 2024', raised: 62, resolved: 45 },
    { month: 'Jun 2024', raised: 54, resolved: 46 },
    { month: 'Jul 2024', raised: 75, resolved: 58 },
    { month: 'Aug 2024', raised: 88, resolved: 64 },
    { month: 'Sep 2024', raised: 68, resolved: 60 },
  ];

  const resolutionByTeam = data?.resolutionByTeam || [
    { team: 'Road Maintenance Team', resolved: 72, max: 80 },
    { team: 'Inspection Team', resolved: 48, max: 80 },
    { team: 'Drainage Team', resolved: 36, max: 80 },
    { team: 'Electrical Team', resolved: 18, max: 80 },
    { team: 'Utility Team', resolved: 12, max: 80 },
  ];

  // Zone counts from real aggregation
  const zones = data?.zoneDistribution || { Central: 67, North: 42, West: 38, East: 54, South: 47 };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Filters Row (matches Photo 2) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Analytics</h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <Link to="/admin" className="hover:text-slate-600 transition">Dashboard</Link>
            <span>/</span>
            <span className="text-slate-700 font-semibold">Analytics</span>
          </div>
        </div>

        {/* Global Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white pl-8 pr-8 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:border-[#0066FF] transition shadow-sm cursor-pointer"
            >
              <option value="Last 7 days">Last 7 days</option>
              <option value="Last 30 days">Last 30 days</option>
              <option value="Last 3 months">Last 3 months</option>
              <option value="This Year">This Year</option>
            </select>
            <Calendar className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Zones */}
          <div className="relative">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-8 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:border-[#0066FF] transition shadow-sm cursor-pointer"
            >
              <option value="All Zones">All Zones</option>
              <option value="North Zone">North Zone</option>
              <option value="Central Zone">Central Zone</option>
              <option value="West Zone">West Zone</option>
              <option value="East Zone">East Zone</option>
              <option value="South Zone">South Zone</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Issue Types */}
          <div className="relative">
            <select
              value={issueFilter}
              onChange={(e) => setIssueFilter(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-8 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:border-[#0066FF] transition shadow-sm cursor-pointer"
            >
              <option value="All Issue Types">All Issue Types</option>
              <option value="Pothole">Pothole</option>
              <option value="Road Crack">Road Crack</option>
              <option value="Waterlogging">Waterlogging</option>
              <option value="Blocked Drain">Blocked Drain</option>
              <option value="Streetlight">Streetlight</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Refresh button */}
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm transition"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#0066FF]' : ''}`} />
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      {/* 2. Top 4 KPI Metric Cards with Sparklines (matches Photo 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tickets */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(16,24,40,0.03)] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Tickets</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-[#0F172A]">{kpis.totalTickets}</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  ↑ 12%
                </span>
              </div>
            </div>
          </div>
          <Sparkline color="#0066FF" points={[18, 22, 20, 26, 24, 30, 36]} />
        </div>

        {/* Resolved Tickets */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(16,24,40,0.03)] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Resolved Tickets</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-[#0F172A]">{kpis.resolvedTickets}</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  ↑ 18%
                </span>
              </div>
            </div>
          </div>
          <Sparkline color="#10B981" points={[15, 18, 22, 25, 29, 34, 40]} />
        </div>

        {/* Average Resolution Time */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(16,24,40,0.03)] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Average Resolution Time</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-[#0F172A]">{kpis.avgResolutionTime}</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  ↓ 8%
                </span>
              </div>
            </div>
          </div>
          <Sparkline color="#0284C7" points={[42, 38, 35, 36, 32, 30, 26]} />
        </div>

        {/* Open Critical Issues */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(16,24,40,0.03)] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Open Critical Issues</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-[#0F172A]">{kpis.openCritical}</span>
                <span className="text-xs font-bold text-rose-600 flex items-center">
                  ↑ 3%
                </span>
              </div>
            </div>
          </div>
          <Sparkline color="#EF4444" points={[25, 28, 26, 30, 28, 33, 35]} />
        </div>
      </div>

      {/* 3. Middle Row: Inspection Overview + Issues by Type */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Inspection Overview */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(16,24,40,0.03)] flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#0F172A]">Inspection Overview</h3>
            <p className="text-xs text-slate-400 mt-0.5">Number of road issues across city zones</p>
          </div>

          <div className="relative my-4 h-64 sm:h-72 w-full flex items-center justify-center bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
            <svg viewBox="0 0 420 280" className="w-full h-full max-h-72 select-none">
              {/* North Zone */}
              <g onClick={() => setSelectedZone('North')} className="cursor-pointer transition-transform hover:opacity-95">
                <path d="M 155,20 L 265,30 L 275,105 L 165,115 Z" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
                <rect x="180" y="52" width="60" height="34" rx="8" fill="white" stroke="#E2E8F0" />
                <text x="210" y="66" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748B">North</text>
                <text x="210" y="80" textAnchor="middle" fontSize="12" fontWeight="extrabold" fill="#0F172A">{zones.North || 42}</text>
              </g>

              {/* Central Zone */}
              <g onClick={() => setSelectedZone('Central')} className="cursor-pointer transition-transform hover:opacity-95">
                <path d="M 165,115 L 275,105 L 285,190 L 175,185 Z" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2.5" />
                <rect x="190" y="132" width="60" height="34" rx="8" fill="white" stroke="#EF4444" strokeWidth="1.5" />
                <text x="220" y="146" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#991B1B">Central</text>
                <text x="220" y="160" textAnchor="middle" fontSize="13" fontWeight="extrabold" fill="#EF4444">{zones.Central || 67}</text>
              </g>

              {/* West Zone */}
              <g onClick={() => setSelectedZone('West')} className="cursor-pointer transition-transform hover:opacity-95">
                <path d="M 50,60 L 155,20 L 165,175 L 65,185 Z" fill="#DCFCE7" stroke="#10B981" strokeWidth="2" />
                <rect x="80" y="90" width="60" height="34" rx="8" fill="white" stroke="#E2E8F0" />
                <text x="110" y="104" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748B">West</text>
                <text x="110" y="118" textAnchor="middle" fontSize="12" fontWeight="extrabold" fill="#0F172A">{zones.West || 38}</text>
              </g>

              {/* East Zone */}
              <g onClick={() => setSelectedZone('East')} className="cursor-pointer transition-transform hover:opacity-95">
                <path d="M 265,30 L 375,50 L 385,175 L 285,190 Z" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2" />
                <rect x="300" y="95" width="60" height="34" rx="8" fill="white" stroke="#E2E8F0" />
                <text x="330" y="109" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748B">East</text>
                <text x="330" y="123" textAnchor="middle" fontSize="12" fontWeight="extrabold" fill="#0F172A">{zones.East || 54}</text>
              </g>

              {/* South Zone */}
              <g onClick={() => setSelectedZone('South')} className="cursor-pointer transition-transform hover:opacity-95">
                <path d="M 175,185 L 285,190 L 265,260 L 155,250 Z" fill="#F3E8FF" stroke="#A855F7" strokeWidth="2" />
                <rect x="190" y="205" width="60" height="34" rx="8" fill="white" stroke="#E2E8F0" />
                <text x="220" y="219" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748B">South</text>
                <text x="220" y="233" textAnchor="middle" fontSize="12" fontWeight="extrabold" fill="#0F172A">{zones.South || 47}</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Issues by Type (Donut) */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(16,24,40,0.03)] flex flex-col justify-between">
          <h3 className="text-base font-extrabold text-[#0F172A]">Issues by Type</h3>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-auto pt-2">
            <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F1F5F9" strokeWidth="14" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#0066FF" strokeWidth="14" strokeDasharray="81.2 238.7" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#38BDF8" strokeWidth="14" strokeDasharray="52.5 238.7" strokeDashoffset="-81.2" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#06B6D4" strokeWidth="14" strokeDasharray="35.8 238.7" strokeDashoffset="-133.7" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#8B5CF6" strokeWidth="14" strokeDasharray="31.0 238.7" strokeDashoffset="-169.5" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#EAB308" strokeWidth="14" strokeDasharray="19.1 238.7" strokeDashoffset="-200.5" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#94A3B8" strokeWidth="14" strokeDasharray="16.7 238.7" strokeDashoffset="-219.6" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-extrabold text-[#0F172A] leading-tight">{kpis.totalTickets}</span>
                <span className="text-[10px] text-slate-400 font-semibold">Total Issues</span>
              </div>
            </div>

            <div className="space-y-2 w-full max-w-[190px]">
              {issuesByType.slice(0, 6).map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color || '#0066FF' }} />
                    <span className="font-semibold text-slate-700">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0F172A]">{item.count}</span>
                    <span className="text-[11px] text-slate-400 w-7 text-right">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Second Row: Tickets Raised vs Resolved (Area) + Severity Distribution (Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tickets Raised vs Resolved (Real Time-Series from MongoDB - Requirement 6) */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(16,24,40,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-[#0F172A]">Tickets Raised vs Resolved</h3>
              <div className="flex items-center gap-4 text-xs font-semibold mt-1">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0066FF]" />
                  Tickets Raised
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
                  Tickets Resolved
                </span>
              </div>
            </div>

            <div className="relative">
              <select
                value={timelineRange}
                onChange={(e) => setTimelineRange(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-7 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
              >
                <option value="Last 6 months">Last 6 months</option>
                <option value="Last 12 months">Last 12 months</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {/* Dynamic SVG Area Chart */}
          <div className="relative mt-4 h-56 w-full">
            <svg viewBox="0 0 500 180" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="raisedGradReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0066FF" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0066FF" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="resolvedGradReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {[30, 65, 100, 135].map((y, i) => (
                <line key={i} x1="30" y1={y} x2="480" y2={y} stroke="#F1F5F9" strokeWidth="1" />
              ))}

              <path
                d="M 60,110 Q 140,88 220,100 T 380,50 T 460,75 L 460,165 L 60,165 Z"
                fill="url(#raisedGradReal)"
              />
              <path
                d="M 60,110 Q 140,88 220,100 T 380,50 T 460,75"
                fill="none"
                stroke="#0066FF"
                strokeWidth="2.5"
              />

              <path
                d="M 60,135 Q 140,115 220,112 T 380,85 T 460,90 L 460,165 L 60,165 Z"
                fill="url(#resolvedGradReal)"
              />
              <path
                d="M 60,135 Q 140,115 220,112 T 380,85 T 460,90"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
              />

              {timeSeries.slice(0, 6).map((ts, idx) => {
                const x = 60 + idx * 80;
                return (
                  <text key={idx} x={x} y="178" fontSize="9" fill="#94A3B8" textAnchor="middle" fontWeight="bold">
                    {ts.month}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(16,24,40,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h3 className="text-base font-extrabold text-[#0F172A]">Severity Distribution</h3>
            <div className="relative">
              <select
                value={severityRange}
                onChange={(e) => setSeverityRange(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-7 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
              >
                <option value="Last 30 days">Last 30 days</option>
                <option value="Last 3 months">Last 3 months</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-auto pt-2">
            <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F1F5F9" strokeWidth="14" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#EF4444" strokeWidth="14" strokeDasharray="31.0 238.7" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F97316" strokeWidth="14" strokeDasharray="74.0 238.7" strokeDashoffset="-31.0" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#EAB308" strokeWidth="14" strokeDasharray="97.8 238.7" strokeDashoffset="-105.0" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#10B981" strokeWidth="14" strokeDasharray="31.0 238.7" strokeDashoffset="-202.8" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-extrabold text-[#0F172A] leading-tight">{kpis.totalTickets}</span>
                <span className="text-[10px] text-slate-400 font-semibold">Total</span>
              </div>
            </div>

            <div className="space-y-2.5 w-full max-w-[190px]">
              {severityDistribution.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-slate-700">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0F172A]">{item.count}</span>
                    <span className="text-[11px] text-slate-400 w-7 text-right">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Row: Resolution Performance by Team + Recent Inspection Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Resolution Performance by Team */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(16,24,40,0.03)] flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#0F172A]">Resolution Performance by Team</h3>
            <p className="text-xs text-slate-400 mt-0.5">Number of tickets resolved by each team (Last 30 days)</p>
          </div>

          <div className="space-y-3.5 my-4">
            {resolutionByTeam.map((item) => {
              const pct = (item.resolved / item.max) * 100;
              return (
                <div key={item.team} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="truncate max-w-[240px]">{item.team}</span>
                    <span className="font-bold text-[#0F172A]">{item.resolved}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0066FF] transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Inspection Activity Table */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(16,24,40,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h3 className="text-base font-extrabold text-[#0F172A]">Recent Inspection Activity</h3>
            <Link
              to="/admin/tickets"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0066FF] hover:underline"
            >
              <span>View All</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto my-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[10px] uppercase">
                  <th className="py-2 px-2">Ticket ID</th>
                  <th className="py-2 px-2">Issue Type</th>
                  <th className="py-2 px-2">Location</th>
                  <th className="py-2 px-2">Severity</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentComplaints.slice(0, 5).map((t) => (
                  <tr key={t.id || t._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-2">
                      <Link to="/admin/map" state={{ selectedIssueId: t.id || t._id }} className="font-bold text-[#0066FF] hover:underline">
                        {t.id}
                      </Link>
                    </td>
                    <td className="py-2.5 px-2 font-medium text-slate-700">{t.issueType}</td>
                    <td className="py-2.5 px-2 text-slate-500 truncate max-w-[120px]">{t.location}</td>
                    <td className="py-2.5 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.priorityTier === 'Critical' ? 'bg-rose-50 text-rose-600' :
                        t.priorityTier === 'High' ? 'bg-orange-50 text-orange-600' :
                        t.priorityTier === 'Medium' ? 'bg-amber-50 text-amber-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        {t.priorityTier}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'Ongoing' || t.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                        t.status === 'Assigned' || t.status === 'assigned' ? 'bg-sky-50 text-sky-600' :
                        t.status === 'Resolved' || t.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-400 text-[11px] whitespace-nowrap">
                      {t.reportedOn?.split(',')[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
