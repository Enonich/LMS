import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = `${window.location.origin}/api`;

export default function MaterialUploadModal({ token, onClose, onUploadSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: 'Computer Science',
    content_type: 'pdf'
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const departments = [
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Engineering',
    'Business',
    'Other'
  ];

  const contentTypes = [
    { value: 'pdf', label: 'PDF Document', icon: 'file-pdf' },
    { value: 'video', label: 'Video', icon: 'video' },
    { value: 'text', label: 'Text Content', icon: 'file-alt' }
  ];

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  }

  function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!formData.title) {
        setFormData({ ...formData, title: selectedFile.name.replace(/\.[^/.]+$/, '') });
      }
    }
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      if (!formData.title) {
        setFormData({ ...formData, title: droppedFile.name.replace(/\.[^/.]+$/, '') });
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (formData.content_type !== 'text' && !file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('department', formData.department);
      data.append('content_type', formData.content_type);
      
      if (file) {
        data.append('file', file);
      }

      await axios.post(`${API_BASE}/admin/materials/upload`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      onUploadSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            <i className="fas fa-cloud-upload-alt" style={{ marginRight: '0.5rem', color: '#667eea' }}></i>
            Upload Learning Material
          </h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.error}>
              <i className="fas fa-exclamation-circle" style={{ marginRight: '0.5rem' }}></i>
              {error}
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <i className="fas fa-heading" style={styles.labelIcon}></i>
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Introduction to Python Programming"
              style={styles.input}
              disabled={uploading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <i className="fas fa-align-left" style={styles.labelIcon}></i>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of the material..."
              style={{ ...styles.input, ...styles.textarea }}
              disabled={uploading}
            />
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label}>
                <i className="fas fa-university" style={styles.labelIcon}></i>
                Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                style={styles.select}
                disabled={uploading}
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label}>
                <i className="fas fa-tag" style={styles.labelIcon}></i>
                Content Type
              </label>
              <select
                name="content_type"
                value={formData.content_type}
                onChange={handleChange}
                style={styles.select}
                disabled={uploading}
              >
                {contentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formData.content_type !== 'text' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <i className="fas fa-file-upload" style={styles.labelIcon}></i>
                File Upload *
              </label>
              <div
                style={{
                  ...styles.dropzone,
                  ...(dragActive ? styles.dropzoneActive : {}),
                  ...(file ? styles.dropzoneHasFile : {})
                }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
              >
                <input
                  id="fileInput"
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  accept={formData.content_type === 'pdf' ? '.pdf' : formData.content_type === 'video' ? '.mp4,.mov,.avi' : '*'}
                  disabled={uploading}
                />
                {file ? (
                  <div style={styles.fileInfo}>
                    <i className="fas fa-file-check" style={{ fontSize: '2rem', color: '#48bb78', marginBottom: '0.5rem' }}></i>
                    <div style={{ fontWeight: 600, color: '#2d3748' }}>{file.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.25rem' }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      style={styles.removeFileBtn}
                      disabled={uploading}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div style={styles.dropzoneContent}>
                    <i className="fas fa-cloud-upload-alt" style={{ fontSize: '3rem', color: '#cbd5e0', marginBottom: '0.75rem' }}></i>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#4a5568', marginBottom: '0.25rem' }}>
                      Drop your file here or click to browse
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>
                      {formData.content_type === 'pdf' && 'PDF files only'}
                      {formData.content_type === 'video' && 'MP4, MOV, AVI files'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelBtn}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...styles.submitBtn,
                ...(uploading ? styles.submitBtnDisabled : {})
              }}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                  Uploading...
                </>
              ) : (
                <>
                  <i className="fas fa-upload" style={{ marginRight: '0.5rem' }}></i>
                  Upload Material
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6000,
    backdropFilter: 'blur(4px)',
    animation: 'fadeIn 0.2s ease-out'
  },
  modal: {
    background: 'linear-gradient(135deg, #ffffff 0%, #f7fafc 100%)',
    width: '90vw',
    maxWidth: '650px',
    maxHeight: '90vh',
    overflowY: 'auto',
    borderRadius: '20px',
    padding: '0',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    animation: 'slideUp 0.3s ease-out'
  },
  header: {
    padding: '1.5rem 2rem',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '20px 20px 0 0'
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center'
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    fontSize: '2rem',
    cursor: 'pointer',
    color: '#ffffff',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    '&:hover': {
      background: 'rgba(255,255,255,0.3)'
    }
  },
  form: {
    padding: '2rem'
  },
  formGroup: {
    marginBottom: '1.5rem'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#2d3748'
  },
  labelIcon: {
    marginRight: '0.5rem',
    color: '#667eea',
    width: '16px'
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '0.95rem',
    transition: 'all 0.2s',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    '&:focus': {
      borderColor: '#667eea',
      boxShadow: '0 0 0 3px rgba(102,126,234,0.1)'
    }
  },
  textarea: {
    minHeight: '100px',
    resize: 'vertical'
  },
  select: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '0.95rem',
    transition: 'all 0.2s',
    outline: 'none',
    background: '#ffffff',
    color: '#2d3748',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  row: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  dropzone: {
    border: '3px dashed #cbd5e0',
    borderRadius: '16px',
    padding: '2.5rem 1.5rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s',
    background: '#f7fafc',
    minHeight: '180px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dropzoneActive: {
    borderColor: '#667eea',
    background: '#edf2f7',
    transform: 'scale(1.02)'
  },
  dropzoneHasFile: {
    borderColor: '#48bb78',
    background: '#f0fff4'
  },
  dropzoneContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  fileInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem'
  },
  removeFileBtn: {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    background: '#fc8181',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
    transition: 'all 0.2s'
  },
  error: {
    background: '#fed7d7',
    color: '#c53030',
    padding: '0.875rem 1rem',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    fontWeight: 500
  },
  footer: {
    marginTop: '2rem',
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end'
  },
  cancelBtn: {
    padding: '0.875rem 1.75rem',
    background: '#e2e8f0',
    color: '#4a5568',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 600,
    transition: 'all 0.2s',
    fontFamily: 'inherit'
  },
  submitBtn: {
    padding: '0.875rem 1.75rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 600,
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    boxShadow: '0 4px 12px rgba(102,126,234,0.3)'
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  }
};
