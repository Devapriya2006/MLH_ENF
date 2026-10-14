import { useEffect, useState } from 'react';
import { Trophy, Award, Star, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/complaints/leaderboard')
      .then(data => setRows(Array.isArray(data) ? data : data.rows || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="text-center space-y-1">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-sm">
          <Trophy className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Citizen Leaderboard</h1>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Points awarded: Report issue (+10), Support report (+2), Verify repair (+3).
        </p>
      </div>

      <div className="card !p-2 divide-y divide-slate-100">
        {loading ? (
          <p className="py-8 text-center text-xs text-slate-400">Loading leaderboard rankings...</p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">No contributors yet. Report an issue to rank first!</p>
        ) : (
          rows.map((u, i) => (
            <div key={u._id} className="flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-2xl transition">
              <div className="flex items-center gap-3">
                <span className="w-8 text-center font-bold text-base">
                  {medals[i] || `#${i + 1}`}
                </span>
                <div className="h-10 w-10 rounded-full bg-blue-50 text-[#0066FF] font-bold flex items-center justify-center text-sm">
                  {u.name?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">{u.name}</h4>
                  <span className="text-[10px] text-slate-400">Citizen Reporter</span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-amber-50 text-amber-800 font-extrabold text-xs px-3 py-1 rounded-full border border-amber-200">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                <span>{u.points} pts</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
