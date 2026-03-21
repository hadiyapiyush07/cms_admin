// src/cms_admin/components/ProfessorViewModal.jsx
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ProfessorViewModal = ({ professor, onClose }) => {
  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Format datetime for display
  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate years of experience display
  const getExperienceDisplay = () => {
    if (!professor.experience) return 'N/A';
    return `${professor.experience} year${professor.experience !== 1 ? 's' : ''}`;
  };

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    Professor Details
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[70vh] p-2">
                  {/* Profile Header */}
                  <div className="col-span-2 bg-gradient-to-r from-purple-700 to-purple-950 text-white p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="bg-white text-purple-600 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold">
                        {professor.name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{professor.name}</h2>
                        <p className="text-purple-100">{professor.email}</p>
                        <p className="text-purple-100 text-sm mt-1">Contact: {professor.contactNumber}</p>
                      </div>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-purple-900 mb-2 border-b pb-1">Basic Information</h4>
                    <div className="space-y-2">
                      <div><span className="text-gray-600 font-medium">Name:</span> {professor.name}</div>
                      <div><span className="text-gray-600 font-medium">Email:</span> {professor.email}</div>
                      <div><span className="text-gray-600 font-medium">Contact Number:</span> {professor.contactNumber}</div>
                      <div><span className="text-gray-600 font-medium">Status:</span> 
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs ${professor.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {professor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Department Information */}
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-purple-900 mb-2 border-b pb-1">Department Information</h4>
                    <div className="space-y-2">
                      <div><span className="text-gray-600 font-medium">Department:</span> {professor.department?.name || 'N/A'}</div>
                      <div><span className="text-gray-600 font-medium">Department Code:</span> {professor.department?.code || 'N/A'}</div>
                      {professor.department?.description && (
                        <div><span className="text-gray-600 font-medium">Description:</span> {professor.department.description}</div>
                      )}
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-purple-900 mb-2 border-b pb-1">Professional Information</h4>
                    <div className="space-y-2">
                      <div><span className="text-gray-600 font-medium">Qualification:</span> {professor.qualification || 'N/A'}</div>
                      <div><span className="text-gray-600 font-medium">Specialization:</span> {professor.specialization || 'N/A'}</div>
                      <div><span className="text-gray-600 font-medium">Experience:</span> {getExperienceDisplay()}</div>
                      <div><span className="text-gray-600 font-medium">Joining Date:</span> {formatDate(professor.joiningDate)}</div>
                    </div>
                  </div>

                  {/* Subjects Taught */}
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-purple-900 mb-2 border-b pb-1">
                      Subjects Taught ({professor.coursesTaught?.length || 0})
                    </h4>
                    {professor.coursesTaught && professor.coursesTaught.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {professor.coursesTaught.map((course, index) => (
                          <div key={course._id || index} className="flex justify-between items-center border-b pb-1 last:border-0">
                            <div>
                              <span className="font-medium">{course.name}</span>
                              {course.code && <span className="text-xs text-gray-500 ml-2">({course.code})</span>}
                            </div>
                            {course.credits && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                {course.credits} Credits
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No subjects assigned yet.</p>
                    )}
                  </div>

                  {/* Account Information */}
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-purple-900 mb-2 border-b pb-1">Account Information</h4>
                    <div className="space-y-2">
                      <div><span className="text-gray-600 font-medium">Account Status:</span> 
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs ${professor.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {professor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div><span className="text-gray-600 font-medium">Last Login:</span> {formatDateTime(professor.lastLogin)}</div>
                      <div><span className="text-gray-600 font-medium">Account Created:</span> {formatDateTime(professor.createdAt)}</div>
                      <div><span className="text-gray-600 font-medium">Last Updated:</span> {formatDateTime(professor.updatedAt)}</div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-purple-900 mb-2 border-b pb-1">Statistics</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded text-center">
                        <div className="text-2xl font-bold text-purple-600">{professor.coursesTaught?.length || 0}</div>
                        <div className="text-xs text-gray-500">Subjects Taught</div>
                      </div>
                      <div className="bg-white p-3 rounded text-center">
                        <div className="text-2xl font-bold text-purple-600">{professor.experience || 0}</div>
                        <div className="text-xs text-gray-500">Years Experience</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ProfessorViewModal;