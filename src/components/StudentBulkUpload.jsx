import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Download, UploadCloud, AlertCircle, CheckCircle, FileSpreadsheet, Loader2 } from 'lucide-react';

const StudentBulkUpload = ({ onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const fetchFilters = async () => {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [deptRes, semRes] = await Promise.all([
          axios.get('http://localhost:5000/api/departments', { headers }),
          axios.get('http://localhost:5000/api/semesters', { headers }),
        ]);
        if (deptRes.data.success) setDepartments(deptRes.data.data);
        if (semRes.data.success) setSemesters(semRes.data.data);
      } catch (err) {
        console.error('Failed to load departments/semesters for mapping', err);
      }
    };
    fetchFilters();
  }, []);

  const downloadTemplate = () => {
    const templateData = [{
      name: 'John Doe',
      email: 'johndoe@example.com',
      contactNumber: '9876543210',
      dob: '2000-01-01',
      gender: 'Male',
      category: 'General',
      admissionYear: '2024',
      department: 'MCA', // We'll map string to ID
      semester: 'Semester 1', // We'll map string to ID
      aadharNumber: '123456789012',
      password: 'Student@123'
    }];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students Template");
    XLSX.writeFile(wb, "Student_Bulk_Upload_Template.xlsx");
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
    setResults(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (rows.length === 0) throw new Error("Excel sheet is empty.");

        // Transform IDs
        const students = rows.map((row, idx) => {
          const dept = departments.find(d => d.name.toLowerCase() === (row.department || '').toLowerCase());
          const sem = semesters.find(s => s.semesterName.toLowerCase() === (row.semester || '').toLowerCase());

          if (!dept) throw new Error(`Row ${idx + 1}: Department "${row.department}" not found in system.`);
          if (!sem) throw new Error(`Row ${idx + 1}: Semester "${row.semester}" not found in system.`);

          return {
            ...row,
            department: dept._id,
            semesterID: sem._id,
          };
        });

        const token = localStorage.getItem('authToken');
        const response = await axios.post('http://localhost:5000/api/admin/students/bulk', { students }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setResults(response.data.results);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error processing file.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-3xl mx-auto space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <UploadCloud size={20} className="text-blue-600" />
            Bulk Upload Students
          </h2>
          <p className="text-sm text-slate-500 mt-1">Upload an Excel (.xlsx) or CSV file to add multiple students.</p>
        </div>
        <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-semibold transition">
          <Download size={16} /> Download Template
        </button>
      </div>

      <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50">
        <FileSpreadsheet size={40} className="text-slate-400 mb-3" />
        <label className="cursor-pointer bg-white px-4 py-2 border border-slate-200 rounded-lg shadow-sm text-sm font-semibold text-blue-600 hover:bg-blue-50 transition mb-2">
          Choose File
          <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileChange} />
        </label>
        {file ? (
          <p className="text-sm text-slate-700 font-medium">{file.name}</p>
        ) : (
          <p className="text-xs text-slate-400">No file selected</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {results && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <CheckCircle size={20} /> Upload Completed
          </div>
          <p className="text-sm text-emerald-700">
            Total processed: {results.total} <br/>
            Successfully added: <b>{results.success}</b> <br/>
            Failed: <b>{results.failed}</b>
          </p>
          {results.errors.length > 0 && (
            <div className="mt-2 p-3 bg-white border border-red-100 rounded-lg text-xs text-red-600 max-h-40 overflow-y-auto">
              <ul className="list-disc pl-4 space-y-1">
                {results.errors.map((e, i) => (
                  <li key={i}>Row {e.row} ({e.email}): {e.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button onClick={onSuccess} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">
          Back to List
        </button>
        <button 
          onClick={handleUpload} 
          disabled={!file || loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
          Upload Data
        </button>
      </div>

    </div>
  );
};

export default StudentBulkUpload;
