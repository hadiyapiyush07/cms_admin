import { useState } from 'react';
import ProfessorForm from '../../components/ProfessorForm';
import ProfessorList from '../../components/ProfessorList';
import { Plus, ArrowLeft } from 'lucide-react';

const ProfessorManagement = () => {
  const [view, setView] = useState('list');
  const [editProfessor, setEditProfessor] = useState(null);

  const handleAddClick = () => {
    setEditProfessor(null);
    setView('form');
  };

  const handleEditClick = (professor) => {
    setEditProfessor(professor);
    setView('form');
  };

  const handleFormSuccess = () => {
    setView('list');
    setEditProfessor(null);
  };

  const handleCancel = () => {
    setView('list');
    setEditProfessor(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Professor Management</h1>

        {view === 'list' ? (
          <button
            onClick={handleAddClick}
            className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus size={16} /> Add Professor
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back
          </button>
        )}
      </div>

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
  );
};

export default ProfessorManagement;