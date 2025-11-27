import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = `${window.location.origin}/api`;

export default function AdminDepartmentsTab({ token, user }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin/departments/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(res.data);
    } catch (error) {
      console.error('Error loading departments:', error);
      alert('Failed to load departments');
    } finally {
      setLoading(false);
    }
  }

  async function deleteDepartment(name) {
    if (!window.confirm(`Are you sure you want to delete the "${name}" department? This action cannot be undone.`)) return;

    try {
      await axios.delete(`${API_BASE}/admin/departments/${name}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadDepartments();
      alert('Department deleted successfully');
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Failed to delete department');
    }
  }

  return (
    <div>
      {/* Header with Actions */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.sectionTitle}>Department Management</h3>
          <p style={styles.sectionSubtitle}>{departments.length} departments configured</p>
        </div>
        <button
          style={styles.primaryButton}
          onClick={() => setShowCreateModal(true)}
        >
          <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
          Add Department
        </button>
      </div>

      {/* Departments Grid */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: '#667eea' }}></i>
          <div style={{ color: '#718096', marginTop: '1rem' }}>Loading departments...</div>
        </div>
      ) : (
        <div style={styles.grid}>
          {departments.length === 0 ? (
            <div style={styles.emptyState}>
              <i className="fas fa-building" style={{ fontSize: '3rem', color: '#cbd5e0', marginBottom: '1rem' }}></i>
              <h3 style={{ margin: '0 0 0.5rem', color: '#2d3748' }}>No departments yet</h3>
              <p style={{ fontSize:'0.9rem', color:'#718096', marginBottom: '1.5rem' }}>
                Create your first department to organize materials and users.
              </p>
              <button
                style={styles.primaryButton}
                onClick={() => setShowCreateModal(true)}
              >
                <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
                Create Department
              </button>
            </div>
          ) : (
            departments.map(department => (
              <div key={department.name} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.icon}>
                    <i className="fas fa-building" style={{ color: '#667eea', fontSize: '1.5rem' }}></i>
                  </div>
                  <div style={styles.cardActions}>
                    <button
                      style={styles.dangerButton}
                      onClick={() => deleteDepartment(department.name)}
                      title="Delete Department"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div style={styles.cardContent}>
                  <h3 style={styles.cardTitle}>{department.name}</h3>
                  <p style={styles.cardDescription}>
                    {department.description || 'No description provided'}
                  </p>
                  {department.head_of_department && (
                    <div style={styles.headInfo}>
                      <i className="fas fa-user-tie" style={{ marginRight: '0.5rem', color: '#718096' }}></i>
                      <span style={styles.headLabel}>Head:</span>
                      <span style={styles.headName}>{department.head_of_department}</span>
                    </div>
                  )}
                  <div style={styles.metaInfo}>
                    <span style={styles.metaItem}>
                      <i className="fas fa-calendar" style={{ marginRight: '0.5rem' }}></i>
                      Created {new Date(department.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Department Modal */}
      {showCreateModal && (
        <DepartmentModal
          token={token}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadDepartments();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

function DepartmentModal({ token, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    head_of_department: ''
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API_BASE}/admin/departments/create`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Department created successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error creating department:', error);
      alert(error.response?.data?.detail || 'Failed to create department');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={modalStyles.backdrop}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <h3 style={modalStyles.title}>Create New Department</h3>
          <button onClick={onClose} style={modalStyles.closeButton}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={modalStyles.form}>
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Department Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={modalStyles.input}
              placeholder="e.g., Computer Science, Physics, Mathematics"
              required
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              style={modalStyles.textarea}
              placeholder="Brief description of the department..."
              rows={3}
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Head of Department</label>
            <input
              type="text"
              value={formData.head_of_department}
              onChange={(e) => setFormData({...formData, head_of_department: e.target.value})}
              style={modalStyles.input}
              placeholder="Dr. John Smith"
            />
          </div>

          <div style={modalStyles.actions}>
            <button type="button" onClick={onClose} style={modalStyles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={modalStyles.submitButton} disabled={loading}>
              {loading ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem'
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
    transition: 'all 0.3s'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 1.5rem 0'
  },
  icon: {
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    background: '#f7fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  cardActions: {
    display: 'flex',
    gap: '0.5rem'
  },
  dangerButton: {
    background: '#fed7d7',
    color: '#c53030',
    border: 'none',
    padding: '0.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem'
  },
  cardContent: {
    padding: '1rem 1.5rem 1.5rem'
  },
  cardTitle: {
    margin: '0 0 0.5rem',
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#2d3748'
  },
  cardDescription: {
    margin: '0 0 1rem',
    color: '#718096',
    fontSize: '0.9rem',
    lineHeight: 1.5
  },
  headInfo: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.75rem',
    fontSize: '0.85rem'
  },
  headLabel: {
    color: '#718096',
    marginRight: '0.25rem'
  },
  headName: {
    color: '#2d3748',
    fontWeight: 500
  },
  metaInfo: {
    borderTop: '1px solid #f3f4f6',
    paddingTop: '0.75rem'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    color: '#718096',
    fontSize: '0.8rem'
  },
  emptyState: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
    textAlign: 'center'
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
    zIndex: 1000
  },
  modal: {
    background: '#fff',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
  },
  header: {
    padding: '1.5rem',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#1f2937'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#718096'
  },
  form: {
    padding: '1.5rem'
  },
  formGroup: {
    marginBottom: '1.5rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#2d3748'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontFamily: 'inherit'
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    minHeight: '80px',
    resize: 'vertical'
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    marginTop: '2rem'
  },
  cancelButton: {
    background: '#f7fafc',
    color: '#4a5568',
    border: '2px solid #e2e8f0',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  submitButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit'
  }
};