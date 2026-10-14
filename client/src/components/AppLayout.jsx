import { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, FileText, Compass, User, LogOut, HelpCircle, 
  ChevronDown, AlertTriangle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';

export default function AppLayout({ children, onOpenReport }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'My Reports', path: '/reports', icon: FileText },
    { label: 'Explore', path: '/explore', icon: Compass },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/welcome');
  };

  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U';
  const userName = user?.name?.split(' ')[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-[#0F172A] selection:bg-blue-100 selection:text-blue-700">
      {/* Top Header Bar (matches screenshots 4 & 5) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size="md" subtitle="Smarter Cities. Better Communities." />
          </Link>

          {/* Right Header Controls */}
          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell with red dot */}
            {/* Separator dot */}
            <span className="hidden sm:inline-block text-slate-300 font-bold select-none">•</span>

            {/* User Avatar & Hello dropdown */}
            <Link
              to="/profile"
              className="flex items-center gap-2.5 pl-1 py-1 pr-1.5 rounded-full hover:bg-slate-50 transition group"
            >
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-[#7C8BA1] text-white font-semibold flex items-center justify-center text-xs sm:text-sm shadow-sm group-hover:ring-2 group-hover:ring-[#0066FF] transition">
                {userInitial}
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-left">
                <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#0066FF] transition">
                  {userName ? `Hello, ${userName}` : 'Your account'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700 transition" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 pb-28 md:pb-8 flex gap-8">
        {/* Desktop Left Sidebar */}
        <aside className="hidden md:flex flex-col justify-between w-56 shrink-0 space-y-6">
          <nav className="space-y-1.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path === '/' && location.pathname === '') ||
                (item.path === '/reports' && location.pathname.startsWith('/reports'));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#0066FF] text-white shadow-[0_4px_14px_rgba(0,102,255,0.25)]'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <AlertTriangle className="h-5 w-5" />
                <span>Admin Portal</span>
              </NavLink>
            )}
          </nav>

          <div className="pt-6 border-t border-slate-200/60 space-y-1">
            <button
              onClick={() => alert('Support contact information has not been configured for this deployment.')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 w-full text-left transition"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Help & Support</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 w-full text-left transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Dynamic Center Page Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Matches Screens 4 & 5) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_25px_rgba(0,0,0,0.06)]">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '');

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center transition-all ${
                isActive
                  ? 'bg-blue-50 text-[#0066FF] font-bold px-4 py-1.5 rounded-2xl'
                  : 'text-slate-500 hover:text-slate-700 px-3 py-1.5'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
