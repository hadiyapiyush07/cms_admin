import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const AdminFees = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    semester: '',
    search: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0,
  });

  const searchDebounce = useRef(null);
  const filterDebounce = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'admin') {
      navigate('/admin/signin');
    }
  }, [navigate]);

  useEffect(() => {
    fetchDepartmentsSemesters();
  }, []);

  useEffect(() => {
    if (filterDebounce.current) clearTimeout(filterDebounce.current);
    filterDebounce.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
    }, 300);
    return () => clearTimeout(filterDebounce.current);
  }, [searchInput]);

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(searchDebounce.current);
  }, [filters, pagination.page]);

  const fetchDepartmentsSemesters = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const [deptRes, semRes] = await Promise.all([
        axios.get('http://localhost:5000/api/departments', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/semesters', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (semRes.data.success) setSemesters(semRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 10,
        ...(filters.department && { department: filters.department }),
        ...(filters.semester && { semester: filters.semester }),
        ...(filters.search && { search: filters.search }),
      });
      const res = await axios.get(`http://localhost:5000/api/fees/admin/semester-wise?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setStudents(res.data.data);
        setPagination({
          page: res.data.page,
          total: res.data.total,
          pages: res.data.pages,
        });
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch fee information');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (filterDebounce.current) clearTimeout(filterDebounce.current);
    setFilters(prev => ({ ...prev, search: searchInput }));
  };

  const formatAmount = (amount) => `₹${(amount / 100).toFixed(2)}`;

  const maxSemesters = 6;

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Fee Management</h1>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Student's Semester</label>
            <select
              name="semester"
              value={filters.semester}
              onChange={handleFilterChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">All Semesters</option>
              {semesters.map(sem => (
                <option key={sem._id} value={sem._id}>{sem.semesterName}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text"
                name="search"
                placeholder="Search by enrollment number..."
                value={searchInput}
                onChange={handleSearchChange}
                className="flex-1 p-2 border rounded focus:ring focus:ring-blue-200"
              />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                <Search size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No students found.</div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Semester</th>
                  {[...Array(maxSemesters)].map((_, i) => (
                    <th key={i} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sem {i+1}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map(student => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.enrollmentNum}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.department?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.currentSemesterName}</td>
                    {[...Array(maxSemesters)].map((_, idx) => {
                      const semData = student.semesters.find(s => s.semester === idx + 1);
                      const isPaid = semData?.paid || false;
                      const amount = semData?.amount || 100;
                      return (
                        <td key={idx} className="px-6 py-4 whitespace-nowrap text-center">
                          {idx + 1 <= parseInt(student.currentSemesterName?.split(' ')[1] || 0) ? (
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}
                              title={isPaid ? `Paid ₹${formatAmount(amount)}` : 'Pending'}
                            >
                              {isPaid ? 'Paid' : 'Pending'}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-3 py-1">Page {pagination.page} of {pagination.pages}</span>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminFees;