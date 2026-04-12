import { useState } from 'react';
import ProfessorForm from '../../components/ProfessorForm';
import ProfessorList from '../../components/ProfessorList';
import { Plus, ArrowLeft, GraduationCap } from 'lucide-react';

const ProfessorManagement = () => {
  const [view, setView]                 = useState('list');
  const [editProfessor, setEditProfessor] = useState(null);

  const handleAddClick    = () => { setEditProfessor(null); setView('form'); };
  const handleEditClick   = (professor) => { setEditProfessor(professor); setView('form'); };
  const handleFormSuccess = () => { setView('list'); setEditProfessor(null); };
  const handleCancel      = () => { setView('list'); setEditProfessor(null); };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <GraduationCap size={20} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">Professor Management</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              {view === 'list' ? 'View and manage all professors' : editProfessor ? 'Edit professor details' : 'Add a new professor'}
            </p>
          </div>
        </div>

        {view === 'list' ? (
          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition self-start sm:self-auto"
          >
            <Plus size={16} /> Add Professor
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 bg-slate-500 hover:bg-slate-600 active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition self-start sm:self-auto"
          >
            <ArrowLeft size={16} /> Back
          </button>
        )}
      </div>

      {/* ── Content ── */}
      <div>
        {view === 'list' ? (
          <ProfessorList onEdit={handleEditClick} />
        ) : (
          <ProfessorForm
            initialData={editProfessor}
            mode={editProfessor ? 'edit' : 'add'}
            onSuccess={handleFormSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default ProfessorManagement;