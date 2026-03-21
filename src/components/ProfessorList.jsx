// src/cms_admin/components/ProfessorList.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import ProfessorViewModal from './ProfessorViewModal';

const ProfessorList = ({ onEdit }) => {
  const [professors, setProfessors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [professorToDelete, setProfessorToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filter states
  const [selectedDept, setSelectedDept] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state for viewing professor details
  const [viewProfessor, setViewProfessor] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Fetch departments for dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      const token = localStorage.getItem('authToken');
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const deptRes = await axios.get('http://localhost:5000/api/departments', { headers });
        
        if (deptRes.data.success) {
          setDepartments(deptRes.data.data);
        } else if (Array.isArray(deptRes.data)) {
          setDepartments(deptRes.data);
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
        setError('Failed to load departments.');
      }
    };
    fetchDepartments();
  }, []);

  // Fetch professors based on filters
  useEffect(() => {
    const fetchProfessors = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('authToken');
        const params = new URLSearchParams({
          page,
          limit,
          ...(selectedDept && { department: selectedDept }),
          ...(searchTerm && { search: searchTerm }),
        });
        const response = await axios.get(
          `http://localhost:5000/api/professor?${params}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          setProfessors(response.data.data);
          setTotalPages(response.data.pages);
        } else {
          setError('Failed to load professors.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching professors.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfessors();
  }, [page, selectedDept, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleView = (professor) => {
    setViewProfessor(professor);
    setShowViewModal(true);
  };

  const handleEdit = (professor) => {
    if (onEdit) onEdit(professor);
  };

  const handleDeleteClick = (professor) => {
    setProfessorToDelete(professor);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!professorToDelete) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(
        `http://localhost:5000/api/professor/${professorToDelete._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfessors(prev => prev.filter(p => p._id !== professorToDelete._id));
      setShowDeleteModal(false);
      setProfessorToDelete(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete professor.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Manage Professors</h2>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-end">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Department</label>
          <select
            value={selectedDept}
            onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }}
            className="w-full p-2 border rounded focus:ring focus:ring-blue-200"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search by name, email, contact number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 p-2 border rounded focus:ring focus:ring-blue-200"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Error / Loading */}
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {loading && <div className="text-center py-4">Loading professors...</div>}

      {/* Professor Table */}
      {!loading && !error && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border text-left">Name</th>
                  <th className="py-2 px-4 border text-left">Email</th>
                  <th className="py-2 px-4 border text-left">Contact</th>
                  <th className="py-2 px-4 border text-left">Department</th>
                  <th className="py-2 px-4 border text-left">Qualification</th>
                  <th className="py-2 px-4 border text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {professors.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">No professors found.</td>
                  </tr>
                ) : (
                  professors.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border font-medium">{p.name}</td>
                      <td className="py-2 px-4 border">{p.email}</td>
                      <td className="py-2 px-4 border">{p.contactNumber}</td>
                      <td className="py-2 px-4 border">{p.department?.name || 'N/A'}</td>
                      <td className="py-2 px-4 border">{p.qualification || 'N/A'}</td>
                      <td className="py-2 px-4 border text-center space-x-2">
                        <button
                          onClick={() => handleView(p)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(p)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(p)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p-1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
              >
                Previous
              </button>
              <span className="px-3 py-1">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p+1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && professorToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete professor <span className="font-semibold">{professorToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100 cursor-pointer"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Professor Modal */}
      {showViewModal && viewProfessor && (
        <ProfessorViewModal
          professor={viewProfessor}
          onClose={() => setShowViewModal(false)}
        />
      )}
    </div>
  );
};

export default ProfessorList;