// src/cms_admin/components/ProfessorList.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import ProfessorViewModal from './ProfessorViewModal';
import {
  Search, ChevronLeft, ChevronRight, Eye, Pencil, Trash2,
  AlertCircle, GraduationCap, Download, FileText, FileSpreadsheet, Loader2
} from 'lucide-react';

// ── Fetch ALL professors (no pagination) for reports ───────────────────────
const fetchAllProfessorsForReport = async (filters) => {
  const token  = localStorage.getItem('authToken');
  const params = new URLSearchParams({
    page: 1, limit: 10000,
    ...(filters.department && { department: filters.department }),
    ...(filters.search     && { search:     filters.search     }),
  });
  const res = await axios.get(`http://localhost:5000/api/professor?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.success ? res.data.data : [];
};

// ── Build flat row ──────────────────────────────────────────────────────────
const buildProfessorRows = (professors) =>
  professors.map(p => ({
    'Name':           p.name,
    'Email':          p.email,
    'Contact':        p.contactNumber,
    'Department':     p.department?.name || 'N/A',
    'Qualification':  p.qualification   || 'N/A',
    'Specialization': p.specialization  || 'N/A',
    'Experience (yrs)': p.experience    || 0,
    'Joining Date':   p.joiningDate ? new Date(p.joiningDate).toLocaleDateString('en-IN') : 'N/A',
    'Subjects':       p.coursesTaught?.length || 0,
    'Status':         p.isActive ? 'Active' : 'Inactive',
  }));

// ── Download Excel ──────────────────────────────────────────────────────────
const downloadProfessorExcel = async (filters, label, departments) => {
  const professors = await fetchAllProfessorsForReport(filters);
  const rows       = buildProfessorRows(professors);

  const wb  = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(rows);
  ws1['!cols'] = [
    { wch: 22 }, { wch: 28 }, { wch: 14 }, { wch: 16 },
    { wch: 16 }, { wch: 22 }, { wch: 16 }, { wch: 16 },
    { wch: 10 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Professors');

  const deptName = departments.find(d => d._id === filters.department)?.name || 'All';
  const summaryRows = [
    ['PROFESSOR REPORT SUMMARY', ''],
    ['Generated On',   new Date().toLocaleString('en-IN')],
    ['Filter Applied', label],
    ['Department',     deptName],
    ['', ''],
    ['Total Professors', professors.length],
    ['Active',           professors.filter(p => p.isActive).length],
    ['Inactive',         professors.filter(p => !p.isActive).length],
    ['Avg Experience',   professors.length
      ? (professors.reduce((sum, p) => sum + (p.experience || 0), 0) / professors.length).toFixed(1) + ' yrs'
      : 'N/A'],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(summaryRows);
  ws2['!cols'] = [{ wch: 22 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Summary');

  // Browser-safe download
  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob  = new Blob([wbOut], { type: 'application/octet-stream' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href      = url;
  a.download  = `Professors_${label.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
};

// ── Download PDF ────────────────────────────────────────────────────────────
const downloadProfessorPDF = async (filters, label) => {
  const { default: jsPDF }     = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const professors = await fetchAllProfessorsForReport(filters);
  const rows       = buildProfessorRows(professors);
  const doc        = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW      = doc.internal.pageSize.getWidth();

  // Header banner
  doc.setFillColor(88, 28, 135); // purple-900
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('CAMPUS FLOW — Professor Report', pageW / 2, 10, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Filter: ${label}   |   Generated: ${new Date().toLocaleString('en-IN')}   |   Total: ${professors.length} professors`, pageW / 2, 17, { align: 'center' });

  // Summary boxes
  const avgExp = professors.length
    ? (professors.reduce((sum, p) => sum + (p.experience || 0), 0) / professors.length).toFixed(1)
    : '0';

  const boxY = 26;
  const boxes = [
    { label: 'Total Professors', value: String(professors.length),                           color: [237, 233, 254] },
    { label: 'Active',           value: String(professors.filter(p => p.isActive).length),   color: [209, 250, 229] },
    { label: 'Inactive',         value: String(professors.filter(p => !p.isActive).length),  color: [254, 226, 226] },
    { label: 'Avg Experience',   value: `${avgExp} yrs`,                                     color: [224, 231, 255] },
  ];
  const boxW = (pageW - 20) / 4;
  boxes.forEach((b, i) => {
    const x = 10 + i * (boxW + 2);
    doc.setFillColor(...b.color);
    doc.roundedRect(x, boxY, boxW, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(b.label, x + boxW / 2, boxY + 5, { align: 'center' });
    doc.setFontSize(11);
    doc.text(b.value, x + boxW / 2, boxY + 11, { align: 'center' });
  });

  // Table
  const columns   = Object.keys(rows[0] || {});
  const tableRows = rows.map(r => columns.map(c => r[c]));

  autoTable(doc, {
    startY:     boxY + 18,
    head:       [columns],
    body:       tableRows,
    styles:     { fontSize: 6.5, cellPadding: 1.5 },
    headStyles: { fillColor: [88, 28, 135], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 9) {
        const val = data.cell.raw;
        if (val === 'Active') {
          doc.setFillColor(209, 250, 229);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          doc.setTextColor(5, 150, 105); doc.setFontSize(6.5);
          doc.text('Active', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' });
        } else if (val === 'Inactive') {
          doc.setFillColor(254, 226, 226);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          doc.setTextColor(220, 38, 38); doc.setFontSize(6.5);
          doc.text('Inactive', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' });
        }
      }
    },
    foot: [[`TOTAL: ${professors.length} professors`, '', '', '', '', '', '', '', '', '']],
    footStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 7 },
  });

  // Page numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${totalPages}  |  Campus Flow — Confidential`, pageW / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
  }

  doc.save(`Professors_${label.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// ══════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════
const ProfessorList = ({ onEdit }) => {
  const [professors, setProfessors]   = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [showDeleteModal, setShowDeleteModal]     = useState(false);
  const [professorToDelete, setProfessorToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading]         = useState(false);
  const [selectedDept, setSelectedDept] = useState('');
  const [searchTerm, setSearchTerm]     = useState('');
  const [viewProfessor, setViewProfessor]   = useState(null);
  const [showViewModal, setShowViewModal]   = useState(false);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProfessors, setTotalProfessors] = useState(0);
  const [downloading, setDownloading] = useState({ pdf: false, excel: false, pdfAll: false, excelAll: false });
  const limit = 10;

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('authToken');
      try {
        const res = await axios.get('http://localhost:5000/api/departments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) setDepartments(res.data.data);
        else if (Array.isArray(res.data)) setDepartments(res.data);
      } catch { setError('Failed to load departments.'); }
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
          ...(searchTerm   && { search:     searchTerm   }),
        });
        const response = await axios.get(`http://localhost:5000/api/professor?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setProfessors(response.data.data);
          setTotalPages(response.data.pages);
          setTotalProfessors(response.data.total || response.data.data.length);
        } else { setError('Failed to load professors.'); }
      } catch (err) { setError(err.response?.data?.message || 'Error fetching professors.'); }
      finally { setLoading(false); }
    })();
  }, [page, selectedDept, searchTerm]);

  const getFilterLabel = (isAll) => {
    if (isAll) return 'All Professors';
    const deptName = departments.find(d => d._id === selectedDept)?.name;
    const parts = [];
    if (deptName)   parts.push(deptName);
    if (searchTerm) parts.push(`Search:${searchTerm}`);
    return parts.length ? parts.join(' | ') : 'All Professors';
  };

  const handleDownload = async (type, isAll) => {
    const key = `${type}${isAll ? 'All' : ''}`;
    setDownloading(prev => ({ ...prev, [key]: true }));
    try {
      const activeFilters = isAll
        ? { department: '', search: '' }
        : { department: selectedDept, search: searchTerm };
      const label = getFilterLabel(isAll);
      if (type === 'pdf') await downloadProfessorPDF(activeFilters, label);
      else                await downloadProfessorExcel(activeFilters, label, departments);
    } catch (err) {
      console.error('Download error:', err);
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(prev => ({ ...prev, [key]: false }));
    }
  };

  const confirmDelete = async () => {
    if (!professorToDelete) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`http://localhost:5000/api/professor/${professorToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfessors(prev => prev.filter(p => p._id !== professorToDelete._id));
      setShowDeleteModal(false); setProfessorToDelete(null);
    } catch (err) { setError(err.response?.data?.message || 'Failed to delete professor.'); }
    finally { setDeleteLoading(false); }
  };

  // Download button component (defined outside would cause prop issues, keeping inline — no input/focus bug here)
  const DlBtn = ({ type, isAll, label }) => {
    const key   = `${type}${isAll ? 'All' : ''}`;
    const busy  = downloading[key];
    const isPDF = type === 'pdf';
    return (
      <button
        onClick={() => handleDownload(type, isAll)}
        disabled={busy}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
          isPDF
            ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
        }`}
      >
        {busy ? <Loader2 size={13} className="animate-spin" />
               : isPDF ? <FileText size={13} /> : <FileSpreadsheet size={13} />}
        {busy ? 'Generating…' : label}
      </button>
    );
  };

  const selectClass = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

  return (
    <div className="space-y-5">

      {/* ── Header with Download Panel ── */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">

        {/* Filters */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <select 
              value={selectedDept} 
              onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }} 
              className={`${selectClass} sm:w-48`}
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
            <form onSubmit={(e) => { e.preventDefault(); setPage(1); }} className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text" placeholder="Search by name, email, contact..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition">
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Download Panel */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex flex-col gap-3 lg:min-w-[240px]">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
            <Download size={13} /> Download Report
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1.5">
              Current filter: <span className="font-semibold text-slate-600">{getFilterLabel(false)}</span>
            </p>
            <div className="flex gap-2">
              <DlBtn type="pdf"   isAll={false} label="PDF" />
              <DlBtn type="excel" isAll={false} label="Excel" />
            </div>
          </div>
          <div className="border-t border-slate-100" />
          <div>
            <p className="text-xs text-slate-400 mb-1.5">Full report — all professors</p>
            <div className="flex gap-2">
              <DlBtn type="pdf"   isAll={true} label="PDF (All)" />
              <DlBtn type="excel" isAll={true} label="Excel (All)" />
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center py-16 gap-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 text-sm">Loading professors...</span>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Name</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap hidden md:table-cell">Email</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap hidden sm:table-cell">Contact</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap hidden sm:table-cell">Department</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap hidden lg:table-cell">Qualification</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {professors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <GraduationCap size={20} className="text-slate-400" />
                      </div>
                      <p className="text-slate-500 text-sm font-medium">No professors found</p>
                    </td>
                  </tr>
                ) : professors.map((p, idx) => (
                  <tr key={p._id} className={`hover:bg-blue-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm font-semibold text-slate-800">{p.name}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-500 hidden md:table-cell">{p.email}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-500 hidden sm:table-cell">{p.contactNumber}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap hidden sm:table-cell">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{p.department?.name || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-500 hidden lg:table-cell">{p.qualification || 'N/A'}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => { setViewProfessor(p); setShowViewModal(true); }}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition" title="View">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => onEdit?.(p)}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition" title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => { setProfessorToDelete(p); setShowDeleteModal(true); }}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 flex-wrap gap-3">
              <p className="text-sm text-slate-500">
                Page <span className="font-semibold text-slate-700">{page}</span> of{' '}
                <span className="font-semibold text-slate-700">{totalPages}</span>
                {' '}· <span className="font-semibold text-slate-700">{totalProfessors}</span> total
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
      {showDeleteModal && professorToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-800 mb-2">Delete Professor</h3>
            <p className="text-slate-600 text-sm mb-5">
              Delete <span className="font-semibold">{professorToDelete.name}</span>? This cannot be undone.
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

      {showViewModal && viewProfessor && (
        <ProfessorViewModal professor={viewProfessor} onClose={() => setShowViewModal(false)} />
      )}
    </div>
  );
};

export default ProfessorList;