import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const adminHome = () => {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Try to get data from localStorage first
      const storedData = localStorage.getItem('adminData');
      if (storedData) {
        setAdminData(JSON.parse(storedData));
      }

      // Optionally fetch fresh data from backend
      const token = localStorage.getItem('adminToken');
      if (token) {
        try {
          const response = await axios.get('http://localhost:5000/api/admin/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data.success) {
            const freshData = response.data.admin;
            setAdminData(freshData);
            localStorage.setItem('adminData', JSON.stringify(freshData));
          }
        } catch (error) {
          console.error('Failed to fetch fresh admin data', error);
          if (error.response?.status === 401) {
            localStorage.removeItem('adminToken');
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
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/admin/signin');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (!adminData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Session expired. Please login again.</p>
        <button
          onClick={() => navigate('/admin/signin')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

  const fullName = `${adminData.firstName || ''} ${adminData.lastName || ''}`.trim() || 'Admin';
  const initials = (adminData.firstName?.charAt(0) || '') + (adminData.lastName?.charAt(0) || '');

  return (
    <div className="p-6">
      {/* Header with logout button */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back, {fullName}
          </h1>
          <p className="text-gray-600 mt-1">Administrator • Campus Flow</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition cursor-pointer"
        >
          Logout
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-8 rounded-xl shadow-lg mb-8">
        <div className="flex items-center space-x-6">
          <div className="bg-white text-blue-600 rounded-full w-20 h-20 flex items-center justify-center text-3xl font-bold">
            {initials || fullName.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold">{fullName}</h2>
            <p className="text-blue-100 mt-1">{adminData.email}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-blue-200 text-sm">Admin ID</p>
                <p className="font-semibold">{adminData.id?.slice(-6).toUpperCase() || 'N/A'}</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">Phone</p>
                <p className="font-semibold">{adminData.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">Status</p>
                <p className="font-semibold">{adminData.isActive ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        <ActionCard
          title="Student Management"
          description="Add, edit, or remove students"
          icon="👥"
          color="from-green-500 to-green-700"
          onClick={() => navigate('/admin/studentmanagement')}
        />
        <ActionCard
          title="Professor Management"
          description="Manage faculty accounts"
          icon="👨‍🏫"
          color="from-purple-500 to-purple-700"
          onClick={() => navigate('/admin/professormanagement')}
        />
        <ActionCard
          title="Gallery"
          description="Upload and manage gallery images"
          icon="🖼️"
          color="from-orange-500 to-orange-700"
          onClick={() => navigate('/admin/handlegallery')}
        />
      </div>

      {/* Admin Details - Full Width */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">📋 Admin Details</h3>
        <div className="space-y-3">
          <InfoItem label="Name" value={fullName} />
          <InfoItem label="Email" value={adminData.email} />
          <InfoItem label="Phone" value={adminData.phone || 'Not provided'} />
          <InfoItem label="Last Login" value={adminData.lastLogin ? new Date(adminData.lastLogin).toLocaleString() : 'Never'} />
          <InfoItem label="Account Created" value={adminData.createdAt ? new Date(adminData.createdAt).toLocaleDateString() : 'N/A'} />
        </div>
      </div>
    </div>
  );
};

// Helper Components
const InfoItem = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-500 text-sm">{label}:</span>
    <span className="font-medium text-gray-800 bg-gray-50 px-3 py-1 rounded-lg">
      {value || 'N/A'}
    </span>
  </div>
);

const ActionCard = ({ title, description, icon, color, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-gradient-to-r ${color} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer`}
  >
    <div className="text-4xl mb-3">{icon}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-white text-opacity-90 text-sm">{description}</p>
  </div>
);

export default adminHome;