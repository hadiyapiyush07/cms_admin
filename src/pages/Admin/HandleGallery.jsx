import { useState, useEffect, useRef } from 'react';
import { X, Pencil, Trash2, Image, Plus, CalendarDays } from 'lucide-react';

const HandleGallery = () => {
  const [title, setTitle]           = useState('');
  const [date, setDate]             = useState('');
  const [coverFile, setCoverFile]   = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [uploading, setUploading]   = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const successTimeout              = useRef(null);

  const [events, setEvents]         = useState([]);
  const [loading, setLoading]       = useState(true);

  const [editingEvent, setEditingEvent]         = useState(null);
  const [editTitle, setEditTitle]               = useState('');
  const [editDate, setEditDate]                 = useState('');
  const [editCoverFile, setEditCoverFile]       = useState(null);
  const [editCoverPreview, setEditCoverPreview] = useState(null);
  const [editPhotos, setEditPhotos]             = useState([]);
  const [editNewPhotoFiles, setEditNewPhotoFiles] = useState([]);
  const [editRemovedPhotos, setEditRemovedPhotos] = useState([]);
  const [updating, setUpdating]                 = useState(false);

  useEffect(() => {
    fetchEvents();
    return () => { if (successTimeout.current) clearTimeout(successTimeout.current); };
  }, []);

  const fetchEvents = async () => {
    try {
      const res  = await fetch('http://localhost:5000/api/events');
      const data = await res.json();
      setEvents(data);
    } catch (error) { console.error('Error fetching events:', error); }
    finally { setLoading(false); }
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
      body: formData,
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.msg || 'Upload failed'); }
    return (await res.json()).url;
  };

  const resetForm = () => {
    setTitle(''); setDate(''); setCoverFile(null); setPhotoFiles([]);
    document.querySelectorAll('input[type=file]').forEach(i => i.value = '');
  };

  const showSuccess = (msg) => {
    if (successTimeout.current) clearTimeout(successTimeout.current);
    setSuccessMessage(msg);
    successTimeout.current = setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSubmit = async () => {
    setUploading(true);
    try {
      const coverUrl   = await uploadFile(coverFile);
      const photoUrls  = [];
      for (let file of photoFiles) photoUrls.push(await uploadFile(file));

      const eventRes = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ title, date, cover: coverUrl, photos: photoUrls })
      });
      if (!eventRes.ok) { const err = await eventRes.json(); throw new Error(err.msg || 'Failed'); }
      showSuccess('Event created successfully!');
      resetForm();
      fetchEvents();
    } catch (error) { alert(`Error: ${error.message}`); }
    finally { setUploading(false); }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.msg || 'Delete failed'); }
      fetchEvents();
    } catch (error) { alert(`Error: ${error.message}`); }
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setEditTitle(event.title);
    setEditDate(event.date);
    setEditCoverPreview(event.cover);
    setEditCoverFile(null);
    setEditPhotos([...event.photos]);
    setEditNewPhotoFiles([]);
    setEditRemovedPhotos([]);
  };

  const handleEditCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setEditCoverPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      let coverUrl = editCoverPreview;
      if (editCoverFile) coverUrl = await uploadFile(editCoverFile);

      const newPhotoUrls = [];
      for (let file of editNewPhotoFiles) newPhotoUrls.push(await uploadFile(file));

      const res = await fetch(`http://localhost:5000/api/events/${editingEvent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          title: editTitle, date: editDate,
          cover: coverUrl, photos: [...editPhotos, ...newPhotoUrls]
        })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.msg || 'Update failed'); }
      showSuccess('Event updated successfully!');
      fetchEvents();
      setEditingEvent(null);
    } catch (error) { alert(`Error: ${error.message}`); }
    finally { setUpdating(false); }
  };

  const inputClass = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
  const fileClass  = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:text-xs file:font-semibold cursor-pointer";

  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Image size={20} className="text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Gallery Manager</h1>
          <p className="text-slate-500 text-xs mt-0.5">Upload and manage college event photos</p>
        </div>
      </div>

      {/* ── Success banner ── */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full" /> {successMessage}
        </div>
      )}

      {/* ── Upload New Event Form ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-5 flex items-center gap-2">
          <Plus size={15} className="text-blue-600" /> Upload New Event
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Event Title <span className="text-red-500">*</span></label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className={inputClass} placeholder="e.g. Republic Day Celebration"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Event Date <span className="text-red-500">*</span></label>
            <input
              type="text" value={date} onChange={(e) => setDate(e.target.value)}
              className={inputClass} placeholder="e.g. 26 Jan 2026"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cover Image <span className="text-red-500">*</span></label>
            <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files[0])} className={fileClass} />
            {coverFile && <p className="text-xs text-slate-500 mt-1.5">✓ {coverFile.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Event Photos <span className="text-red-500">*</span></label>
            <input type="file" accept="image/*" multiple onChange={(e) => setPhotoFiles(prev => [...prev, ...Array.from(e.target.files)])} className={fileClass} />
            {photoFiles.length > 0 && (
              <p className="text-xs text-slate-500 mt-1.5">✓ {photoFiles.length} file{photoFiles.length > 1 ? 's' : ''} selected</p>
            )}
          </div>
        </div>

        <button
          type="button" onClick={handleSubmit} disabled={uploading || !title || !date || !coverFile}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          {uploading
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading...</>
            : <><Plus size={15} /> Create Event</>}
        </button>
      </div>

      {/* ── Existing Events ── */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Existing Events</h2>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-500 text-sm">Loading events...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Image size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium text-sm">No events yet</p>
            <p className="text-slate-400 text-xs mt-1">Create your first event above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <div key={event._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition group">
                <div className="relative overflow-hidden">
                  <img
                    src={event.cover} alt={event.title}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-2 left-3 flex items-center gap-1 text-white text-xs font-medium">
                    <CalendarDays size={12} /> {event.date}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-800 text-sm mb-1 truncate">{event.title}</h3>
                  <p className="text-slate-400 text-xs mb-3">{event.photos?.length || 0} photos</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(event)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-semibold transition active:scale-95"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event._id)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2 rounded-xl text-xs font-semibold transition active:scale-95"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-base font-bold text-slate-800">Edit Event</h2>
              <button
                onClick={() => setEditingEvent(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Event Title <span className="text-red-500">*</span></label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required className={inputClass} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Event Date <span className="text-red-500">*</span></label>
                <input type="text" value={editDate} onChange={(e) => setEditDate(e.target.value)} required className={inputClass} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cover Image</label>
                {editCoverPreview && (
                  <img src={editCoverPreview} alt="Cover preview" className="w-24 h-18 object-cover rounded-lg mb-2 border border-slate-200" />
                )}
                <input type="file" accept="image/*" onChange={handleEditCoverChange} className={fileClass} />
                <p className="text-xs text-slate-400 mt-1">Leave empty to keep current cover</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Current Photos</label>
                {editPhotos.length === 0
                  ? <p className="text-xs text-slate-400">No photos remaining</p>
                  : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {editPhotos.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img src={url} alt="Event" className="w-full h-16 object-cover rounded-lg border border-slate-200" />
                          <button
                            type="button"
                            onClick={() => {
                              setEditPhotos(prev => prev.filter(u => u !== url));
                              setEditRemovedPhotos(prev => [...prev, url]);
                            }}
                            className="absolute top-0.5 right-0.5 bg-red-500/80 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Add New Photos</label>
                <input type="file" accept="image/*" multiple onChange={(e) => setEditNewPhotoFiles(prev => [...prev, ...Array.from(e.target.files)])} className={fileClass} />
                {editNewPhotoFiles.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {editNewPhotoFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                        <span className="text-xs text-slate-600 truncate max-w-[80%]">{file.name}</span>
                        <button type="button" onClick={() => setEditNewPhotoFiles(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 transition">
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button" onClick={() => setEditingEvent(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={updating}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                >
                  {updating
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating...</>
                    : 'Update Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HandleGallery;