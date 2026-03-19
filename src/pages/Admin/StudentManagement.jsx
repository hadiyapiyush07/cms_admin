import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StudentManagement = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initial form state matching the schema + qualification fields
  const [formData, setFormData] = useState({
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
    // 10th qualification
    tenthBoard: '',
    tenthAdmitNumber: '',
    tenthPassingYear: '',
    tenthMarksObtained: '',
    // 12th qualification
    twelfthBoard: '',
    twelfthAdmitNumber: '',
    twelfthPassingYear: '',
    twelfthMarksObtained: '',
    twelfthTotalMarks: '',
  });

  // Helper to get duration (years) from department name
  const getDurationFromDepartment = (deptId) => {
    if (!deptId) return null;
    const dept = departments.find(d => d._id === deptId);
    if (!dept) return null;
    const name = dept.name.toUpperCase();
    // Bachelor programs (3 years)
    if (name === 'BCOM' || name === 'BBA' || name === 'BCA') return 3;
    // Master programs (2 years)
    if (name === 'MCOM' || name === 'MBA' || name === 'MCA') return 2;
    return null;
  };

  // Auto‑update batch when admissionYear or department changes
  useEffect(() => {
    if (formData.admissionYear && formData.department) {
      const duration = getDurationFromDepartment(formData.department);
      if (duration) {
        const start = parseInt(formData.admissionYear);
        const end = start + duration;
        // Format: "2023-26" (last two digits of end year)
        const batch = `${start}-${end.toString().slice(-2)}`;
        setFormData(prev => ({ ...prev, batch }));
      }
    }
  }, [formData.admissionYear, formData.department, departments]);

  // Auto‑update currentYear based on selected semester
  useEffect(() => {
    if (formData.semesterID && semesters.length) {
      const semester = semesters.find(s => s._id === formData.semesterID);
      if (semester && semester.semesterName) {
        const match = semester.semesterName.match(/\d+/);
        if (match) {
          const semNum = parseInt(match[0]);
          const year = Math.ceil(semNum / 2);
          setFormData(prev => ({ ...prev, currentYear: year }));
        }
      }
    }
  }, [formData.semesterID, semesters]);

  // Fetch departments and semesters on component mount
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found. Please login again.');
        setTimeout(() => navigate('/admin/login'), 2000);
        return;
      }

      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [deptRes, semRes] = await Promise.all([
          axios.get('http://localhost:5000/api/departments', { headers }),
          axios.get('http://localhost:5000/api/semesters', { headers }),
        ]);

        if (deptRes.data.success) setDepartments(deptRes.data.data);
        if (semRes.data.success) setSemesters(semRes.data.data);
        setError('');
      } catch (err) {
        console.error('Failed to fetch departments/semesters', err.response?.data || err.message);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Session expired or unauthorized. Please login again.');
          setTimeout(() => navigate('/admin/login'), 2000);
        } else {
          setError('Could not load departments or semesters. Please refresh.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Validate required fields
  const validate = () => {
    const required = [
      'enrollmentNum', 'name', 'dob', 'gender', 'email',
      'contactNumber', 'department', 'semesterID', 'category', 'password'
    ];
    for (let field of required) {
      if (!formData[field] || formData[field].trim() === '') {
        setError(`${field} is required.`);
        return false;
      }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token missing. Please login again.');
        setTimeout(() => navigate('/admin/login'), 2000);
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/admin/students',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccess('Student added successfully!');
        setFormData({
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
        });
      } else {
        setError(response.data.message || 'Failed to add student.');
      }
    } catch (err) {
      console.error('Submit error', err);
      setError(err.response?.data?.message || 'Server error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate 10th percentage (total fixed at 600)
  const tenthPercentage = formData.tenthMarksObtained
    ? ((formData.tenthMarksObtained / 600) * 100).toFixed(2)
    : '';

  // Calculate 12th percentage
  const twelfthPercentage = (formData.twelfthMarksObtained && formData.twelfthTotalMarks)
    ? ((formData.twelfthMarksObtained / formData.twelfthTotalMarks) * 100).toFixed(2)
    : '';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Add New Student</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
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

        
        

        {/* 10th Qualification Details */}
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
              <input
                type="number"
                value="600"
                disabled
                className="w-full p-2 border rounded bg-gray-100"
              />
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

        {/* 12th Qualification Details */}
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
                onChange={handleChange}
                readOnly
                className="w-full p-2 border rounded bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Department <span className="text-red-500">*</span>
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
                {semesters.map(sem => (
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
                onChange={handleChange}
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
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
                minLength="8"
              />
            </div>
            <div className="flex items-center">
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
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add Student'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentManagement;