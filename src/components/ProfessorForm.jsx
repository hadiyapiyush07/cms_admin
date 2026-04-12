// src/cms_admin/components/ProfessorForm.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, EyeOff, CheckCircle, AlertCircle, Info } from 'lucide-react';

// ── Validation helpers (outside component) ─────────────────────────────────

const QUALIFICATION_REGEX = /\b(ph\.?d|m\.?tech|b\.?tech|mca|bca|m\.?sc|b\.?sc|mba|bba|ma\b|b\.?a\b|m\.?e\b|b\.?e\b|m\.?com|b\.?com|llb|llm|mbbs|md\b|ms\b|diploma|pgdca|pgd)\b/i;
const SPECIALIZATION_MIN = 3;
const SPECIALIZATION_LETTER_REGEX = /[a-zA-Z]{2,}/;
const TODAY = new Date().toISOString().split('T')[0];

const validateField = (name, value, mode) => {
  switch (name) {
    case 'name': {
      if (!value || value.trim() === '') return 'Full name is required.';
      if (value.trim().length < 2) return 'Name must be at least 2 characters.';
      if (!/^[a-zA-Z\s.'-]+$/.test(value.trim()))
        return 'Name can only contain letters, spaces, dots, apostrophes or hyphens.';
      return '';
    }
    case 'email': {
      if (!value || value.trim() === '') return 'Email is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
        return 'Enter a valid email address.';
      return '';
    }
    case 'contactNumber': {
      if (!value || value.trim() === '') return 'Contact number is required.';
      if (!/^[0-9]{10}$/.test(value)) return 'Contact number must be exactly 10 digits.';
      return '';
    }
    case 'department': {
      if (!value) return 'Please select a department.';
      return '';
    }
    case 'qualification': {
      if (!value || value.trim() === '') return '';
      if (value.trim().length < 2) return 'Qualification is too short.';
      if (!QUALIFICATION_REGEX.test(value.trim()))
        return 'Enter a valid qualification (e.g. Ph.D, M.Tech, MCA, B.Sc, MBA).';
      return '';
    }
    case 'experience': {
      if (value === '' || value === null || value === undefined) return '';
      const num = parseFloat(value);
      if (isNaN(num)) return 'Experience must be a number.';
      if (num < 0) return 'Experience cannot be negative.';
      if (num > 60) return 'Experience seems too high (max 60 years).';
      // Allow only up to 1 decimal place (e.g. 2.5 ✓, 2.345 ✗)
      if (!/^\d+(\.[05])?$/.test(String(value).trim()))
        return 'Only .0 or .5 decimals allowed (e.g. 2, 2.5, 10).';
      return '';
    }
    case 'specialization': {
      if (!value || value.trim() === '') return '';
      if (value.trim().length < SPECIALIZATION_MIN)
        return `Specialization must be at least ${SPECIALIZATION_MIN} characters.`;
      if (!SPECIALIZATION_LETTER_REGEX.test(value.trim()))
        return 'Enter a meaningful specialization (e.g. Computer Science, Data Science).';
      return '';
    }
    case 'joiningDate': {
      if (!value) return '';
      if (value > TODAY) return 'Joining date cannot be a future date.';
      if (value < '1950-01-01') return 'Joining date seems too far in the past.';
      return '';
    }
    case 'password': {
      if (mode === 'add') {
        if (!value || value.trim() === '') return 'Password is required for new professors.';
        if (value.length < 6) return 'Password must be at least 6 characters.';
      } else {
        if (value && value.trim() !== '' && value.length < 6)
          return 'New password must be at least 6 characters.';
      }
      return '';
    }
    default:
      return '';
  }
};

// ── FieldWrapper is defined OUTSIDE ProfessorForm ──────────────────────────
// This is critical! Defining it inside would cause React to unmount/remount
// the input on every render, making the cursor jump out after each keystroke.

const FieldWrapper = ({ label, required, hint, children, name, fieldErrors, touched }) => {
  const err     = fieldErrors[name];
  const isTouched = touched[name];
  const isValid   = isTouched && !err;

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {!required && <span className="text-slate-400 text-xs font-normal ml-1">(optional)</span>}
      </label>
      <div className="relative">
        {children}
        {isTouched && isValid && (
          <CheckCircle size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" />
        )}
      </div>
      {isTouched && err && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle size={12} /> {err}
        </p>
      )}
      {hint && !(isTouched && err) && (
        <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
          <Info size={11} /> {hint}
        </p>
      )}
    </div>
  );
};

// ── Helper: input className (also outside, pure function) ──────────────────
const getInputClass = (name, touched, fieldErrors) => {
  const err      = fieldErrors[name];
  const isTouched = touched[name];
  const base = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition pr-8';
  if (!isTouched) return `${base} border-slate-200 focus:ring-blue-500 focus:border-blue-500 bg-slate-50`;
  if (err)        return `${base} border-red-400 focus:ring-red-300 focus:border-red-400 bg-red-50`;
  return          `${base} border-emerald-400 focus:ring-emerald-300 focus:border-emerald-400 bg-emerald-50/30`;
};

// ── Main Component ──────────────────────────────────────────────────────────

const ProfessorForm = ({ initialData = null, mode = 'add', onSuccess }) => {
  const [showPassword, setShowPassword]   = useState(false);
  const [departments, setDepartments]     = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [submitting, setSubmitting]       = useState(false);
  const [submitError, setSubmitError]     = useState('');
  const [success, setSuccess]             = useState('');
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [fieldErrors, setFieldErrors]     = useState({});
  const [touched, setTouched]             = useState({});

  const emptyForm = {
    name: '', email: '', contactNumber: '', department: '',
    coursesTaught: [], qualification: '', experience: '',
    specialization: '', joiningDate: '', password: '', isActive: true,
  };

  const [formData, setFormData] = useState(emptyForm);

  // Populate form in edit mode
  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        name:           initialData.name || '',
        email:          initialData.email || '',
        contactNumber:  initialData.contactNumber || '',
        department:     initialData.department?._id || initialData.department || '',
        coursesTaught:  initialData.coursesTaught?.map(c => c._id || c) || [],
        qualification:  initialData.qualification || '',
        experience:     initialData.experience || '',
        specialization: initialData.specialization || '',
        joiningDate:    initialData.joiningDate
          ? new Date(initialData.joiningDate).toISOString().split('T')[0] : '',
        password:  '',
        isActive:  initialData.isActive !== undefined ? initialData.isActive : true,
      });
      if (initialData.department?._id || initialData.department)
        fetchSubjectsByDepartment(initialData.department._id || initialData.department);
    } else {
      setFormData(emptyForm);
      setAvailableSubjects([]);
      setFieldErrors({});
      setTouched({});
    }
  }, [initialData, mode]);

  // Fetch departments on mount
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('authToken');
      try {
        const res = await axios.get('http://localhost:5000/api/departments', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) setDepartments(res.data.data);
        else if (Array.isArray(res.data)) setDepartments(res.data);
        else if (res.data.data) setDepartments(res.data.data);
      } catch (err) {
        console.error('Error fetching departments:', err);
        setSubmitError('Could not load departments.');
      }
    })();
  }, []);

  const fetchSubjectsByDepartment = async (departmentId) => {
    if (!departmentId) { setAvailableSubjects([]); return; }
    setSubjectsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.get(
        `http://localhost:5000/api/subjects?department=${departmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      let subjects = [];
      if (res.data.success && res.data.data) subjects = res.data.data;
      else if (Array.isArray(res.data)) subjects = res.data;
      setAvailableSubjects(subjects);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setAvailableSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const touchField = (name, value) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, value, mode);
    setFieldErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = value;

    if (name === 'department') {
      fetchSubjectsByDepartment(value);
      setFormData(prev => ({ ...prev, department: value, coursesTaught: [] }));
      touchField('department', value);
      return;
    }
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }
    if (name === 'contactNumber') {
      newValue = value.replace(/[^0-9]/g, '').slice(0, 10);
    }
    if (name === 'experience') {
      if (value !== '' && isNaN(parseFloat(value))) return;
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
    if (touched[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: validateField(name, newValue, mode) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    touchField(name, value);
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
      coursesTaught: prev.coursesTaught.filter(id => id !== subjectId),
    }));
  };

  const getSubjectName = (subjectId) => {
    const subject = availableSubjects.find(s => s._id === subjectId);
    return subject?.name || subjectId;
  };

  const validateAll = () => {
    const fields = ['name', 'email', 'contactNumber', 'department',
      'qualification', 'experience', 'specialization', 'joiningDate', 'password'];
    const errors = {};
    const allTouched = {};
    fields.forEach(f => {
      allTouched[f] = true;
      errors[f] = validateField(f, formData[f], mode);
    });
    setTouched(allTouched);
    setFieldErrors(errors);
    return Object.values(errors).every(e => e === '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSuccess('');

    if (!validateAll()) {
      setSubmitError('Please fix the errors below before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setSubmitError('Authentication required. Please log in again.');
        setSubmitting(false);
        return;
      }

      const submitData = {
        name:           formData.name.trim(),
        email:          formData.email.trim().toLowerCase(),
        contactNumber:  formData.contactNumber.trim(),
        department:     formData.department,
        coursesTaught:  formData.coursesTaught || [],
        qualification:  formData.qualification || '',
        experience:     formData.experience !== '' ? parseFloat(formData.experience) : 0,
        specialization: formData.specialization || '',
        joiningDate:    formData.joiningDate || TODAY,
        isActive:       true,
      };

      if (mode === 'add') {
        submitData.password = formData.password;
      } else if (mode === 'edit' && formData.password && formData.password.trim() !== '') {
        submitData.password = formData.password;
      }

      let response;
      if (mode === 'add') {
        response = await axios.post('http://localhost:5000/api/professor', submitData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
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
          setTouched({});
          setFieldErrors({});
        }
        setTimeout(() => { if (onSuccess) onSuccess(response.data.data); }, 1500);
      } else {
        setSubmitError(response.data.message || 'Operation failed.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || '';
      if (errorMessage.includes('email already exists'))
        setSubmitError(`Email "${formData.email}" is already registered.`);
      else if (errorMessage.includes('contactNumber already exists'))
        setSubmitError(`Contact number "${formData.contactNumber}" is already registered.`);
      else if (err.request)
        setSubmitError('Cannot connect to server. Please check if backend is running.');
      else
        setSubmitError(errorMessage || err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // Shorthand so JSX stays clean — passes validation state into the pure helper
  const ic = (name) => getInputClass(name, touched, fieldErrors);

  // Shorthand props for FieldWrapper
  const fw = { fieldErrors, touched };

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-white shadow-sm rounded-2xl p-6 space-y-8 border border-slate-100">

      {/* Global alerts */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-2 text-sm">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{submitError}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <CheckCircle size={16} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* ── Basic Info ── */}
      <section>
        <h2 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Basic Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <FieldWrapper {...fw} label="Full Name" name="name" required>
            <input
              type="text" name="name" value={formData.name}
              onChange={handleChange} onBlur={handleBlur}
              className={ic('name')}
              placeholder="Dr. Rajesh Kumar"
            />
          </FieldWrapper>

          <FieldWrapper {...fw} label="Email Address" name="email" required>
            <input
              type="email" name="email" value={formData.email}
              onChange={handleChange} onBlur={handleBlur}
              className={ic('email')}
              placeholder="professor@college.edu"
            />
          </FieldWrapper>

          <FieldWrapper {...fw} label="Contact Number" name="contactNumber" required hint="Enter exactly 10 digits, numbers only">
            <input
              type="tel" name="contactNumber" value={formData.contactNumber}
              onChange={handleChange} onBlur={handleBlur}
              className={ic('contactNumber')}
              placeholder="9876543210"
              maxLength="10"
            />
          </FieldWrapper>

        </div>
      </section>

      {/* ── Department ── */}
      <section>
        <h2 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Department</h2>
        <FieldWrapper {...fw} label="Select Department" name="department" required>
          <select
            name="department" value={formData.department}
            onChange={handleChange} onBlur={handleBlur}
            className={ic('department')}
          >
            <option value="">— Choose Department —</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>
                {dept.name} {dept.code ? `(${dept.code})` : ''}
              </option>
            ))}
          </select>
        </FieldWrapper>
      </section>

      {/* ── Professional Info ── */}
      <section>
        <h2 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Professional Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <FieldWrapper {...fw} label="Qualification" name="qualification"
            hint="Accepted: Ph.D, M.Tech, MCA, B.Sc, MBA, BCA, BE, ME, etc.">
            <input
              type="text" name="qualification" value={formData.qualification}
              onChange={handleChange} onBlur={handleBlur}
              className={ic('qualification')}
              placeholder="e.g., Ph.D, M.Tech, MCA"
            />
          </FieldWrapper>

          <FieldWrapper {...fw} label="Experience (years)" name="experience"
            hint="Enter 0–60. Decimals allowed (e.g. 2.5)">
            <input
              type="number" name="experience" value={formData.experience}
              onChange={handleChange} onBlur={handleBlur}
              className={ic('experience')}
              placeholder="Years of experience"
              min="0" max="60" step="0.5"
            />
          </FieldWrapper>

          <FieldWrapper {...fw} label="Specialization" name="specialization"
            hint="e.g., Computer Science, Data Science, Networking">
            <input
              type="text" name="specialization" value={formData.specialization}
              onChange={handleChange} onBlur={handleBlur}
              className={ic('specialization')}
              placeholder="e.g., Computer Science, Data Science"
            />
          </FieldWrapper>

          <FieldWrapper {...fw} label="Joining Date" name="joiningDate"
            hint={`Max date allowed: today (${TODAY})`}>
            <input
              type="date" name="joiningDate" value={formData.joiningDate}
              onChange={handleChange} onBlur={handleBlur}
              className={ic('joiningDate')}
              max={TODAY}
              min="1950-01-01"
            />
          </FieldWrapper>

        </div>
      </section>

      {/* ── Subjects Taught ── */}
      {formData.department && (
        <section>
          <h2 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Subjects Taught</h2>
          {subjectsLoading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Loading subjects...
            </div>
          ) : (
            <>
              <select
                onChange={handleSubjectSelect}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                disabled={availableSubjects.length === 0}
                value=""
              >
                <option value="">
                  {availableSubjects.length === 0
                    ? 'No subjects available for this department'
                    : '— Select Subject to Add —'}
                </option>
                {availableSubjects.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} {subject.code ? `(${subject.code})` : ''}
                  </option>
                ))}
              </select>

              {availableSubjects.length === 0 && (
                <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                  <Info size={12} /> No subjects found. Add subjects to this department first.
                </p>
              )}

              {formData.coursesTaught.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Selected ({formData.coursesTaught.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.coursesTaught.map(subjectId => (
                      <span key={subjectId}
                        className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-medium">
                        {getSubjectName(subjectId)}
                        <button type="button" onClick={() => removeSubject(subjectId)}
                          className="text-blue-400 hover:text-red-500 transition font-bold text-base leading-none">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ── Security ── */}
      <section>
        <h2 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Security</h2>
        <FieldWrapper {...fw} label="Password" name="password"
          required={mode === 'add'}
          hint={mode === 'edit'
            ? 'Leave blank to keep current password. Min 6 chars if changing.'
            : 'Minimum 6 characters.'}>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password" value={formData.password}
              onChange={handleChange} onBlur={handleBlur}
              className={`${ic('password')} pr-10`}
              placeholder={mode === 'add' ? 'Enter password (min 6 characters)' : 'Enter new password (optional)'}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition">
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </FieldWrapper>
      </section>

      {/* ── Submit ── */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button type="button" onClick={() => onSuccess?.('cancel')}
          className="px-6 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
          Cancel
        </button>
        <button type="submit" disabled={submitting}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 flex items-center gap-2">
          {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {submitting ? 'Saving...' : mode === 'add' ? 'Add Professor' : 'Update Professor'}
        </button>
      </div>
    </form>
  );
};

export default ProfessorForm;