import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  ArrowLeft, ThumbsUp, CheckCircle2, XCircle, Camera, 
  Shield, AlertTriangle, Sparkles, Clock, MapPin, Building
} from 'lucide-react';
import MapLibreMap from '../components/MapLibreMap';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, isClosed, band, normalizeCategory } from '../constants';
import { PriorityBadge, SeverityBar, StatusBadge, Thumb } from '../components/Badges';
import StatusStepper from '../components/StatusStepper';
import LiveCameraModal from '../components/LiveCameraModal';

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user, refresh } = useAuth();
  const [c, setC] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const load = () => api(`/complaints/${id}`).then(setC).catch(e => setErr(e.message));
  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    if (!c?._id || !['pending', 'processing'].includes(c.analysisStatus)) return undefined;
    const timer = setInterval(() => api(`/complaints/${id}/analysis`)
      .then(analysis => setC(current => current ? { ...current, ...analysis } : current))
      .catch(() => {}), 2500);
    return () => clearInterval(timer);
  }, [id, c?._id, c?.analysisStatus]);

  const run = async fn => {
    setBusy(true); setErr('');
    try { await fn(); await load(); await refresh(); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const confirm = () => run(() => api(`/complaints/${id}/confirm`, { method: 'POST' }));
  const retryAnalysis = () => run(() => api(`/complaints/${id}/analysis/retry`, { method: 'POST' }));
  const vote = resolved => run(() => api(`/complaints/${id}/verify-resolution`, { method: 'POST', body: { resolved } }));
  const setStatus = status => run(() => api(`/complaints/${id}/status`, { method: 'PATCH', body: { status } }));
  
  const handleCaptureRepairPhoto = (file) => {
    const fd = new FormData();
    fd.append('image', file);
    run(() => api(`/complaints/${id}/resolve`, { method: 'POST', form: fd }));
  };

  if (!c) {
    return (
      <div className="py-20 text-center space-y-2">
        <p className="text-sm text-slate-500">{err || 'Loading issue details…'}</p>
      </div>
    );
  }

  const normCat = normalizeCategory(c.category);
  const cat = CATEGORIES[normCat] || CATEGORIES.other;
  const pos = [c.location.coordinates[1], c.location.coordinates[0]];
  const isAdmin = user?.role === 'admin';
  const own = user && c.reporter?._id === user.id;

  const mapMarkers = [
    {
      id: c._id,
      lat: pos[0],
      lng: pos[1],
      color: band(c.priority).color,
      icon: cat.icon,
      title: c.title,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Top back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      {/* Main Header Card */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-bold text-slate-700">{cat.icon} {cat.label}</span>
              <span>•</span>
              <span>{c.ticketId || `ID ${c._id}`}</span>
              <span>•</span>
              <span>Reported {new Date(c.createdAt).toLocaleDateString()}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">{c.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={c.status} />
            <PriorityBadge value={c.priority} />
          </div>
        </div>

        {/* Stepper */}
        <div className="pt-2 border-t border-slate-100">
          <StatusStepper status={c.status} />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Left Column: Visual Evidence & AI Assessment */}
        <div className="space-y-5">
          {/* Visual Evidence Card */}
          <div className="card space-y-3">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Camera className="h-4 w-4 text-[#0066FF]" /> Photo Evidence
            </h3>

            <div className={`grid gap-3 ${c.afterImage?.url ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div>
                <span className="mb-1 text-[11px] font-bold text-slate-400 block">BEFORE REPAIR</span>
                <Thumb url={c.beforeImage?.url} category={c.category} className="h-48 w-full" />
              </div>
              {c.afterImage?.url && (
                <div>
                  <span className="mb-1 text-[11px] font-bold text-emerald-600 block">AFTER REPAIR</span>
                  <Thumb url={c.afterImage.url} category={c.category} className="h-48 w-full" />
                </div>
              )}
            </div>

            {c.afterVerdict && (
              <div className={`rounded-2xl p-3 text-xs border ${
                c.afterVerdict.resolved 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                  : 'bg-rose-50 border-rose-100 text-rose-800'
              }`}>
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Resolution Comparison: {c.afterVerdict.resolved ? 'Repaired Successfully' : 'Incomplete Repair'}
                </span>
                <p className="mt-1 text-[11px] opacity-90">{c.afterVerdict.note}</p>
              </div>
            )}
          </div>

          {/* AI Analysis Details */}
          <div className="card space-y-3 text-xs">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#0066FF]" /> AI Analysis Summary
            </h3>

            {['pending', 'processing'].includes(c.analysisStatus) && <p role="status" className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs font-semibold text-blue-800">AI analysis in progress</p>}
            {c.analysisStatus === 'completed' && <p className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">Analysis completed</p>}
            {c.analysisStatus === 'review_required' && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">Review required. The citizen-selected category and description are retained.</p>}
            {c.analysisStatus === 'failed' && <div className="space-y-2"><p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{c.analysisError || 'AI analysis failed. The submitted report is preserved.'}</p>{(own || isAdmin) && <button type="button" className="btn-primary" disabled={busy} onClick={retryAnalysis}>{busy ? 'Retrying analysis…' : 'Retry AI analysis'}</button>}</div>}

            {c.authenticityStatus && <div className={`rounded-xl border p-3 text-xs ${c.authenticityStatus === 'LIKELY_REAL_SCENE' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}><strong>Image authenticity risk: {c.authenticityStatus.replaceAll('_', ' ').toLowerCase()}</strong>{c.authenticityReason && <p className="mt-1">{c.authenticityReason}</p>}{c.authenticityStatus !== 'LIKELY_REAL_SCENE' && <p className="mt-1">This indicator is not proof; administrator review is required.</p>}</div>}

            {c.aiCategory && <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"><span className="text-slate-500">AI suggested category: </span><strong>{CATEGORIES[normalizeCategory(c.aiCategory)]?.label || c.aiCategory}</strong>{c.categoryMatches === false && <span className="ml-1 text-amber-700">(differs from selected category)</span>}</div>}
            {c.aiObservations && <p className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700">Visible evidence: {c.aiObservations}</p>}

            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Assessed Severity</span>
                <span className="font-extrabold text-[#0F172A]">{c.aiSeverity ?? '—'}{c.aiSeverity != null ? '/100' : ''}</span>
              </div>
              <SeverityBar value={c.aiSeverity} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-[10px]">Confidence</span>
                <p className="font-bold text-[#0F172A]">{c.aiConfidence}%</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-[10px]">Assigned Dept</span>
                <p className="font-bold text-[#0F172A] truncate">{c.department}</p>
              </div>
            </div>

            {c.description && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-[10px] block mb-1">Citizen Description</span>
                <p className="text-slate-700 leading-relaxed">{c.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Community Support, Location, Actions */}
        <div className="space-y-5">
          {/* Community Confirmation Card */}
          <div className="card space-y-3">
            <h3 className="text-sm font-bold text-[#0F172A]">Community Support</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              👥 <b>{c.confirmationCount}</b> citizens confirmed this issue. More community confirmations increase urgency score.
            </p>

            {!isClosed(c.status) && (
              user ? (
                <button
                  type="button"
                  className="btn-primary w-full !py-2.5 text-xs font-semibold gap-1.5"
                  disabled={busy || c.confirmedByMe || own}
                  onClick={confirm}
                >
                  <ThumbsUp className="h-4 w-4" />
                  {own ? 'You Reported This' : c.confirmedByMe ? '✓ You Supported This' : 'Support this Issue (+2 pts)'}
                </button>
              ) : (
                <Link to="/login" className="btn-ghost w-full !py-2.5 text-xs">
                  Login to Support
                </Link>
              )
            )}
          </div>

          {/* Citizen Verification when Resolved */}
          {c.status === 'resolved' && (
            <div className="card border-emerald-200 bg-emerald-50/60 space-y-3">
              <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Verify Resolution
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                The authority reported this issue repaired. Please inspect and cast your verification vote:
              </p>

              {!user ? (
                <Link to="/login" className="btn-ghost w-full text-xs">Login to vote</Link>
              ) : c.myVote !== null ? (
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-emerald-800">
                  You voted: {c.myVote ? 'Resolved ✅' : 'Not Resolved ❌'}
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => vote(true)}
                    className="btn-primary flex-1 !bg-emerald-600 hover:!bg-emerald-700 !py-2.5 text-xs"
                  >
                    ✅ Fixed (+3 pts)
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => vote(false)}
                    className="btn-ghost flex-1 !py-2.5 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    ❌ Not Fixed
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Official Admin Controls */}
          {isAdmin && !isClosed(c.status) && (
            <div className="card border-blue-200 bg-blue-50/40 space-y-3">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-[#0066FF]" /> Official Actions
              </h3>
              <div className="flex flex-wrap gap-2">
                {['assigned', 'in_progress'].map(s => (
                  <button
                    key={s}
                    disabled={busy || c.status === s}
                    onClick={() => setStatus(s)}
                    className="btn-ghost !py-1.5 !px-3 text-xs"
                  >
                    Set {s.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-blue-100">
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="btn-primary w-full !py-2.5 text-xs gap-1.5"
                >
                  <Camera className="h-4 w-4" /> Capture Live Repair Photo
                </button>
              </div>
            </div>
          )}

          {/* Location Map with MapLibre */}
          <div className="card space-y-2">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#0066FF]" /> Location
            </h3>
            <p className="text-[11px] text-slate-500">Device fix ±{Number.isFinite(c.locationAccuracy) ? Math.round(c.locationAccuracy) : '—'} m</p>
            <div className="h-44 rounded-2xl overflow-hidden border border-slate-100">
              <MapLibreMap
                center={pos}
                zoom={16}
                interactive={false}
                markers={mapMarkers}
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Camera Modal for Admin Repair Resolution */}
      <LiveCameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCaptureRepairPhoto}
        title="Capture Live After-Repair Photo"
      />
    </div>
  );
}
