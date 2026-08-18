import React, { useState, useEffect } from 'react';
import axios from '../../axiosConfig';
import { ShieldCheck, Plus, Trash2, Loader2, Check, Eye, EyeOff } from 'lucide-react';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '', role: 'DepartmentAdmin', department: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [adminRes, deptRes] = await Promise.all([
        axios.get('/admin/admins'),
        axios.get('/departments')
      ]);
      
      if (adminRes.data.success) setAdmins(adminRes.data.data);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      
      const payload = { ...formData };
      if (payload.role === 'SuperAdmin') delete payload.department;
      
      const res = await axios.post('/admin/admins', payload);
      
      if (res.data.success) {
        setShowForm(false);
        setFormData({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'DepartmentAdmin', department: '' });
        fetchData(); // Reload
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-blue-600" /> Admin Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage system administrators and their department access.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          {showForm ? <Trash2 size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add Admin'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <h3 className="font-bold text-slate-700 border-b pb-2 mb-4">Add New Admin</h3>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">First Name *</label>
            <input required type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full p-2.5 border rounded-xl text-sm" placeholder="John" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Last Name *</label>
            <input required type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full p-2.5 border rounded-xl text-sm" placeholder="Doe" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Email *</label>
            <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full p-2.5 border rounded-xl text-sm" placeholder="admin@college.edu" />
          </div>
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Password *</label>
            <input required type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} className="w-full p-2.5 border rounded-xl text-sm pr-10" placeholder="••••••••" minLength="8" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Role *</label>
            <select required name="role" value={formData.role} onChange={handleInputChange} className="w-full p-2.5 border rounded-xl text-sm bg-white">
              <option value="DepartmentAdmin">Department Admin</option>
              <option value="SuperAdmin">Super Admin</option>
            </select>
          </div>
          {formData.role === 'DepartmentAdmin' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Department *</label>
              <select required name="department" value={formData.department} onChange={handleInputChange} className="w-full p-2.5 border rounded-xl text-sm bg-white">
                <option value="">Select Department</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
          )}
          <div className="md:col-span-2 flex justify-end mt-2">
            <button disabled={submitting} type="submit" className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-slate-800 disabled:opacity-70">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Create Admin
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Department</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {admins.map(admin => (
              <tr key={admin._id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-800">{admin.firstName} {admin.lastName}</td>
                <td className="p-4 text-slate-500">{admin.email}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${admin.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {admin.role === 'SuperAdmin' ? 'Super Admin' : 'Dept Admin'}
                  </span>
                </td>
                <td className="p-4 text-slate-500">{admin.department ? admin.department.name : 'All Departments'}</td>
                <td className="p-4">
                  {admin.isActive ? <span className="text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-1 rounded">Active</span> : <span className="text-red-600 font-medium text-xs bg-red-50 px-2 py-1 rounded">Inactive</span>}
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr><td colSpan="5" className="p-8 text-center text-slate-500">No admins found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminManagement;
