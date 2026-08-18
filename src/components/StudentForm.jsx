// src/cms_admin/components/StudentForm.jsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Eye, EyeOff, CheckCircle, AlertCircle, Info, Upload, X, User, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — defined OUTSIDE component (prevents re-mount / cursor-loss bug)
// ─────────────────────────────────────────────────────────────────────────────

const BACHELOR_DEPTS = ['BCA', 'BBA', 'BCOM'];
const MASTER_DEPTS   = ['MCA', 'MBA', 'MCOM'];

const getDeptType = (deptId, departments) => {
  if (!deptId) return null;
  const dept = departments.find(d => d._id === deptId);
  if (!dept) return null;
  const name = dept.name.toUpperCase().replace(/[\s.]/g, '');
  if (BACHELOR_DEPTS.some(b => name === b || name.startsWith(b))) return 'bachelor';
  if (MASTER_DEPTS.some(m => name === m || name.startsWith(m))) return 'master';
  return 'other';
};

const getDuration = (deptId, departments) => {
  const type = getDeptType(deptId, departments);
  if (type === 'bachelor') return 3;
  if (type === 'master')   return 2;
  return null;
};

// ── Section card ──────────────────────────────────────────────────────────────
const FormSection = ({ title, badge, badgeColor = 'blue', children }) => (
  <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h2>
      {badge && (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          badgeColor === 'blue'   ? 'bg-blue-100 text-blue-700'      :
          badgeColor === 'green'  ? 'bg-emerald-100 text-emerald-700':
          badgeColor === 'purple' ? 'bg-purple-100 text-purple-700'  :
          'bg-amber-100 text-amber-700'
        }`}>{badge}</span>
      )}
    </div>
    <div className="p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  </section>
);

// ── Field wrapper ─────────────────────────────────────────────────────────────
const Field = ({ label, required, span, hint, error: fieldError, children }) => (
  <div className={
    span === 'full' ? 'sm:col-span-2 md:col-span-3' :
    span === 2      ? 'sm:col-span-2'                : ''
  }>
    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {fieldError && (
      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
        <AlertCircle size={11} /> {fieldError}
      </p>
    )}
    {hint && !fieldError && (
      <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
        <Info size={11} /> {hint}
      </p>
    )}
  </div>
);

// ── Input classes ─────────────────────────────────────────────────────────────
const ic    = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
const icErr = "w-full border border-red-400 rounded-xl px-3 py-2.5 text-sm bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition";
const icRO  = "w-full border border-slate-100 rounded-xl px-3 py-2.5 text-sm bg-slate-100 text-slate-500 cursor-not-allowed";

const inputClass = (fieldName, fieldErrors) => fieldErrors[fieldName] ? icErr : ic;

// ── Validation (updated: removed grade dropdowns from academic, added CGPA validation) ──
const validateAll = (formData, mode, deptType) => {
  const errors = {};
  const req = (field, label) => {
    if (!formData[field] || String(formData[field]).trim() === '')
      errors[field] = `${label} is required.`;
  };

  req('enrollmentNum', 'Enrollment Number');
  req('name',          'Full Name');
  req('dob',           'Date of Birth');
  req('gender',        'Gender');
  req('category',      'Category');
  req('email',         'Email');
  req('contactNumber', 'Contact Number');
  req('department',    'Department / Course');
  req('semesterID',    'Semester');

  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
    errors.email = 'Enter a valid email address.';
  if (formData.contactNumber && !/^[0-9]{10}$/.test(formData.contactNumber))
    errors.contactNumber = 'Contact must be exactly 10 digits.';
  if (formData.aadharNumber && !/^[0-9]{12}$/.test(formData.aadharNumber))
    errors.aadharNumber = 'Aadhar must be exactly 12 digits.';
  if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode))
    errors.pincode = 'Pincode must be 6 digits.';
  if (formData.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail))
    errors.parentEmail = 'Enter a valid parent email.';
  if (formData.admissionYear) {
    const yr = parseInt(formData.admissionYear);
    if (isNaN(yr) || yr < 2000 || yr > new Date().getFullYear() + 1)
      errors.admissionYear = `Enter a valid year (2000–${new Date().getFullYear() + 1}).`;
  }

  // 10th marks
  if (formData.tenthMarksObtained) {
    const m = parseFloat(formData.tenthMarksObtained);
    if (isNaN(m) || m < 0 || m > 600) errors.tenthMarksObtained = 'Marks must be 0–600.';
  }
  if (formData.tenthPassingYear) {
    const yr = parseInt(formData.tenthPassingYear);
    if (isNaN(yr) || yr < 1990 || yr > new Date().getFullYear())
      errors.tenthPassingYear = 'Enter a valid passing year.';
  }

  // 12th marks
  if (formData.twelfthMarksObtained && formData.twelfthTotalMarks) {
    const obt = parseFloat(formData.twelfthMarksObtained);
    const tot = parseFloat(formData.twelfthTotalMarks);
    if (!isNaN(obt) && !isNaN(tot) && obt > tot)
      errors.twelfthMarksObtained = 'Marks obtained cannot exceed total marks.';
  }
  if (formData.twelfthTotalMarks) {
    const t = parseFloat(formData.twelfthTotalMarks);
    if (isNaN(t) || t <= 0) errors.twelfthTotalMarks = 'Total marks must be greater than 0.';
  }
  if (formData.twelfthPassingYear) {
    const yr = parseInt(formData.twelfthPassingYear);
    if (isNaN(yr) || yr < 1990 || yr > new Date().getFullYear())
      errors.twelfthPassingYear = 'Enter a valid passing year.';
  }

  // Bachelor (UG) — 12th + parent required
  if (deptType === 'bachelor') {
    req('twelfthBoard',         '12th Board');
    req('twelfthPassingYear',   '12th Passing Year');
    req('twelfthMarksObtained', '12th Marks Obtained');
    req('twelfthTotalMarks',    '12th Total Marks');
    req('admissionYear',        'Admission Year');
    req('fatherName',           "Father's Name");
    req('motherName',           "Mother's Name");
    req('parentContact',        'Parent Contact');
  }

  // Master (PG) — bachelor degree info required + parent info
  if (deptType === 'master') {
    req('admissionYear',       'Admission Year');
    req('fatherName',          "Father's Name");
    req('motherName',          "Mother's Name");
    req('parentContact',       'Parent Contact');
    req('bachelorDegree',      'Bachelor Degree');
    req('bachelorBoard',       'Bachelor University / Board');
    req('bachelorPassingYear', 'Bachelor Passing Year');
    // CGPA or Grade — at least one required (Grade now uses dropdown values)
    if (!formData.bachelorCGPA && !formData.bachelorGrade)
      errors.bachelorCGPA = 'Enter either CGPA or Grade for Bachelor degree.';
  }

  // Bachelor CGPA range validation (prevent negative)
  if (formData.bachelorCGPA) {
    const cgpa = parseFloat(formData.bachelorCGPA);
    if (isNaN(cgpa)) errors.bachelorCGPA = 'CGPA must be a number.';
    else if (cgpa < 0) errors.bachelorCGPA = 'CGPA cannot be negative.';
    else if (cgpa > 10) errors.bachelorCGPA = 'CGPA must be between 0 and 10.';
  }
  // Bachelor passing year validation
  if (formData.bachelorPassingYear) {
    const yr = parseInt(formData.bachelorPassingYear);
    if (isNaN(yr) || yr < 1990 || yr > new Date().getFullYear())
      errors.bachelorPassingYear = 'Enter a valid passing year.';
  }

  // Password
  if (mode === 'add') {
    if (!formData.password || formData.password.trim() === '')
      errors.password = 'Password is required.';
    else if (formData.password.length < 6)
      errors.password = 'Password must be at least 6 characters.';
  } else {
    if (formData.password && formData.password.trim() !== '' && formData.password.length < 6)
      errors.password = 'New password must be at least 6 characters.';
  }

  return errors;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const StudentForm = ({ initialData = null, mode = 'add', onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate                        = useNavigate();
  const [departments, setDepartments]   = useState([]);
  const [allSemesters, setAllSemesters] = useState([]);
  const [filteredSemesters, setFilteredSemesters] = useState([]);
  const [submitting, setSubmitting]     = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [fieldErrors, setFieldErrors]   = useState({});
  const [touched, setTouched]           = useState(false);
  const [picPreview, setPicPreview]     = useState(null);
  const fileInputRef                    = useRef(null);
  // Auto‑enrollment state
  const [generatingEnroll, setGeneratingEnroll] = useState(false);

  // Grade options for the bachelor degree dropdown
  const bachelorGradeOptions = [
    { value: 'Distinction', label: 'Distinction (75%+)' },
    { value: 'A', label: 'A Grade (60-74%)' },
    { value: 'B', label: 'B Grade (50-59%)' },
    { value: 'C', label: 'C Grade (40-49%)' },
    { value: 'D', label: 'D Grade (33-39%)' },
    { value: 'F', label: 'F Grade (Below 33%)' },
  ];

  const emptyForm = {
    enrollmentNum: '', aadharNumber: '', name: '', dob: '', gender: '',
    bloodGroup: '', nationality: 'Indian', religion: '', category: '',
    caste: '', subcaste: '', email: '', contactNumber: '', alternateContact: '',
    address: '', city: '', state: '', pincode: '',
    fatherName: '', motherName: '', guardianName: '',
    parentContact: '', parentEmail: '', parentOccupation: '',
    admissionYear: '', batch: '', department: '', semesterID: '', currentYear: '', division: 'A',
    password: '', isActive: true, profilePicture: '',
    // SSC (10th)
    tenthBoard: '', tenthAdmitNumber: '', tenthPassingYear: '', tenthMarksObtained: '',
    // HSC (12th)
    twelfthBoard: '', twelfthAdmitNumber: '', twelfthPassingYear: '',
    twelfthMarksObtained: '', twelfthTotalMarks: '',
    // Bachelor Degree — only for PG (Master) students
    bachelorDegree:         '',
    bachelorSpecialization: '',
    bachelorBoard:          '',
    bachelorAdmitNumber:    '',
    bachelorPassingYear:    '',
    bachelorCGPA:           '',
    bachelorGrade:          '',   // now a dropdown value
  };

  const [formData, setFormData] = useState(emptyForm);

  const deptType   = getDeptType(formData.department, departments);
  const isBachelor = deptType === 'bachelor';
  const isMaster   = deptType === 'master';

  // ── AUTO‑GENERATE ENROLLMENT NUMBER (only for add mode) ──
  useEffect(() => {
    if (mode !== 'add') return;
    if (!formData.admissionYear || !formData.department) return;

    const generateEnrollment = async () => {
      setGeneratingEnroll(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(
          `https://cms-backend-wl7u.onrender.com/api/admin/students/next-enrollment?year=${formData.admissionYear}&department=${formData.department}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          setFormData(prev => ({ ...prev, enrollmentNum: response.data.enrollmentNum }));
          setFieldErrors(prev => ({ ...prev, enrollmentNum: undefined }));
        } else {
          setFieldErrors(prev => ({ ...prev, enrollmentNum: 'Failed to generate enrollment number. Please contact admin.' }));
        }
      } catch (err) {
        console.error('Enrollment generation error:', err);
        setFieldErrors(prev => ({ ...prev, enrollmentNum: 'Could not generate enrollment number. Check backend endpoint.' }));
      } finally {
        setGeneratingEnroll(false);
      }
    };

    generateEnrollment();
  }, [formData.admissionYear, formData.department, mode]);

  // Populate form from initialData (edit mode)
  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        ...emptyForm,
        ...initialData,
        department: initialData.department?._id || initialData.department || '',
        semesterID: initialData.semesterID?._id  || initialData.semesterID  || '',
        dob:        initialData.dob ? new Date(initialData.dob).toISOString().split('T')[0] : '',
        password:   '',
        bachelorGrade: initialData.bachelorGrade || '',
      });
      if (initialData.profilePicture) setPicPreview(initialData.profilePicture);
    } else {
      setFormData(emptyForm);
      setFieldErrors({});
      setTouched(false);
      setPicPreview(null);
    }
  }, [initialData, mode]);

  // Fetch departments & semesters
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('authToken');
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [deptRes, semRes] = await Promise.all([
          axios.get('https://cms-backend-wl7u.onrender.com/api/departments', { headers }),
          axios.get('https://cms-backend-wl7u.onrender.com/api/semesters',   { headers }),
        ]);
        if (deptRes.data.success) setDepartments(deptRes.data.data);
        if (semRes.data.success)  { setAllSemesters(semRes.data.data); setFilteredSemesters(semRes.data.data); }
      } catch { setError('Could not load departments or semesters.'); }
    })();
  }, []);

  // Filter semesters based on department duration
  useEffect(() => {
    if (!formData.department) { setFilteredSemesters(allSemesters); return; }
    const dur = getDuration(formData.department, departments);
    if (dur === 3) {
      setFilteredSemesters(allSemesters.filter(s => {
        const n = parseInt(s.semesterName.match(/\d+/)?.[0] || 0);
        return n >= 1 && n <= 6;
      }));
    } else if (dur === 2) {
      setFilteredSemesters(allSemesters.filter(s => {
        const n = parseInt(s.semesterName.match(/\d+/)?.[0] || 0);
        return n >= 1 && n <= 4;
      }));
    } else { setFilteredSemesters(allSemesters); }
  }, [formData.department, allSemesters, departments]);

  // Reset semester if it becomes invalid after department change
  useEffect(() => {
    if (formData.semesterID && filteredSemesters.length > 0)
      if (!filteredSemesters.some(s => s._id === formData.semesterID))
        setFormData(prev => ({ ...prev, semesterID: '' }));
  }, [filteredSemesters]);

  // Auto‑calculate batch from admissionYear + duration
  useEffect(() => {
    if (formData.admissionYear && formData.department) {
      const dur   = getDuration(formData.department, departments);
      const start = parseInt(formData.admissionYear);
      if (dur && !isNaN(start))
        setFormData(prev => ({ ...prev, batch: `${start}-${(start + dur).toString().slice(-2)}` }));
    }
  }, [formData.admissionYear, formData.department, departments]);

  // Auto‑calculate current year from semester
  useEffect(() => {
    if (formData.semesterID && allSemesters.length) {
      const sem = allSemesters.find(s => s._id === formData.semesterID);
      if (sem?.semesterName) {
        const match = sem.semesterName.match(/\d+/);
        if (match) setFormData(prev => ({ ...prev, currentYear: Math.ceil(parseInt(match[0]) / 2) }));
      }
    }
  }, [formData.semesterID, allSemesters]);

  // Re‑validate when form data changes (if touched)
  useEffect(() => {
    if (touched) setFieldErrors(validateAll(formData, mode, deptType));
  }, [formData, touched, mode, deptType]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Special handler for CGPA to prevent negative values
  const handleCgpaChange = (e) => {
    let value = e.target.value;
    if (value === '') {
      handleChange(e);
      return;
    }
    const num = parseFloat(value);
    if (isNaN(num)) return;
    if (num < 0) {
      setFieldErrors(prev => ({ ...prev, bachelorCGPA: 'CGPA cannot be negative' }));
      return;
    }
    if (num > 10) {
      setFieldErrors(prev => ({ ...prev, bachelorCGPA: 'CGPA cannot exceed 10' }));
      return;
    }
    // Clear error if valid
    if (fieldErrors.bachelorCGPA) {
      setFieldErrors(prev => ({ ...prev, bachelorCGPA: undefined }));
    }
    handleChange(e);
  };

  // ── Profile picture upload ──────────────────────────────────────────────────
  const handlePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPicPreview(reader.result);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const token = localStorage.getItem('authToken');
      const fd    = new FormData();
      fd.append('file', file);
      const res = await fetch('https://cms-backend-wl7u.onrender.com/api/upload/StudentPhoto', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setFormData(prev => ({ ...prev, profilePicture: data.url }));
    } catch (err) {
      console.error(err);
      alert('Profile picture upload failed. Please try again.');
      setPicPreview(null);
      setFormData(prev => ({ ...prev, profilePicture: '' }));
    } finally { setUploading(false); }
  };

  const removePicture = () => {
    setPicPreview(null);
    setFormData(prev => ({ ...prev, profilePicture: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Manual refresh of enrollment number (if needed) ──
  const refreshEnrollmentNumber = async () => {
    if (mode !== 'add') return;
    if (!formData.admissionYear || !formData.department) {
      setFieldErrors(prev => ({ ...prev, enrollmentNum: 'Select admission year and department first.' }));
      return;
    }
    setGeneratingEnroll(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `https://cms-backend-wl7u.onrender.com/api/admin/students/next-enrollment?year=${formData.admissionYear}&department=${formData.department}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setFormData(prev => ({ ...prev, enrollmentNum: response.data.enrollmentNum }));
        setFieldErrors(prev => ({ ...prev, enrollmentNum: undefined }));
      } else {
        setFieldErrors(prev => ({ ...prev, enrollmentNum: 'Failed to generate a new number.' }));
      }
    } catch (err) {
      setFieldErrors(prev => ({ ...prev, enrollmentNum: 'Server error. Could not refresh.' }));
    } finally {
      setGeneratingEnroll(false);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setTouched(true);
    const errors = validateAll(formData, mode, deptType);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Please fix the errors below before submitting.');
      const firstErrEl = document.querySelector('[data-field-error]');
      if (firstErrEl) firstErrEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    try {
      const token  = localStorage.getItem('authToken');
      const url    = mode === 'add'
        ? 'https://cms-backend-wl7u.onrender.com/api/admin/students'
        : `https://cms-backend-wl7u.onrender.com/api/admin/students/${initialData._id}`;
      const method = mode === 'add' ? axios.post : axios.put;
      const submitData = { ...formData };
      if (mode === 'edit' && !submitData.password) delete submitData.password;
      // Clear bachelor fields if not a master program
      if (!isMaster) {
        submitData.bachelorDegree         = '';
        submitData.bachelorSpecialization = '';
        submitData.bachelorBoard          = '';
        submitData.bachelorAdmitNumber    = '';
        submitData.bachelorPassingYear    = '';
        submitData.bachelorCGPA           = '';
        submitData.bachelorGrade          = '';
      }
      const response = await method(url, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setSuccess(mode === 'add' ? 'Student added successfully!' : 'Student updated successfully!');
        if (mode === 'add') { setFormData(emptyForm); setFieldErrors({}); setTouched(false); setPicPreview(null); }
        if (onSuccess) onSuccess(response.data.data);
      } else { setError(response.data.message || 'Operation failed.'); }
    } catch (err) {
      const msg = err.response?.data?.message || 'Server error.';
      if (msg.toLowerCase().includes('enrollment')) setFieldErrors(prev => ({ ...prev, enrollmentNum: 'Enrollment number already exists.' }));
      if (msg.toLowerCase().includes('email'))      setFieldErrors(prev => ({ ...prev, email: 'Email already registered.' }));
      if (msg.toLowerCase().includes('aadhar'))     setFieldErrors(prev => ({ ...prev, aadharNumber: 'Aadhar number already exists.' }));
      setError(msg);
    } finally { setSubmitting(false); }
  };

  const tenthPercentage   = formData.tenthMarksObtained
    ? `${((formData.tenthMarksObtained / 600) * 100).toFixed(2)}%` : '';
  const twelfthPercentage = (formData.twelfthMarksObtained && formData.twelfthTotalMarks)
    ? `${((formData.twelfthMarksObtained / formData.twelfthTotalMarks) * 100).toFixed(2)}%` : '';

  const fe = fieldErrors;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 max-w-5xl">

      {/* Global alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-2 text-sm">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <CheckCircle size={16} className="flex-shrink-0" /> {success}
        </div>
      )}

      {/* Department notice */}
      {deptType && (
        <div className={`px-4 py-3 rounded-xl text-sm flex items-center gap-2 border ${
          isBachelor ? 'bg-blue-50 border-blue-200 text-blue-700' :
          isMaster   ? 'bg-purple-50 border-purple-200 text-purple-700' :
                       'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <Info size={15} className="flex-shrink-0" />
          {isBachelor
            ? 'Bachelor program — 12th qualification details and parent info are required.'
            : isMaster
              ? 'Master / PG program — Bachelor degree info (CGPA & Grade), 12th details and parent info are required.'
              : 'Please fill all required fields.'}
        </div>
      )}

      {/* ── 0. PROFILE PICTURE (unchanged) ── */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Profile Picture</h2>
          <span className="text-xs text-slate-400 font-normal">(optional)</span>
        </div>
        <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative flex-shrink-0">
            {picPreview ? (
              <div className="relative">
                <img src={picPreview} alt="Profile preview"
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-200 shadow-sm" />
                {!uploading && (
                  <button type="button" onClick={removePicture}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition">
                    <X size={12} />
                  </button>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1">
                <User size={28} className="text-slate-400" />
                <span className="text-xs text-slate-400">No photo</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700 mb-1">Upload student photo</p>
            <p className="text-xs text-slate-400 mb-3">Supported: JPG, PNG, WEBP · Max 2MB · Recommended: square image</p>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
              onChange={handlePictureChange} className="hidden" id="profilePicInput" />
            <label htmlFor="profilePicInput"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                uploading ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
              }`}>
              <Upload size={15} />
              {uploading ? 'Uploading...' : picPreview ? 'Change Photo' : 'Choose Photo'}
            </label>
            {formData.profilePicture && (
              <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle size={12} /> Photo uploaded successfully
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── 1. ACADEMIC DETAILS (removed grade dropdowns) ── */}
      <FormSection
        title="Academic Details"
        badge={isBachelor ? 'Bachelor / UG' : isMaster ? 'Master / PG' : undefined}
        badgeColor={isBachelor ? 'blue' : 'purple'}
      >
        <Field label="Course / Department" required error={fe.department}>
          <div data-field-error={fe.department ? true : undefined}>
            <select name="department" value={formData.department} onChange={handleChange}
              className={inputClass('department', fe)}>
              <option value="">— Select Department —</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
        </Field>
        <Field label="Admission Year" required={isBachelor || isMaster} error={fe.admissionYear} hint="e.g. 2024">
          <input type="number" name="admissionYear" value={formData.admissionYear} onChange={handleChange}
            className={inputClass('admissionYear', fe)}
            min="2000" max={new Date().getFullYear() + 1} placeholder="e.g. 2024" />
        </Field>
        <Field label="Batch (Auto)">
          <input type="text" value={formData.batch} readOnly className={icRO} placeholder="Auto-calculated" />
        </Field>
        <Field label="Semester" required error={fe.semesterID}>
          <div data-field-error={fe.semesterID ? true : undefined}>
            <select name="semesterID" value={formData.semesterID} onChange={handleChange}
              className={inputClass('semesterID', fe)} disabled={!formData.department}>
              <option value="">{formData.department ? '— Select Semester —' : 'Select department first'}</option>
              {filteredSemesters.map(sem => <option key={sem._id} value={sem._id}>{sem.semesterName}</option>)}
            </select>
          </div>
        </Field>
        <Field label="Current Year (Auto)">
          <input type="number" value={formData.currentYear} readOnly className={icRO} />
        </Field>
        <Field label="Division" required>
          <div data-field-error={undefined}>
            <select name="division" value={formData.division} onChange={handleChange} className={inputClass('division', {})}>
              <option value="A">Division A</option>
              <option value="B">Division B</option>
              <option value="C">Division C</option>
            </select>
          </div>
        </Field>
        {/* Academic Grade and PG Program Grade removed as requested */}
      </FormSection>

      {/* ── 2. CORE IDENTIFICATION (unchanged) ── */}
      <FormSection title="Core Identification">
        <Field label="Enrollment Number" required error={fe.enrollmentNum} hint={mode === 'add' ? 'Auto‑generated based on year & department' : ''}>
          <div data-field-error={fe.enrollmentNum ? true : undefined} className="relative">
            <input
              type="text"
              name="enrollmentNum"
              value={formData.enrollmentNum}
              onChange={handleChange}
              readOnly={mode === 'add'}
              className={mode === 'add' ? icRO : inputClass('enrollmentNum', fe)}
              placeholder="Will be auto‑generated"
            />
            {mode === 'add' && (
              <button
                type="button"
                onClick={refreshEnrollmentNumber}
                disabled={generatingEnroll || !formData.admissionYear || !formData.department}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 disabled:opacity-40"
                title="Refresh enrollment number"
              >
                <RefreshCw size={16} className={generatingEnroll ? 'animate-spin' : ''} />
              </button>
            )}
          </div>
          {generatingEnroll && <p className="text-xs text-blue-500 mt-1">Generating unique number...</p>}
        </Field>
        <Field label="Aadhar Number" error={fe.aadharNumber} hint="12 digits">
          <input type="text" name="aadharNumber" value={formData.aadharNumber} onChange={handleChange}
            className={inputClass('aadharNumber', fe)} maxLength={12} placeholder="12-digit Aadhar" />
        </Field>
      </FormSection>

      {/* ── 3. PERSONAL DETAILS (unchanged) ── */}
      <FormSection title="Personal Details">
        <Field label="Full Name" required error={fe.name}>
          <div data-field-error={fe.name ? true : undefined}>
            <input type="text" name="name" value={formData.name} onChange={handleChange}
              className={inputClass('name', fe)} placeholder="Student full name" />
          </div>
        </Field>
        <Field label="Date of Birth" required error={fe.dob}>
          <div data-field-error={fe.dob ? true : undefined}>
            <input type="date" name="dob" value={formData.dob} onChange={handleChange}
              className={inputClass('dob', fe)} max={new Date().toISOString().split('T')[0]} />
          </div>
        </Field>
        <Field label="Gender" required error={fe.gender}>
          <div data-field-error={fe.gender ? true : undefined}>
            <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass('gender', fe)}>
              <option value="">Select Gender</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
        </Field>
        <Field label="Blood Group">
          <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className={ic}>
            <option value="">Select</option>
            {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg}>{bg}</option>)}
          </select>
        </Field>
        <Field label="Nationality">
          <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className={ic} />
        </Field>
        <Field label="Religion">
          <input type="text" name="religion" value={formData.religion} onChange={handleChange} className={ic} />
        </Field>
      </FormSection>

      {/* ── 4. RESERVATION / CATEGORY (unchanged) ── */}
      <FormSection title="Reservation / Category">
        <Field label="Category" required error={fe.category}>
          <div data-field-error={fe.category ? true : undefined}>
            <select name="category" value={formData.category} onChange={handleChange} className={inputClass('category', fe)}>
              <option value="">Select Category</option>
              {['General','OBC','SC','ST','EWS','NT','SBC','VJNT','Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </Field>
        <Field label="Caste">
          <input type="text" name="caste" value={formData.caste} onChange={handleChange} className={ic} />
        </Field>
        <Field label="Subcaste">
          <input type="text" name="subcaste" value={formData.subcaste} onChange={handleChange} className={ic} />
        </Field>
      </FormSection>

      {/* ── 5. CONTACT & ADDRESS (unchanged) ── */}
      <FormSection title="Contact & Address">
        <Field label="Email" required error={fe.email}>
          <div data-field-error={fe.email ? true : undefined}>
            <input type="email" name="email" value={formData.email} onChange={handleChange}
              className={inputClass('email', fe)} placeholder="student@email.com" />
          </div>
        </Field>
        <Field label="Contact Number" required error={fe.contactNumber} hint="10 digits">
          <div data-field-error={fe.contactNumber ? true : undefined}>
            <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleChange}
              className={inputClass('contactNumber', fe)} maxLength={10} placeholder="10-digit mobile" />
          </div>
        </Field>
        <Field label="Alternate Contact">
          <input type="tel" name="alternateContact" value={formData.alternateContact} onChange={handleChange} className={ic} />
        </Field>
        <Field label="Address" span={2}>
          <input type="text" name="address" value={formData.address} onChange={handleChange} className={ic} placeholder="House No., Street, Area" />
        </Field>
        <Field label="City">
          <input type="text" name="city" value={formData.city} onChange={handleChange} className={ic} />
        </Field>
        <Field label="State">
          <input type="text" name="state" value={formData.state} onChange={handleChange} className={ic} />
        </Field>
        <Field label="Pincode" error={fe.pincode} hint="6 digits">
          <input type="text" name="pincode" value={formData.pincode} onChange={handleChange}
            className={inputClass('pincode', fe)} maxLength={6} placeholder="6-digit pincode" />
        </Field>
      </FormSection>

      {/* ── 6. PARENT / GUARDIAN (unchanged) ── */}
      <FormSection title="Parent / Guardian"
        badge={(isBachelor || isMaster) ? 'Required' : undefined} badgeColor="amber">
        <Field label="Father's Name" required={isBachelor || isMaster} error={fe.fatherName}>
          <div data-field-error={fe.fatherName ? true : undefined}>
            <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange}
              className={inputClass('fatherName', fe)} />
          </div>
        </Field>
        <Field label="Mother's Name" required={isBachelor || isMaster} error={fe.motherName}>
          <div data-field-error={fe.motherName ? true : undefined}>
            <input type="text" name="motherName" value={formData.motherName} onChange={handleChange}
              className={inputClass('motherName', fe)} />
          </div>
        </Field>
        <Field label="Guardian Name">
          <input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} className={ic} />
        </Field>
        <Field label="Parent Contact" required={isBachelor || isMaster} error={fe.parentContact}>
          <div data-field-error={fe.parentContact ? true : undefined}>
            <input type="tel" name="parentContact" value={formData.parentContact} onChange={handleChange}
              className={inputClass('parentContact', fe)} maxLength={10} />
          </div>
        </Field>
        <Field label="Parent Email" error={fe.parentEmail}>
          <input type="email" name="parentEmail" value={formData.parentEmail} onChange={handleChange}
            className={inputClass('parentEmail', fe)} />
        </Field>
        <Field label="Parent Occupation">
          <input type="text" name="parentOccupation" value={formData.parentOccupation} onChange={handleChange} className={ic} />
        </Field>
      </FormSection>

      {/* ── 7. SSC / 10th (unchanged) ── */}
      <FormSection title="SSC / 10th Qualification">
        <Field label="Board" hint="e.g. GSEB, CBSE, ICSE">
          <input type="text" name="tenthBoard" value={formData.tenthBoard} onChange={handleChange}
            className={ic} placeholder="e.g. GSEB, CBSE" />
        </Field>
        <Field label="Admit Number">
          <input type="text" name="tenthAdmitNumber" value={formData.tenthAdmitNumber} onChange={handleChange} className={ic} />
        </Field>
        <Field label="Passing Year" error={fe.tenthPassingYear}>
          <input type="number" name="tenthPassingYear" value={formData.tenthPassingYear} onChange={handleChange}
            className={inputClass('tenthPassingYear', fe)}
            min="1990" max={new Date().getFullYear()} placeholder="e.g. 2022" />
        </Field>
        <Field label="Marks Obtained" error={fe.tenthMarksObtained} hint="Out of 600">
          <input type="number" name="tenthMarksObtained" value={formData.tenthMarksObtained} onChange={handleChange}
            className={inputClass('tenthMarksObtained', fe)} min="0" max="600" />
        </Field>
        <Field label="Total Marks">
          <input type="number" value="600" disabled className={icRO} />
        </Field>
        <Field label="Percentage (Auto)">
          <input type="text" value={tenthPercentage} readOnly className={icRO} placeholder="Auto-calculated" />
        </Field>
      </FormSection>

      {/* ── 8. HSC / 12th (unchanged) ── */}
      <FormSection title="HSC / 12th Qualification"
        badge={isBachelor ? 'Required for UG' : undefined} badgeColor="blue">
        <Field label="Board" required={isBachelor} error={fe.twelfthBoard} hint="e.g. GSEB, CBSE, ICSE">
          <div data-field-error={fe.twelfthBoard ? true : undefined}>
            <input type="text" name="twelfthBoard" value={formData.twelfthBoard} onChange={handleChange}
              className={inputClass('twelfthBoard', fe)} placeholder="e.g. GSEB, CBSE" />
          </div>
        </Field>
        <Field label="Admit Number">
          <input type="text" name="twelfthAdmitNumber" value={formData.twelfthAdmitNumber} onChange={handleChange} className={ic} />
        </Field>
        <Field label="Passing Year" required={isBachelor} error={fe.twelfthPassingYear}>
          <div data-field-error={fe.twelfthPassingYear ? true : undefined}>
            <input type="number" name="twelfthPassingYear" value={formData.twelfthPassingYear} onChange={handleChange}
              className={inputClass('twelfthPassingYear', fe)}
              min="1990" max={new Date().getFullYear()} placeholder="e.g. 2024" />
          </div>
        </Field>
        <Field label="Marks Obtained" required={isBachelor} error={fe.twelfthMarksObtained}>
          <div data-field-error={fe.twelfthMarksObtained ? true : undefined}>
            <input type="number" name="twelfthMarksObtained" value={formData.twelfthMarksObtained} onChange={handleChange}
              className={inputClass('twelfthMarksObtained', fe)} min="0" />
          </div>
        </Field>
        <Field label="Total Marks" required={isBachelor} error={fe.twelfthTotalMarks} hint="e.g. 700 or 750">
          <div data-field-error={fe.twelfthTotalMarks ? true : undefined}>
            <input type="number" name="twelfthTotalMarks" value={formData.twelfthTotalMarks} onChange={handleChange}
              className={inputClass('twelfthTotalMarks', fe)} min="0" placeholder="e.g. 700" />
          </div>
        </Field>
        <Field label="Percentage (Auto)">
          <input type="text" value={twelfthPercentage} readOnly className={icRO} placeholder="Auto-calculated" />
        </Field>
      </FormSection>

      {/* ── 9. BACHELOR DEGREE DETAILS — with dropdown for Grade/Division and CGPA validation ── */}
      {isMaster && (
        <FormSection title="Bachelor Degree Details" badge="Required for PG" badgeColor="purple">
          <div className="sm:col-span-2 md:col-span-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 flex items-start gap-2 text-purple-700 text-xs">
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              Since this is a <strong>Postgraduate (PG)</strong> program, please fill the student's completed Bachelor degree information.
              Enter the <strong>CGPA</strong> (e.g. 7.85 out of 10) and/or select the <strong>Grade / Division</strong> from the dropdown.
            </span>
          </div>

          <Field label="Bachelor Degree" required error={fe.bachelorDegree} hint="e.g. BCA, B.Sc, B.Com, BBA">
            <div data-field-error={fe.bachelorDegree ? true : undefined}>
              <input type="text" name="bachelorDegree" value={formData.bachelorDegree} onChange={handleChange}
                className={inputClass('bachelorDegree', fe)} placeholder="e.g. BCA, B.Sc, B.Com" />
            </div>
          </Field>

          <Field label="Specialization / Stream" hint="e.g. Computer Science, Commerce">
            <input type="text" name="bachelorSpecialization" value={formData.bachelorSpecialization} onChange={handleChange}
              className={ic} placeholder="e.g. Computer Science" />
          </Field>

          <Field label="University / Board" required error={fe.bachelorBoard} hint="Name of the university">
            <div data-field-error={fe.bachelorBoard ? true : undefined}>
              <input type="text" name="bachelorBoard" value={formData.bachelorBoard} onChange={handleChange}
                className={inputClass('bachelorBoard', fe)} placeholder="e.g. GTU, Mumbai University" />
            </div>
          </Field>

          <Field label="Admit / Roll Number">
            <input type="text" name="bachelorAdmitNumber" value={formData.bachelorAdmitNumber} onChange={handleChange}
              className={ic} placeholder="Roll / Enrollment number" />
          </Field>

          <Field label="Passing Year" required error={fe.bachelorPassingYear}>
            <div data-field-error={fe.bachelorPassingYear ? true : undefined}>
              <input type="number" name="bachelorPassingYear" value={formData.bachelorPassingYear} onChange={handleChange}
                className={inputClass('bachelorPassingYear', fe)}
                min="1990" max={new Date().getFullYear()} placeholder="e.g. 2024" />
            </div>
          </Field>

          {/* CGPA field with negative number prevention */}
          <Field label="CGPA" error={fe.bachelorCGPA} hint="Out of 10 (e.g. 7.85) – cannot be negative">
            <div data-field-error={fe.bachelorCGPA ? true : undefined}>
              <input type="number" name="bachelorCGPA" value={formData.bachelorCGPA} onChange={handleCgpaChange}
                className={inputClass('bachelorCGPA', fe)}
                min="0" max="10" step="0.01" placeholder="e.g. 7.85" />
            </div>
          </Field>

          {/* Grade / Division – now a dropdown (replaces text input) */}
          <Field label="Grade / Division" hint="Select grade (e.g., Distinction, A, B, C, D, F)">
            <select name="bachelorGrade" value={formData.bachelorGrade} onChange={handleChange} className={ic}>
              <option value="">Select Grade / Division</option>
              {bachelorGradeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>
        </FormSection>
      )}

      {/* ── 10. SYSTEM & SECURITY (unchanged) ── */}
      <FormSection title="System & Security">
        <Field
          label={mode === 'add' ? 'Password' : 'New Password (leave blank to keep current)'}
          required={mode === 'add'}
          error={fe.password}
          hint={mode === 'edit' ? 'Min 6 characters if changing' : 'Minimum 6 characters'}
          span={2}
        >
          <div className="relative" data-field-error={fe.password ? true : undefined}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password" value={formData.password} onChange={handleChange}
              className={`${inputClass('password', fe)} pr-10`}
              placeholder={mode === 'add' ? 'Min 6 characters' : 'Leave blank to keep current'}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition">
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>
        <Field label="Account Status">
          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange}
              className="w-4 h-4 accent-blue-600 rounded" />
            <span className="text-sm font-medium text-slate-700">Active</span>
          </label>
        </Field>
      </FormSection>

      {touched && Object.keys(fe).length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle size={15} />
          <span><strong>{Object.keys(fe).length} error{Object.keys(fe).length > 1 ? 's' : ''}</strong> need to be fixed before saving.</span>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={() => onSuccess?.('cancel')}
          className="px-6 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
          Cancel
        </button>
        <button type="submit" disabled={submitting || uploading}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition disabled:opacity-50 active:scale-95">
          {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {uploading ? 'Uploading photo...' : submitting ? 'Saving...' : mode === 'add' ? 'Add Student' : 'Update Student'}
        </button>
      </div>
    </form>
  );
};

export default StudentForm;
