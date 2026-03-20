import { useState, useEffect, useRef } from 'react';
import { X, Pencil, Trash2 } from 'lucide-react';

const HandleGallery = () => {
  // ---------- Form state for new event ----------
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // ---------- Auto‑dismiss timeout ref ----------
  const successTimeout = useRef(null);

  // ---------- Events list state ----------
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------- Edit modal state ----------
  const [editingEvent, setEditingEvent] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCoverFile, setEditCoverFile] = useState(null);
  const [editCoverPreview, setEditCoverPreview] = useState(null);
  const [editPhotos, setEditPhotos] = useState([]);
  const [editNewPhotoFiles, setEditNewPhotoFiles] = useState([]);
  const [editRemovedPhotos, setEditRemovedPhotos] = useState([]);
  const [updating, setUpdating] = useState(false);

  // Clear success timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeout.current) clearTimeout(successTimeout.current);
    };
  }, []);

  // Fetch all events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/events');
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Upload a single file (helper) ----------
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.msg || 'Upload failed');
    }

    const data = await res.json();
    return data.url;
  };

  // ---------- Reset new event form ----------
  const resetForm = () => {
    setTitle('');
    setDate('');
    setCoverFile(null);
    setPhotoFiles([]);
    document.querySelectorAll('input[type=file]').forEach(input => input.value = '');
  };

  // ---------- Handle new event submission ----------
  const handleSubmit = async () => {
    // Clear any pending timeout
    if (successTimeout.current) clearTimeout(successTimeout.current);
    setSuccessMessage('');
    setUploading(true);

    try {
      // 1. Upload cover image
      const coverUrl = await uploadFile(coverFile);

      // 2. Upload all event photos
      const photoUrls = [];
      for (let file of photoFiles) {
        const url = await uploadFile(file);
        photoUrls.push(url);
      }

      // 3. Save event metadata
      const eventRes = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ title, date, cover: coverUrl, photos: photoUrls })
      });

      if (!eventRes.ok) {
        const error = await eventRes.json();
        throw new Error(error.msg || 'Failed to create event');
      }

      setSuccessMessage('Event created successfully!');
      // Auto‑dismiss after 3 seconds
      successTimeout.current = setTimeout(() => {
        setSuccessMessage('');
        successTimeout.current = null;
      }, 3000);

      resetForm();
      fetchEvents();
    } catch (error) {
      console.error(error);
      alert(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // ---------- Delete event ----------
  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.msg || 'Delete failed');
      }

      alert('Event deleted');
      fetchEvents();
    } catch (error) {
      console.error(error);
      alert(`Error: ${error.message}`);
    }
  };

  // ---------- Open edit modal ----------
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

  // ---------- Close edit modal ----------
  const closeEditModal = () => {
    setEditingEvent(null);
  };

  // ---------- Handle cover change in edit modal ----------
  const handleEditCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditCoverPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // ---------- Handle new photo files in edit modal ----------
  const handleEditNewPhotosChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setEditNewPhotoFiles(prev => [...prev, ...newFiles]);
  };

  // ---------- Remove an existing photo ----------
  const removeExistingPhoto = (photoUrl) => {
    setEditPhotos(prev => prev.filter(url => url !== photoUrl));
    setEditRemovedPhotos(prev => [...prev, photoUrl]);
  };

  // ---------- Remove a newly added photo file ----------
  const removeNewPhotoFile = (index) => {
    setEditNewPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ---------- Submit update ----------
  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      let coverUrl = editCoverPreview;
      if (editCoverFile) {
        coverUrl = await uploadFile(editCoverFile);
      }

      const newPhotoUrls = [];
      for (let file of editNewPhotoFiles) {
        const url = await uploadFile(file);
        newPhotoUrls.push(url);
      }

      const finalPhotos = [...editPhotos, ...newPhotoUrls];

      const res = await fetch(`http://localhost:5000/api/events/${editingEvent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          title: editTitle,
          date: editDate,
          cover: coverUrl,
          photos: finalPhotos
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.msg || 'Update failed');
      }

      setSuccessMessage('Event updated successfully!');
      // Auto‑dismiss after 3 seconds
      if (successTimeout.current) clearTimeout(successTimeout.current);
      successTimeout.current = setTimeout(() => {
        setSuccessMessage('');
        successTimeout.current = null;
      }, 3000);

      fetchEvents();
      closeEditModal();
    } catch (error) {
      console.error(error);
      alert(`Error: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // ---------- Photo file input for new event ----------
  const handlePhotosChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setPhotoFiles(prev => [...prev, ...newFiles]);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Upload New Event</h2>
      {successMessage && <div style={styles.success}>{successMessage}</div>}

      {/* New Event Form - no onSubmit to prevent page reload */}
      <form style={styles.form}>
        {/* Title */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Event Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={styles.input}
            placeholder="e.g. Republic Day Celebration"
          />
        </div>

        {/* Date */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Event Date *</label>
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={styles.input}
            placeholder="e.g. 26 Jan 2026"
          />
        </div>

        {/* Cover Image */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Cover Image *</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files[0])}
            required
            style={styles.fileInput}
          />
          {coverFile && <p style={styles.fileName}>Selected: {coverFile.name}</p>}
        </div>

        {/* Multiple Photos */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Event Photos *</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotosChange}
            style={styles.fileInput}
          />
          {photoFiles.length > 0 && (
            <div style={styles.fileList}>
              <p>Selected files:</p>
              <ul>
                {photoFiles.map((file, idx) => (
                  <li key={idx}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={uploading}
          style={{
            ...styles.button,
            ...(uploading ? styles.buttonDisabled : {}),
          }}
        >
          {uploading ? 'Uploading...' : 'Create Event'}
        </button>
      </form>

      <hr style={{ margin: '2rem 0' }} />

      {/* Events List */}
      <h2 style={styles.heading}>Existing Events</h2>
      {loading ? (
        <p>Loading events...</p>
      ) : events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <div style={styles.eventGrid}>
          {events.map((event) => (
            <div key={event._id} style={styles.eventCard}>
              <img src={event.cover} alt={event.title} style={styles.eventCover} />
              <div style={styles.eventInfo}>
                <h3>{event.title}</h3>
                <p>{event.date}</p>
                <p>{event.photos?.length || 0} photos</p>
                <div style={styles.buttonGroup}>
                  <button
                    onClick={() => openEditModal(event)}
                    style={styles.editButton}
                  >
                    <Pencil size={16} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event._id)}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingEvent && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>Edit Event</h2>
              <button onClick={closeEditModal} style={styles.closeButton}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              {/* Title */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Event Title *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>

              {/* Date */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Event Date *</label>
                <input
                  type="text"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>

              {/* Cover Image */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Cover Image</label>
                {editCoverPreview && (
                  <img
                    src={editCoverPreview}
                    alt="Cover preview"
                    style={styles.previewImage}
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditCoverChange}
                  style={styles.fileInput}
                />
                <p style={styles.hint}>Leave empty to keep current cover</p>
              </div>

              {/* Existing Photos */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Current Photos</label>
                <div style={styles.photoGrid}>
                  {editPhotos.map((url, idx) => (
                    <div key={idx} style={styles.photoItem}>
                      <img src={url} alt="Event" style={styles.thumb} />
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(url)}
                        style={styles.removePhotoButton}
                        title="Remove"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Photos */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Add New Photos</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleEditNewPhotosChange}
                  style={styles.fileInput}
                />
                {editNewPhotoFiles.length > 0 && (
                  <div style={styles.newPhotoList}>
                    <p>New files to upload:</p>
                    <ul>
                      {editNewPhotoFiles.map((file, idx) => (
                        <li key={idx}>
                          {file.name}
                          <button
                            type="button"
                            onClick={() => removeNewPhotoFile(idx)}
                            style={styles.removeSmall}
                          >
                            <X size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div style={styles.modalActions}>
                <button
                  type="submit"
                  disabled={updating}
                  style={{
                    ...styles.button,
                    ...(updating ? styles.buttonDisabled : {}),
                  }}
                >
                  {updating ? 'Updating...' : 'Update Event'}
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Styles (unchanged) ----------
const styles = {
  container: {
    maxWidth: '1000px',
    margin: '2rem auto',
    padding: '2rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  heading: {
    textAlign: 'center',
    marginBottom: '1.5rem',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
    color: '#555',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  fileInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  fileName: {
    marginTop: '0.5rem',
    fontSize: '0.9rem',
    color: '#666',
  },
  fileList: {
    marginTop: '0.5rem',
    fontSize: '0.9rem',
    color: '#666',
  },
  button: {
    padding: '0.75rem',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
  },
  success: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  eventGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem',
    marginTop: '1rem',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  },
  eventCover: {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
  },
  eventInfo: {
    padding: '1rem',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  editButton: {
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 0.75rem',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.9rem',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 0.75rem',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.9rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
  },
  previewImage: {
    width: '100px',
    height: '75px',
    objectFit: 'cover',
    marginBottom: '0.5rem',
    borderRadius: '4px',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  photoItem: {
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '4px',
  },
  removePhotoButton: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    backgroundColor: 'rgba(255,0,0,0.7)',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  newPhotoList: {
    marginTop: '0.5rem',
    fontSize: '0.9rem',
  },
  removeSmall: {
    background: 'none',
    border: 'none',
    color: 'red',
    marginLeft: '0.5rem',
    cursor: 'pointer',
    verticalAlign: 'middle',
  },
  modalActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    marginTop: '1.5rem',
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  hint: {
    fontSize: '0.85rem',
    color: '#888',
    marginTop: '0.25rem',
  },
};

export default HandleGallery;