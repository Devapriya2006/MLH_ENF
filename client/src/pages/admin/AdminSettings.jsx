import { useState } from 'react';
import { Settings, Shield, Bell, Sliders, Users, Database, Check } from 'lucide-react';

export default function AdminSettings() {
  const [saved, setSaved] = useState(false);
  const [autoTriage, setAutoTriage] = useState(true);
  const [criticalThreshold, setCriticalThreshold] = useState(70);
  const [smsAlerts, setSmsAlerts] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Portal Settings</h1>
        <p className="text-xs text-slate-400 mt-1">Configure AI automated triage thresholds, departmental routing and alert notifications.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* AI & Automation */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <Sliders className="h-5 w-5 text-[#0066FF]" />
            <h3 className="font-extrabold text-sm text-[#0F172A]">AI Classification & Triage Engine</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Automatic Severity Scoring</span>
                <span className="text-slate-400">Score incoming citizen uploads with CivicVision pipeline instantly.</span>
              </div>
              <input
                type="checkbox"
                checked={autoTriage}
                onChange={(e) => setAutoTriage(e.target.checked)}
                className="h-4 w-4 rounded text-[#0066FF] focus:ring-[#0066FF]"
              />
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Critical Priority Cutoff Score</span>
                <span className="font-bold text-[#0066FF]">{criticalThreshold}/100</span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                className="w-full accent-[#0066FF]"
              />
              <span className="text-[11px] text-slate-400 block">Issues scoring above {criticalThreshold} trigger immediate dispatch to fast-response teams.</span>
            </div>
          </div>
        </div>

        {/* Notifications & Dispatch */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <Bell className="h-5 w-5 text-[#0066FF]" />
            <h3 className="font-extrabold text-sm text-[#0F172A]">Alerts & Municipal Dispatch</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">High-Priority SMS & WhatsApp Dispatch</span>
                <span className="text-slate-400">Notify regional crew heads immediately when critical road hazards are logged.</span>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="h-4 w-4 rounded text-[#0066FF] focus:ring-[#0066FF]"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">
              <Check className="h-4 w-4" /> Changes saved successfully!
            </span>
          )}
          <button type="submit" className="btn-primary !py-2.5 !px-6 text-xs font-bold ml-auto">
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}

