import { useState } from 'react';
import { FileText, Download, Calendar, Filter, CheckCircle2, TrendingUp, AlertTriangle, AlertCircle } from 'lucide-react';

export default function AdminReports() {
  const [reportType, setReportType] = useState('monthly_summary');
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [selectedPriority, setSelectedPriority] = useState('All Priority');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [err, setErr] = useState('');

  const handleExport = async (overrideFormat = null) => {
    const fmt = overrideFormat || selectedFormat;
    setIsExporting(true);
    setErr('');
    setDownloadSuccess(false);

    try {
      const params = new URLSearchParams();
      params.set('format', fmt.toLowerCase());
      if (selectedPriority !== 'All Priority') params.set('priority', selectedPriority);
      if (selectedCategory !== 'All Categories') params.set('category', selectedCategory);
      if (selectedStatus !== 'All Status') params.set('status', selectedStatus);

      const token = localStorage.getItem('cl_token');
      const res = await fetch(`/api/complaints/export?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Export failed on server' }));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `civiclens-infrastructure-audit-${Date.now()}.${fmt.toLowerCase() === 'excel' ? 'xlsx' : fmt.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (e) {
      setErr(e.message || 'Export failed. Please check network connection.');
    } finally {
      setIsExporting(false);
    }
  };

  const reportsList = [
    { title: 'Official Infrastructure Health Audit', date: 'October 2024', size: 'Live Database', format: 'pdf' },
    { title: 'Pothole & Road Damage Register (Data Matrix)', date: 'Q3 2024', size: 'Live Database', format: 'xlsx' },
    { title: 'Zone-Wise Hazard & Triage Export', date: 'September 2024', size: 'Live Database', format: 'csv' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Reports & Audits</h1>
        <p className="text-xs text-slate-400 mt-1">Export official road health diagnostics, contractor SLAs and civic metrics.</p>
      </div>

      {err && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Custom Export Generator */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-4 md:col-span-1">
          <h3 className="font-extrabold text-sm text-[#0F172A]">Generate Custom Report</h3>
          
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Filter by Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 font-medium focus:outline-none focus:border-[#0066FF]"
              >
                <option value="All Priority">All Priorities</option>
                <option value="Critical">Critical Only (≥70)</option>
                <option value="High">High (50-69)</option>
                <option value="Medium">Medium (30-49)</option>
                <option value="Low">Low (&lt;30)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Filter by Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 font-medium focus:outline-none focus:border-[#0066FF]"
              >
                <option value="All Categories">All Categories</option>
                <option value="pothole">Pothole</option>
                <option value="road_damage">Road Crack / Damage</option>
                <option value="waterlogging">Waterlogging</option>
                <option value="drainage">Blocked Drain / Manhole</option>
                <option value="streetlight">Streetlight</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Export Format</label>
              <div className="grid grid-cols-3 gap-2">
                {['pdf', 'csv', 'xlsx'].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setSelectedFormat(fmt)}
                    className={`py-2 rounded-xl text-xs font-bold transition uppercase ${
                      selectedFormat === fmt
                        ? 'bg-[#0066FF] text-white shadow-sm'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {fmt === 'xlsx' ? 'Excel' : fmt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleExport()}
              disabled={isExporting}
              className="w-full btn-primary !py-3 text-xs font-bold mt-2"
            >
              {isExporting ? 'Generating Official File...' : `Download ${selectedFormat.toUpperCase()} Report`}
            </button>

            {downloadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Report compiled & downloaded successfully!</span>
              </div>
            )}
          </div>
        </div>

        {/* Audit Archives */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:col-span-2 space-y-4">
          <h3 className="font-extrabold text-sm text-[#0F172A]">Available Audit Archives</h3>
          <p className="text-xs text-slate-400">Download formatted reports directly from live MongoDB database records.</p>
          
          <div className="divide-y divide-slate-100 pt-2">
            {reportsList.map((rep, idx) => (
              <div key={idx} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">{rep.title}</h4>
                    <span className="text-[11px] text-slate-400">{rep.date} • {rep.size}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleExport(rep.format)}
                  disabled={isExporting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm uppercase"
                >
                  <Download className="h-3.5 w-3.5 text-slate-400" />
                  <span>{rep.format === 'xlsx' ? 'Excel' : rep.format}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
