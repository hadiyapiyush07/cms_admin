// src/cms_admin/components/ProfessorForm.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';

const ProfessorForm = ({ initialData = null, mode = 'add', onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  // Default empty form
  const emptyForm = {
    name: '',
    email: '',
    contactNumber: '',
    department: '',
    coursesTaught: [],
    qualification: '',
    experience: '',
    specialization: '',
    joiningDate: '',
    password: '',
    isActive: true
  };

  const [formData, setFormData] = useState(emptyForm);

  // When initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        contactNumber: initialData.contactNumber || '',
        department: initialData.department?._id || initialData.department || '',
        coursesTaught: initialData.coursesTaught?.map(c => c._id || c) || [],
        qualification: initialData.qualification || '',
        experience: initialData.experience || '',
        specialization: initialData.specialization || '',
        joiningDate: initialData.joiningDate ? new Date(initialData.joiningDate).toISOString().split('T')[0] : '',
        password: '', // Don't prefill password for security
        isActive: initialData.isActive !== undefined ? initialData.isActive : true
      });
      
      // Fetch subjects for the department
      if (initialData.department?._id || initialData.department) {
        fetchSubjectsByDepartment(initialData.department._id || initialData.department);
      }
    } else {
      setFormData(emptyForm);
      setAvailableSubjects([]);
    }
  }, [initialData, mode]);

  // Fetch departments on mount
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
        } else if (deptRes.data.data) {
          setDepartments(deptRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
        setError('Could not load departments.');
      }
    };
    fetchDepartments();
  }, []);

  // Fetch subjects when department changes
  const fetchSubjectsByDepartment = async (departmentId) => {
    if (!departmentId) {
      setAvailableSubjects([]);
      return;
    }

    setSubjectsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const subjectsRes = await axios.get(
        `http://localhost:5000/api/subjects?department=${departmentId}`,
        { headers }
      );
      
      let subjects = [];
      if (subjectsRes.data.success && subjectsRes.data.data) {
        subjects = subjectsRes.data.data;
      } else if (Array.isArray(subjectsRes.data)) {
        subjects = subjectsRes.data;
      }
      
      setAvailableSubjects(subjects);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setAvailableSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'department') {
      fetchSubjectsByDepartment(value);
      setFormData(prev => ({
        ...prev,
        department: value,
        coursesTaught: []
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'experience') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? '' : parseInt(value) || 0 }));
    } else if (name === 'contactNumber') {
      const numbersOnly = value.replace(/[^0-9]/g, '');
      if (numbersOnly.length <= 10) {
        setFormData(prev => ({ ...prev, [name]: numbersOnly }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubjectSelect = (e) => {
    const subjectId = e.target.value;
    if (!subjectId) return;

    setFormData(prev => {
      if (prev.coursesTaught.includes(subjectId)) return prev;
      return { ...prev, coursesTaught: [...prev.coursesTaught, subjectId] };
    });
    e.target.value = '';
  };

  const removeSubject = (subjectId) => {
    setFormData(prev => ({
      ...prev,
      coursesTaught: prev.coursesTaught.filter(id => id !== subjectId)
    }));
  };

  const getSubjectName = (subjectId) => {
    const subject = availableSubjects.find(s => s._id === subjectId);
    return subject?.name || subjectId;
  };

  const validate = () => {
    // For edit mode, password is not required
    if (mode === 'add') {
      if (!formData.name || formData.name.trim() === '') {
        setError('Name is required');
        return false;
      }
      
      if (!formData.email || formData.email.trim() === '') {
        setError('Email is required');
        return false;
      }
      
      if (!formData.contactNumber || formData.contactNumber.trim() === '') {
        setError('Contact number is required');
        return false;
      }
      
      if (!formData.department) {
        setError('Please select a department');
        return false;
      }
      
      if (!formData.password || formData.password.trim() === '') {
        setError('Password is required for new professors');
        return false;
      }
    } else {
      // For edit mode, only validate fields that should be present
      if (!formData.name || formData.name.trim() === '') {
        setError('Name is required');
        return false;
      }
      
      if (!formData.email || formData.email.trim() === '') {
        setError('Email is required');
        return false;
      }
      
      if (!formData.contactNumber || formData.contactNumber.trim() === '') {
        setError('Contact number is required');
        return false;
      }
      
      if (!formData.department) {
        setError('Please select a department');
        return false;
      }
    }
    
    // Common validations for both modes
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.contactNumber)) {
      setError('Contact number must be exactly 10 digits');
      return false;
    }
    
    // Password validation only for add mode OR if password is provided in edit mode
    if (mode === 'add') {
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
    } else if (formData.password && formData.password.trim() !== '') {
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Authentication required. Please log in again.');
        setSubmitting(false);
        return;
      }
      
      // Prepare data for submission
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        contactNumber: formData.contactNumber.trim(),
        department: formData.department,
        coursesTaught: formData.coursesTaught || [],
        qualification: formData.qualification || '',
        experience: formData.experience ? parseInt(formData.experience) : 0,
        specialization: formData.specialization || '',
        joiningDate: formData.joiningDate || new Date().toISOString().split('T')[0],
        isActive: true
      };
      
      // Handle password: required for add, optional for edit
      if (mode === 'add') {
        submitData.password = formData.password;
      } else if (mode === 'edit' && formData.password && formData.password.trim() !== '') {
        // Only send password if user entered a new one (to update it)
        submitData.password = formData.password;
      }
      // If editing and no password provided, don't include password field

      console.log('📤 Submitting professor data:', {
        mode,
        url: mode === 'add' ? '/api/professor' : `/api/professor/${initialData._id}`,
        data: { ...submitData, password: submitData.password ? '***' : 'not sent' }
      });

      let response;
      if (mode === 'add') {
        response = await axios.post('http://localhost:5000/api/professor', submitData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        response = await axios.put(
          `http://localhost:5000/api/professor/${initialData._id}`,
          submitData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.data.success) {
        setSuccess(mode === 'add' ? '✓ Professor added successfully!' : '✓ Professor updated successfully!');
        if (mode === 'add') {
          setFormData(emptyForm);
          setAvailableSubjects([]);
        }
        setTimeout(() => {
          if (onSuccess) onSuccess(response.data.data);
        }, 1500);
      } else {
        setError(response.data.message || 'Operation failed.');
      }
    } catch (err) {
      console.error('❌ Submit error:', err);
      
      if (err.response) {
        console.error('Error status:', err.response.status);
        console.error('Error data:', err.response.data);
        
        const errorMessage = err.response.data?.message || '';
        
        if (errorMessage.includes('email already exists')) {
          setError(`Email "${formData.email}" is already registered. Please use a different email.`);
        } else if (errorMessage.includes('contactNumber already exists')) {
          setError(`Contact number "${formData.contactNumber}" is already registered. Please use a different number.`);
        } else {
          setError(errorMessage || `Error: ${err.response.status}`);
        }
      } else if (err.request) {
        setError('Cannot connect to server. Please check if backend is running.');
      } else {
        setError(err.message || 'An error occurred.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Basic Info */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Basic Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="professor@college.edu"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="10-digit mobile number"
              maxLength="10"
            />
            <p className="text-xs text-gray-500 mt-1">Enter exactly 10 digits</p>
          </div>
        </div>
      </section>

      {/* Department */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Department</h2>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Select Department <span className="text-red-500">*</span>
          </label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>
                {dept.name} {dept.code ? `(${dept.code})` : ''}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Professional Info */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Professional Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Qualification</label>
            <input
              type="text"
              name="qualification"
              value={formData.qualification}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Ph.D., M.Tech, MCA"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Experience (years)</label>
            <input
              type="number"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Years of experience"
              min="0"
              step="0.5"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Specialization</label>
            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Computer Science, Data Science"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Joining Date</label>
            <input
              type="date"
              name="joiningDate"
              value={formData.joiningDate}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Subjects Taught */}
      {formData.department && (
        <section>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Subjects Taught</h2>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Select Subject
            </label>
            
            {subjectsLoading ? (
              <div className="text-gray-500 p-2">Loading subjects...</div>
            ) : (
              <>
                <select
                  onChange={handleSubjectSelect}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={availableSubjects.length === 0}
                  value=""
                >
                  <option value="">
                    {availableSubjects.length === 0 
                      ? "No subjects available for this department" 
                      : "-- Select Subject --"}
                  </option>
                  {availableSubjects.map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name} {subject.code ? `(${subject.code})` : ''}
                    </option>
                  ))}
                </select>

                {availableSubjects.length === 0 && (
                  <p className="text-sm text-yellow-600 mt-1">
                    No subjects found. Please add subjects to this department first.
                  </p>
                )}
              </>
            )}

            {/* Selected Subjects */}
            {formData.coursesTaught.length > 0 && (
              <div className="mt-3">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Selected Subjects ({formData.coursesTaught.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {formData.coursesTaught.map((subjectId) => (
                    <span
                      key={subjectId}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                    >
                      {getSubjectName(subjectId)}
                      <button
                        type="button"
                        onClick={() => removeSubject(subjectId)}
                        className="text-blue-700 hover:text-blue-900 font-bold text-lg"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Security */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Security</h2>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Password {mode === 'add' && <span className="text-red-500">*</span>}
            {mode === 'edit' && <span className="text-gray-500 text-xs ml-2">(Leave blank to keep current password)</span>}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 border rounded pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={mode === 'add' ? 'Enter password (min 6 characters)' : 'Enter new password (optional)'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Password must be at least 6 characters
          </p>
        </div>
      </section>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <button
          type="button"
          onClick={() => onSuccess?.('cancel')}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded transition duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition duration-200 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : mode === 'add' ? 'Add Professor' : 'Update Professor'}
        </button>
      </div>
    </form>
  );
};

export default ProfessorForm;