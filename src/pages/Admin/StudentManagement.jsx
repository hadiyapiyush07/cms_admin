// src/cms_admin/pages/StudentManagement.jsx
import { useState } from 'react';
import StudentForm from '../../components/StudentForm';
import StudentList from '../../components/StudentList';
import { Plus , ArrowLeft} from 'lucide-react';


const StudentManagement = () => {
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [editStudent, setEditStudent] = useState(null); // student data when editing

  const handleAddClick = () => {
    setEditStudent(null);
    setView('form');
  };

  const handleEditClick = (student) => {
    setEditStudent(student);
    setView('form');
  };

  const handleFormSuccess = (savedStudent) => {
    // After successful add/edit, go back to list
    setView('list');
    setEditStudent(null);
  };

  const handleCancel = () => {
    setView('list');
    setEditStudent(null);
  };

  return (
    <div className="p-6">
      {/* Header with action buttons */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Student Management</h1>
        {view === 'list' ? (
          <button
            onClick={handleAddClick}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex justify-between items-center gap-2"
          >
            <Plus size={16} /> Add New Student
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded flex justify-between items-center gap-2"
          >
            <ArrowLeft size={16} /> Back to List
          </button>
        )}
      </div>

      {/* Content */}
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
  );
};

export default StudentManagement;