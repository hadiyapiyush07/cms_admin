import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Search, ChevronLeft, ChevronRight,
  IndianRupee, TrendingUp, AlertCircle, Users,
  FileText, FileSpreadsheet, Download, Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ─── Install these two packages if not already installed ───────────────────
// npm install jspdf jspdf-autotable xlsx
// ──────────────────────────────────────────────────────────────────────────

const MAX_SEMESTERS = 6;

// Format paise → ₹ string (for UI)
const fmt = (paise) =>
  `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// Format paise → Rs. string (for PDF — jsPDF can't render ₹ symbol)
const pdfFmt = (paise) =>
  `Rs.${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// ── Fetch ALL students (no pagination) for reports ────────────────────────
const fetchAllStudentsForReport = async (filters) => {
  const token  = localStorage.getItem('authToken');
  const params = new URLSearchParams({
    page: 1, limit: 10000, // large limit to get all
    ...(filters.department && { department: filters.department }),
    ...(filters.semester   && { semester:   filters.semester   }),
    ...(filters.search     && { search:     filters.search     }),
  });
  const res = await axios.get(
    `http://localhost:5000/api/fees/admin/semester-wise?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.success ? res.data.data : [];
};

// ── Build flat row data from students array ────────────────────────────────
const buildRows = (students, formatter = fmt) =>
  students.map(student => {
    const currentSem = parseInt(student.currentSemesterName?.split(' ')[1] || 0);
    let totalPaid = 0, totalDue = 0;
    const semCols = {};
    for (let i = 1; i <= MAX_SEMESTERS; i++) {
      if (i <= currentSem) {
        const sd  = student.semesters.find(s => s.semester === i);
        const amt = sd?.amount || 100;
        if (sd?.paid) { semCols[`Sem ${i}`] = 'Paid'; totalPaid += amt; }
        else          { semCols[`Sem ${i}`] = 'Due';  totalDue  += amt; }
      } else {
        semCols[`Sem ${i}`] = '-';
      }
    }
    return {
      'Enrollment No.': student.enrollmentNum,
      'Student Name':   student.name,
      'Department':     student.department?.name || 'N/A',
      'Current Sem':    student.currentSemesterName,
      ...semCols,
      'Total Paid':  formatter(totalPaid),
      'Total Due':   totalDue > 0 ? formatter(totalDue) : '-',
    };
  });

// ── Download Excel (.xlsx) ─────────────────────────────────────────────────
const downloadExcel = async (filters, summary, label, departments, semesters) => {
  // Uses XLSX statically imported at top of file

  const students = await fetchAllStudentsForReport(filters);
  const rows     = buildRows(students);

  const wb = XLSX.utils.book_new();

  // Sheet 1: Student Fee Status
  const ws1 = XLSX.utils.json_to_sheet(rows);
  ws1['!cols'] = [
    { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 14 },
    ...Array(MAX_SEMESTERS).fill({ wch: 10 }),
    { wch: 14 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Fee Status');

  // Sheet 2: Summary
  const summaryRows = [
    ['FEE REPORT SUMMARY', ''],
    ['Generated On', new Date().toLocaleString('en-IN')],
    ['Filter Applied', label],
    ['', ''],
    ['Total Students', summary.totalStudents],
    ['Total Collected', fmt(summary.totalCollected)],
    ['Total Pending',   fmt(summary.totalPending)],
    ['Grand Total',     fmt(summary.totalCollected + summary.totalPending)],
    ['', ''],
    ['SEMESTER-WISE BREAKDOWN', ''],
    ['Semester', 'Collected', 'Pending', '% Paid'],
    ...(summary.semesterWise || []).map(s => {
      const total = s.collected + s.pending;
      const pct   = total > 0 ? Math.round((s.collected / total) * 100) : 0;
      return [`Semester ${s.semester}`, fmt(s.collected), fmt(s.pending), `${pct}%`];
    }),
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(summaryRows);
  ws2['!cols'] = [{ wch: 26 }, { wch: 18 }, { wch: 18 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Summary');

  // ── Browser-safe download (works in Vite/React) ──
  const wbOut   = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob    = new Blob([wbOut], { type: 'application/octet-stream' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = url;
  a.download    = `FeeReport_${label.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ── Download PDF ───────────────────────────────────────────────────────────
const downloadPDF = async (filters, summary, label) => {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const students = await fetchAllStudentsForReport(filters);
  const rows     = buildRows(students, pdfFmt);
  const doc      = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const generatedOn = new Date().toLocaleString('en-IN');
  const pageW       = doc.internal.pageSize.getWidth();

  // ── Header banner ──
  doc.setFillColor(30, 64, 175); // blue-700
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CAMPUS FLOW — Fee Status Report', pageW / 2, 10, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Filter: ${label}   |   Generated: ${generatedOn}`, pageW / 2, 17, { align: 'center' });

  // ── Summary boxes ──
  doc.setTextColor(30, 41, 59); // slate-800
  const boxY = 26;
  const boxes = [
    { label: 'Total Students',   value: String(summary.totalStudents),                    color: [219, 234, 254] },
    { label: 'Total Collected',  value: pdfFmt(summary.totalCollected),                   color: [209, 250, 229] },
    { label: 'Total Pending',    value: pdfFmt(summary.totalPending),                     color: [254, 226, 226] },
    { label: 'Grand Total',      value: pdfFmt(summary.totalCollected + summary.totalPending), color: [224, 231, 255] },
  ];
  const boxW = (pageW - 20) / 4;
  boxes.forEach((b, i) => {
    const x = 10 + i * (boxW + 2);
    doc.setFillColor(...b.color);
    doc.roundedRect(x, boxY, boxW, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(b.label, x + boxW / 2, boxY + 5, { align: 'center' });
    doc.setFontSize(10);
    doc.text(b.value, x + boxW / 2, boxY + 11, { align: 'center' });
  });

  // ── Semester-wise summary ──
  const semY = boxY + 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('SEMESTER-WISE:', 10, semY + 4);
  (summary.semesterWise || []).forEach((s, i) => {
    const total = s.collected + s.pending;
    const pct   = total > 0 ? Math.round((s.collected / total) * 100) : 0;
    const x     = 50 + i * 40;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(`Sem ${s.semester}`, x, semY + 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(5, 150, 105);
    doc.text(pdfFmt(s.collected), x, semY + 6);
    doc.setTextColor(220, 38, 38);
    doc.text(`${pdfFmt(s.pending)} due`, x, semY + 10);
    doc.setTextColor(100, 116, 139);
    doc.text(`${pct}% paid`, x, semY + 14);
  });

  // ── Main table ──
  const tableStartY = semY + 18;
  const columns     = Object.keys(rows[0] || {});
  const tableRows   = rows.map(r => columns.map(c => r[c]));

  autoTable(doc, {
    startY: tableStartY,
    head:   [columns],
    body:   tableRows,
    styles: { fontSize: 6.5, cellPadding: 1.5 },
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: 255,
      fontStyle: 'bold',
      fontSize:  7,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 28 },
      2: { cellWidth: 22 },
      3: { cellWidth: 18 },
    },
    didDrawCell: (data) => {
      // Colour Paid/Due cells — plain text only (jsPDF can't render ✓ ✗)
      if (data.section === 'body' && data.column.index >= 4 && data.column.index <= 9) {
        const val = data.cell.raw;
        if (val === 'Paid') {
          doc.setFillColor(209, 250, 229);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          doc.setTextColor(5, 150, 105);
          doc.setFontSize(6.5);
          doc.text('Paid', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' });
        } else if (val === 'Due') {
          doc.setFillColor(254, 226, 226);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          doc.setTextColor(220, 38, 38);
          doc.setFontSize(6.5);
          doc.text('Due', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' });
        }
      }
    },
    // Footer row with totals
    foot: [[
      `TOTAL (${students.length} students)`, '', '', '',
      ...Array(MAX_SEMESTERS).fill(''),
      pdfFmt(summary.totalCollected),
      pdfFmt(summary.totalPending),
    ]],
    footStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
      fontStyle: 'bold',
      fontSize:  7,
    },
  });

  // ── Page numbers ──
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${i} of ${totalPages}  |  Campus Flow — Confidential`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 5,
      { align: 'center' }
    );
  }

  const fileName = `FeeReport_${label.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// ══════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════

const AdminFees = () => {
  const navigate = useNavigate();
  const [students, setStudents]       = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  const [summary, setSummary] = useState({
    totalStudents: 0, totalCollected: 0, totalPending: 0, semesterWise: [],
  });
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [filters, setFilters]         = useState({ department: '', semester: '', search: '' });
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination]   = useState({ page: 1, total: 0, pages: 0 });

  // Download states
  const [downloading, setDownloading] = useState({ pdf: false, excel: false, pdfAll: false, excelAll: false });

  const searchDebounce  = useRef(null);
  const filterDebounce  = useRef(null);
  const summaryDebounce = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role  = localStorage.getItem('userRole');
    if (!token || role !== 'admin') navigate('/admin/signin');
  }, [navigate]);

  useEffect(() => { fetchDepartmentsSemesters(); }, []);

  useEffect(() => {
    if (filterDebounce.current) clearTimeout(filterDebounce.current);
    filterDebounce.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
    }, 300);
    return () => clearTimeout(filterDebounce.current);
  }, [searchInput]);

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => { fetchStudents(); }, 300);
    return () => clearTimeout(searchDebounce.current);
  }, [filters, pagination.page]);

  useEffect(() => {
    if (summaryDebounce.current) clearTimeout(summaryDebounce.current);
    summaryDebounce.current = setTimeout(() => { fetchSummary(); }, 350);
    return () => clearTimeout(summaryDebounce.current);
  }, [filters]);

  const fetchDepartmentsSemesters = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const [deptRes, semRes] = await Promise.all([
        axios.get('http://localhost:5000/api/departments', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/semesters',   { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (deptRes.data.success) {
        let fetchedDepts = deptRes.data.data;
        const userStr = localStorage.getItem('adminData');
        const user = userStr ? JSON.parse(userStr) : null;
        
        if (user?.role === 'DepartmentAdmin' && user?.department) {
           const deptId = typeof user.department === 'string' ? user.department : user.department._id;
           fetchedDepts = fetchedDepts.filter(d => d._id === deptId);
           setFilters(prev => ({ ...prev, department: deptId, page: 1 }));
        }
        setDepartments(fetchedDepts);
      }
      if (semRes.data.success)  setSemesters(semRes.data.data);
    } catch (err) { console.error(err); }
  };

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const token  = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        ...(filters.department && { department: filters.department }),
        ...(filters.semester   && { semester:   filters.semester   }),
        ...(filters.search     && { search:     filters.search     }),
      });
      const res = await axios.get(`http://localhost:5000/api/fees/admin/summary?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setSummary(res.data);
    } catch (err) { console.error('Summary fetch error:', err); }
    finally { setSummaryLoading(false); }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token  = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: pagination.page, limit: 10,
        ...(filters.department && { department: filters.department }),
        ...(filters.semester   && { semester:   filters.semester   }),
        ...(filters.search     && { search:     filters.search     }),
      });
      const res = await axios.get(`http://localhost:5000/api/fees/admin/semester-wise?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setStudents(res.data.data);
        setPagination({ page: res.data.page, total: res.data.total, pages: res.data.pages });
      } else { setError(res.data.message); }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch fee information');
    } finally { setLoading(false); }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (filterDebounce.current) clearTimeout(filterDebounce.current);
    setFilters(prev => ({ ...prev, search: searchInput }));
  };

  // ── Compute current filter label for file name / report ──────────────────
  const getFilterLabel = (filterOverride) => {
    const f = filterOverride || filters;
    const deptName = departments.find(d => d._id === f.department)?.name;
    const semName  = semesters.find(s => s._id === f.semester)?.semesterName;
    const parts    = [];
    if (deptName) parts.push(deptName);
    if (semName)  parts.push(semName);
    if (f.search) parts.push(`Enrollment:${f.search}`);
    return parts.length ? parts.join(' | ') : 'All Students';
  };

  // ── Handle download with loading state ───────────────────────────────────
  const handleDownload = async (type, isAll) => {
    const key = `${type}${isAll ? 'All' : ''}`;
    setDownloading(prev => ({ ...prev, [key]: true }));
    try {
      const activeFilters = isAll ? { department: '', semester: '', search: '' } : filters;
      const label         = isAll ? 'All Students' : getFilterLabel();

      // Fetch summary for all-students report
      let reportSummary = summary;
      if (isAll) {
        const token = localStorage.getItem('authToken');
        const res   = await axios.get('http://localhost:5000/api/fees/admin/summary', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) reportSummary = res.data;
      }

      if (type === 'pdf') {
        await downloadPDF(activeFilters, reportSummary, label);
      } else {
        await downloadExcel(activeFilters, reportSummary, label, departments, semesters);
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(prev => ({ ...prev, [key]: false }));
    }
  };

  const semWise = summary.semesterWise.length
    ? summary.semesterWise
    : Array.from({ length: MAX_SEMESTERS }, (_, i) => ({ semester: i + 1, collected: 0, pending: 0 }));

  if (loading && students.length === 0) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium text-sm">Loading fee data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
        <AlertCircle size={20} /><span className="font-medium">{error}</span>
      </div>
    </div>
  );

  // ── Download button component ─────────────────────────────────────────────
  const DlBtn = ({ type, isAll, label }) => {
    const key      = `${type}${isAll ? 'All' : ''}`;
    const busy     = downloading[key];
    const isPDF    = type === 'pdf';
    return (
      <button
        onClick={() => handleDownload(type, isAll)}
        disabled={busy || summaryLoading}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
          isPDF
            ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
        }`}
      >
        {busy
          ? <Loader2 size={13} className="animate-spin" />
          : isPDF ? <FileText size={13} /> : <FileSpreadsheet size={13} />}
        {busy ? 'Generating…' : label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Fee Management</h1>
          <p className="text-slate-500 mt-1 text-sm">Track semester-wise fee collection and pending dues</p>
        </div>

        {/* ── Download Panel ── */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex flex-col gap-3 min-w-[260px]">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
            <Download size={13} /> Download Report
          </div>

          {/* Filtered report */}
          <div>
            <p className="text-xs text-slate-400 mb-1.5">
              Current filter: <span className="font-semibold text-slate-600">{getFilterLabel()}</span>
            </p>
            <div className="flex gap-2">
              <DlBtn type="pdf"   isAll={false} label="PDF" />
              <DlBtn type="excel" isAll={false} label="Excel" />
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Full report */}
          <div>
            <p className="text-xs text-slate-400 mb-1.5">Full report — all students</p>
            <div className="flex gap-2">
              <DlBtn type="pdf"   isAll={true} label="PDF (All)" />
              <DlBtn type="excel" isAll={true} label="Excel (All)" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Users size={22} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Students</p>
            {summaryLoading
              ? <div className="h-7 w-16 bg-slate-100 rounded animate-pulse mt-1" />
              : <p className="text-2xl font-bold text-slate-800 mt-0.5">{summary.totalStudents}</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={22} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Collected</p>
            {summaryLoading
              ? <div className="h-7 w-24 bg-slate-100 rounded animate-pulse mt-1" />
              : <p className="text-2xl font-bold text-emerald-700 mt-0.5">{fmt(summary.totalCollected)}</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={22} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Pending</p>
            {summaryLoading
              ? <div className="h-7 w-24 bg-slate-100 rounded animate-pulse mt-1" />
              : <p className="text-2xl font-bold text-red-600 mt-0.5">{fmt(summary.totalPending)}</p>}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <IndianRupee size={22} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-100 uppercase tracking-wide">Grand Total</p>
            {summaryLoading
              ? <div className="h-7 w-24 bg-white/20 rounded animate-pulse mt-1" />
              : <p className="text-2xl font-bold text-white mt-0.5">
                  {fmt(summary.totalCollected + summary.totalPending)}
                </p>}
          </div>
        </div>
      </div>

      {/* ── Semester-wise Bar ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
            Semester-wise Collection — All Students
          </h2>
          {summaryLoading && <span className="text-xs text-slate-400 animate-pulse">Updating…</span>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {semWise.map((sem) => {
            const total = sem.collected + sem.pending;
            const pct   = total > 0 ? Math.round((sem.collected / total) * 100) : 0;
            return (
              <div key={sem.semester} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 mb-2">SEM {sem.semester}</p>
                <div className="w-full h-1.5 bg-slate-200 rounded-full mb-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: summaryLoading ? '0%' : `${pct}%` }}
                  />
                </div>
                <p className="text-xs font-semibold text-emerald-700">{fmt(sem.collected)}</p>
                <p className="text-xs text-red-500">{fmt(sem.pending)} due</p>
                <p className="text-xs text-slate-400 mt-0.5">{pct}% paid</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Department</label>
            <select
              name="department" value={filters.department} onChange={handleFilterChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              disabled={JSON.parse(localStorage.getItem('adminData'))?.role === 'DepartmentAdmin'}
            >
              {JSON.parse(localStorage.getItem('adminData'))?.role === 'DepartmentAdmin' ? (
                <option value={JSON.parse(localStorage.getItem('adminData'))?.department?._id || JSON.parse(localStorage.getItem('adminData'))?.department || ''}>
                  {departments.find(d => d._id === (JSON.parse(localStorage.getItem('adminData'))?.department?._id || JSON.parse(localStorage.getItem('adminData'))?.department))?.name || 'Your Department'}
                </option>
              ) : (
                <>
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Current Semester</label>
            <select
              name="semester" value={filters.semester} onChange={handleFilterChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="">All Semesters</option>
              {semesters.map(sem => (
                <option key={sem._id} value={sem._id}>{sem.semesterName}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Search Student</label>
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text" placeholder="Enrollment number..." value={searchInput}
                onChange={handleSearchChange}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <button type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors flex items-center">
                <Search size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      {students.length === 0 && !loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No students found</p>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Enrollment No.</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Student Name</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Department</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Curr. Sem</th>
                    {[...Array(MAX_SEMESTERS)].map((_, i) => (
                      <th key={i} className="px-4 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        Sem {i + 1}
                      </th>
                    ))}
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-emerald-600 uppercase tracking-wide whitespace-nowrap">Paid</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-red-500 uppercase tracking-wide whitespace-nowrap">Due</th>
                  </tr>
                </thead>

                <tbody className={`divide-y divide-slate-50 transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
                  {students.map((student, rowIdx) => {
                    const currentSem = parseInt(student.currentSemesterName?.split(' ')[1] || 0);
                    let studentTotalPaid = 0, studentTotalDue = 0;
                    for (let i = 0; i < MAX_SEMESTERS; i++) {
                      if (i + 1 <= currentSem) {
                        const semData = student.semesters.find(s => s.semester === i + 1);
                        const amount  = semData?.amount || 100;
                        if (semData?.paid) studentTotalPaid += amount;
                        else              studentTotalDue  += amount;
                      }
                    }
                    return (
                      <tr key={student._id}
                        className={`hover:bg-blue-50/40 transition-colors ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {student.enrollmentNum}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{student.name}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500">{student.department?.name || 'N/A'}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                            {student.currentSemesterName}
                          </span>
                        </td>
                        {[...Array(MAX_SEMESTERS)].map((_, idx) => {
                          const semData  = student.semesters.find(s => s.semester === idx + 1);
                          const isPaid   = semData?.paid || false;
                          const amount   = semData?.amount || 100;
                          const isActive = idx + 1 <= currentSem;
                          return (
                            <td key={idx} className="px-4 py-4 text-center whitespace-nowrap">
                              {isActive ? (
                                <span
                                  title={isPaid ? `Paid: ${fmt(amount)}` : `Pending: ${fmt(amount)}`}
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold cursor-default ${
                                    isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                                  }`}>
                                  {isPaid ? '✓ Paid' : '✗ Due'}
                                </span>
                              ) : (
                                <span className="text-slate-200 text-xs select-none">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <span className="text-sm font-semibold text-emerald-700">{fmt(studentTotalPaid)}</span>
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <span className={`text-sm font-semibold ${studentTotalDue > 0 ? 'text-red-600' : 'text-slate-300'}`}>
                            {studentTotalDue > 0 ? fmt(studentTotalDue) : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {students.length > 0 && (() => {
                  const pageColTotals = [...Array(MAX_SEMESTERS)].map((_, i) => {
                    let paid = 0, due = 0;
                    students.forEach(s => {
                      const cs = parseInt(s.currentSemesterName?.split(' ')[1] || 0);
                      if (i + 1 <= cs) {
                        const f = s.semesters.find(x => x.semester === i + 1);
                        const amt = f?.amount || 100;
                        if (f?.paid) paid += amt; else due += amt;
                      }
                    });
                    return { paid, due };
                  });
                  const pageTotalPaid = pageColTotals.reduce((a, c) => a + c.paid, 0);
                  const pageTotalDue  = pageColTotals.reduce((a, c) => a + c.due,  0);
                  return (
                    <tfoot>
                      <tr className="bg-slate-800 text-white">
                        <td colSpan={4} className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-300">
                          This Page ({students.length} students)
                        </td>
                        {pageColTotals.map((col, i) => (
                          <td key={i} className="px-4 py-3.5 text-center">
                            <div className="text-xs font-semibold text-emerald-400">{fmt(col.paid)}</div>
                            <div className="text-xs text-red-400">{fmt(col.due)}</div>
                          </td>
                        ))}
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-sm font-bold text-emerald-400">{fmt(pageTotalPaid)}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-sm font-bold text-red-400">{fmt(pageTotalDue)}</span>
                        </td>
                      </tr>
                    </tfoot>
                  );
                })()}
              </table>
            </div>
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 flex-wrap gap-3">
              <p className="text-sm text-slate-500">
                Showing page <span className="font-semibold text-slate-700">{pagination.page}</span>
                {' '}of <span className="font-semibold text-slate-700">{pagination.pages}</span>
                {' '}· <span className="font-semibold text-slate-700">{summary.totalStudents || pagination.total}</span> students total
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminFees;