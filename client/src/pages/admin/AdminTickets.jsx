import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Calendar, RefreshCw, ChevronDown, ChevronLeft, ChevronRight, 
  LayoutList, LayoutGrid, MoreHorizontal, AlertTriangle, Clock, 
  CheckCircle2, Users, ExternalLink, ArrowUpDown, Eye, Wrench, AlertCircle
} from 'lucide-react';
import { api } from '../../api';

export default function AdminTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Filters
  const [searchTable, setSearchTable] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedPriority, setSelectedPriority] = useState('All Severity');
  const [selectedType, setSelectedType] = useState('All Issue Types');
  const [selectedTeam, setSelectedTeam] = useState('All Teams');
  const [sortBy, setSortBy] = useState('Latest First');
  const [viewMode, setViewMode] = useState('list');
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const loadData = () => {
    setLoading(true);
    setErr('');

    const params = new URLSearchParams();
    params.set('page', currentPage);
    params.set('limit', rowsPerPage);
    if (searchTable.trim()) params.set('search', searchTable.trim());
    if (selectedStatus !== 'All Status') params.set('status', selectedStatus);
    if (selectedPriority !== 'All Severity') params.set('priority', selectedPriority);
    if (selectedType !== 'All Issue Types') params.set('category', selectedType);
    if (sortBy === 'Latest First') params.set('sort', 'recent');
    else if (sortBy === 'Oldest First') params.set('sort', 'oldest');
    else params.set('sort', 'priority');

    Promise.all([
      api(`/complaints?${params.toString()}`),
      api('/complaints/analytics'),
    ])
      .then(([complaintsRes, analyticsRes]) => {
        setTickets(complaintsRes.items || complaintsRes || []);
        setTotalTickets(complaintsRes.total || complaintsRes.length || 0);
        setStats(analyticsRes.kpis);
      })
      .catch((e) => {
        setErr(e.message || 'Failed to fetch tickets from server.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [currentPage, rowsPerPage, selectedStatus, selectedPriority, selectedType, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData();
  };

  const clearFilters = () => {
    setSearchTable('');
    setSelectedStatus('All Status');
    setSelectedPriority('All Severity');
    setSelectedType('All Issue Types');
    setSelectedTeam('All Teams');
    setCurrentPage(1);
  };

  const togglePriorityCard = (tier) => {
    if (selectedPriority === tier) {
      setSelectedPriority('All Severity');
    } else {
      setSelectedPriority(tier);
    }
    setCurrentPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === tickets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tickets.map(t => t.id || t._id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleUpdateTicketStatus = async (id, newStatus) => {
    try {
      await api(`/complaints/${id}/status`, {
        method: 'PATCH',
        body: { status: newStatus.toLowerCase().replace(' ', '_') },
      });
      loadData();
    } catch (e2) {
      alert(`Error updating ticket status: ${e2.message}`);
    }
    setActiveMenuId(null);
  };

  const totalPages = Math.max(1, Math.ceil(totalTickets / rowsPerPage));
  const kpiTotal = stats?.totalTickets || totalTickets;
  const kpiCritical = stats?.critical || 0;
  const kpiHigh = stats?.high || 0;
  const kpiMedium = stats?.medium || 0;
  const kpiLow = stats?.low || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Tickets</h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <Link to="/admin" className="hover:text-slate-600 transition">Dashboard</Link>
            <span>/</span>
            <span className="text-slate-700 font-semibold">Tickets</span>
          </div>
        </div>

        {/* Search input top right */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by ID, location or keywords..."
            value={searchTable}
            onChange={(e) => setSearchTable(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-white border border-slate-200 focus:outline-none focus:border-[#0066FF] shadow-sm transition"
          />
        </form>
      </div>

      {err && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      {/* 2. Top 5 Metric KPI Cards with One-Click Priority Filter Switching (Requirement 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Tickets */}
        <div
          onClick={() => { setSelectedPriority('All Severity'); setCurrentPage(1); }}
          className={`rounded-2xl p-4 shadow-sm border transition cursor-pointer flex items-center gap-3 ${
            selectedPriority === 'All Severity'
              ? 'bg-blue-50/90 border-[#0066FF] ring-2 ring-blue-100'
              : 'bg-white border-slate-100 hover:bg-slate-50'
          }`}
        >
          <div className="h-9 w-9 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
            <LayoutList className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Total Tickets</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-[#0F172A]">{kpiTotal}</span>
              <span className="text-[10px] font-bold text-emerald-600">↑ 12%</span>
            </div>
          </div>
        </div>

        {/* Critical */}
        <div
          onClick={() => togglePriorityCard('Critical')}
          className={`rounded-2xl p-4 shadow-sm border transition cursor-pointer flex items-center gap-3 ${
            selectedPriority === 'Critical'
              ? 'bg-rose-100 border-rose-500 ring-2 ring-rose-200'
              : 'bg-white border-slate-100 hover:bg-rose-50/40'
          }`}
        >
          <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] text-rose-700 font-bold">Critical</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-[#0F172A]">{kpiCritical}</span>
              <span className="text-[10px] font-bold text-emerald-600">↑ 3%</span>
            </div>
          </div>
        </div>

        {/* High */}
        <div
          onClick={() => togglePriorityCard('High')}
          className={`rounded-2xl p-4 shadow-sm border transition cursor-pointer flex items-center gap-3 ${
            selectedPriority === 'High'
              ? 'bg-orange-100 border-orange-500 ring-2 ring-orange-200'
              : 'bg-white border-slate-100 hover:bg-orange-50/40'
          }`}
        >
          <div className="h-9 w-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] text-orange-700 font-bold">High</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-[#0F172A]">{kpiHigh}</span>
              <span className="text-[10px] font-bold text-rose-600">↓ 5%</span>
            </div>
          </div>
        </div>

        {/* Medium */}
        <div
          onClick={() => togglePriorityCard('Medium')}
          className={`rounded-2xl p-4 shadow-sm border transition cursor-pointer flex items-center gap-3 ${
            selectedPriority === 'Medium'
              ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-200'
              : 'bg-white border-slate-100 hover:bg-amber-50/40'
          }`}
        >
          <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] text-amber-700 font-bold">Medium</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-[#0F172A]">{kpiMedium}</span>
              <span className="text-[10px] font-bold text-emerald-600">↑ 8%</span>
            </div>
          </div>
        </div>

        {/* Low */}
        <div
          onClick={() => togglePriorityCard('Low')}
          className={`rounded-2xl p-4 shadow-sm border transition cursor-pointer flex items-center gap-3 col-span-2 sm:col-span-1 ${
            selectedPriority === 'Low'
              ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-200'
              : 'bg-white border-slate-100 hover:bg-emerald-50/40'
          }`}
        >
          <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] text-emerald-700 font-bold">Low</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-[#0F172A]">{kpiLow}</span>
              <span className="text-[10px] font-bold text-emerald-600">↑ 15%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Toolbar */}
      <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-[0_2px_10px_rgba(16,24,40,0.03)] flex flex-wrap items-center justify-between gap-3">
        {/* Table Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by ID, location or description..."
            value={searchTable}
            onChange={(e) => setSearchTable(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50/70 border border-slate-200/80 focus:bg-white focus:outline-none focus:border-[#0066FF] transition"
          />
        </form>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-7 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
            >
              <option value="All Status">All Status</option>
              <option value="reported">Reported</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Severity / Priority */}
          <div className="relative">
            <select
              value={selectedPriority}
              onChange={(e) => { setSelectedPriority(e.target.value); setCurrentPage(1); }}
              className="appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-7 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
            >
              <option value="All Severity">All Severity / Priority</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Issue Types */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
              className="appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-7 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
            >
              <option value="All Issue Types">All Issue Types</option>
              <option value="pothole">Pothole</option>
              <option value="road_damage">Road Damage</option>
              <option value="waterlogging">Waterlogging</option>
              <option value="drainage">Drainage</option>
              <option value="streetlight">Streetlight</option>
              <option value="traffic_sign">Traffic Sign</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Clear filters */}
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* 4. Tickets Data Table Card */}
      <div className="rounded-3xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(16,24,40,0.03)] overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-base font-extrabold text-[#0F172A]">
            Tickets ({totalTickets})
          </h2>

          <div className="flex items-center gap-3">
            {/* Sort by */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Sort by</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-7 py-1.5 text-xs font-bold text-[#0F172A] hover:bg-slate-50 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
                >
                  <option value="Latest First">Latest First</option>
                  <option value="Highest Priority">Highest Priority</option>
                  <option value="Oldest First">Oldest First</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            {/* List / Grid view toggles */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/60">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-white shadow-sm text-[#0066FF]' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <LayoutList className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white shadow-sm text-[#0066FF]' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px] bg-slate-50/50">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === tickets.length && tickets.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded text-[#0066FF] focus:ring-[#0066FF] cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">Ticket ID</th>
                <th className="py-3 px-3">Photo</th>
                <th className="py-3 px-3">Issue Type</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Reported On</th>
                <th className="py-3 px-3">Updated On</th>
                <th className="py-3 px-3">Assigned Team</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((t) => {
                const targetId = t.id || t._id;
                const isSelected = selectedIds.includes(targetId);

                return (
                  <tr key={targetId} className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-blue-50/30' : ''}`}>
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(targetId)}
                        className="rounded text-[#0066FF] focus:ring-[#0066FF] cursor-pointer"
                      />
                    </td>

                    <td className="py-3.5 px-3">
                      <Link
                        to="/admin/map"
                        state={{ selectedIssueId: targetId }}
                        className="font-bold text-[#0066FF] hover:underline"
                      >
                        {t.id}
                      </Link>
                    </td>

                    <td className="py-3.5 px-3">
                      <img
                        src={t.images?.[0] || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=100'}
                        alt={t.title}
                        className="h-9 w-9 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-slate-800">
                      {t.issueType}
                    </td>

                    <td className="py-3.5 px-3 text-slate-600 font-medium max-w-[180px] truncate">
                      {t.location}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        t.priorityTier === 'Critical' ? 'bg-rose-50 text-rose-600' :
                        t.priorityTier === 'High' ? 'bg-orange-50 text-orange-600' :
                        t.priorityTier === 'Medium' ? 'bg-amber-50 text-amber-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        <span>{t.priorityTier} ({t.priority || 0})</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        t.status === 'Ongoing' || t.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                        t.status === 'Assigned' || t.status === 'assigned' ? 'bg-sky-50 text-sky-600' :
                        t.status === 'Reported' || t.status === 'reported' ? 'bg-slate-100 text-slate-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        <span>{t.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-slate-600 font-medium whitespace-nowrap">
                      {t.reportedOn}
                    </td>

                    <td className="py-3.5 px-3 text-slate-600 font-medium whitespace-nowrap">
                      {t.updatedOn}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 truncate max-w-[130px]">
                          {t.assignedTeam?.name || t.assignedTo || 'Road Maintenance'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === targetId ? null : targetId)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      {activeMenuId === targetId && (
                        <div className="absolute right-3 top-10 w-44 rounded-2xl bg-white border border-slate-100 shadow-xl p-1.5 z-40 text-left space-y-0.5 animate-fadeIn">
                          <button
                            onClick={() => navigate('/admin/map', { state: { selectedIssueId: targetId } })}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-400" />
                            <span>View on Map</span>
                          </button>
                          <button
                            onClick={() => handleUpdateTicketStatus(t._id || targetId, 'in_progress')}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <Wrench className="h-3.5 w-3.5 text-slate-400" />
                            <span>Mark In Progress</span>
                          </button>
                          <button
                            onClick={() => handleUpdateTicketStatus(t._id || targetId, 'resolved')}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Mark Resolved</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {tickets.length === 0 && !loading && (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              No tickets found matching your search and filter criteria.
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <div>
            Showing {tickets.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}-{Math.min(currentPage * rowsPerPage, totalTickets)} of {totalTickets} tickets
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`h-8 w-8 rounded-xl font-bold flex items-center justify-center transition ${
                  currentPage === num
                    ? 'bg-[#0066FF] text-white shadow-sm'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {num}
              </button>
            ))}

            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Rows per page */}
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <div className="relative">
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-7 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
