import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, ChevronRight, ArrowRight, Globe, ChevronDown, CheckCircle, Leaf } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

export default function Welcome() {
  const navigate = useNavigate();
  const [lang, setLang] = useState('English');
  const [showLangMenu, setShowLangMenu] = useState(false);

  const languages = ['English'];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-700">
      {/* Background with Road & Skyline */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-45"
        style={{ backgroundImage: `url('/hero-road-desktop.jpg')` }}
      />
      {/* Soft gradient overlays */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/95 via-white/80 to-slate-50/95" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full px-5 py-4 max-w-7xl mx-auto flex items-center justify-between">
        <BrandLogo size="md" subtitle="Smarter Roads. Safer Cities." />

        {/* Language selector pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-md hover:bg-white hover:border-slate-300 transition"
          >
            <Globe className="h-3.5 w-3.5 text-slate-500" />
            <span>{lang}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-36 overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl z-50 animate-fadeIn">
              {languages.map(l => (
                <button
                  key={l}
                  onClick={() => {
                    setLang(l.split(' ')[0]);
                    setShowLangMenu(false);
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-xs font-medium transition ${
                    lang.startsWith(l.split(' ')[0]) ? 'bg-blue-50 text-[#0066FF] font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Hero Body */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4 max-w-md md:max-w-4xl mx-auto w-full text-center">
        {/* Headlines */}
        <div className="space-y-2 mb-8 md:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
            Together for <br className="sm:hidden" />
            <span className="text-[#0066FF]">Better Roads</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-normal max-w-xs sm:max-w-md mx-auto leading-relaxed">
            Report local infrastructure issues, attach photo evidence, and follow each report from submission to resolution.
          </p>
        </div>

        {/* --- MOBILE VIEW: Horizontal row cards with chevron (Screen 1 Mobile) --- */}
        <div className="w-full space-y-3.5 md:hidden">
          {/* Card 1: Citizen */}
          <div 
            onClick={() => navigate('/login')}
            className="group cursor-pointer rounded-3xl border border-slate-200/80 bg-white/95 p-4 text-left shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-md transition-all duration-200 hover:border-[#0066FF]/60 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0066FF]">
                <Users className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-[#0F172A]">I'm a Citizen</h2>
                <p className="text-xs text-slate-500 font-normal mt-0.5 leading-snug">
                  Report a road issue and track its status
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
          </div>

          {/* Card 2: Government / Official */}
          <div 
            onClick={() => navigate('/admin-login')}
            className="group cursor-pointer rounded-3xl border border-slate-200/80 bg-white/95 p-4 text-left shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-md transition-all duration-200 hover:border-slate-400 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Shield className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-[#0F172A]">Government / Official</h2>
                <p className="text-xs text-slate-500 font-normal mt-0.5 leading-snug">
                  Login to manage and resolve road issues
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
          </div>
        </div>

        {/* --- DESKTOP VIEW: 2 Side-by-Side Cards with Buttons (Desktop Image 1) --- */}
        <div className="hidden md:grid md:grid-cols-2 md:gap-6 w-full max-w-2xl">
          {/* Card 1: Citizen */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-7 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md flex flex-col items-center justify-between">
            <div className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0066FF] mb-4">
                <Users className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-1">I'm a Citizen</h2>
              <p className="text-xs text-slate-500 font-normal leading-relaxed max-w-xs mb-6">
                Report road issues, add photos and track their status.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="btn-primary w-full !py-3 text-xs font-bold rounded-2xl"
            >
              Get Started →
            </button>
          </div>

          {/* Card 2: Government / Official */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-7 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md flex flex-col items-center justify-between">
            <div className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 mb-4">
                <Shield className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-1">Government / Official</h2>
              <p className="text-xs text-slate-500 font-normal leading-relaxed max-w-xs mb-6">
                Login to manage and resolve road issues.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin-login')}
              className="btn-secondary w-full !py-3 text-xs font-bold rounded-2xl !bg-[#EAF2FF] !text-[#0066FF] hover:!bg-[#DBEAFE]"
            >
              Official Login →
            </button>
          </div>
        </div>

        {/* Mobile caption text (Screen 1 Mobile bottom) */}
        <p className="md:hidden text-xs text-slate-500 mt-8 mb-2">
          Reports and updates shown here come from submitted records.
        </p>
      </main>

      {/* Desktop Footer Badges (Desktop Image 1 bottom) */}
      <footer className="hidden md:block relative z-10 w-full border-t border-slate-200/60 bg-white/80 backdrop-blur-md py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-around text-slate-600 text-xs">
          <div className="flex items-center gap-2.5 font-medium">
            <div className="h-8 w-8 rounded-full bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            <div className="text-left">
              <span className="font-bold text-[#0F172A] block">Photo evidence</span>
              <span className="text-slate-500 text-[11px]">Attach context to reports</span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-200" />

          <div className="flex items-center gap-2.5 font-medium">
            <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="text-left">
              <span className="font-bold text-[#0F172A] block">Clear status</span>
              <span className="text-slate-500 text-[11px]">Track each report</span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-200" />

          <div className="flex items-center gap-2.5 font-medium">
            <div className="h-8 w-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Leaf className="h-4 w-4" />
            </div>
            <div className="text-left">
              <span className="font-bold text-[#0F172A] block">Local visibility</span>
              <span className="text-slate-500 text-[11px]">See nearby reports</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
