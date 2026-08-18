// src/cms_admin/components/StudentList.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import StudentViewModal from './StudentViewModal';
import {
  Search, ChevronLeft, ChevronRight, Eye, Pencil, Trash2,
  AlertCircle, Users, Download, FileText, FileSpreadsheet,
  Loader2, CreditCard, X, CheckCircle
} from 'lucide-react';

// ── Report helpers (unchanged) ─────────────────────────────────────────────
const fetchAllStudentsForReport = async (filters) => {
  const token  = localStorage.getItem('authToken');
  const params = new URLSearchParams({
    page: 1, limit: 10000,
    ...(filters.department && { department: filters.department }),
    ...(filters.semester   && { semester:   filters.semester   }),
    ...(filters.search     && { search:     filters.search     }),
  });
  const res = await axios.get(`https://cms-backend-wl7u.onrender.com/api/admin/students?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.success ? res.data.data : [];
};

const buildStudentRows = (students) =>
  students.map(s => ({
    'Enrollment No.':  s.enrollmentNum,
    'Name':            s.name,
    'Email':           s.email,
    'Contact':         s.contactNumber,
    'Department':      s.department?.name || 'N/A',
    'Semester':        s.semesterID?.semesterName || 'N/A',
    'Gender':          s.gender || 'N/A',
    'Category':        s.category || 'N/A',
    'Admission Year':  s.admissionYear || 'N/A',
    'Batch':           s.batch || 'N/A',
    'Status':          s.isActive ? 'Active' : 'Inactive',
  }));

const downloadStudentExcel = async (filters, label, departments, semesters) => {
  const students = await fetchAllStudentsForReport(filters);
  const rows     = buildStudentRows(students);
  const wb  = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(rows);
  ws1['!cols'] = [
    { wch: 18 }, { wch: 22 }, { wch: 26 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 12 },
    { wch: 14 }, { wch: 12 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Students');
  const deptName = departments.find(d => d._id === filters.department)?.name || 'All';
  const semName  = semesters.find(s => s._id === filters.semester)?.semesterName || 'All';
  const summaryRows = [
    ['STUDENT REPORT SUMMARY', ''],
    ['Generated On', new Date().toLocaleString('en-IN')],
    ['Filter Applied', label],
    ['Department', deptName], ['Semester', semName], ['', ''],
    ['Total Students', students.length],
    ['Active',   students.filter(s => s.isActive).length],
    ['Inactive', students.filter(s => !s.isActive).length],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(summaryRows);
  ws2['!cols'] = [{ wch: 22 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Summary');
  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob  = new Blob([wbOut], { type: 'application/octet-stream' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href = url; a.download = `Students_${label.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
};

const downloadStudentPDF = async (filters, label) => {
  const { default: jsPDF }     = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const students = await fetchAllStudentsForReport(filters);
  const rows     = buildStudentRows(students);
  const doc      = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW    = doc.internal.pageSize.getWidth();
  doc.setFillColor(30, 64, 175); doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text('CAMPUS FLOW - Student Report', pageW / 2, 10, { align: 'center' });
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text(`Filter: ${label}   |   Generated: ${new Date().toLocaleString('en-IN')}   |   Total: ${students.length} students`, pageW / 2, 17, { align: 'center' });
  const boxY = 26;
  const boxes = [
    { label: 'Total Students', value: String(students.length),                          color: [219, 234, 254] },
    { label: 'Active',         value: String(students.filter(s => s.isActive).length),  color: [209, 250, 229] },
    { label: 'Inactive',       value: String(students.filter(s => !s.isActive).length), color: [254, 226, 226] },
    { label: 'Departments',    value: String(new Set(students.map(s => s.department?.name)).size), color: [224, 231, 255] },
  ];
  const boxW = (pageW - 20) / 4;
  boxes.forEach((b, i) => {
    const x = 10 + i * (boxW + 2);
    doc.setFillColor(...b.color); doc.roundedRect(x, boxY, boxW, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(30, 41, 59);
    doc.text(b.label, x + boxW / 2, boxY + 5, { align: 'center' });
    doc.setFontSize(11); doc.text(b.value, x + boxW / 2, boxY + 11, { align: 'center' });
  });
  const columns = Object.keys(rows[0] || {}); const tableRows = rows.map(r => columns.map(c => r[c]));
  autoTable(doc, {
    startY: boxY + 18, head: [columns], body: tableRows,
    styles: { fontSize: 6.5, cellPadding: 1.5 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 10) {
        const val = data.cell.raw;
        if (val === 'Active') {
          doc.setFillColor(209, 250, 229); doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          doc.setTextColor(5, 150, 105); doc.setFontSize(6.5);
          doc.text('Active', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' });
        } else if (val === 'Inactive') {
          doc.setFillColor(254, 226, 226); doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          doc.setTextColor(220, 38, 38); doc.setFontSize(6.5);
          doc.text('Inactive', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' });
        }
      }
    },
    foot: [[`TOTAL: ${students.length} students`, '', '', '', '', '', '', '', '', '', '']],
    footStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 7 },
  });
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${totalPages}  |  Campus Flow - Confidential`, pageW / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
  }
  doc.save(`Students_${label.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// ── Download ID Card PDF ────────────────────────────────────────────────────
const downloadIDCardPDF = async (student) => {
  const { default: jsPDF } = await import('jspdf');

  // ── Compute exact page height from content so NO whitespace ───────────────
  const HDR_H   = 20;   // header
  const FTR_H   = 14;   // footer
  const PAD     = 5;    // inner padding in left panel
  const LEFT_W  = 50;   // left panel width
  const BADGE_H = 7;
  const BADGE_GAP = 3;
  const photoW  = LEFT_W - PAD * 2;         // 40 mm
  const photoH  = Math.round(photoW * 1.2); // 48 mm (portrait)
  const BODY_H  = PAD + photoH + BADGE_GAP + BADGE_H + PAD; // 5+48+3+7+5 = 68
  const W = 148;
  const H = HDR_H + BODY_H + FTR_H;         // 20+68+14 = 102 mm  ← exact fit

  // jsPDF format array = [width, height] in portrait coordinates;
  // with orientation:'landscape' the axes are flipped so pass [H, W]
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [H, W],
  });

  // ── Colours ──────────────────────────────────────────────────────────────
  const C = {
    blue:      [30,  64,  175],
    blueLight: [59,  130, 246],
    blueFaint: [239, 246, 255],
    blueBadge: [219, 234, 254],
    white:     [255, 255, 255],
    dark:      [15,  23,  42],
    mid:       [71,  85,  105],
    muted:     [148, 163, 184],
    line:      [226, 232, 240],
    bg:        [248, 250, 252],
    greenBg:   [209, 250, 229],
    greenFg:   [5,   150, 105],
    redBg:     [254, 226, 226],
    redFg:     [220, 38,  38],
    shadow:    [200, 210, 230],
  };

  // ── 1. White base ─────────────────────────────────────────────────────────
  doc.setFillColor(...C.white);
  doc.rect(0, 0, W, H, 'F');

  // ── 2. Header ────────────────────────────────────────────────────────────
  doc.setFillColor(...C.blue);
  doc.rect(0, 0, W, HDR_H, 'F');
  doc.setFillColor(...C.blueLight);
  doc.rect(0, HDR_H - 2.5, W, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...C.white);
  doc.text('CAMPUS FLOW', W / 2, 8.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(219, 234, 254);
  doc.text('Official Student Identity Card', W / 2, 14.5, { align: 'center' });

  // ── 3. Footer ────────────────────────────────────────────────────────────
  const FTR_Y = H - FTR_H;  // = 88
  doc.setFillColor(...C.bg);
  doc.rect(0, FTR_Y, W, FTR_H, 'F');
  doc.setFillColor(...C.blueLight);
  doc.rect(0, FTR_Y, W, 1.5, 'F');

  const yr = new Date().getFullYear();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(...C.mid);
  doc.text(
    `Issued: ${yr}   |   Academic Year ${yr}-${(yr + 1).toString().slice(-2)}   |   Campus Flow`,
    10, FTR_Y + 6
  );
  doc.setFontSize(4.8);
  doc.setTextColor(...C.muted);
  doc.text(
    'This card is the property of the institution. If found, please return to the college office.',
    10, FTR_Y + 10.5
  );

  doc.setFillColor(...(student.isActive ? C.greenBg : C.redBg));
  doc.roundedRect(W - 24, FTR_Y + 3.5, 16, 6.5, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...(student.isActive ? C.greenFg : C.redFg));
  doc.text(
    student.isActive ? 'ACTIVE' : 'INACTIVE',
    W - 16, FTR_Y + 8, { align: 'center' }
  );

  // ── 4. Left panel (light blue tint) ──────────────────────────────────────
  const BODY_Y = HDR_H;  // = 20
  doc.setFillColor(...C.blueFaint);
  doc.rect(0, BODY_Y, LEFT_W, BODY_H, 'F');

  // ── 5. Photo ─────────────────────────────────────────────────────────────
  const photoX = PAD;            // 5
  const photoY = BODY_Y + PAD;  // 25

  // Drop-shadow
  doc.setFillColor(...C.shadow);
  doc.roundedRect(photoX + 1, photoY + 1, photoW, photoH, 2, 2, 'F');

  const drawInitial = () => {
    doc.setFillColor(...C.blueBadge);
    doc.roundedRect(photoX, photoY, photoW, photoH, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...C.blue);
    doc.text(
      (student.name || 'S').charAt(0).toUpperCase(),
      photoX + photoW / 2,
      photoY + photoH / 2 + 4,
      { align: 'center' }
    );
  };

  if (student.profilePicture) {
    await new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        doc.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', photoX, photoY, photoW, photoH);
        resolve();
      };
      img.onerror = () => { drawInitial(); resolve(); };
      img.src = student.profilePicture;
    });
  } else {
    drawInitial();
  }

  // ── 6. Dept badge — immediately below photo ───────────────────────────────
  const dept   = student.department?.name || 'N/A';
  const badgeY = photoY + photoH + BADGE_GAP;  // 25+48+3 = 76
  doc.setFillColor(...C.blue);
  doc.roundedRect(photoX, badgeY, photoW, BADGE_H, 2, 2, 'F');  // 76→83
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...C.white);
  const deptStr = dept.length > 13 ? dept.slice(0, 13) : dept;
  doc.text(deptStr, photoX + photoW / 2, badgeY + 4.8, { align: 'center' });
  // badge bottom = 83, left panel bottom = BODY_Y+BODY_H = 20+68 = 88 ✓ (5mm pad)

  // ── 7. Right content column ───────────────────────────────────────────────
  const RX = LEFT_W + 6;       // 56
  const RW = W - RX - 6;       // 86
  let   ry = BODY_Y + 7;       // 27

  // Name
  const sname = student.name || 'N/A';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...C.dark);
  doc.text(sname.length > 24 ? sname.slice(0, 24) + '...' : sname, RX, ry);

  // Enrollment
  ry += 8;  // 35
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...C.muted);
  doc.text('Enrollment No.', RX, ry);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...C.dark);
  doc.text(student.enrollmentNum || 'N/A', RX + 27, ry);

  // Divider
  ry += 4;  // 39
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.3);
  doc.line(RX, ry, RX + RW, ry);
  ry += 6;  // 45

  // ── Info grid: 3 rows × 2 cols ────────────────────────────────────────────
  // Remaining body: BODY_Y+BODY_H - ry = 88 - 45 = 43mm → 3 rows = ~14mm each
  const col1 = RX;
  const col2 = RX + RW / 2 + 4;
  const rowH = 14;

  const grid = [
    ['Semester',  student.semesterID?.semesterName || 'N/A',  'Batch',       student.batch || 'N/A'],
    ['Gender',    student.gender || 'N/A',                    'Blood Group', student.bloodGroup || 'N/A'],
    ['Contact',   student.contactNumber || 'N/A',             'Category',    student.category || 'N/A'],
  ];

  grid.forEach(([l1, v1, l2, v2]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(...C.muted);
    doc.text(l1, col1, ry);
    doc.text(l2, col2, ry);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.dark);
    const sv1 = String(v1); doc.text(sv1.length > 17 ? sv1.slice(0, 17) : sv1, col1, ry + 5);
    const sv2 = String(v2); doc.text(sv2.length > 15 ? sv2.slice(0, 15) : sv2, col2, ry + 5);

    ry += rowH;
  });
  // Final ry = 45 + 3*14 = 87 — body ends at 88 ✓ perfect fit

  // ── Save ─────────────────────────────────────────────────────────────────
  const safeName = (student.name || 'student').replace(/\s+/g, '_');
  doc.save(`IDCard_${safeName}_${student.enrollmentNum || 'card'}.pdf`);
};

// ── ID Card Preview Modal ───────────────────────────────────────────────────
const IDCardModal = ({ student, onClose }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try { await downloadIDCardPDF(student); }
    catch (err) { console.error(err); alert('Download failed. Please try again.'); }
    finally { setDownloading(false); }
  };

  const yr   = new Date().getFullYear();
  const dept = student.department?.name || 'N/A';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">Student ID Card Preview</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>

        {/* Card Preview — matches PDF layout exactly */}
        <div className="p-6">
          <div className="rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-white">

            {/* Top header bar */}
            <div className="bg-blue-700 px-5 py-3 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-400 opacity-60" />
              <p className="text-white font-bold text-sm tracking-wide text-center">CAMPUS FLOW</p>
              <p className="text-blue-200 text-[10px] text-center mt-0.5">Official Student Identity Card</p>
            </div>

            {/* Card body — photo left, info right */}
            <div className="flex gap-0">
              {/* Photo column */}
              <div className="flex-shrink-0 w-28 bg-slate-50 border-r border-slate-100 flex flex-col items-center justify-start pt-4 pb-3 px-3">
                <div className="w-20 h-24 rounded-lg overflow-hidden border-2 border-slate-200 shadow-sm bg-blue-50 flex items-center justify-center">
                  {student.profilePicture ? (
                    <img src={student.profilePicture} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-blue-700 font-bold text-3xl">
                      {(student.name || 'S').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {/* Dept badge below photo */}
                <div className="mt-2 bg-blue-700 text-white text-[9px] font-bold px-2 py-0.5 rounded-full text-center w-full truncate">
                  {dept}
                </div>
              </div>

              {/* Info column */}
              <div className="flex-1 px-4 pt-3 pb-2 flex flex-col justify-between min-h-[140px]">
                <div>
                  {/* Name + enrollment */}
                  <p className="font-bold text-slate-900 text-base leading-tight truncate">{student.name || 'N/A'}</p>
                  <div className="flex items-center gap-2 mt-0.5 mb-2">
                    <span className="text-[10px] text-slate-400">Enrollment No.</span>
                    <span className="text-[10px] font-bold text-slate-700 font-mono">{student.enrollmentNum || 'N/A'}</span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100 mb-2" />

                  {/* Info grid — 2 columns */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {[
                      { label: 'Semester',    value: student.semesterID?.semesterName },
                      { label: 'Batch',       value: student.batch },
                      { label: 'Gender',      value: student.gender },
                      { label: 'Blood Group', value: student.bloodGroup },
                      { label: 'Contact',     value: student.contactNumber },
                      { label: 'Category',    value: student.category },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[9px] text-slate-400 leading-none">{label}</p>
                        <p className="text-[10px] font-semibold text-slate-800 leading-tight truncate">{value || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer strip */}
            <div className="bg-slate-50 border-t border-slate-100 px-4 py-2 flex items-center justify-between">
              <div>
                <p className="text-[9px] text-slate-400">
                  Issued: {yr} · Academic Year {yr}-{(yr + 1).toString().slice(-2)}
                </p>
                <p className="text-[8px] text-slate-300">Campus Flow · Official Document</p>
              </div>
              <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${
                student.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
              }`}>
                {student.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
            Close
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 active:scale-95"
          >
            {downloading
              ? <><Loader2 size={15} className="animate-spin" /> Generating...</>
              : <><Download size={15} /> Download ID Card</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════
const StudentList = ({ onEdit }) => {
  const [students, setStudents]         = useState([]);
  const [departments, setDepartments]   = useState([]);
  const [semesters, setSemesters]       = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading]     = useState(false);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem]   = useState('');
  const [selectedDiv, setSelectedDiv]   = useState('');
  const [searchTerm, setSearchTerm]     = useState('');
  const [viewStudent, setViewStudent]   = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [downloading, setDownloading] = useState({ pdf: false, excel: false, pdfAll: false, excelAll: false });
  // ID Card preview
  const [idCardStudent, setIdCardStudent] = useState(null);
  const limit = 60;

  const getSemesterNumber = (semesterName) => {
    if (!semesterName) return Infinity;
    const match = semesterName.match(/\d+/);
    return match ? parseInt(match[0]) : Infinity;
  };

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('authToken');
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [deptRes, semRes] = await Promise.all([
          axios.get('https://cms-backend-wl7u.onrender.com/api/departments', { headers }),
          axios.get('https://cms-backend-wl7u.onrender.com/api/semesters', { headers }),
        ]);
        if (deptRes.data.success) setDepartments(deptRes.data.data);
        if (semRes.data.success)  setSemesters(semRes.data.data);
      } catch { setError('Failed to load filters.'); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true); setError('');
      try {
        const token  = localStorage.getItem('authToken');
        const params = new URLSearchParams({
          page, limit,
          ...(selectedDept && { department: selectedDept }),
          ...(selectedSem  && { semester:   selectedSem   }),
          ...(selectedDiv  && { division:   selectedDiv   }),
          ...(searchTerm   && { search:     searchTerm    }),
        });
        const response = await axios.get(`https://cms-backend-wl7u.onrender.com/api/admin/students?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          const sorted = response.data.data.sort((a, b) => {
            const semA = getSemesterNumber(a.semesterID?.semesterName);
            const semB = getSemesterNumber(b.semesterID?.semesterName);
            if (semA !== semB) return semA - semB;
            return a.enrollmentNum.localeCompare(b.enrollmentNum);
          });
          setStudents(sorted);
          setTotalPages(response.data.pages);
          setTotalStudents(response.data.total || response.data.data.length);
        } else { setError('Failed to load students.'); }
      } catch (err) { setError(err.response?.data?.message || 'Error fetching students.'); }
      finally { setLoading(false); }
    })();
  }, [page, selectedDept, selectedSem, selectedDiv, searchTerm]);

  const getFilterLabel = (isAll) => {
    if (isAll) return 'All Students';
    const deptName = departments.find(d => d._id === selectedDept)?.name;
    const semName  = semesters.find(s => s._id === selectedSem)?.semesterName;
    const parts = [];
    if (deptName) parts.push(deptName);
    if (selectedSem === 'completed') parts.push('Alumni (Completed)');
    else if (semName) parts.push(semName);
    if (selectedDiv) parts.push(`Div ${selectedDiv}`);
    if (searchTerm) parts.push(`Search: "${searchTerm}"`);
    if (deptName)   parts.push(deptName);
    if (semName)    parts.push(semName);
    if (searchTerm) parts.push(`Search:${searchTerm}`);
    return parts.length ? parts.join(' | ') : 'All Students';
  };

  const handleDownload = async (type, isAll) => {
    const key = `${type}${isAll ? 'All' : ''}`;
    setDownloading(prev => ({ ...prev, [key]: true }));
    try {
      const activeFilters = isAll
        ? { department: '', semester: '', search: '' }
        : { department: selectedDept, semester: selectedSem, search: searchTerm };
      const label = getFilterLabel(isAll);
      if (type === 'pdf') await downloadStudentPDF(activeFilters, label);
      else                await downloadStudentExcel(activeFilters, label, departments, semesters);
    } catch (err) { console.error('Download error:', err); alert('Download failed. Please try again.'); }
    finally { setDownloading(prev => ({ ...prev, [key]: false })); }
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`https://cms-backend-wl7u.onrender.com/api/admin/students/${studentToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(prev => prev.filter(s => s._id !== studentToDelete._id));
      setShowDeleteModal(false); setStudentToDelete(null);
    } catch (err) { setError(err.response?.data?.message || 'Failed to delete student.'); }
    finally { setDeleteLoading(false); }
  };

  const DlBtn = ({ type, isAll, label }) => {
    const key = `${type}${isAll ? 'All' : ''}`;
    const busy = downloading[key];
    const isPDF = type === 'pdf';
    return (
      <button onClick={() => handleDownload(type, isAll)} disabled={busy}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
          isPDF
            ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
        }`}>
        {busy ? <Loader2 size={13} className="animate-spin" /> : isPDF ? <FileText size={13} /> : <FileSpreadsheet size={13} />}
        {busy ? 'Generating...' : label}
      </button>
    );
  };

  const selectClass = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

  return (
    <div className="space-y-5">

      {/* Filters + Download Panel */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <select 
              value={selectedDept} 
              onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }} 
              className={`${selectClass} sm:w-44`}
              disabled={JSON.parse(localStorage.getItem('adminData'))?.role === 'DepartmentAdmin'}
            >
              {JSON.parse(localStorage.getItem('adminData'))?.role === 'DepartmentAdmin' ? (
                <option value={JSON.parse(localStorage.getItem('adminData'))?.department?._id || JSON.parse(localStorage.getItem('adminData'))?.department || ''}>
                  {departments.find(d => d._id === (JSON.parse(localStorage.getItem('adminData'))?.department?._id || JSON.parse(localStorage.getItem('adminData'))?.department))?.name || 'Your Department'}
                </option>
              ) : (
                <>
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </>
              )}
            </select>
            <select value={selectedSem} onChange={(e) => { setSelectedSem(e.target.value); setPage(1); }} className={`${selectClass} sm:w-44`}>
              <option value="">All Semesters</option>
              {semesters.filter(s => {
                if (!selectedDept) return true;
                const dept = departments.find(d => d._id === selectedDept);
                if (!dept) return true;
                const isMaster = ['MCA', 'MBA', 'MCOM'].some(m => dept.name.toUpperCase().includes(m));
                if (isMaster) {
                  const num = parseInt(s.semesterName.replace('Semester ', ''), 10);
                  return num <= 4;
                }
                return true;
              }).map(s => <option key={s._id} value={s._id}>{s.semesterName}</option>)}
              <option value="completed" className="font-semibold text-emerald-600">Completed / Alumni</option>
            </select>
            <select value={selectedDiv} onChange={(e) => { setSelectedDiv(e.target.value); setPage(1); }} className={`${selectClass} sm:w-32`}>
              <option value="">All Divs</option>
              <option value="A">Div A</option>
              <option value="B">Div B</option>
              <option value="C">Div C</option>
            </select>
            <form onSubmit={(e) => { e.preventDefault(); setPage(1); }} className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search by name, enrollment, email..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition">
                Search
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex flex-col gap-3 lg:min-w-[240px]">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
            <Download size={13} /> Download Report
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1.5">Current filter: <span className="font-semibold text-slate-600">{getFilterLabel(false)}</span></p>
            <div className="flex gap-2">
              <DlBtn type="pdf" isAll={false} label="PDF" />
              <DlBtn type="excel" isAll={false} label="Excel" />
            </div>
          </div>
          <div className="border-t border-slate-100" />
          <div>
            <p className="text-xs text-slate-400 mb-1.5">Full report — all students</p>
            <div className="flex gap-2">
              <DlBtn type="pdf" isAll={true} label="PDF (All)" />
              <DlBtn type="excel" isAll={true} label="Excel (All)" />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center py-16 gap-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 text-sm">Loading students...</span>
        </div>
      )}

      {!loading && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Enrollment No.</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Name</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap hidden md:table-cell">Email</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap hidden sm:table-cell">Department</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap hidden sm:table-cell">Semester</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users size={20} className="text-slate-400" />
                      </div>
                      <p className="text-slate-500 text-sm font-medium">No students found</p>
                    </td>
                  </tr>
                ) : students.map((s, idx) => {
                  const isGraduated = !s.isActive && (
                    (s.semesterID?.semesterName === 'Semester 6' && ['BCA', 'BBA', 'BCOM'].some(d => s.department?.name?.toUpperCase().includes(d))) ||
                    (s.semesterID?.semesterName === 'Semester 4' && ['MCA', 'MBA', 'MCOM'].some(d => s.department?.name?.toUpperCase().includes(d)))
                  );

                  return (
                  <tr key={s._id} className={`hover:bg-blue-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} ${!s.isActive && !isGraduated ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{s.enrollmentNum}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-slate-800">{s.name} {isGraduated && <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Alumni</span>}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-500 hidden md:table-cell">{s.email}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-500 hidden sm:table-cell">{s.department?.name || 'N/A'}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap hidden sm:table-cell">
                      {isGraduated ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md uppercase tracking-wide flex items-center inline-flex gap-1"><CheckCircle size={12}/> Completed</span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{s.semesterID?.semesterName || 'N/A'}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => { setViewStudent(s); setShowViewModal(true); }}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition" title="View">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => onEdit?.(s)}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition" title="Edit">
                          <Pencil size={15} />
                        </button>
                        {/* ID Card button — opens preview modal first */}
                        <button
                          onClick={() => setIdCardStudent(s)}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
                          title="Generate ID Card"
                        >
                          <CreditCard size={15} />
                        </button>
                        <button onClick={() => { setStudentToDelete(s); setShowDeleteModal(true); }}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 flex-wrap gap-3">
              <p className="text-sm text-slate-500">
                Page <span className="font-semibold text-slate-700">{page}</span> of{' '}
                <span className="font-semibold text-slate-700">{totalPages}</span>
                {' '}· <span className="font-semibold text-slate-700">{totalStudents}</span> total
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  <ChevronLeft size={15} /> Prev
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && studentToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-800 mb-2">Delete Student</h3>
            <p className="text-slate-600 text-sm mb-5">
              Delete <span className="font-semibold">{studentToDelete.name}</span> ({studentToDelete.enrollmentNum})? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewStudent && (
        <StudentViewModal student={viewStudent} onClose={() => setShowViewModal(false)} />
      )}

      {/* ID Card Preview Modal */}
      {idCardStudent && (
        <IDCardModal student={idCardStudent} onClose={() => setIdCardStudent(null)} />
      )}
    </div>
  );
};

export default StudentList;
