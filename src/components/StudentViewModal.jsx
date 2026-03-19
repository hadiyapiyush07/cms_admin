// src/cms_admin/components/StudentViewModal.jsx
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const StudentViewModal = ({ student, onClose }) => {
  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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
                    Student Details
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[70vh] p-2">
                  {/* Core Identification */}
                  <div className="col-span-2 bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-blue-900 mb-2">Core Identification</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-gray-600">Enrollment No.:</span> {student.enrollmentNum}</div>
                      <div><span className="text-gray-600">Aadhar No.:</span> {student.aadharNumber || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Personal Details */}
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-blue-900 mb-2">Personal Details</h4>
                    <div className="space-y-1">
                      <div><span className="text-gray-600">Name:</span> {student.name}</div>
                      <div><span className="text-gray-600">DOB:</span> {formatDate(student.dob)}</div>
                      <div><span className="text-gray-600">Gender:</span> {student.gender}</div>
                      <div><span className="text-gray-600">Blood Group:</span> {student.bloodGroup || 'N/A'}</div>
                      <div><span className="text-gray-600">Nationality:</span> {student.nationality}</div>
                      <div><span className="text-gray-600">Religion:</span> {student.religion || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Reservation / Category */}
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-blue-900 mb-2">Reservation / Category</h4>
                    <div className="space-y-1">
                      <div><span className="text-gray-600">Category:</span> {student.category}</div>
                      <div><span className="text-gray-600">Caste:</span> {student.caste || 'N/A'}</div>
                      <div><span className="text-gray-600">Subcaste:</span> {student.subcaste || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Contact & Address */}
                  <div className="col-span-2 bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-blue-900 mb-2">Contact & Address</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-gray-600">Email:</span> {student.email}</div>
                      <div><span className="text-gray-600">Contact:</span> {student.contactNumber}</div>
                      <div><span className="text-gray-600">Alternate:</span> {student.alternateContact || 'N/A'}</div>
                      <div><span className="text-gray-600">Address:</span> {student.address || 'N/A'}</div>
                      <div><span className="text-gray-600">City:</span> {student.city || 'N/A'}</div>
                      <div><span className="text-gray-600">State:</span> {student.state || 'N/A'}</div>
                      <div><span className="text-gray-600">Pincode:</span> {student.pincode || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Parent / Guardian */}
                  <div className="col-span-2 bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-blue-900 mb-2">Parent / Guardian</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div><span className="text-gray-600">Father:</span> {student.fatherName || 'N/A'}</div>
                      <div><span className="text-gray-600">Mother:</span> {student.motherName || 'N/A'}</div>
                      <div><span className="text-gray-600">Guardian:</span> {student.guardianName || 'N/A'}</div>
                      <div><span className="text-gray-600">Parent Contact:</span> {student.parentContact || 'N/A'}</div>
                      <div><span className="text-gray-600">Parent Email:</span> {student.parentEmail || 'N/A'}</div>
                      <div><span className="text-gray-600">Occupation:</span> {student.parentOccupation || 'N/A'}</div>
                    </div>
                  </div>

                  {/* 10th Qualification */}
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-blue-900 mb-2">10th Qualification</h4>
                    <div className="space-y-1">
                      <div><span className="text-gray-600">Board:</span> {student.tenthBoard || 'N/A'}</div>
                      <div><span className="text-gray-600">Admit No.:</span> {student.tenthAdmitNumber || 'N/A'}</div>
                      <div><span className="text-gray-600">Passing Year:</span> {student.tenthPassingYear || 'N/A'}</div>
                      <div><span className="text-gray-600">Marks Obtained:</span> {student.tenthMarksObtained || 'N/A'} / 600</div>
                      {student.tenthMarksObtained && (
                        <div><span className="text-gray-600">Percentage:</span> {((student.tenthMarksObtained / 600) * 100).toFixed(2)}%</div>
                      )}
                    </div>
                  </div>

                  {/* 12th Qualification */}
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-blue-900 mb-2">12th Qualification</h4>
                    <div className="space-y-1">
                      <div><span className="text-gray-600">Board:</span> {student.twelfthBoard || 'N/A'}</div>
                      <div><span className="text-gray-600">Admit No.:</span> {student.twelfthAdmitNumber || 'N/A'}</div>
                      <div><span className="text-gray-600">Passing Year:</span> {student.twelfthPassingYear || 'N/A'}</div>
                      <div><span className="text-gray-600">Marks Obtained:</span> {student.twelfthMarksObtained || 'N/A'} / {student.twelfthTotalMarks || 'N/A'}</div>
                      {student.twelfthMarksObtained && student.twelfthTotalMarks && (
                        <div><span className="text-gray-600">Percentage:</span> {((student.twelfthMarksObtained / student.twelfthTotalMarks) * 100).toFixed(2)}%</div>
                      )}
                    </div>
                  </div>

                  {/* Academic Details */}
                  <div className="col-span-2 bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-blue-900 mb-2">Academic Details</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div><span className="text-gray-600">Admission Year:</span> {student.admissionYear || 'N/A'}</div>
                      <div><span className="text-gray-600">Batch:</span> {student.batch || 'N/A'}</div>
                      <div><span className="text-gray-600">Department:</span> {student.department?.name || 'N/A'}</div>
                      <div><span className="text-gray-600">Semester:</span> {student.semesterID?.semesterName || 'N/A'}</div>
                      <div><span className="text-gray-600">Current Year:</span> {student.currentYear || 'N/A'}</div>
                    </div>
                  </div>

                  {/* System Fields */}
                  <div className="col-span-2 bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-blue-900 mb-2">System & Status</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-gray-600">Status:</span> {student.isActive ? 'Active' : 'Inactive'}</div>
                      <div><span className="text-gray-600">Last Login:</span> {formatDate(student.lastLogin)}</div>
                      <div><span className="text-gray-600">Created At:</span> {formatDate(student.createdAt)}</div>
                      <div><span className="text-gray-600">Updated At:</span> {formatDate(student.updatedAt)}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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

export default StudentViewModal;