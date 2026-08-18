// src/cms_admin/components/StudentViewModal.jsx
import { useEffect } from 'react';
import { X } from 'lucide-react';

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

// ── Reusable field row ──────────────────────────────────────────────────────
const Field = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 py-1.5 border-b border-slate-100 last:border-0">
    <span className="text-xs text-slate-500 font-medium">{label}</span>
    <span className="text-sm font-semibold text-slate-800 sm:text-right">{value || 'N/A'}</span>
  </div>
);

// ── Section card ───────────────────────────────────────────────────────────
const Section = ({ title, color = 'blue', children }) => (
  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
    <h4 className={`text-xs font-bold uppercase tracking-wide mb-3 text-${color}-700`}>{title}</h4>
    {children}
  </div>
);

const StudentViewModal = ({ student, onClose }) => {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-4xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-800">Student Details</h3>
            <p className="text-xs text-slate-500 mt-0.5">{student.name} · {student.enrollmentNum}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Core Identification — full width */}
            <div className="md:col-span-2">
              <Section title="Core Identification">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  <Field label="Enrollment No." value={student.enrollmentNum} />
                  <Field label="Aadhar No." value={student.aadharNumber} />
                </div>
              </Section>
            </div>

            {/* Personal */}
            <Section title="Personal Details">
              <Field label="Name"        value={student.name} />
              <Field label="DOB"         value={formatDate(student.dob)} />
              <Field label="Gender"      value={student.gender} />
              <Field label="Blood Group" value={student.bloodGroup} />
              <Field label="Nationality" value={student.nationality} />
              <Field label="Religion"    value={student.religion} />
            </Section>

            {/* Category */}
            <Section title="Reservation / Category">
              <Field label="Category" value={student.category} />
              <Field label="Caste"    value={student.caste} />
              <Field label="Subcaste" value={student.subcaste} />
            </Section>

            {/* Contact — full width */}
            <div className="md:col-span-2">
              <Section title="Contact & Address">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  <Field label="Email"     value={student.email} />
                  <Field label="Contact"   value={student.contactNumber} />
                  <Field label="Alternate" value={student.alternateContact} />
                  <Field label="Address"   value={student.address} />
                  <Field label="City"      value={student.city} />
                  <Field label="State"     value={student.state} />
                  <Field label="Pincode"   value={student.pincode} />
                </div>
              </Section>
            </div>

            {/* Parent — full width */}
            <div className="md:col-span-2">
              <Section title="Parent / Guardian">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6">
                  <Field label="Father"         value={student.fatherName} />
                  <Field label="Mother"         value={student.motherName} />
                  <Field label="Guardian"       value={student.guardianName} />
                  <Field label="Parent Contact" value={student.parentContact} />
                  <Field label="Parent Email"   value={student.parentEmail} />
                  <Field label="Occupation"     value={student.parentOccupation} />
                </div>
              </Section>
            </div>

            {/* 10th */}
            <Section title="10th Qualification">
              <Field label="Board"          value={student.tenthBoard} />
              <Field label="Admit No."      value={student.tenthAdmitNumber} />
              <Field label="Passing Year"   value={student.tenthPassingYear} />
              <Field label="Marks Obtained" value={`${student.tenthMarksObtained || 'N/A'} / 600`} />
              {student.tenthMarksObtained && (
                <Field label="Percentage" value={`${((student.tenthMarksObtained / 600) * 100).toFixed(2)}%`} />
              )}
            </Section>

            {/* 12th */}
            <Section title="12th Qualification">
              <Field label="Board"          value={student.twelfthBoard} />
              <Field label="Admit No."      value={student.twelfthAdmitNumber} />
              <Field label="Passing Year"   value={student.twelfthPassingYear} />
              <Field label="Marks Obtained" value={`${student.twelfthMarksObtained || 'N/A'} / ${student.twelfthTotalMarks || 'N/A'}`} />
              {student.twelfthMarksObtained && student.twelfthTotalMarks && (
                <Field label="Percentage" value={`${((student.twelfthMarksObtained / student.twelfthTotalMarks) * 100).toFixed(2)}%`} />
              )}
            </Section>

            {/* Academic — full width */}
            <div className="md:col-span-2">
              <Section title="Academic Details" color="blue">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6">
                  <Field label="Admission Year" value={student.admissionYear} />
                  <Field label="Batch"          value={student.batch} />
                  <Field label="Department"     value={student.department?.name || 'N/A'} />
                  <Field label="Semester"       value={student.isActive === false ? 'COMPLETED' : student.semesterID?.semesterName || 'N/A'} />
                  <Field label="Current Year"   value={student.currentYear} />
                  <Field label="Division"       value={student.division || 'A'} />
                </div>
              </Section>
            </div>

            {/* System — full width */}
            <div className="md:col-span-2">
              <Section title="System & Status">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  <Field label="Status"     value={student.isActive ? 'Active' : 'Inactive'} />
                  <Field label="Last Login" value={formatDate(student.lastLogin)} />
                  <Field label="Created At" value={formatDate(student.createdAt)} />
                  <Field label="Updated At" value={formatDate(student.updatedAt)} />
                </div>
              </Section>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end flex-shrink-0">
          <button onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition active:scale-95">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentViewModal;