import React, { useState, useEffect } from 'react';
import axios from '../../axiosConfig';
import { BookOpen, Plus, Trash2, AlertCircle } from 'lucide-react';

const SubjectManager = () => {
  const [departments, setDepartments]       = useState([]);
  const [selectedDept, setSelectedDept]     = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [subjectType, setSubjectType]       = useState('theory');
  const [subjects, setSubjects]             = useState([]);
  const [newSubject, setNewSubject]         = useState({ name: '', code: '' });
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [deptType, setDeptType]             = useState('UG');

  const PG_DEPARTMENTS = ['MBA', 'MCA', 'MCom', 'Mcom'];

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/departments');
        setDepartments(res.data.data || res.data);
      } catch { setError('Could not load departments'); }
    })();
  }, []);

  useEffect(() => {
    if (selectedDept) {
      const dept  = departments.find(d => d._id === selectedDept);
      const isPG  = PG_DEPARTMENTS.includes(dept?.name);
      setDeptType(isPG ? 'PG' : 'UG');
      setSelectedSemester('');
      setSubjects([]);
    }
  }, [selectedDept, departments]);

  useEffect(() => {
    if (!selectedDept || !selectedSemester) return;
    (async () => {
      setLoading(true); setError('');
      try {
        const res = await axios.get('/subjects', {
          params: { department: selectedDept, semester: selectedSemester }
        });
        setSubjects(res.data.data);
      } catch { setError('Could not load subjects'); }
      finally { setLoading(false); }
    })();
  }, [selectedDept, selectedSemester]);

  const generateCode = async () => {
    if (!selectedDept || !selectedSemester) return;
    try {
      const res = await axios.get('/subjects/next-code', {
        params: { department: selectedDept, semester: selectedSemester, type: subjectType }
      });
      if (res.data.success) setNewSubject(prev => ({ ...prev, code: res.data.code }));
    } catch (err) { console.error('Failed to generate code', err); }
  };

  useEffect(() => { generateCode(); }, [selectedDept, selectedSemester, subjectType]);

  const addSubject = async () => {
    if (!newSubject.name.trim() || !newSubject.code.trim()) { setError('Please fill both name and code'); return; }
    if (!selectedSemester) { setError('Please select a semester first'); return; }
    setError('');
    try {
      const res = await axios.post('/subjects', {
        name: newSubject.name.trim(),
        code: newSubject.code.trim().toUpperCase(),
        department: selectedDept,
        semester: selectedSemester
      });
      setSubjects([...subjects, res.data.data]);
      setNewSubject({ name: '', code: '' });
      await generateCode();
    } catch (err) { setError(err.response?.data?.message || 'Failed to add subject'); }
  };

  const deleteSubject = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    setError('');
    try {
      await axios.delete(`/subjects/${id}`);
      setSubjects(subjects.filter(sub => sub._id !== id));
    } catch { setError('Failed to delete subject'); }
  };

  const semesterRange = deptType === 'PG' ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6];
  const selectClass   = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
  const inputClass    = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <BookOpen size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Manage Subjects</h1>
          <p className="text-slate-500 text-xs mt-0.5">Add and manage subjects per department and semester</p>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" /> {error}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Select Department & Semester</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department</label>
            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className={selectClass}>
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className={selectClass}
              disabled={!selectedDept}
            >
              <option value="">Select Semester</option>
              {semesterRange.map(num => (
                <option key={num} value={num}>Semester {num}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Add Subject Form ── */}
      {selectedDept && selectedSemester && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Add New Subject</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject Name</label>
              <input
                type="text"
                placeholder="e.g. Data Structures"
                value={newSubject.name}
                onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject Code</label>
              <input
                type="text"
                placeholder="Auto-generated (editable)"
                value={newSubject.code}
                onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })}
                className={inputClass}
              />
            </div>
          </div>

          {/* Type + Add button */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-5">
              <span className="text-sm font-semibold text-slate-600">Type:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio" value="theory"
                  checked={subjectType === 'theory'}
                  onChange={() => setSubjectType('theory')}
                  className="accent-blue-600"
                />
                <span className="text-sm text-slate-700">Theory</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio" value="practical"
                  checked={subjectType === 'practical'}
                  onChange={() => setSubjectType('practical')}
                  className="accent-blue-600"
                />
                <span className="text-sm text-slate-700">Practical</span>
              </label>
            </div>

            <button
              onClick={addSubject}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition sm:ml-auto"
            >
              <Plus size={16} /> Add Subject
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-3">
            Code auto-generated as DEPT-{selectedSemester}XXT/P (editable)
          </p>
        </div>
      )}

      {/* ── Subjects Table ── */}
      {selectedDept && selectedSemester && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">
              Subjects — Semester {selectedSemester}
            </h3>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
              {subjects.length} subjects
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-500 text-sm">Loading...</span>
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen size={20} className="text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm font-medium">No subjects found</p>
              <p className="text-slate-400 text-xs mt-1">Add a subject using the form above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject Name</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Code</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {subjects.map((sub, idx) => (
                    <tr key={sub._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 text-xs text-slate-400">{idx + 1}</td>
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{sub.name}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {sub.code}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => deleteSubject(sub._id)}
                          className="text-slate-300 hover:text-red-500 transition p-1.5 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubjectManager;