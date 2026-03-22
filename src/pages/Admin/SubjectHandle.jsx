import React, { useState, useEffect } from 'react';
import axios from '../../axiosConfig'; // adjust path

const SubjectManager = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [subjectType, setSubjectType] = useState('theory');
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState({ name: '', code: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deptType, setDeptType] = useState('UG');

  const PG_DEPARTMENTS = ['MBA', 'MCA', 'MCom', 'Mcom'];

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get('/departments');
        const depts = res.data.data || res.data;
        setDepartments(depts);
      } catch (err) {
        setError('Could not load departments');
      }
    };
    fetchDepartments();
  }, []);

  // When department changes, reset semester and set UG/PG type
  useEffect(() => {
    if (selectedDept) {
      const dept = departments.find(d => d._id === selectedDept);
      const isPG = PG_DEPARTMENTS.includes(dept?.name);
      setDeptType(isPG ? 'PG' : 'UG');
      setSelectedSemester('');
      setSubjects([]);
    }
  }, [selectedDept, departments]);

  // Fetch subjects when both department and semester are selected
  useEffect(() => {
    if (!selectedDept || !selectedSemester) return;

    const fetchSubjects = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('/subjects', {
          params: { department: selectedDept, semester: selectedSemester }
        });
        setSubjects(res.data.data);
      } catch (err) {
        console.error(err);
        setError('Could not load subjects');
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, [selectedDept, selectedSemester]);

  // Function to generate the next code
  const generateCode = async () => {
    if (!selectedDept || !selectedSemester) return;
    try {
      const res = await axios.get('/subjects/next-code', {
        params: {
          department: selectedDept,
          semester: selectedSemester,
          type: subjectType
        }
      });
      if (res.data.success) {
        setNewSubject(prev => ({ ...prev, code: res.data.code }));
      }
    } catch (err) {
      console.error('Failed to generate code', err.response?.data || err);
      // Keep existing code if any
    }
  };

  // Auto‑generate code when department, semester, or type changes
  useEffect(() => {
    generateCode();
  }, [selectedDept, selectedSemester, subjectType]);

  const addSubject = async () => {
    if (!newSubject.name.trim() || !newSubject.code.trim()) {
      setError('Please fill both name and code');
      return;
    }
    if (!selectedSemester) {
      setError('Please select a semester first');
      return;
    }
    setError('');
    try {
      const res = await axios.post('/subjects', {
        name: newSubject.name.trim(),
        code: newSubject.code.trim().toUpperCase(),
        department: selectedDept,
        semester: selectedSemester
      });
      setSubjects([...subjects, res.data.data]);
      // Clear the name field and trigger a new code generation
      setNewSubject({ name: '', code: '' });
      // Fetch the next code (will now account for the newly added subject)
      await generateCode();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add subject';
      setError(msg);
    }
  };

  const deleteSubject = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    setError('');
    try {
      await axios.delete(`/subjects/${id}`);
      setSubjects(subjects.filter(sub => sub._id !== id));
    } catch (err) {
      setError('Failed to delete subject');
    }
  };

  const semesterRange = deptType === 'PG' ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6];

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Manage Subjects</h2>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Department</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Semester</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Semester</option>
            {semesterRange.map(num => (
              <option key={num} value={num}>Semester {num}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedDept && selectedSemester && (
        <>
          <div className="mb-8 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-3">Add New Subject</h3>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-1">Subject Name</label>
                <input
                  type="text"
                  placeholder="Subject Name"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium mb-1">Subject Code</label>
                <input
                  type="text"
                  placeholder="Subject Code"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="theory"
                    checked={subjectType === 'theory'}
                    onChange={() => setSubjectType('theory')}
                  />
                  Theory
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="practical"
                    checked={subjectType === 'practical'}
                    onChange={() => setSubjectType('practical')}
                  />
                  Practical
                </label>
              </div>
              <button
                onClick={addSubject}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Code auto‑generated in format: DEPT-{selectedSemester}XXT/P (editable)
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">
              Subjects (Semester {selectedSemester})
            </h3>
            {loading && <p>Loading...</p>}
            {!loading && subjects.length === 0 && (
              <p>No subjects found for this semester.</p>
            )}
            {!loading && subjects.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject Code</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subjects.map(sub => (
                      <tr key={sub._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{sub.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{sub.code}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => deleteSubject(sub._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SubjectManager;