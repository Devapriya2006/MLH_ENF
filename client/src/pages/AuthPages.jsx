import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, Lock, Eye, EyeOff, User, Phone, Calendar, MapPin, Home, 
  ArrowLeft, Camera, Shield, CheckCircle2, ChevronDown, Check,
  BarChart3, Users, Wrench, Sparkles, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/BrandLogo';
import LiveCameraModal from '../components/LiveCameraModal';

/* Left Hero Banner for Auth Screens (matches screenshots desktop view) */
function AuthSideBanner({ title = "Together for", highlight = "Better Roads", subtitle = "Report road issues and help build cleaner, safer and smarter cities.", isAdmin = false }) {
  return (
    <div className="hidden lg:flex flex-col justify-between p-12 relative z-10 max-w-xl">
      <div>
        <BrandLogo size="lg" subtitle={isAdmin ? "Government & Administration" : "Smarter Roads. Safer Cities."} />
        
        <div className="mt-16 space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
            {title} <span className="text-[#0066FF]">{highlight}</span>
          </h1>
          <p className="text-slate-600 text-base leading-relaxed max-w-md">
            {subtitle}
          </p>
        </div>
      </div>

      {isAdmin ? (
        <div className="space-y-5 my-8">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-2xl bg-blue-100/70 text-[#0066FF] flex items-center justify-center shrink-0">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#0F172A] text-sm">Real-time Insights</h4>
              <p className="text-xs text-slate-500">View road issues and progress across regions.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-2xl bg-blue-100/70 text-[#0066FF] flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#0F172A] text-sm">Role-based Access</h4>
              <p className="text-xs text-slate-500">Different access levels for different authorities.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-2xl bg-blue-100/70 text-[#0066FF] flex items-center justify-center shrink-0">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#0F172A] text-sm">Better Coordination</h4>
              <p className="text-xs text-slate-500">Take timely action for cleaner and safer cities.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-6 py-6 border-t border-slate-200/80 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-[#0F172A] block">Safer Roads</span>
              <span className="text-slate-500">For Everyone</span>
            </div>
          </div>
          <div className="h-6 w-[1px] bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-[#0F172A] block">Cleaner Cities</span>
              <span className="text-slate-500">For a Better Tomorrow</span>
            </div>
          </div>
          <div className="h-6 w-[1px] bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-[#0F172A] block">Smarter</span>
              <span className="text-slate-500">Communities</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* 1. CITIZEN LOGIN SCREEN */
export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(email, password, 'citizen');
      nav('/');
    } catch (e2) {
      setErr(e2.message || 'Login failed. Please check your credentials.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 lg:p-10 bg-slate-50 overflow-x-hidden selection:bg-blue-100 selection:text-blue-700">
      {/* Background with road */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url('/hero-road-desktop.jpg')` }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/95 via-white/80 to-blue-50/60" />

      <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left Desktop Brand Banner */}
        <AuthSideBanner />

        {/* Right Floating Login Card (matches mobile & desktop screenshots) */}
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-9 shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <Link to="/welcome" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
            <div className="lg:hidden">
              <BrandLogo size="sm" showSubtitle={false} />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Citizen Login</h2>
            <p className="text-xs text-slate-500 mt-1">Report road issues and track their status.</p>
          </div>

          {err && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-100 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{err}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#0066FF] focus:ring-[#0066FF]"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => alert('Password reset link sent to your registered email.')}
                className="font-medium text-[#0066FF] hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full py-3.5 text-sm font-semibold rounded-xl mt-2"
            >
              {busy ? 'Logging in...' : 'Login'}
            </button>


            {/* Sign up link */}
            <p className="text-center text-xs text-slate-500 pt-3">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-[#0066FF] hover:underline">
                Sign Up
              </Link>
            </p>
          </form>
        </div>
      </div>

    </div>
  );
}

/* 2. ADMIN LOGIN SCREEN (matches Image 7) */
export function AdminLogin() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(email, password, 'admin');
      nav('/admin');
    } catch (e2) {
      setErr(e2.message || 'Official login failed. Verify your administrator credentials.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 lg:p-10 bg-slate-50 overflow-x-hidden selection:bg-blue-100 selection:text-blue-700">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url('/hero-road-desktop.jpg')` }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/95 via-white/80 to-blue-50/60" />

      <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left Banner */}
        <AuthSideBanner
          title="Admin"
          highlight="Portal"
          subtitle="Manage, monitor and resolve road issues across multiple regions."
          isAdmin={true}
        />

        {/* Right Floating Admin Card */}
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-9 shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <Link to="/welcome" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </div>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center mb-3 ring-8 ring-blue-50/50">
              <Shield className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Admin Login</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Login with your official credentials to access the CivicLens AI admin portal.
            </p>
          </div>

          {err && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-100 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{err}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User ID / Official Email */}
            <div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter your User ID or Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full py-3.5 text-sm font-semibold rounded-xl mt-2"
            >
              {busy ? 'Authenticating...' : 'Login'}
            </button>

            <div className="pt-4 text-center">
              <Link to="/login" className="text-xs font-medium text-slate-500 hover:text-[#0066FF]">
                Switch to Citizen Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* 3. CITIZEN REGISTRATION / CREATE ACCOUNT SCREEN (matches Image 2, 5, 6) */
export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    idProofType: 'Aadhar Card',
    idProofNumber: '',
    phone: '',
    email: '',
    password: '',
    gender: 'Male',
    dob: '1995-05-15',
    location: '',
    fullAddress: '',
  });

  const [idPhoto, setIdPhoto] = useState(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [successData, setSuccessData] = useState(null);

  const locations = [];

  const updateField = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleCapturePhoto = (file, previewUrl) => {
    setIdPhoto(file);
    setIdPhotoPreview(previewUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);

    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    if (!fullName) {
      setErr('Please enter both first and last name');
      setBusy(false);
      return;
    }

    try {
      const resultUser = await register({
        name: fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        idProofType: formData.idProofType,
        idProofNumber: formData.idProofNumber,
        gender: formData.gender,
        dob: formData.dob,
        location: formData.location,
        fullAddress: formData.fullAddress,
      });

      // Show success celebratory screen matching Screenshot 4
      setSuccessData({
        name: fullName,
        email: formData.email,
        phone: formData.phone,
        idProofType: formData.idProofType,
        idProofNumber: formData.idProofNumber,
        location: formData.location,
      });
    } catch (e2) {
      setErr(e2.message || 'Registration failed. Please check the entered information.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 lg:p-10 bg-slate-50 overflow-x-hidden selection:bg-blue-100 selection:text-blue-700">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url('/hero-road-desktop.jpg')` }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/95 via-white/80 to-blue-50/60" />

      {/* Main container */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-start justify-between gap-8 my-auto">
        {/* Left Side Banner */}
        <AuthSideBanner
          title="Together for"
          highlight="Better Roads"
          subtitle="Report road issues and help build cleaner, safer and smarter cities."
        />

        {/* Right Create Account Form Card */}
        <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-9 shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-slate-100 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition">
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </Link>
            <div className="lg:hidden">
              <BrandLogo size="sm" showSubtitle={false} />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Create Citizen Account</h2>
            <p className="text-xs text-slate-500 mt-1">Fill in your details to get started and report road issues.</p>
          </div>

          {err && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-100 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{err}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Select ID Proof Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select ID Proof *</label>
              <div className="relative">
                <select
                  value={formData.idProofType}
                  onChange={(e) => updateField('idProofType', e.target.value)}
                  className="input appearance-none pr-10 cursor-pointer"
                >
                  <option value="Aadhar Card">Aadhar Card</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Passport">Passport</option>
                </select>
                <ChevronDown className="pointer-events-none absolute inset-y-0 right-3.5 my-auto h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* ID Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ID Number *</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Shield className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter ID number"
                  value={formData.idProofNumber}
                  onChange={(e) => updateField('idProofNumber', e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Upload ID Proof Photo - ONLY LIVE CAMERA (per user request) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Upload ID Proof Photo * <span className="text-[#0066FF] font-normal">(Live Camera Capture Only)</span>
              </label>

              {idPhotoPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-2 flex items-center gap-3">
                  <img
                    src={idPhotoPreview}
                    alt="ID Proof Captured"
                    className="h-20 w-24 object-cover rounded-xl border border-slate-200"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Live Photo Captured
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Clear image captured via camera</p>
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="mt-2 text-xs font-semibold text-[#0066FF] hover:underline flex items-center gap-1"
                    >
                      <Camera className="h-3.5 w-3.5" /> Retake Live Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => setShowCamera(true)}
                  className="border-2 border-dashed border-blue-200 hover:border-[#0066FF] bg-blue-50/40 hover:bg-blue-50/70 rounded-2xl p-4 text-center cursor-pointer transition group"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0066FF] shadow-sm group-hover:scale-105 transition-transform">
                    <Camera className="h-6 w-6" />
                  </div>
                  <h4 className="mt-2 text-xs font-bold text-slate-800">Take Live Photo</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click to launch camera directly. (File browsing disabled for authenticity)
                  </p>
                </div>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  required
                  placeholder="Enter mobile number"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Email Address & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Password (6+ chars)"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Gender & Date of Birth */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                <div className="relative">
                  <select
                    value={formData.gender}
                    onChange={(e) => updateField('gender', e.target.value)}
                    className="input appearance-none pr-10 cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute inset-y-0 right-3.5 my-auto h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth *</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => updateField('dob', e.target.value)}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location *</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <select
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  className="input pl-10 appearance-none pr-10 cursor-pointer"
                >
                  <option value="">Select your city</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute inset-y-0 right-3.5 my-auto h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Full Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Address *</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Home className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter your full address"
                  value={formData.fullAddress}
                  onChange={(e) => updateField('fullAddress', e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full py-3.5 text-sm font-semibold rounded-xl mt-3"
            >
              {busy ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>

      {/* Live Camera Viewfinder Modal */}
      <LiveCameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCapturePhoto}
        title="Capture ID Proof Live Photo"
      />

      {/* Account Created Successfully Modal (Screenshot 4) */}
      {successData && (
        <AccountSuccessModal
          data={successData}
          onDone={() => nav('/')}
        />
      )}
    </div>
  );
}

/* 5. ACCOUNT CREATED SUCCESSFULLY MODAL (Screenshot 4) */
function AccountSuccessModal({ data, onDone }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 sm:p-9 shadow-2xl border border-slate-100 text-center">
        {/* Animated Celebration Green Badge */}
        <div className="relative mx-auto my-3 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
          <div className="h-20 w-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_8px_25px_rgba(16,185,129,0.4)]">
            <Check className="h-10 w-10 stroke-[3]" />
          </div>
        </div>

        <h3 className="text-2xl font-extrabold text-[#0F172A] mt-4">
          Account Created Successfully!
        </h3>
        <p className="text-base font-bold text-[#0066FF] mt-1">
          Welcome, {data.name}!
        </p>
        <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
          Your citizen account has been created. You can now report road issues and track their status.
        </p>

        {/* Account Details Card */}
        <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 p-4 text-left space-y-2.5 text-xs">
          <div className="font-bold text-[#0F172A] border-b border-slate-200/60 pb-2 mb-2">Account Details</div>
          <div className="flex items-center gap-2.5 text-slate-600">
            <User className="h-4 w-4 text-[#0066FF]" />
            <span className="font-semibold text-slate-800">{data.name}</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-600">
            <Mail className="h-4 w-4 text-[#0066FF]" />
            <span>{data.email}</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-600">
            <Phone className="h-4 w-4 text-[#0066FF]" />
            <span>{data.phone || 'Not provided'}</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-600">
            <Shield className="h-4 w-4 text-[#0066FF]" />
            <span>{data.idProofType} • {data.idProofNumber ? `XXXX ${data.idProofNumber.slice(-4)}` : 'Not provided'}</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-600">
            <MapPin className="h-4 w-4 text-[#0066FF]" />
            <span>{data.location || 'Not provided'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            onClick={onDone}
            className="btn-primary w-full py-3.5 text-sm font-semibold rounded-xl"
          >
            Go to Dashboard
          </button>
          <button
            type="button"
            onClick={onDone}
            className="btn-ghost w-full py-3 text-xs font-semibold rounded-xl"
          >
            Continue to App
          </button>
        </div>
      </div>
    </div>
  );
}
