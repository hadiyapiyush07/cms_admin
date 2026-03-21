// src/cms_admin/components/StudentForm.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentForm = ({ initialData = null, mode = 'add', onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [allSemesters, setAllSemesters] = useState([]);   // all semesters from DB
  const [filteredSemesters, setFilteredSemesters] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Default empty form
  const emptyForm = {
    enrollmentNum: '',
    aadharNumber: '',
    name: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    nationality: 'Indian',
    religion: '',
    category: '',
    caste: '',
    subcaste: '',
    email: '',
    contactNumber: '',
    alternateContact: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    fatherName: '',
    motherName: '',
    guardianName: '',
    parentContact: '',
    parentEmail: '',
    parentOccupation: '',
    admissionYear: '',
    batch: '',
    department: '',
    semesterID: '',
    currentYear: '',
    password: '',
    isActive: true,
    profilePicture: '',
    tenthBoard: '',
    tenthAdmitNumber: '',
    tenthPassingYear: '',
    tenthMarksObtained: '',
    twelfthBoard: '',
    twelfthAdmitNumber: '',
    twelfthPassingYear: '',
    twelfthMarksObtained: '',
    twelfthTotalMarks: '',
  };

  const [formData, setFormData] = useState(emptyForm);

  // When initialData changes (e.g., when editing), map populated fields to IDs
  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        ...initialData,
        department: initialData.department?._id || initialData.department || '',
        semesterID: initialData.semesterID?._id || initialData.semesterID || '',
        dob: initialData.dob ? new Date(initialData.dob).toISOString().split('T')[0] : '',
        password: '',
      });
    } else {
      setFormData(emptyForm);
    }
  }, [initialData, mode]);

  // Fetch departments and semesters on mount
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('authToken');
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [deptRes, semRes] = await Promise.all([
          axios.get('http://localhost:5000/api/departments', { headers }),
          axios.get('http://localhost:5000/api/semesters', { headers }),
        ]);
        if (deptRes.data.success) setDepartments(deptRes.data.data);
        if (semRes.data.success) {
          setAllSemesters(semRes.data.data);
          setFilteredSemesters(semRes.data.data); // initially show all
        }
      } catch (err) {
        setError('Could not load departments or semesters.');
      }
    };
    fetchData();
  }, []);

  // Helper to get duration from department ID
  const getDurationFromDepartment = (deptId) => {
    if (!deptId) return null;
    const dept = departments.find(d => d._id === deptId);
    if (!dept) return null;
    const name = dept.name.toUpperCase();
    if (['BCOM', 'BBA', 'BCA'].includes(name)) return 3;
    if (['MCOM', 'MBA', 'MCA'].includes(name)) return 2;
    return null;
  };

  // Filter semesters based on selected department
  useEffect(() => {
    if (!formData.department) {
      setFilteredSemesters(allSemesters);
      return;
    }
    const duration = getDurationFromDepartment(formData.department);
    if (duration === 3) {
      // Bachelor – show semesters 1‑6
      const bachelorSemesters = allSemesters.filter(s => {
        const semNum = parseInt(s.semesterName.match(/\d+/)?.[0] || 0);
        return semNum >= 1 && semNum <= 6;
      });
      setFilteredSemesters(bachelorSemesters);
    } else if (duration === 2) {
      // Master – show semesters 1‑4 only
      const masterSemesters = allSemesters.filter(s => {
        const semNum = parseInt(s.semesterName.match(/\d+/)?.[0] || 0);
        return semNum >= 1 && semNum <= 4;
      });
      setFilteredSemesters(masterSemesters);
    } else {
      setFilteredSemesters(allSemesters);
    }
  }, [formData.department, allSemesters, departments]);

  // When department changes, reset semester if the current one is not allowed
  useEffect(() => {
    if (formData.semesterID && filteredSemesters.length > 0) {
      const isAllowed = filteredSemesters.some(s => s._id === formData.semesterID);
      if (!isAllowed) {
        setFormData(prev => ({ ...prev, semesterID: '' }));
      }
    }
  }, [filteredSemesters, formData.semesterID]);

  // Auto-update batch
  useEffect(() => {
    if (formData.admissionYear && formData.department) {
      const duration = getDurationFromDepartment(formData.department);
      if (duration) {
        const start = parseInt(formData.admissionYear);
        const end = start + duration;
        const batch = `${start}-${end.toString().slice(-2)}`;
        setFormData(prev => ({ ...prev, batch }));
      }
    }
  }, [formData.admissionYear, formData.department, departments]);

  // Auto-update currentYear based on semester
  useEffect(() => {
    if (formData.semesterID && allSemesters.length) {
      const semester = allSemesters.find(s => s._id === formData.semesterID);
      if (semester?.semesterName) {
        const match = semester.semesterName.match(/\d+/);
        if (match) {
          const semNum = parseInt(match[0]);
          const year = Math.ceil(semNum / 2);
          setFormData(prev => ({ ...prev, currentYear: year }));
        }
      }
    }
  }, [formData.semesterID, allSemesters]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validate = () => {
    const required = [
      'enrollmentNum', 'name', 'dob', 'gender', 'email',
      'contactNumber', 'department', 'semesterID', 'category',
      ...(mode === 'add' ? ['password'] : [])
    ];
    for (let field of required) {
      if (!formData[field] || formData[field].trim() === '') {
        setError(`${field} is required.`);
        return false;
      }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Invalid email address.');
      return false;
    }
    if (mode === 'add' && formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    // Optional: Validate semester belongs to the department's allowed list
    const duration = getDurationFromDepartment(formData.department);
    if (duration === 2) {
      const semNum = parseInt(formData.semesterID && allSemesters.find(s => s._id === formData.semesterID)?.semesterName?.match(/\d+/)?.[0] || 0);
      if (semNum > 4) {
        setError('For Master programs, only semesters 1‑4 are allowed.');
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
      const url = mode === 'add'
        ? 'http://localhost:5000/api/admin/students'
        : `http://localhost:5000/api/admin/students/${initialData._id}`;
      const method = mode === 'add' ? axios.post : axios.put;
      const response = await method(url, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSuccess(mode === 'add' ? 'Student added successfully!' : 'Student updated successfully!');
        if (mode === 'add') {
          setFormData(emptyForm);
        }
        if (onSuccess) onSuccess(response.data.data);
      } else {
        setError(response.data.message || 'Operation failed.');
      }
    } catch (err) {
      console.error('Submit error', err);
      setError(err.response?.data?.message || 'Server error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Percentage calculations
  const tenthPercentage = formData.tenthMarksObtained
    ? ((formData.tenthMarksObtained / 600) * 100).toFixed(2)
    : '';
  const twelfthPercentage = (formData.twelfthMarksObtained && formData.twelfthTotalMarks)
    ? ((formData.twelfthMarksObtained / formData.twelfthTotalMarks) * 100).toFixed(2)
    : '';

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">{success}</div>}

      {/* Core Identification */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Core Identification</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Enrollment Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="enrollmentNum"
              value={formData.enrollmentNum}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Aadhar Number</label>
            <input
              type="text"
              name="aadharNumber"
              value={formData.aadharNumber}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Personal Details */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Personal Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Blood Group</label>
            <select
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Nationality</label>
            <input
              type="text"
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Religion</label>
            <input
              type="text"
              name="religion"
              value={formData.religion}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </section>

      {/* Reservation / Category */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Reservation / Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Caste</label>
            <input
              type="text"
              name="caste"
              value={formData.caste}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Subcaste</label>
            <input
              type="text"
              name="subcaste"
              value={formData.subcaste}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </section>

      {/* Contact & Address */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Contact & Address</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Alternate Contact</label>
            <input
              type="text"
              name="alternateContact"
              value={formData.alternateContact}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">State</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Pincode</label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </section>

      {/* Parent / Guardian */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Parent / Guardian</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Father's Name</label>
            <input
              type="text"
              name="fatherName"
              value={formData.fatherName}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Mother's Name</label>
            <input
              type="text"
              name="motherName"
              value={formData.motherName}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Guardian Name</label>
            <input
              type="text"
              name="guardianName"
              value={formData.guardianName}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Parent Contact</label>
            <input
              type="text"
              name="parentContact"
              value={formData.parentContact}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Parent Email</label>
            <input
              type="email"
              name="parentEmail"
              value={formData.parentEmail}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Parent Occupation</label>
            <input
              type="text"
              name="parentOccupation"
              value={formData.parentOccupation}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </section>

      {/* 10th Qualification */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">10th Qualification Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Board</label>
            <input
              type="text"
              name="tenthBoard"
              value={formData.tenthBoard}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Admit Number</label>
            <input
              type="text"
              name="tenthAdmitNumber"
              value={formData.tenthAdmitNumber}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Passing Year</label>
            <input
              type="number"
              name="tenthPassingYear"
              value={formData.tenthPassingYear}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Marks Obtained</label>
            <input
              type="number"
              name="tenthMarksObtained"
              value={formData.tenthMarksObtained}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              min="0"
              max="600"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Total Marks</label>
            <input type="number" value="600" disabled className="w-full p-2 border rounded bg-gray-100" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Percentage (%)</label>
            <input
              type="text"
              value={tenthPercentage}
              readOnly
              className="w-full p-2 border rounded bg-gray-100"
              placeholder="Auto-calculated"
            />
          </div>
        </div>
      </section>

      {/* 12th Qualification */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">12th Qualification Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Board</label>
            <input
              type="text"
              name="twelfthBoard"
              value={formData.twelfthBoard}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Admit Number</label>
            <input
              type="text"
              name="twelfthAdmitNumber"
              value={formData.twelfthAdmitNumber}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Passing Year</label>
            <input
              type="number"
              name="twelfthPassingYear"
              value={formData.twelfthPassingYear}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Marks Obtained</label>
            <input
              type="number"
              name="twelfthMarksObtained"
              value={formData.twelfthMarksObtained}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              min="0"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Total Marks</label>
            <input
              type="number"
              name="twelfthTotalMarks"
              value={formData.twelfthTotalMarks}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              min="0"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Percentage (%)</label>
            <input
              type="text"
              value={twelfthPercentage}
              readOnly
              className="w-full p-2 border rounded bg-gray-100"
              placeholder="Auto-calculated"
            />
          </div>
        </div>
      </section>

      {/* Academic Details */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Academic Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Course <span className="text-red-500">*</span>
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Admission Year</label>
            <input
              type="number"
              name="admissionYear"
              value={formData.admissionYear}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Batch</label>
            <input
              type="text"
              name="batch"
              value={formData.batch}
              readOnly
              className="w-full p-2 border rounded bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Semester <span className="text-red-500">*</span>
            </label>
            <select
              name="semesterID"
              value={formData.semesterID}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Semester</option>
              {filteredSemesters.map(sem => (
                <option key={sem._id} value={sem._id}>{sem.semesterName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Current Year</label>
            <input
              type="number"
              name="currentYear"
              value={formData.currentYear}
              readOnly
              min="1"
              max="3"
              className="w-full p-2 border rounded bg-gray-100"
            />
          </div>
        </div>
      </section>

      {/* System Fields */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">System & Security</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {mode === 'add' ? 'Password' : 'New Password (leave blank to keep current)'}
              {mode === 'add' && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 border rounded pr-10"
                required={mode === 'add'}
                minLength={mode === 'add' ? 6 : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="flex items-center mt-6">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-gray-700 text-sm font-bold">Active</label>
          </div>
        </div>
      </section>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => onSuccess?.('cancel')}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
        >
          {submitting ? 'Saving...' : mode === 'add' ? 'Add Student' : 'Update Student'}
        </button>
      </div>
    </form>
  );
};

export default StudentForm;