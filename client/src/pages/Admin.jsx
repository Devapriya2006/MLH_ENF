import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, BarChart3, Users, Wrench, CheckCircle2, 
  Clock, AlertTriangle, ArrowLeft, Filter, RefreshCw 
} from 'lucide-react';
import { api } from '../api';
import { CATEGORIES, STATUSES, isClosed, normalizeCategory, normalizeStatus } from '../constants';
import { PriorityBadge, StatusBadge, Thumb } from '../components/Badges';

const StatCard = ({ label, value, tone = 'text-[#0066FF]', bg = 'bg-blue-50', icon: Icon = BarChart3 }) => (
  <div className="card flex items-center gap-4">
    <div className={`h-12 w-12 rounded-2xl ${bg} flex items-center justify-center shrink-0`}>
      <Icon className={`h-6 w-6 ${tone}`} />
    </div>
    <div>
      <div className={`text-2xl font-extrabold ${tone}`}>{value ?? '—'}</div>
      <div className="text-xs text-slate-500 font-medium">{label}</div>
    </div>
  </div>
);

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [f, setF] = useState({ category: '', status: '', minSeverity: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const load = () => {
    setLoading(true);
    const q = new URLSearchParams({ ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)), page: String(page), limit: '50' }).toString();
    Promise.all([
      api('/complaints?' + q).then(data => { setItems(data.items); setPagination(data.pagination); }),
      api('/complaints/stats').then(setStats),
    ])
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [f, page]);

  const setStatus = (id, status) =>
    api(`/complaints/${id}/status`, { method: 'PATCH', body: { status: status === 'submitted' ? 'reported' : status } })
      .then(load)
      .catch(e => setErr(e.message));

  const retryAnalysis = id => api(`/complaints/${id}/analysis/retry`, { method: 'POST' })
    .then(load)
    .catch(e => setErr(e.message));

  const maxCat = Math.max(1, ...Object.values(stats?.byCategory || {}));
  const maxSeverity = Math.max(1, ...Object.values(stats?.bySeverity || {}));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-6 px-2.5 rounded-full bg-blue-50 text-[#0066FF] text-[11px] font-bold flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" /> Official Dashboard
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Admin Portal</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage, verify and monitor road issues across multiple city regions.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          className="btn-ghost !py-2 text-xs font-semibold gap-1.5 self-start"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Data
        </button>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Complaints" value={loading && !stats ? '…' : stats?.total} tone="text-[#0066FF]" bg="bg-blue-50" icon={BarChart3} />
        <StatCard label="Pending / Open" value={loading && !stats ? '…' : stats?.open} tone="text-amber-600" bg="bg-amber-50" icon={Clock} />
        <StatCard label="Critical (≥ 70)" value={stats?.critical} tone="text-rose-600" bg="bg-rose-50" icon={AlertTriangle} />
        <StatCard label="Avg. Fix Time (hrs)" value={stats?.avgResolutionHours} tone="text-emerald-600" bg="bg-emerald-50" icon={CheckCircle2} />
      </div>

      {/* Complaints by Category Chart */}
      {stats && stats.byCategory && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-[#0F172A]">Issues by Category</h3>
          <div className="space-y-2 pt-1">
            {Object.entries(stats.byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([k, n]) => {
                const norm = normalizeCategory(k);
                const cat = CATEGORIES[norm] || CATEGORIES.other;
                const pct = Math.round((n / maxCat) * 100);

                return (
                  <div key={k} className="flex items-center gap-3 text-xs">
                    <span className="w-36 font-semibold text-slate-700 truncate">
                      {cat.icon} {cat.label}
                    </span>
                    <div className="h-3 flex-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#0066FF] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-bold text-slate-800">{n}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {stats?.bySeverity && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-[#0F172A]">Severity Distribution</h3>
          {['minor', 'moderate', 'urgent'].map(level => {
            const count = stats.bySeverity[level] || 0;
            const color = level === 'urgent' ? 'bg-rose-500' : level === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500';
            return <div key={level} className="flex items-center gap-3 text-xs">
              <span className="w-24 capitalize font-semibold text-slate-700">{level}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${color}`} style={{ width: `${Math.round((count / maxSeverity) * 100)}%` }} /></div>
              <span className="w-8 text-right font-bold text-slate-800">{count}</span>
            </div>;
          })}
        </div>
      )}

      {/* Complaint Management Table */}
      <div className="card space-y-4">
        {/* Table Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-[#0F172A]">All Reports (Priority Ranked)</h3>
          
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={f.category}
              onChange={e => { setPage(1); setF({ ...f, category: e.target.value }); }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#0066FF]"
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>

            <select
              value={f.status}
              onChange={e => { setPage(1); setF({ ...f, status: e.target.value }); }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#0066FF]"
            >
              <option value="">All Statuses</option>
              {STATUSES.map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Issue Title</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Confirms</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(c => {
                const normCat = normalizeCategory(c.category);
                const cat = CATEGORIES[normCat] || CATEGORIES.other;

                return (
                  <tr key={c._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3">
                      <PriorityBadge value={c.priority} />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/complaint/${c._id}`}
                          className="font-bold text-[#0F172A] hover:text-[#0066FF] transition flex items-center gap-2"
                        >
                          <Thumb url={c.beforeImage?.url} category={c.category} className="h-8 w-8 rounded-lg shrink-0" />
                          <span className="truncate max-w-xs">{c.title}</span>
                        </Link>
                        {['failed', 'review_required'].includes(c.analysisStatus) && <button type="button" onClick={() => retryAnalysis(c._id)} className="text-[10px] font-semibold text-amber-700 hover:underline">Retry AI</button>}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-medium">
                      {c.department || 'General Administration'}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800">
                      {c.aiSeverity}/100
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      👥 {c.confirmationCount}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isClosed(c.status) ? (
                        <span className="text-[11px] text-emerald-600 font-semibold">Resolved</span>
                      ) : (
                        <select
                          value={c.status}
                          onChange={e => setStatus(c._id, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-[#0066FF] cursor-pointer"
                        >
                          {STATUSES.filter(([k]) => !isClosed(k)).map(([k, l]) => (
                            <option key={k} value={k}>{l}</option>
                          ))}
                          <option value="resolved">Mark Resolved</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {items.length === 0 && (
            <p className="py-8 text-center text-xs text-slate-400">
              No complaints match the selected filter criteria.
            </p>
          )}
        </div>
        {pagination && <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>Page {pagination.page} of {Math.max(1, pagination.pages)} · {pagination.total} reports</span>
          <div className="flex gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)} className="btn-ghost !py-1.5 disabled:opacity-40">Previous</button><button type="button" disabled={page >= pagination.pages || loading} onClick={() => setPage(value => value + 1)} className="btn-ghost !py-1.5 disabled:opacity-40">Next</button></div>
        </div>}
      </div>
    </div>
  );
}
