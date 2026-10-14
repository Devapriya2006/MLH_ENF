import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [ai, setAi] = useState(null);
  useEffect(() => { fetch('/api/health').then(r => r.json()).then(h => setAi(h.ai)).catch(() => setAi({ reachable: false })); }, []);
  const ready = ai?.reachable && ai?.installed;
  const link = ({ isActive }) => `px-3 py-1.5 rounded-lg text-sm font-medium ${isActive ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`;
  return (
    <header className="sticky top-0 z-[1000] border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2">
        <Link to="/" className="text-lg font-bold text-brand-700">🔎 CivicLens <span className="text-slate-800">AI</span></Link>
        <nav className="flex flex-wrap items-center gap-1">
          {ai && (
            <span
              title={ai.engine === 'cloudflare' ? 'Cloudflare Workers AI' : 'Open-weight vision model'}
              className={`rounded-full px-2 py-1 text-xs font-medium ${ready ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}
            >
              {ready
                ? `🟢 AI: ${ai.engine === 'cloudflare' ? 'Cloudflare AI' : ai.model}`
                : `🟡 AI: ${ai.engine === 'cloudflare' ? 'Set Cloudflare tokens' : 'Offline'}`}
            </span>
          )}
          <NavLink to="/" end className={link}>Map</NavLink>
          <NavLink to="/report" className={link}>Report</NavLink>
          <NavLink to="/leaderboard" className={link}>Leaderboard</NavLink>
          {user?.role === 'admin' && <NavLink to="/admin" className={link}>Admin</NavLink>}
          {user ? (
            <>
              <span className="ml-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">🏆 {user.points} pts</span>
              <span className="hidden text-sm text-slate-500 sm:inline">{user.name}</span>
              <button className="btn-ghost !py-1" onClick={() => { logout(); nav('/'); }}>Logout</button>
            </>
          ) : (
            <><Link to="/login" className="btn-ghost !py-1">Login</Link><Link to="/register" className="btn-primary !py-1">Sign up</Link></>
          )}
        </nav>
      </div>
    </header>
  );
}
