import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Map as MapIcon, Ticket, BarChart2, TrendingUp, 
  Settings, ChevronRight, LogOut, Shield, Bell, Menu, X, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Inspector display info (matches Vikram, City Inspector in screenshots)
  const inspectorName = user?.name || 'Vikram';
  const inspectorRole = user?.department || 'City Inspector';
  const inspectorInitials = inspectorName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'VK';

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Map', path: '/admin/map', icon: MapIcon },
    { label: 'Tickets', path: '/admin/tickets', icon: Ticket, badge: 12 },
    { label: 'Reports', path: '/admin/reports', icon: BarChart2 },
    { label: 'Analytics', path: '/admin/analytics', icon: TrendingUp },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row text-[#0F172A] selection:bg-blue-100 selection:text-blue-700">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <BrandLogo size="sm" subtitle="Smarter Cities. Safer Roads." />
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Left Sidebar (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 flex flex-col justify-between py-6 px-4 transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="space-y-7">
          {/* Brand Logo */}
          <div className="px-2">
            <BrandLogo size="md" subtitle="Smarter Cities. Safer Roads." />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                (item.path === '/admin/dashboard' && (location.pathname === '/admin' || location.pathname === '/admin/dashboard'));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#EFF6FF] text-[#0066FF] font-bold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-[#0066FF]' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-[#EF4444] text-white text-[11px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Options */}
        <div className="pt-4 border-t border-slate-100 relative">
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 cursor-pointer transition group"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#E2E8F0] text-[#0F172A] font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                {inspectorInitials}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-[#0F172A] leading-tight">
                  {inspectorName}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {inspectorRole}
                </span>
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition" />
          </div>

          {/* Profile Dropdown Popover */}
          {showProfileMenu && (
            <div className="absolute bottom-16 left-2 right-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-fadeIn space-y-1">
              <NavLink
                to="/"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                <ArrowLeft className="h-4 w-4 text-slate-400" />
                <span>Switch to Citizen Portal</span>
              </NavLink>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 h-[calc(100vh-60px)] lg:h-screen overflow-y-auto bg-[#F8FAFC]">
        <Outlet />
      </main>
    </div>
  );
}

