import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, FileText, Image as ImageIcon, X, Bell, ChevronRight } from 'lucide-react';

const NotificationManagement = () => {
  const [departments, setDepartments]   = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [formData, setFormData]         = useState({ title: '', content: '', attachments: [] });
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await axios.get('https://cms-backend-wl7u.onrender.com/api/departments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          let fetchedDepts = res.data.data;
          const userStr = localStorage.getItem('adminData');
          const user = userStr ? JSON.parse(userStr) : null;
          
          if (user?.role === 'DepartmentAdmin' && user?.department) {
             const deptId = typeof user.department === 'string' ? user.department : user.department._id;
             fetchedDepts = fetchedDepts.filter(d => d._id === deptId);
             setSelectedDept(deptId);
          }
          setDepartments(fetchedDepts);
        }
      } catch (err) { console.error(err); }
    })();
  }, []);

  useEffect(() => {
    if (selectedDept) fetchNotifications(selectedDept);
  }, [selectedDept]);

  const fetchNotifications = async (deptId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.get(`https://cms-backend-wl7u.onrender.com/api/notifications?department=${deptId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setNotifications(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const total = formData.attachments.length + newFiles.length;
    if (total > 5) { alert(`Max 5 files. You have ${formData.attachments.length} already.`); return; }
    setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...newFiles] }));
  };

  const removeFile = (index) =>
    setFormData(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('authToken');
      const data  = new FormData();
      data.append('title', formData.title);
      data.append('content', formData.content);
      data.append('department', selectedDept);
      formData.attachments.forEach(file => data.append('attachments', file));

      const res = await axios.post('https://cms-backend-wl7u.onrender.com/api/notifications', data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setSuccess('Notification sent!');
        setFormData({ title: '', content: '', attachments: [] });
        fetchNotifications(selectedDept);
        setShowModal(false);
      } else { setError(res.data.message); }
    } catch (err) { setError(err.response?.data?.message || 'Server error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`https://cms-backend-wl7u.onrender.com/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch { alert('Failed to delete'); }
  };

  const selectedDeptName = departments.find(d => d._id === selectedDept)?.name;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Bell size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">Notification Center</h1>
            <p className="text-slate-500 text-xs mt-0.5">Send and manage department notifications</p>
          </div>
        </div>
        {selectedDept && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition self-start sm:self-auto"
          >
            <Plus size={16} /> Send Notification
          </button>
        )}
      </div>

      {/* ── Department Cards ── */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Select Department</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {departments.map(dept => (
            <button
              key={dept._id}
              onClick={() => setSelectedDept(dept._id)}
              className={`text-left p-4 rounded-xl border transition-all duration-200 active:scale-95 ${
                selectedDept === dept._id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                  : 'bg-white hover:border-blue-300 hover:shadow-md border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base">{dept.name}</h3>
                  <p className={`text-xs mt-0.5 ${selectedDept === dept._id ? 'text-blue-100' : 'text-slate-400'}`}>
                    {dept.code}
                    {dept.description ? ` • ${dept.description.substring(0, 40)}...` : ''}
                  </p>
                </div>
                <ChevronRight size={16} className={selectedDept === dept._id ? 'text-blue-200' : 'text-slate-300'} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Notifications List ── */}
      {selectedDept && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-base">
              {selectedDeptName} — Notifications
            </h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
              {notifications.length} total
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-500 text-sm">Loading...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell size={24} className="text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium text-sm">No notifications yet</p>
              <p className="text-slate-400 text-xs mt-1">Click "Send Notification" to create one</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map(notif => (
                <div key={notif._id} className="px-5 py-4 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                        <h3 className="font-semibold text-slate-800 text-sm truncate">{notif.title}</h3>
                      </div>
                      <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed ml-3.5">
                        {notif.content}
                      </p>
                      {notif.attachments?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2 ml-3.5">
                          {notif.attachments.map((att, idx) => (
                            <a
                              key={idx}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-xs bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg"
                            >
                              {att.fileType === 'image' ? <ImageIcon size={12} /> : <FileText size={12} />}
                              {att.filename}
                            </a>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-slate-400 mt-2 ml-3.5">
                        {new Date(notif.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        {' '}· {notif.createdBy?.firstName || 'Admin'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(notif._id)}
                      className="text-slate-300 hover:text-red-500 transition p-1.5 rounded-lg hover:bg-red-50 flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-base font-bold text-slate-800">New Notification</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Notification title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Content <span className="text-red-500">*</span></label>
                <textarea
                  rows="4"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  placeholder="Write notification content..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Attachments <span className="text-slate-400 font-normal">(PDF/Images, max 5)</span>
                </label>
                <input
                  type="file" multiple accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:text-xs file:font-semibold"
                  ref={(input) => { if (input) input.value = ''; }}
                />
                {formData.attachments.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {formData.attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg">
                        <span className="text-xs text-slate-600 truncate max-w-[80%]">{file.name}</span>
                        <button type="button" onClick={() => removeFile(idx)} className="text-red-400 hover:text-red-600 transition">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error   && <p className="text-red-500 text-xs">{error}</p>}
              {success && <p className="text-emerald-500 text-xs">{success}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManagement;
