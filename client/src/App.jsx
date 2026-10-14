import { Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import { Login, AdminLogin, Register } from './pages/AuthPages';
import Home from './pages/Home';
import ReportsView from './pages/ReportsView';
import ExploreView from './pages/ExploreView';
import ProfileView from './pages/ProfileView';
import Report from './pages/Report';
import ComplaintDetail from './pages/ComplaintDetail';
import Admin from './pages/Admin';
import Leaderboard from './pages/Leaderboard';
import AppLayout from './components/AppLayout';
import { useAuth } from './context/AuthContext';

function Guard({ children, admin }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0066FF] border-t-transparent" />
          <span className="text-xs font-semibold text-slate-500">Loading CivicLens...</span>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/welcome" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Role Selection & Auth Routes */}
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/register" element={<Register />} />

      {/* Authenticated Citizen & Official Views wrapped in AppLayout */}
      <Route
        path="/"
        element={
          <Guard>
            <AppLayout>
              <Home />
            </AppLayout>
          </Guard>
        }
      />
      <Route
        path="/reports"
        element={
          <Guard>
            <AppLayout>
              <ReportsView />
            </AppLayout>
          </Guard>
        }
      />
      <Route
        path="/explore"
        element={
          <Guard>
            <AppLayout>
              <ExploreView />
            </AppLayout>
          </Guard>
        }
      />
      <Route
        path="/profile"
        element={
          <Guard>
            <AppLayout>
              <ProfileView />
            </AppLayout>
          </Guard>
        }
      />
      <Route
        path="/report"
        element={
          <Guard>
            <AppLayout>
              <Report />
            </AppLayout>
          </Guard>
        }
      />
      <Route
        path="/complaint/:id"
        element={
          <Guard>
            <AppLayout>
              <ComplaintDetail />
            </AppLayout>
          </Guard>
        }
      />
      <Route
        path="/admin"
        element={
          <Guard admin>
            <AppLayout>
              <Admin />
            </AppLayout>
          </Guard>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <Guard>
            <AppLayout>
              <Leaderboard />
            </AppLayout>
          </Guard>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
