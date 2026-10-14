import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Camera, CheckCircle2, MapPin, RefreshCw, Shield } from 'lucide-react';
import MapLibreMap from '../components/MapLibreMap';
import LiveCameraModal from '../components/LiveCameraModal';
import { api } from '../api';
import { getPreciseLocation } from '../location';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, DEPARTMENTS, normalizeCategory } from '../constants';

const MAX_LOCATION_ACCURACY_M = Number(import.meta.env.VITE_MAX_LOCATION_ACCURACY_M) || 20;
const DEVICE_CATEGORY = {
  roads: 'road_damage', streetlights: 'streetlight', drainage: 'waterlogging',
  water_supply: 'water_leakage', parks: 'fallen_tree', public_safety: 'other', other: 'other',
};

export default function Report() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const submitLock = useRef(false);
  const submissionId = useRef(crypto.randomUUID());
  const previewUrlRef = useRef('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [capturedAt, setCapturedAt] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [locationFix, setLocationFix] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Getting precise location…');
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({ category: '', description: '' });
  const [language, setLanguage] = useState('en');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [complaint, setComplaint] = useState(null);

  const locate = async () => {
    setLocating(true);
    setLocationFix(null);
    setLocationStatus('Getting precise location…');
    setError('');
    try {
      const fix = await getPreciseLocation(navigator.geolocation, MAX_LOCATION_ACCURACY_M);
      setLocationFix(fix);
      setLocationStatus(`Location verified · ±${Math.round(fix.accuracy)} m`);
    } catch (e) {
      setLocationStatus('Unable to obtain precise location.');
      setError(e.message);
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    locate();
    return () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); };
  }, []);

  const capture = (capturedFile, previewUrl) => {
    if (preview) URL.revokeObjectURL(preview);
    previewUrlRef.current = previewUrl;
    setPhoto(capturedFile);
    setPreview(previewUrl);
    setCapturedAt(new Date(capturedFile.lastModified || Date.now()).toISOString());
    submissionId.current = crypto.randomUUID();
    setComplaint(null);
    setError('');
  };

  useEffect(() => {
    if (!complaint?._id || !['pending', 'processing'].includes(complaint.analysisStatus)) return undefined;
    const timer = setInterval(async () => {
      try {
        const status = await api(`/complaints/${complaint._id}/analysis`);
        setComplaint(current => current ? { ...current, ...status } : current);
      } catch { /* The ticket remains saved if status polling is temporarily unavailable. */ }
    }, 2500);
    return () => clearInterval(timer);
  }, [complaint?._id, complaint?.analysisStatus]);

  const submit = async event => {
    event.preventDefault();
    if (submitLock.current || busy) return;
    setError('');
    if (!user) {
      setError('Please log in or sign up to submit your report.');
      navigate('/login');
      return;
    }
    if (!photo) return setError('Capture a photo using the live camera first.');
    if (!form.description.trim() || form.description.trim().length < 10) return setError('Describe the problem in at least 10 characters.');
    if (!locationFix || Date.now() - locationFix.timestamp > 2 * 60_000) {
      setError('A fresh, precise device location is required. Retry location before submitting.');
      return;
    }

    submitLock.current = true;
    setBusy(true);
    setLocationStatus('Rechecking precise location…');
    let fix;
    try {
      fix = await getPreciseLocation(navigator.geolocation, MAX_LOCATION_ACCURACY_M);
      setLocationFix(fix);
      setLocationStatus(`Location verified · ±${Math.round(fix.accuracy)} m`);
    } catch (e) {
      setLocationFix(null);
      setLocationStatus('Unable to obtain precise location.');
      setError(e.message);
      setBusy(false);
      submitLock.current = false;
      return;
    }
    try {
      const data = new FormData();
      data.append('image', photo);
      data.append('category', DEVICE_CATEGORY[normalizeCategory(form.category)] || 'other');
      data.append('description', form.description.trim());
      data.append('lang', language);
      data.append('lat', String(fix.latitude));
      data.append('lng', String(fix.longitude));
      data.append('locationAccuracy', String(fix.accuracy));
      data.append('capturedAt', capturedAt);
      data.append('submittedAt', new Date().toISOString());
      data.append('submissionId', submissionId.current);
      const saved = await api('/complaints', { method: 'POST', form: data });
      setComplaint(saved);
    } catch (e) {
      setError(e.message || 'Complaint could not be submitted. Your form is still available to retry.');
    } finally {
      setBusy(false);
      submitLock.current = false;
    }
  };

  const reviewRequired = complaint?.analysisStatus === 'review_required' || complaint?.analysisStatus === 'failed';
  const analysisLabel = complaint?.analysisStatus === 'pending' || complaint?.analysisStatus === 'processing'
    ? 'AI analysis in progress'
    : complaint?.analysisStatus === 'completed'
      ? 'Analysis completed'
      : reviewRequired ? 'Review required' : 'Complaint submitted';

  if (complaint) return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="card space-y-4 text-center py-10">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h1 className="text-2xl font-extrabold text-slate-900">Complaint submitted</h1>
        <p className="text-sm text-slate-600">Ticket ID <strong>{complaint.ticketId}</strong></p>
        <p className={`text-sm font-semibold ${reviewRequired ? 'text-amber-700' : 'text-blue-700'}`}>{analysisLabel}</p>
        {complaint.authenticityStatus && <div role="status" className={`mx-auto max-w-lg rounded-xl border p-3 text-left text-xs ${complaint.authenticityStatus === 'LIKELY_REAL_SCENE' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}><strong>Image authenticity: {complaint.authenticityStatus.replaceAll('_', ' ').toLowerCase()}</strong>{complaint.authenticityReason && <p className="mt-1">{complaint.authenticityReason}</p>}{complaint.authenticityStatus !== 'LIKELY_REAL_SCENE' && <p className="mt-1 font-semibold">This is a risk indicator, not proof. Your report is saved for human review.</p>}</div>}
        {complaint.aiObservations && <p className="mx-auto max-w-lg text-xs text-slate-600">AI notes: {complaint.aiObservations}</p>}
        {complaint.aiCategory && complaint.aiCategory !== complaint.category && <p className="text-xs text-amber-700">AI suggested a different category. Your selected category was kept for human review.</p>}
        {complaint.analysisError && <p className="text-xs text-amber-700">The report is saved. Open the ticket to retry AI analysis.</p>}
        <Link className="btn-primary inline-flex" to={`/complaint/${complaint._id}`}>View complaint</Link>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" /> Back to Dashboard</Link>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Camera and precise location required</span>
      </div>
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Report a Civic Issue</h1>
        <p className="mt-1 text-xs text-slate-500">Capture live evidence and provide precise device location so responders can find the issue.</p>
      </div>
      {error && <div role="alert" className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}

      <form onSubmit={submit} className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <section className="card space-y-3">
            <div className="flex items-center justify-between"><h2 className="text-sm font-bold text-slate-900">1. Live Photo Evidence</h2><span className="flex items-center gap-1 text-[11px] font-semibold text-blue-700"><Shield className="h-3.5 w-3.5" /> Camera only</span></div>
            {preview ? <div className="space-y-3"><img src={preview} alt="Captured issue preview" className="aspect-[4/3] w-full rounded-2xl border border-slate-100 bg-black object-cover" /><button type="button" onClick={() => setShowCamera(true)} className="btn-ghost w-full !py-2.5 text-xs font-semibold text-blue-700"><Camera className="mr-1 inline h-4 w-4" /> Retake photo</button></div>
              : <button type="button" onClick={() => setShowCamera(true)} className="w-full rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-8 text-center hover:border-blue-600"><Camera className="mx-auto h-10 w-10 text-blue-600" /><span className="mt-2 block text-sm font-bold">Open live camera</span><span className="mt-1 block text-xs text-slate-500">Gallery and file uploads are unavailable.</span></button>}
          </section>

          <section className="card space-y-3">
            <div className="flex items-center justify-between"><h2 className="text-sm font-bold text-slate-900">2. Precise Location</h2><button type="button" disabled={locating} onClick={locate} className="text-xs font-semibold text-blue-700 hover:underline">{locating ? 'Retrying…' : 'Retry location'}</button></div>
            <p className="text-xs text-slate-500">Allow device location to identify where this issue exists. We require a fix accurate to {MAX_LOCATION_ACCURACY_M} metres or better.</p>
            <p role="status" className={`rounded-xl border px-3 py-2 text-xs font-semibold ${locationFix ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{locationStatus}</p>
            {locationFix && <><p className="text-[11px] text-slate-500">{locationFix.latitude.toFixed(6)}, {locationFix.longitude.toFixed(6)} · ±{Math.round(locationFix.accuracy)} m</p><div className="h-48 overflow-hidden rounded-2xl border border-slate-100"><MapLibreMap center={[locationFix.latitude, locationFix.longitude]} zoom={16} className="h-full w-full" /></div></>}
            <p className="text-[11px] text-slate-500">If permission is denied, enable Location in browser settings and retry. Approximate or map-selected locations cannot be submitted.</p>
          </section>
        </div>

        <div className="card h-fit space-y-4">
          <h2 className="text-sm font-bold text-slate-900">3. Problem Details</h2>
          <div><label htmlFor="problem-category" className="mb-1 block text-xs font-semibold text-slate-700">Problem type *</label><select id="problem-category" required value={form.category} onChange={e => setForm(current => ({ ...current, category: e.target.value }))} className="input text-xs !py-2.5"><option value="" disabled>Select a problem type</option>{Object.entries(CATEGORIES).map(([key, category]) => <option key={key} value={key}>{category.icon} {category.label}</option>)}</select><p className="mt-1 text-[11px] text-slate-500">{form.category ? `Department: ${DEPARTMENTS[normalizeCategory(form.category)] || 'General Administration'}` : 'Choose the closest matching civic issue type.'}</p></div>
          <div><label htmlFor="problem-description" className="mb-1 block text-xs font-semibold text-slate-700">Describe the problem *</label><textarea id="problem-description" required minLength={10} maxLength={1000} rows={5} value={form.description} onChange={e => setForm(current => ({ ...current, description: e.target.value }))} placeholder="Describe the problem here..." className="input text-xs !py-2" /><p className="mt-1 text-right text-[11px] text-slate-400">{form.description.length}/1000</p></div>
          <div><label htmlFor="complaint-language" className="mb-1 block text-xs font-semibold text-slate-700">Complaint language</label><select id="complaint-language" value={language} onChange={e => setLanguage(e.target.value)} className="input text-xs !py-2.5"><option value="en">English</option><option value="bn">বাংলা (Bengali)</option><option value="hi">हिन्दी (Hindi)</option></select></div>
          <button type="submit" disabled={busy || !photo || !locationFix || form.description.trim().length < 10} className="btn-primary w-full !py-3.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50">{busy ? <span className="inline-flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" />Saving complaint…</span> : 'Submit complaint'}</button>
          <p className="text-center text-[11px] text-slate-500">A ticket is created before AI review starts. Your category and description are preserved.</p>
        </div>
      </form>

      <LiveCameraModal isOpen={showCamera} onClose={() => setShowCamera(false)} onCapture={capture} title="Capture Live Road Evidence" />
    </div>
  );
}
