import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, FileText, Image as ImageIcon, X } from 'lucide-react';

const NotificationManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    attachments: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await axios.get('http://localhost:5000/api/departments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) setDepartments(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch notifications when a department is selected
  useEffect(() => {
    if (selectedDept) {
      fetchNotifications(selectedDept);
    }
  }, [selectedDept]);

  const fetchNotifications = async (deptId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.get(`http://localhost:5000/api/notifications?department=${deptId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setNotifications(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection – merge with existing files
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    // Limit total to 5 files
    const total = formData.attachments.length + newFiles.length;
    if (total > 5) {
      alert(`You can only attach up to 5 files. You have ${formData.attachments.length} already.`);
      return;
    }
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newFiles]
    }));
  };

  // Remove a file from the list
  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('authToken');
      const data = new FormData();
      data.append('title', formData.title);
      data.append('content', formData.content);
      data.append('department', selectedDept);
      formData.attachments.forEach(file => {
        data.append('attachments', file);
      });

      const res = await axios.post('http://localhost:5000/api/notifications', data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setSuccess('Notification sent successfully!');
        setFormData({ title: '', content: '', attachments: [] });
        fetchNotifications(selectedDept);
        setShowModal(false);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`http://localhost:5000/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      alert('Failed to delete');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Notification Center</h1>

      {/* Department Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {departments.map(dept => (
          <div
            key={dept._id}
            onClick={() => setSelectedDept(dept._id)}
            className={`cursor-pointer p-6 rounded-lg shadow-md transition-all ${
              selectedDept === dept._id
                ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                : 'bg-white hover:shadow-lg border border-gray-200'
            }`}
          >
            <h3 className="text-xl font-semibold">{dept.name}</h3>
            <p className={selectedDept === dept._id ? 'text-blue-100' : 'text-gray-500'}>
              {dept.code} • {dept.description?.substring(0, 60)}...
            </p>
          </div>
        ))}
      </div>

      {selectedDept && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              Notifications for {departments.find(d => d._id === selectedDept)?.name}
            </h2>
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Plus size={18} /> Send New Notification
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No notifications yet.</div>
          ) : (
            <div className="space-y-4">
              {notifications.map(notif => (
                <div key={notif._id} className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{notif.title}</h3>
                      <p className="text-gray-600 mt-1 whitespace-pre-wrap">{notif.content}</p>
                      {notif.attachments?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {notif.attachments.map((att, idx) => (
                            <a
                              key={idx}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:underline text-sm bg-gray-100 px-2 py-1 rounded"
                            >
                              {att.fileType === 'image' ? <ImageIcon size={14} /> : <FileText size={14} />}
                              {att.filename}
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-2">
                        Sent on {new Date(notif.createdAt).toLocaleString()} by {notif.createdBy?.firstName || 'Admin'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(notif._id)}
                      className="text-red-500 hover:text-red-700 ml-4"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal for creating notification */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">New Notification</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-1">Content</label>
                <textarea
                  rows="4"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-1">
                  Attachments (PDF/Images, max 5 files)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="w-full border rounded px-3 py-2"
                  // Reset input value after selection to allow re-selecting the same file later
                  ref={(input) => {
                    if (input) input.value = '';
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">You can attach up to 5 files.</p>

                {/* Display selected files with remove buttons */}
                {formData.attachments.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-1">Selected files:</p>
                    <ul className="space-y-1">
                      {formData.attachments.map((file, idx) => (
                        <li key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
              {success && <div className="text-green-500 text-sm mb-2">{success}</div>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
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