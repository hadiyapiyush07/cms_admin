// src/cms_admin/pages/StudentManagement.jsx
import { useState } from 'react';
import StudentForm from '../../components/StudentForm';
import StudentList from '../../components/StudentList';
import { Plus, ArrowLeft, Users } from 'lucide-react';

const StudentManagement = () => {
  const [view, setView]             = useState('list');
  const [editStudent, setEditStudent] = useState(null);

  const handleAddClick   = () => { setEditStudent(null); setView('form'); };
  const handleEditClick  = (student) => { setEditStudent(student); setView('form'); };
  const handleFormSuccess = () => { setView('list'); setEditStudent(null); };
  const handleCancel     = () => { setView('list'); setEditStudent(null); };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">Student Management</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              {view === 'list' ? 'View and manage all students' : editStudent ? 'Edit student details' : 'Add a new student'}
            </p>
          </div>
        </div>

        {view === 'list' ? (
          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition self-start sm:self-auto"
          >
            <Plus size={16} /> Add New Student
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 bg-slate-500 hover:bg-slate-600 active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition self-start sm:self-auto"
          >
            <ArrowLeft size={16} /> Back to List
          </button>
        )}
      </div>

      {/* ── Content ── */}
      <div>
        {view === 'list' ? (
          <StudentList onEdit={handleEditClick} />
        ) : (
          <StudentForm
            initialData={editStudent}
            mode={editStudent ? 'edit' : 'add'}
            onSuccess={handleFormSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default StudentManagement;