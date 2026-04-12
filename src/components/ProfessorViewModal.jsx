// src/cms_admin/components/ProfessorViewModal.jsx
import { useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// ── Reusable field row ──────────────────────────────────────────────────────
const Field = ({ label, value, badge }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 py-1.5 border-b border-slate-100 last:border-0">
    <span className="text-xs text-slate-500 font-medium">{label}</span>
    {badge
      ? <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badge}`}>{value}</span>
      : <span className="text-sm font-semibold text-slate-800 sm:text-right">{value || 'N/A'}</span>
    }
  </div>
);

const Section = ({ title, children }) => (
  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
    <h4 className="text-xs font-bold uppercase tracking-wide mb-3 text-purple-700">{title}</h4>
    {children}
  </div>
);

const ProfessorViewModal = ({ professor, onClose }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const experienceDisplay = professor.experience
    ? `${professor.experience} year${professor.experience !== 1 ? 's' : ''}`
    : 'N/A';

  const statusBadge = professor.isActive
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-red-100 text-red-600';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-4xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-800">Professor Details</h3>
            <p className="text-xs text-slate-500 mt-0.5">{professor.name} · {professor.department?.name || 'N/A'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Profile banner — full width */}
            <div className="md:col-span-2 bg-gradient-to-br from-purple-700 to-purple-950 text-white rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-16 h-16 bg-white text-purple-700 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0 shadow-lg">
                  {professor.name?.charAt(0) || 'P'}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold">{professor.name}</h2>
                  <p className="text-purple-200 text-sm mt-0.5">{professor.email}</p>
                  <p className="text-purple-200 text-sm">{professor.contactNumber}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="bg-white/20 text-xs font-semibold px-3 py-1 rounded-full">
                      {professor.department?.name || 'No Department'}
                    </span>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${professor.isActive ? 'bg-emerald-400/30 text-emerald-100' : 'bg-red-400/30 text-red-100'}`}>
                      {professor.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {professor.experience > 0 && (
                      <span className="bg-white/20 text-xs font-semibold px-3 py-1 rounded-full">
                        {experienceDisplay} experience
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <Section title="Basic Information">
              <Field label="Full Name"      value={professor.name} />
              <Field label="Email"          value={professor.email} />
              <Field label="Contact"        value={professor.contactNumber} />
              <Field label="Status"         value={professor.isActive ? 'Active' : 'Inactive'} badge={statusBadge} />
            </Section>

            {/* Department */}
            <Section title="Department Information">
              <Field label="Department"      value={professor.department?.name} />
              <Field label="Department Code" value={professor.department?.code} />
              {professor.department?.description && (
                <Field label="Description" value={professor.department.description} />
              )}
            </Section>

            {/* Professional */}
            <Section title="Professional Information">
              <Field label="Qualification"  value={professor.qualification} />
              <Field label="Specialization" value={professor.specialization} />
              <Field label="Experience"     value={experienceDisplay} />
              <Field label="Joining Date"   value={formatDate(professor.joiningDate)} />
            </Section>

            {/* Statistics */}
            <Section title="Statistics">
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
                  <div className="text-2xl font-bold text-purple-600">{professor.coursesTaught?.length || 0}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Subjects Taught</div>
                </div>
                <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
                  <div className="text-2xl font-bold text-purple-600">{professor.experience || 0}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Years Experience</div>
                </div>
              </div>
            </Section>

            {/* Subjects — full width */}
            <div className="md:col-span-2">
              <Section title={`Subjects Taught (${professor.coursesTaught?.length || 0})`}>
                {!professor.coursesTaught?.length ? (
                  <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                    <BookOpen size={16} /> No subjects assigned yet
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                    {professor.coursesTaught.map((course, i) => (
                      <div key={course._id || i} className="bg-white border border-slate-100 rounded-xl px-3 py-2 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{course.name}</p>
                          {course.code && <p className="text-xs text-slate-400 font-mono">{course.code}</p>}
                        </div>
                        {course.credits && (
                          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-lg font-semibold">
                            {course.credits} Cr
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>

            {/* Account — full width */}
            <div className="md:col-span-2">
              <Section title="Account Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  <Field label="Account Status" value={professor.isActive ? 'Active' : 'Inactive'} badge={statusBadge} />
                  <Field label="Last Login"      value={formatDateTime(professor.lastLogin)} />
                  <Field label="Account Created" value={formatDateTime(professor.createdAt)} />
                  <Field label="Last Updated"    value={formatDateTime(professor.updatedAt)} />
                </div>
              </Section>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end flex-shrink-0">
          <button onClick={onClose}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition active:scale-95">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfessorViewModal;