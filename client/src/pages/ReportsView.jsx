import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { normalizeStatus, CATEGORIES, normalizeCategory, formatTimeAgo } from '../constants';
import { StatusBadge, Thumb } from '../components/Badges';

export default function ReportsView({ onOpenReport }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/complaints')
      .then(data => setComplaints(data || []))
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false));
  }, []);

  const allCount = complaints.length;
  const submittedCount = complaints.filter(c => normalizeStatus(c.status) === 'Submitted').length;
  const inProgressCount = complaints.filter(c => normalizeStatus(c.status) === 'In Progress').length;
  const resolvedCount = complaints.filter(c => normalizeStatus(c.status) === 'Resolved').length;

  const tabs = [
    { label: 'All', count: allCount },
    { label: 'Submitted', count: submittedCount },
    { label: 'In Progress', count: inProgressCount },
    { label: 'Resolved', count: resolvedCount },
  ];

  const filtered = activeTab === 'All'
    ? complaints
    : complaints.filter(c => normalizeStatus(c.status) === activeTab);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">My Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track and follow up on reported issues</p>
        </div>

        <button
          type="button"
          onClick={onOpenReport || (() => navigate('/report'))}
          className="btn-primary !py-2.5 !px-4 text-xs font-bold rounded-full gap-1.5 shadow-md"
        >
          <Plus className="h-4 w-4" /> Report an Issue
        </button>
      </div>

      {/* Filter Tabs matching Screenshot */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map(tab => {
          const isActive = activeTab === tab.label;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActiveTab(tab.label)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#0066FF] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      {/* Reports List */}
      <div className="card space-y-3">
        {loading ? (
          <p className="py-12 text-center text-xs text-slate-400">Loading your reports...</p>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-slate-600">No {activeTab.toLowerCase()} reports found</p>
            <button
              type="button"
              onClick={onOpenReport || (() => navigate('/report'))}
              className="btn-primary !py-2 !px-4 text-xs"
            >
              Report an Issue Now
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(c => {
              const normCat = normalizeCategory(c.category);
              const cat = CATEGORIES[normCat] || CATEGORIES.other;
              const dateStr = new Date(c.createdAt || Date.now()).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <Link
                  key={c._id}
                  to={`/complaint/${c._id}`}
                  className="group py-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 -mx-2 px-3 rounded-2xl transition"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Thumb
                      url={c.beforeImage?.url}
                      category={c.category}
                      className="h-16 w-16 shrink-0"
                    />
                    <div className="min-w-0 space-y-1">
                      <h4 className="text-sm font-bold text-[#0F172A] truncate group-hover:text-[#0066FF] transition">
                        {c.title}
                      </h4>
                      <p className="text-xs text-slate-400 truncate flex items-center gap-1.5">
                        <span className="font-semibold text-slate-500">{c.ticketId || `ID ${c._id}`}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(c.createdAt)}</span>
                      </p>
                      <div className="pt-0.5">
                        <StatusBadge status={c.status} />
                      </div>
                    </div>
                  </div>

                  <div className="h-9 w-9 rounded-full bg-slate-100 group-hover:bg-[#0066FF] group-hover:text-white flex items-center justify-center text-slate-400 transition shrink-0">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

