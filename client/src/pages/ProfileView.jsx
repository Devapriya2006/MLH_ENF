import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, MapPin, Bell, Shield, HelpCircle, Info, 
  LogOut, Camera, ChevronRight, Edit3, X, Check, Phone, Mail 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LiveCameraModal from '../components/LiveCameraModal';

export default function ProfileView() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [modalType, setModalType] = useState('edit'); // 'edit', 'info', 'support', 'about'

  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    fullAddress: user?.fullAddress || '',
  });

  const [avatarPreview, setAvatarPreview] = useState(user?.idProofPhoto || '');
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/welcome');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateProfile(editForm);
      setEditForm({ name: updated.name || '', email: updated.email || '', phone: updated.phone || '', location: updated.location || '', fullAddress: updated.fullAddress || '' });
      setShowEditModal(false);
    } catch (err) {
      alert('Failed to update profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCaptureAvatar = (file, previewUrl) => {
    setAvatarPreview(previewUrl);
  };

  const menuItems = [
    {
      id: 'personal',
      label: 'Personal Information',
      desc: 'Name, email, phone number',
      icon: User,
      bg: 'bg-blue-50 text-[#0066FF]',
      action: () => {
        setModalType('edit');
        setShowEditModal(true);
      },
    },
    {
      id: 'locations',
      label: 'Saved Locations',
      desc: 'Manage your frequently used locations',
      icon: MapPin,
      bg: 'bg-emerald-50 text-emerald-600',
      action: () => {
          alert(user?.fullAddress || user?.location ? `Saved location: ${user.fullAddress || user.location}` : 'No saved locations yet.');
      },
    },
    {
      id: 'notifications',
      label: 'Notifications',
      desc: 'Manage alert preferences',
      icon: Bell,
      bg: 'bg-amber-50 text-amber-600',
      action: () => {
        alert('Notification preferences are not available in this deployment yet.');
      },
    },
    {
      id: 'privacy',
      label: 'Privacy & Security',
      desc: 'Password and account security',
      icon: Shield,
      bg: 'bg-purple-50 text-purple-600',
      action: () => {
        alert('Your account is protected by the security controls configured for this deployment. Contact the system administrator for details.');
      },
    },
    {
      id: 'help',
      label: 'Help & Support',
      desc: 'FAQs, contact support',
      icon: HelpCircle,
      bg: 'bg-sky-50 text-sky-600',
      action: () => {
        alert('Support contact information has not been configured for this deployment.');
      },
    },
    {
      id: 'about',
      label: 'About CivicLens AI',
      desc: 'App version, terms and policies',
      icon: Info,
      bg: 'bg-slate-100 text-slate-600',
      action: () => {
        alert('CivicLens AI helps citizens report local civic issues and follow their progress.');
      },
    },
  ];

  const displayName = user?.name || 'Citizen account';
  const displayEmail = user?.email || '';
  const displayPhone = user?.phone || '';

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Profile</h1>
        <button
          type="button"
          onClick={() => {
            setModalType('edit');
            setShowEditModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50/70 text-xs font-bold text-[#0066FF] hover:bg-blue-100/70 transition"
        >
          <Edit3 className="h-3.5 w-3.5" /> Edit Profile
        </button>
      </div>

      {/* User Avatar Card (matches Screenshot 5/10) */}
      <div className="card !p-6 bg-gradient-to-b from-blue-50/60 to-white flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-slate-600 font-extrabold text-2xl overflow-hidden border-2 border-white shadow-md">
            {avatarPreview ? (
              <img src={avatarPreview} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-slate-500" />
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowCamera(true)}
            className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-[#0066FF] text-white flex items-center justify-center shadow-md hover:bg-blue-700 transition ring-2 ring-white"
            title="Take live photo for avatar"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-extrabold text-[#0F172A] truncate">{displayName}</h2>
          <p className="text-xs text-slate-500 truncate flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-slate-400" /> {displayEmail}
          </p>
          <p className="text-xs text-slate-500 truncate flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-slate-400" /> {displayPhone}
          </p>
        </div>
      </div>

      {/* Menu List Card */}
      <div className="card !p-2 divide-y divide-slate-100">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-2xl text-left transition group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${item.bg}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[#0F172A] group-hover:text-[#0066FF] transition">
                    {item.label}
                  </h4>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{item.desc}</p>
                </div>
              </div>

              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#0066FF] transition shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Red Logout Card (matches Screenshot 5/10) */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-rose-50/70 border border-rose-100 text-rose-600 font-bold text-sm hover:bg-rose-100/70 transition shadow-sm active:scale-[0.99]"
      >
        <LogOut className="h-4 w-4" />
        <span>Logout</span>
      </button>

      {/* Live Camera Modal for Profile Photo */}
      <LiveCameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCaptureAvatar}
        title="Capture Live Profile Photo"
      />

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-[#0F172A]">Edit Personal Information</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="input !py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="input !py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  required
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="input !py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Address</label>
                <textarea
                  rows={2}
                  required
                  value={editForm.fullAddress}
                  onChange={(e) => setEditForm({ ...editForm, fullAddress: e.target.value })}
                  className="input !py-2 text-xs"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-ghost flex-1 !py-2.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 !py-2.5 text-xs font-bold"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

