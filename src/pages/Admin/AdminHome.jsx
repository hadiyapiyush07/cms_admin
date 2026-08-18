import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminDashboardCharts from '../../components/AdminDashboardCharts';
import {
  Users, GraduationCap, Image, LogOut,
  KeyRound, Mail, Phone, Calendar, Clock,
  ShieldCheck, BadgeCheck, ArrowUpCircle, Loader2
} from 'lucide-react';

// ── Helper Components (defined outside to avoid re-mount) ──────────────────

const InfoItem = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
    <div className="flex items-center gap-2 text-slate-500 text-sm">
      {Icon && <Icon size={14} className="text-slate-400" />}
      <span>{label}</span>
    </div>
    <span className="font-medium text-slate-800 text-sm bg-slate-50 px-3 py-1 rounded-lg max-w-[60%] truncate text-right">
      {value || 'N/A'}
    </span>
  </div>
);

const ActionCard = ({ title, description, icon: Icon, gradient, onClick }) => (
  <div
    onClick={onClick}
    className={`${gradient} text-white p-5 md:p-6 rounded-2xl shadow-lg hover:shadow-xl
      transform hover:-translate-y-1 transition-all duration-300 cursor-pointer
      active:scale-95 flex flex-col items-start`}
  >
    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
      <Icon size={24} className="text-white" />
    </div>
    <h3 className="text-lg font-bold mb-1">{title}</h3>
    <p className="text-white/80 text-sm leading-relaxed">{description}</p>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────

const AdminHome = () => {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { loadAdminData(); }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const storedData = localStorage.getItem('adminData');
      if (storedData) setAdminData(JSON.parse(storedData));

      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await axios.get('https://cms-backend-wl7u.onrender.com/api/admin/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data.success) {
            const freshData = response.data.data;
            setAdminData(freshData);
            localStorage.setItem('adminData', JSON.stringify(freshData));
          }
        } catch (error) {
          console.error('Failed to fetch fresh admin data', error);
          if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('adminData');
            navigate('/admin/signin');
          }
        }
      } else {
        navigate('/admin/signin');
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminData');
    navigate('/admin/signin');
  };

  const handleUpgrade = async () => {
    const confirmation = window.prompt("WARNING: You are about to upgrade ALL active students to the next semester. This action CANNOT be undone.\n\nType 'CONFIRM' to proceed:");
    
    if (confirmation !== "CONFIRM") {
      alert("Upgrade cancelled. You did not type 'CONFIRM' exactly.");
      return;
    }
    
    setUpgrading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post('https://cms-backend-wl7u.onrender.com/api/admin/semester/upgrade', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const { upgraded, graduated, errors } = response.data.data;
        alert(`Upgrade Complete!\n\nStudents Upgraded: ${upgraded}\nStudents Graduated: ${graduated}\nErrors: ${errors}`);
        window.location.reload();
      }
    } catch (error) {
      console.error('Upgrade error', error);
      alert('Failed to upgrade semesters. Check console for details.');
    } finally {
      setUpgrading(false);
    }
  };

  // ── Loading ──
  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Loading profile...</p>
      </div>
    </div>
  );

  // ── No data ──
  if (!adminData) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-red-500 font-medium">Session expired. Please login again.</p>
      <button
        onClick={() => navigate('/admin/signin')}
        className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition text-sm font-semibold"
      >
        Go to Login
      </button>
    </div>
  );

  const fullName = `${adminData.firstName || ''} ${adminData.lastName || ''}`.trim() || 'Admin';
  const initials = (adminData.firstName?.charAt(0) || '') + (adminData.lastName?.charAt(0) || '');
  const adminId  = adminData.id || adminData._id || adminData.adminId;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">
            Welcome back, <span className="text-blue-600">{adminData.firstName || 'Admin'}</span> 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">Administrator · Campus Flow</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate('/admin/change-password')}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition active:scale-95"
          >
            <KeyRound size={15} />
            <span className="hidden xs:inline">Change Password</span>
            <span className="xs:hidden">Password</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition active:scale-95"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </div>

      {/* ── Profile Card ── */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 text-white rounded-2xl shadow-xl overflow-hidden">
        {/* Top decorative strip */}
        <div className="h-1.5 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300" />

        <div className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-white text-blue-700 rounded-2xl flex items-center justify-center text-3xl md:text-4xl font-bold shadow-lg">
                {initials || fullName.charAt(0)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-2 border-blue-800 flex items-center justify-center">
                <BadgeCheck size={12} className="text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl md:text-3xl font-bold truncate">{fullName}</h2>
              <p className="text-blue-200 text-sm mt-0.5 flex items-center gap-1.5">
                <Mail size={13} /> {adminData.email}
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
                <div className="bg-white/10 backdrop-blur rounded-xl px-3 py-2.5">
                  <p className="text-blue-200 text-xs mb-0.5">Admin ID</p>
                  <p className="font-bold text-sm tracking-wide">
                    {adminId ? adminId.toString().slice(-6).toUpperCase() : 'N/A'}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl px-3 py-2.5">
                  <p className="text-blue-200 text-xs mb-0.5">Phone</p>
                  <p className="font-bold text-sm">{adminData.phone || 'Not set'}</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl px-3 py-2.5 col-span-2 sm:col-span-1">
                  <p className="text-blue-200 text-xs mb-0.5">Status</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    <p className="font-bold text-sm">{adminData.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Action Cards ── */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {adminData?.role === 'SuperAdmin' ? (
            <>
              <ActionCard
                title="Admin Management"
                description="Manage system administrators"
                icon={Users}
                gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
                onClick={() => navigate('/admin/adminmanagement')}
              />
              <ActionCard
                title="Gallery"
                description="Upload and manage college gallery images"
                icon={Image}
                gradient="bg-gradient-to-br from-orange-500 to-orange-700"
                onClick={() => navigate('/admin/handlegallery')}
              />
            </>
          ) : (
            <>
              <ActionCard
                title="Student Management"
                description="Add, edit, or remove student accounts"
                icon={Users}
                gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
                onClick={() => navigate('/admin/studentmanagement')}
              />
              <ActionCard
                title="Professor Management"
                description="Manage faculty and professor accounts"
                icon={GraduationCap}
                gradient="bg-gradient-to-br from-purple-500 to-purple-700"
                onClick={() => navigate('/admin/professormanagement')}
              />
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className={`text-white p-5 md:p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-95 flex flex-col items-start bg-gradient-to-br from-blue-500 to-blue-700 ${upgrading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              {upgrading ? <Loader2 size={24} className="text-white animate-spin" /> : <ArrowUpCircle size={24} className="text-white" />}
            </div>
            <h3 className="text-lg font-bold mb-1">{upgrading ? 'Upgrading...' : 'Upgrade Semesters'}</h3>
            <p className="text-white/80 text-sm leading-relaxed text-left">Auto-promote all students to the next semester</p>
          </button>
            </>
          )}
        </div>
      </div>

      {/* ── Analytics Dashboard ── */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 mt-4">Analytics Overview</h3>
        <AdminDashboardCharts />
      </div>

      {/* ── Admin Details ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <ShieldCheck size={18} className="text-blue-600" />
          <h3 className="text-base font-semibold text-slate-800">Admin Details</h3>
        </div>
        <div className="px-6 py-2">
          <InfoItem icon={Users}    label="Full Name"       value={fullName} />
          <InfoItem icon={Mail}     label="Email"           value={adminData.email} />
          <InfoItem icon={Phone}    label="Phone"           value={adminData.phone || 'Not provided'} />
          <InfoItem icon={Clock}    label="Last Login"
            value={adminData.lastLogin
              ? new Date(adminData.lastLogin).toLocaleString('en-IN', {
                  dateStyle: 'medium', timeStyle: 'short'
                })
              : 'Never'} />
          <InfoItem icon={Calendar} label="Account Created"
            value={adminData.createdAt
              ? new Date(adminData.createdAt).toLocaleDateString('en-IN', {
                  dateStyle: 'long'
                })
              : 'N/A'} />
        </div>
      </div>

    </div>
  );
};

export default AdminHome;
