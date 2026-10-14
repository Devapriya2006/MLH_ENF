import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, Clock, CheckCircle2, AlertTriangle, ChevronDown, 
  Bell, ChevronRight, SlidersHorizontal, RefreshCw, AlertCircle
} from 'lucide-react';
import { api } from '../../api';
import OpenStreetMap from '../../components/OpenStreetMap';

// Mini Sparkline SVG
const Sparkline = ({ color = '#0066FF', points = [15, 18, 16, 22, 20, 26, 30] }) => {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const width = 70;
  const height = 24;
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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  
  // Filters
  const [zoneFilter, setZoneFilter] = useState('All Zones');
  const [dateFilter, setDateFilter] = useState('Last 30 days');
  const [mapType, setMapType] = useState('All Types');
  const [mapSeverity, setMapSeverity] = useState('All Severity');
  const [mapStatus, setMapStatus] = useState('All Status');

  const loadData = () => {
    setLoading(true);
    setErr('');

    Promise.all([
      api('/complaints/analytics'),
      api('/complaints?limit=300'),
    ])
      .then(([analyticsRes, complaintsRes]) => {
        setAnalytics(analyticsRes);
        setComplaints(complaintsRes.items || complaintsRes || []);
      })
      .catch((e) => {
        setErr(e.message || 'Failed to connect to CivicLens API.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter complaints for map
  const mapIssues = complaints.filter(c => {
    if (mapType !== 'All Types' && c.category !== mapType.toLowerCase() && c.issueType !== mapType) return false;
    if (mapSeverity !== 'All Severity' && c.priorityTier !== mapSeverity) return false;
    if (mapStatus !== 'All Status' && c.status.toLowerCase() !== mapStatus.toLowerCase()) return false;
    return true;
  });

  const kpis = analytics?.kpis || {
    totalTickets: complaints.length || 0,
    openTickets: complaints.filter(c => c.status !== 'resolved').length || 0,
    resolvedTickets: complaints.filter(c => c.status === 'resolved').length || 0,
    avgResolutionTime: '2.3 days',
  };

  const issuesByType = analytics?.issuesByType || [];
  const severityDistribution = analytics?.severityDistribution || [];
  const ticketsByStatus = analytics?.ticketsByStatus || [];
  const topLocations = analytics?.topLocations || [];

  const recentTickets = complaints.slice(0, 5);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Filters (matches media_1791960016118_3ae579ab.jpg) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Overview of road issues, inspections and action progress
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Zone Selector */}
          <div className="relative">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-8 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
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

          {/* Date Selector */}
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-8 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
            >
              <option value="Last 7 days">Last 7 days</option>
              <option value="Last 30 days">Last 30 days</option>
              <option value="Last 3 months">Last 3 months</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Notification Icon */}
          <button className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm transition">
            <Bell className="h-4 w-4" />
          </button>

          {/* Refresh Button */}
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

      {/* 2. Top 4 Metric KPI Cards (matches media_1791960016118_3ae579ab.jpg) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tickets */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(16,24,40,0.03)] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Total Tickets</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-[#0F172A]">{kpis.totalTickets}</span>
                <span className="text-xs font-bold text-emerald-600">↑ 12%</span>
              </div>
            </div>
          </div>
          <Sparkline color="#0066FF" points={[15, 20, 18, 25, 22, 28, 34]} />
        </div>

        {/* Open Tickets */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(16,24,40,0.03)] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Open Tickets</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-[#0F172A]">{kpis.openTickets}</span>
                <span className="text-xs font-bold text-rose-600">↑ 5%</span>
              </div>
            </div>
          </div>
          <Sparkline color="#EF4444" points={[28, 30, 27, 32, 29, 35, 38]} />
        </div>

        {/* Resolved Tickets */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(16,24,40,0.03)] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Resolved Tickets</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-[#0F172A]">{kpis.resolvedTickets}</span>
                <span className="text-xs font-bold text-emerald-600">↑ 18%</span>
              </div>
            </div>
          </div>
          <Sparkline color="#10B981" points={[12, 16, 20, 24, 28, 32, 38]} />
        </div>

        {/* Avg. Resolution Time */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(16,24,40,0.03)] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Avg. Resolution Time</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-[#0F172A]">{kpis.avgResolutionTime}</span>
                <span className="text-xs font-bold text-emerald-600">↓ 8%</span>
              </div>
            </div>
          </div>
          <Sparkline color="#0284C7" points={[40, 36, 34, 32, 28, 26, 22]} />
        </div>
      </div>

      {/* 3. Middle Row: Issue Map (All Zones) + Issues by Type & Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Issue Map (All Zones) */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(16,24,40,0.03)] flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-50 pb-3">
            <h3 className="text-base font-extrabold text-[#0F172A]">Issue Map (All Zones)</h3>
            
            {/* Map Filters */}
            <div className="flex items-center gap-2">
              <select
                value={mapType}
                onChange={(e) => setMapType(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0066FF]"
              >
                <option value="All Types">All Types</option>
                <option value="Pothole">Pothole</option>
                <option value="Road Crack">Road Crack</option>
                <option value="Waterlogging">Waterlogging</option>
              </select>

              <select
                value={mapSeverity}
                onChange={(e) => setMapSeverity(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0066FF]"
              >
                <option value="All Severity">All Severity</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                value={mapStatus}
                onChange={(e) => setMapStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0066FF]"
              >
                <option value="All Status">All Status</option>
                <option value="Reported">Reported</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* OpenStreetMap Canvas with Zones */}
          <div className="relative my-3 h-72 sm:h-80 w-full rounded-2xl overflow-hidden border border-slate-100">
            <OpenStreetMap
              center={[32.3452, 44.3572]}
              zoom={13}
              autoLocate={true}
              issues={mapIssues}
              onSelectIssue={(issue) => {
                navigate('/admin/map', { state: { selectedIssueId: issue.id || issue._id } });
              }}
              showZones={true}
              className="w-full h-full"
            />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-bold text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span>Critical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>Low</span>
            </div>
          </div>
        </div>

        {/* Issues by Type & Severity Distribution */}
        <div className="lg:col-span-5 space-y-6">
          {/* Issues by Type */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(16,24,40,0.03)]">
            <h3 className="text-sm font-extrabold text-[#0F172A] mb-3">Issues by Type</h3>

            <div className="flex items-center justify-between gap-4">
              {/* Donut SVG */}
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#F1F5F9" strokeWidth="13" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#0066FF" strokeWidth="13" strokeDasharray="81.2 238.7" strokeDashoffset="0" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#F97316" strokeWidth="13" strokeDasharray="52.5 238.7" strokeDashoffset="-81.2" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#06B6D4" strokeWidth="13" strokeDasharray="35.8 238.7" strokeDashoffset="-133.7" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#8B5CF6" strokeWidth="13" strokeDasharray="31.0 238.7" strokeDashoffset="-169.5" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#EAB308" strokeWidth="13" strokeDasharray="19.1 238.7" strokeDashoffset="-200.5" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#94A3B8" strokeWidth="13" strokeDasharray="16.7 238.7" strokeDashoffset="-219.6" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-extrabold text-[#0F172A]">{kpis.totalTickets}</span>
                  <span className="text-[9px] text-slate-400 font-bold">Total Issues</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-1.5 flex-1 min-w-[140px]">
                {issuesByType.slice(0, 5).map(item => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-slate-700 truncate max-w-[85px]">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span>{item.count}</span>
                      <span className="text-[10px] text-slate-400 w-6 text-right font-normal">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Severity Distribution */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(16,24,40,0.03)]">
            <h3 className="text-sm font-extrabold text-[#0F172A] mb-3">Severity Distribution</h3>

            <div className="flex items-center justify-between gap-4">
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#F1F5F9" strokeWidth="13" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#EF4444" strokeWidth="13" strokeDasharray="31.0 238.7" strokeDashoffset="0" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#F97316" strokeWidth="13" strokeDasharray="74.0 238.7" strokeDashoffset="-31.0" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#EAB308" strokeWidth="13" strokeDasharray="97.8 238.7" strokeDashoffset="-105.0" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#10B981" strokeWidth="13" strokeDasharray="31.0 238.7" strokeDashoffset="-202.8" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-extrabold text-[#0F172A]">{kpis.totalTickets}</span>
                  <span className="text-[9px] text-slate-400 font-bold">Total</span>
                </div>
              </div>

              <div className="space-y-2 flex-1 min-w-[140px]">
                {severityDistribution.map(item => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-slate-700">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span>{item.count}</span>
                      <span className="text-[10px] text-slate-400 w-6 text-right font-normal">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Recent Tickets + Tickets by Status + Top Issue Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Tickets Table */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(16,24,40,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h3 className="text-sm font-extrabold text-[#0F172A]">Recent Tickets</h3>
            <Link to="/admin/tickets" className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto my-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[10px] uppercase">
                  <th className="py-2 px-1">Photo</th>
                  <th className="py-2 px-2">Ticket ID</th>
                  <th className="py-2 px-2">Issue Type</th>
                  <th className="py-2 px-2">Location</th>
                  <th className="py-2 px-2">Severity</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTickets.map((t) => (
                  <tr key={t.id || t._id} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-1">
                      <img
                        src={t.images?.[0] || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=100'}
                        alt="thumb"
                        className="h-7 w-7 rounded-lg object-cover"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <Link to="/admin/map" className="font-bold text-[#0066FF] hover:underline">
                        {t.id}
                      </Link>
                    </td>
                    <td className="py-2 px-2 font-medium text-slate-800">{t.issueType}</td>
                    <td className="py-2 px-2 text-slate-500 truncate max-w-[110px]">{t.location}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.priorityTier === 'Critical' ? 'bg-rose-50 text-rose-600' :
                        t.priorityTier === 'High' ? 'bg-orange-50 text-orange-600' :
                        t.priorityTier === 'Medium' ? 'bg-amber-50 text-amber-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        {t.priorityTier}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'Ongoing' ? 'bg-blue-50 text-blue-600' :
                        t.status === 'Assigned' ? 'bg-sky-50 text-sky-600' :
                        t.status === 'In Progress' ? 'bg-purple-50 text-purple-600' :
                        t.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right text-slate-400 text-[10px] whitespace-nowrap">
                      {t.reportedOn?.split(',')[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tickets by Status (Vertical Bar Chart) */}
        <div className="lg:col-span-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(16,24,40,0.03)] flex flex-col justify-between">
          <h3 className="text-sm font-extrabold text-[#0F172A] border-b border-slate-50 pb-3">Tickets by Status</h3>

          <div className="my-auto py-2">
            {/* Vertical Bar Chart */}
            <div className="flex items-end justify-around h-44 border-b border-slate-100 pb-2 px-2">
              {ticketsByStatus.map(st => {
                const max = Math.max(...ticketsByStatus.map(s => s.count), 150);
                const heightPct = Math.max(12, Math.round((st.count / max) * 100));

                return (
                  <div key={st.status} className="flex flex-col items-center gap-1.5 flex-1">
                    <span className="text-[11px] font-bold text-[#0F172A]">{st.count}</span>
                    <div className="w-8 rounded-t-lg transition-all duration-700" style={{ height: `${heightPct}%`, backgroundColor: st.color }} />
                    <span className="text-[10px] font-semibold text-slate-500 text-center leading-tight mt-1">{st.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Issue Locations List */}
        <div className="lg:col-span-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(16,24,40,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h3 className="text-sm font-extrabold text-[#0F172A]">Top Issue Locations</h3>
            <Link to="/admin/tickets" className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3 my-auto py-2">
            {topLocations.map(loc => (
              <div key={loc.location} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 truncate max-w-[190px]">
                  <span className="text-slate-400 font-bold text-xs">{loc.rank}</span>
                  <span className="text-blue-600 font-bold">📍</span>
                  <span className="font-semibold text-slate-700 truncate">{loc.location}</span>
                </div>
                <span className="font-extrabold text-[#0F172A]">{loc.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

