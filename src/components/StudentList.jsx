// src/cms_admin/components/StudentList.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import StudentViewModal from './StudentViewModal';

const StudentList = ({ onEdit }) => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filter states
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state for viewing student details
  const [viewStudent, setViewStudent] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 60;

  // Helper: extract semester number from semesterName
  const getSemesterNumber = (semesterName) => {
    if (!semesterName) return Infinity;
    const match = semesterName.match(/\d+/);
    return match ? parseInt(match[0]) : Infinity;
  };

  // Fetch departments and semesters for dropdowns
  useEffect(() => {
    const fetchFilters = async () => {
      const token = localStorage.getItem('authToken');
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [deptRes, semRes] = await Promise.all([
          axios.get('http://localhost:5000/api/departments', { headers }),
          axios.get('http://localhost:5000/api/semesters', { headers }),
        ]);
        if (deptRes.data.success) setDepartments(deptRes.data.data);
        if (semRes.data.success) setSemesters(semRes.data.data);
      } catch (err) {
        setError('Failed to load filters.');
      }
    };
    fetchFilters();
  }, []);

  // Fetch students based on filters
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('authToken');
        const params = new URLSearchParams({
          page,
          limit,
          ...(selectedDept && { department: selectedDept }),
          ...(selectedSem && { semester: selectedSem }),
          ...(searchTerm && { search: searchTerm }),
        });
        const response = await axios.get(
          `http://localhost:5000/api/admin/students?${params}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          // Sort: first by semester (by extracting number), then by enrollment number
          const sortedStudents = response.data.data.sort((a, b) => {
            const semA = getSemesterNumber(a.semesterID?.semesterName);
            const semB = getSemesterNumber(b.semesterID?.semesterName);
            if (semA !== semB) return semA - semB;
            // If same semester, sort by enrollment number
            return a.enrollmentNum.localeCompare(b.enrollmentNum);
          });
          setStudents(sortedStudents);
          setTotalPages(response.data.pages);
        } else {
          setError('Failed to load students.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching students.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [page, selectedDept, selectedSem, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleView = (student) => {
    setViewStudent(student);
    setShowViewModal(true);
  };

  const handleEdit = (student) => {
    if (onEdit) onEdit(student);
  };

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(
        `http://localhost:5000/api/admin/students/${studentToDelete._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudents(prev => prev.filter(s => s._id !== studentToDelete._id));
      setShowDeleteModal(false);
      setStudentToDelete(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete student.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Manage Students</h2>

      {/* Filters and Search (unchanged) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end">
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
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Semester</label>
          <select
            value={selectedSem}
            onChange={(e) => { setSelectedSem(e.target.value); setPage(1); }}
            className="w-full p-2 border rounded focus:ring focus:ring-blue-200"
          >
            <option value="">All Semesters</option>
            {semesters.map(s => (
              <option key={s._id} value={s._id}>{s.semesterName}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search by name, enrollment, email..."
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
      {loading && <div className="text-center py-4">Loading...</div>}

      {/* Student Table */}
      {!loading && !error && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border text-left">Enrollment No.</th>
                  <th className="py-2 px-4 border text-left">Name</th>
                  <th className="py-2 px-4 border text-left">Email</th>
                  <th className="py-2 px-4 border text-left">Department</th>
                  <th className="py-2 px-4 border text-left">Semester</th>
                  <th className="py-2 px-4 border text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-4">No students found.</td></tr>
                ) : (
                  students.map((s) => (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border">{s.enrollmentNum}</td>
                      <td className="py-2 px-4 border">{s.name}</td>
                      <td className="py-2 px-4 border">{s.email}</td>
                      <td className="py-2 px-4 border">{s.department?.name || 'N/A'}</td>
                      <td className="py-2 px-4 border">{s.semesterID?.semesterName || 'N/A'}</td>
                      <td className="py-2 px-4 border text-center space-x-2">
                        <button
                          onClick={() => handleView(s)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(s)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(s)}
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
      {showDeleteModal && studentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete student <span className="font-semibold">{studentToDelete.name}</span> ({studentToDelete.enrollmentNum})? This action cannot be undone.
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

      {/* View Student Modal */}
      {showViewModal && viewStudent && (
        <StudentViewModal
          student={viewStudent}
          onClose={() => setShowViewModal(false)}
        />
      )}
    </div>
  );
};

export default StudentList;