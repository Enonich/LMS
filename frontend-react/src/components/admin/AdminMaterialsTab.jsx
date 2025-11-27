import React, { useState, useEffect } from 'react';

// Import your other components (adjust paths as needed)
// import MaterialUploadModal from './MaterialUploadModal';
// import PdfViewer from './PdfViewer';
// import VideoPlayer from './VideoPlayer';

const API_BASE = process.env.REACT_APP_API_BASE || '/api';

export default function AdminMaterialsTab({ token, isOwner = false }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeMaterial, setActiveMaterial] = useState(null);

  // Load materials on mount
  useEffect(() => {
    loadMaterials();
  }, []);

  // Fetch materials from API
  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/materials`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load materials');
      }
      
      const data = await response.json();
      setMaterials(data);
    } catch (err) {
      console.error('Error loading materials:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete material
  const deleteMaterial = async (id) => {
    if (!window.confirm('Are you sure you want to delete this material?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/materials/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete material');
      }

      await loadMaterials();
    } catch (err) {
      console.error('Error deleting material:', err);
      alert('Failed to delete material: ' + err.message);
    }
  };

  // Force delete (for ghost entries)
  const forceDelete = async (id) => {
    if (!window.confirm('Force delete this ghost entry? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/materials/${id}/force`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to force delete material');
      }

      await loadMaterials();
    } catch (err) {
      console.error('Error force deleting material:', err);
      alert('Failed to force delete: ' + err.message);
    }
  };

  // Open material in modal
  const openMaterial = (material) => {
    setActiveMaterial(material);
  };

  // Close material modal
  const closeMaterial = () => {
    setActiveMaterial(null);
  };

  // Get filtered materials
  const filteredMaterials = departmentFilter === 'all' 
    ? materials 
    : materials.filter(m => m.department === departmentFilter);

  // Get unique departments for filter
  const departments = [...new Set(materials.map(m => m.department).filter(Boolean))];

  return (
    <div>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.sectionTitle}>Materials Management</h2>
          <p style={styles.sectionSubtitle}>Upload and manage course materials</p>
        </div>
        <button 
          style={styles.primaryButton} 
          onClick={() => setShowUploadModal(true)}
        >
          <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
          Upload Material
        </button>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <label style={styles.filterLabel}>
          <i className="fas fa-filter" style={{ marginRight: '0.5rem' }}></i>
          Department:
        </label>
        <select 
          style={styles.filterSelect}
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={styles.loadingContainer}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#667eea', marginBottom: '1rem' }}></i>
          <p>Loading materials...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{ padding: '1rem', background: '#fed7d7', color: '#c53030', borderRadius: '8px', marginBottom: '1rem' }}>
          <i className="fas fa-exclamation-circle" style={{ marginRight: '0.5rem' }}></i>
          {error}
        </div>
      )}

      {/* Materials Table */}
      {!loading && !error && (
        <div style={styles.tableCard}>
          <div style={styles.table}>
            {/* Table Header */}
            <div style={styles.tableHeader}>
              <span>Title</span>
              <span style={{ textAlign: 'center' }}>Type</span>
              <span style={{ textAlign: 'center' }}>Department</span>
              <span style={{ textAlign: 'center' }}>Status</span>
              <span style={{ textAlign: 'center' }}>Pages</span>
              <span style={{ textAlign: 'center' }}>Actions</span>
            </div>

            {/* Table Body */}
            {filteredMaterials.length === 0 ? (
              <div style={styles.emptyState}>
                <i className="fas fa-folder-open" style={{ fontSize: '3rem', color: '#cbd5e0', marginBottom: '1rem' }}></i>
                <h3 style={{ margin: '0 0 0.5rem', color: '#4a5568' }}>No Materials Found</h3>
                <p style={{ margin: 0, color: '#718096' }}>
                  {departmentFilter === 'all' 
                    ? 'Upload your first material to get started' 
                    : `No materials found for ${departmentFilter}`}
                </p>
              </div>
            ) : (
              filteredMaterials.map((material) => {
                return (
                  <div key={material.id} style={styles.tableRow}>
                    <span style={styles.titleCell}>
                      {material.title}
                      {material.file_exists === false && (
                        <span style={styles.errorBadge}>MISSING FILE</span>
                      )}
                      {material.processing && (
                        <span style={styles.warningBadge}>PROCESSING</span>
                      )}
                    </span>
                    <span style={styles.typeCell}>
                      <span style={getTypeBadgeStyle(material.content_type)}>
                        {material.content_type}
                      </span>
                    </span>
                    <span style={styles.departmentCell}>{material.department || 'N/A'}</span>
                    <span style={styles.statusCell}>
                      <span style={material.file_exists === false ? styles.statusError : styles.statusActive}>
                        {material.file_exists === false ? 'Error' : 'Active'}
                      </span>
                    </span>
                    <span style={styles.pagesCell}>{material.pages || '-'}</span>
                    <div style={styles.actionsCell}>
                      <button 
                        style={styles.actionButton} 
                        onClick={() => openMaterial(material)} 
                        title="View Material"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      {isOwner && (
                        <button 
                          style={styles.dangerButton} 
                          onClick={() => deleteMaterial(material.id)} 
                          title="Delete Material"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                      {material.file_exists === false && (
                        <button 
                          style={styles.forceDeleteButton} 
                          onClick={() => forceDelete(material.id)} 
                          title="Force Delete Ghost Entry"
                        >
                          <i className="fas fa-skull"></i>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={modalStyles.backdrop} onClick={() => setShowUploadModal(false)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Upload Material</h3>
              <button onClick={() => setShowUploadModal(false)} style={modalStyles.closeButton}>×</button>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <p style={{ color: '#718096' }}>
                MaterialUploadModal component would be rendered here. 
                Import and use your MaterialUploadModal component.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* View Material Modal */}
      {activeMaterial && (
        <div style={modalStyles.backdrop} onClick={closeMaterial}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{activeMaterial.title}</h3>
              <button onClick={closeMaterial} style={modalStyles.closeButton}>×</button>
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              {activeMaterial.content_type === 'pdf' ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <i className="fas fa-file-pdf" style={{ fontSize: '4rem', color: '#c53030', marginBottom: '1rem' }}></i>
                  <h3 style={{ margin: '0 0 1rem', color: '#2d3748' }}>PDF Document</h3>
                  <p style={{ margin: '0 0 1.5rem', color: '#718096' }}>
                    PDF viewer component would be rendered here. Import and use your PdfViewer component.
                  </p>
                  <button 
                    style={modalStyles.primaryButton} 
                    onClick={() => window.open(`${API_BASE}/materials/${activeMaterial.id}/file`, '_blank')}
                  >
                    <i className="fas fa-external-link-alt" style={{ marginRight: '0.5rem' }}></i>
                    Open PDF
                  </button>
                </div>
              ) : activeMaterial.content_type === 'video' ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <i className="fas fa-video" style={{ fontSize: '4rem', color: '#d68910', marginBottom: '1rem' }}></i>
                  <h3 style={{ margin: '0 0 1rem', color: '#2d3748' }}>Video</h3>
                  <p style={{ margin: '0 0 1.5rem', color: '#718096' }}>
                    Video player component would be rendered here. Import and use your VideoPlayer component.
                  </p>
                </div>
              ) : activeMaterial.content_type === 'text' && activeMaterial.content ? (
                <pre style={{ whiteSpace: 'pre-wrap', background: '#fff', padding: '1rem', borderRadius: '8px', fontSize: '.75rem', border: '1px solid #e5e7eb' }}>
                  {activeMaterial.content}
                </pre>
              ) : (activeMaterial.content_type === 'doc' || activeMaterial.content_type === 'docx') ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <i className="fas fa-file-word" style={{ fontSize: '4rem', color: '#2b6cb0', marginBottom: '1rem' }}></i>
                  <h3 style={{ margin: '0 0 1rem', color: '#2d3748' }}>Microsoft Word Document</h3>
                  <p style={{ margin: '0 0 1.5rem', color: '#718096' }}>
                    This document can be viewed in your browser or downloaded for offline viewing.
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button 
                      style={modalStyles.primaryButton} 
                      onClick={() => window.open(`${API_BASE}/materials/${activeMaterial.id}/file`, '_blank')}
                    >
                      <i className="fas fa-external-link-alt" style={{ marginRight: '0.5rem' }}></i>
                      Open in Browser
                    </button>
                    <button 
                      style={modalStyles.secondaryButton} 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `${API_BASE}/materials/${activeMaterial.id}/file`;
                        link.download = activeMaterial.title + (activeMaterial.content_type === 'docx' ? '.docx' : '.doc');
                        link.click();
                      }}
                    >
                      <i className="fas fa-download" style={{ marginRight: '0.5rem' }}></i>
                      Download
                    </button>
                  </div>
                </div>
              ) : activeMaterial.content_type.startsWith('image/') ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <img 
                    src={`${API_BASE}/materials/${activeMaterial.id}/file`}
                    alt={activeMaterial.title}
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '70vh', 
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{ display: 'none', textAlign: 'center', padding: '2rem' }}>
                    <i className="fas fa-image" style={{ fontSize: '4rem', color: '#cbd5e0', marginBottom: '1rem' }}></i>
                    <h3 style={{ margin: '0 0 1rem', color: '#2d3748' }}>Image Preview Unavailable</h3>
                    <p style={{ margin: '0 0 1.5rem', color: '#718096' }}>
                      Unable to load image preview. You can download it instead.
                    </p>
                    <button
                      style={modalStyles.secondaryButton}
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `${API_BASE}/materials/${activeMaterial.id}/file`;
                        link.download = activeMaterial.title;
                        link.click();
                      }}
                    >
                      <i className="fas fa-download" style={{ marginRight: '0.5rem' }}></i>
                      Download Image
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <i className="fas fa-file" style={{ fontSize: '4rem', color: '#cbd5e0', marginBottom: '1rem' }}></i>
                  <h3 style={{ margin: '0 0 1rem', color: '#2d3748' }}>File Preview Not Available</h3>
                  <p style={{ margin: '0 0 1rem', color: '#718096' }}>
                    Content type: <code style={{ background: '#f7fafc', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>{activeMaterial.content_type}</code>
                  </p>
                  <p style={{ margin: '0 0 1.5rem', color: '#718096' }}>
                    This file type is not supported for preview. You can download it instead.
                  </p>
                  <button
                    style={modalStyles.secondaryButton}
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `${API_BASE}/materials/${activeMaterial.id}/file`;
                      link.download = activeMaterial.title;
                      link.click();
                    }}
                  >
                    <i className="fas fa-download" style={{ marginRight: '0.5rem' }}></i>
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTypeBadgeStyle(type) {
  const typeStyles = {
    pdf: { background: '#fed7d7', color: '#c53030' },
    doc: { background: '#e6f3ff', color: '#2b6cb0' },
    docx: { background: '#e6f3ff', color: '#2b6cb0' },
    video: { background: '#fef5e7', color: '#d68910' },
    text: { background: '#d4f4dd', color: '#2f855a' },
    document: { background: '#e6f3ff', color: '#2b6cb0' },
    image: { background: '#f3e8ff', color: '#805ad5' }
  };
  
  return {
    ...(typeStyles[type] || { background: '#f7fafc', color: '#4a5568' }),
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 600
  };
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#1f2937'
  },
  sectionSubtitle: {
    margin: '0.25rem 0 0',
    color: '#718096',
    fontSize: '0.9rem'
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center'
  },
  filters: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap'
  },
  filterLabel: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#4a5568',
    display: 'flex',
    alignItems: 'center'
  },
  filterSelect: {
    padding: '0.5rem 1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    cursor: 'pointer'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem'
  },
  tableCard: {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden'
  },
  table: {
    display: 'flex',
    flexDirection: 'column'
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr',
    gap: '1rem',
    padding: '1rem 1.5rem',
    background: '#f7fafc',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#4a5568',
    borderBottom: '1px solid #e5e7eb'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr',
    gap: '1rem',
    padding: '1rem 1.5rem',
    alignItems: 'center',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '0.9rem'
  },
  titleCell: {
    fontWeight: 500,
    color: '#2d3748',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },
  warningBadge: {
    background: '#fef5e7',
    color: '#d68910',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: 600
  },
  errorBadge: {
    background: '#fed7d7',
    color: '#c53030',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: 600
  },
  typeCell: {
    display: 'flex',
    justifyContent: 'center'
  },
  departmentCell: {
    color: '#718096'
  },
  statusCell: {
    display: 'flex',
    justifyContent: 'center'
  },
  statusActive: {
    background: '#d4f4dd',
    color: '#2f855a',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 600
  },
  statusError: {
    background: '#fed7d7',
    color: '#c53030',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 600
  },
  pagesCell: {
    color: '#718096',
    textAlign: 'center'
  },
  actionsCell: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'center'
  },
  actionButton: {
    background: '#e6f3ff',
    color: '#2b6cb0',
    border: 'none',
    padding: '0.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    transition: 'background 0.2s'
  },
  dangerButton: {
    background: '#fed7d7',
    color: '#c53030',
    border: 'none',
    padding: '0.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    transition: 'background 0.2s'
  },
  forceDeleteButton: {
    background: '#c53030',
    color: '#fff',
    border: 'none',
    padding: '0.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    transition: 'background 0.2s'
  },
  emptyState: {
    padding: '4rem 2rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gridColumn: '1 / -1'
  }
};

const modalStyles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5000
  },
  modal: {
    background: '#fff',
    width: '90vw',
    maxWidth: '1000px',
    maxHeight: '90vh',
    overflowY: 'auto',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#718096',
    lineHeight: 1
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    transition: 'transform 0.2s'
  },
  secondaryButton: {
    background: '#f7fafc',
    color: '#4a5568',
    border: '2px solid #e2e8f0',
    padding: '0.75rem 1.5rem',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    transition: 'transform 0.2s'
  }
};