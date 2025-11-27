import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = `${window.location.origin}/api`;

export default function AdminUsersTab({ token, user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    loadUsers();
    loadDepartments();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin/users/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function loadDepartments() {
    try {
      const res = await axios.get(`${API_BASE}/admin/departments/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(res.data);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  }

  async function deleteUser(userId) {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      await axios.delete(`${API_BASE}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadUsers();
      alert('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  }

  return (
    <div>
      {/* Header with Actions */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.sectionTitle}>User Management</h3>
          <p style={styles.sectionSubtitle}>{users.length} users registered</p>
        </div>
        <button
          style={styles.primaryButton}
          onClick={() => setShowCreateModal(true)}
        >
          <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
          Add User
        </button>
      </div>

      {/* Users Table */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: '#667eea' }}></i>
          <div style={{ color: '#718096', marginTop: '1rem' }}>Loading users...</div>
        </div>
      ) : (
        <div style={styles.tableCard}>
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Department</span>
              <span>Joined</span>
              <span>Actions</span>
            </div>
            {users.length === 0 ? (
              <div style={styles.emptyState}>
                <i className="fas fa-users" style={{ fontSize: '3rem', color: '#cbd5e0', marginBottom: '1rem' }}></i>
                <p style={{ color: '#718096' }}>No users found</p>
              </div>
            ) : (
              users.map(user => (
                <div key={user._id || user.id} style={styles.tableRow}>
                  <span style={styles.nameCell}>
                    <i className="fas fa-user" style={{ marginRight: '0.5rem', color: '#667eea' }}></i>
                    {user.full_name}
                  </span>
                  <span style={styles.emailCell}>{user.email}</span>
                  <span style={styles.roleCell}>
                    <span style={getRoleBadgeStyle(user.role)}>
                      {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                    </span>
                  </span>
                  <span style={styles.departmentCell}>{user.department || 'N/A'}</span>
                  <span style={styles.dateCell}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                  <div style={styles.actionsCell}>
                    <button
                      style={styles.actionButton}
                      onClick={() => setEditingUser(user)}
                      title="Edit User"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      style={styles.dangerButton}
                      onClick={() => deleteUser(user._id || user.id)}
                      title="Delete User"
                      disabled={user._id === user.id} // Prevent self-deletion
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create/Edit User Modal */}
      {(showCreateModal || editingUser) && (
        <UserModal
          token={token}
          user={editingUser}
          departments={departments}
          onClose={() => {
            setShowCreateModal(false);
            setEditingUser(null);
          }}
          onSuccess={() => {
            loadUsers();
            setShowCreateModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}

function UserModal({ token, user, departments, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'user',
    department: ''
  });
  const [loading, setLoading] = useState(false);
  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'user',
        department: user.department || ''
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        password: '',
        role: 'user',
        department: ''
      });
    }
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = { ...formData };
      if (isEditing && !submitData.password) {
        delete submitData.password; // Don't update password if empty
      }

      if (isEditing) {
        await axios.put(`${API_BASE}/admin/users/${user._id || user.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('User updated successfully!');
      } else {
        await axios.post(`${API_BASE}/admin/users/create`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('User created successfully!');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving user:', error);
      alert(error.response?.data?.detail || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={modalStyles.backdrop}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <h3 style={modalStyles.title}>
            {isEditing ? 'Edit User' : 'Create New User'}
          </h3>
          <button onClick={onClose} style={modalStyles.closeButton}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={modalStyles.form}>
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Full Name *</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              style={modalStyles.input}
              required
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={modalStyles.input}
              required
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>
              Password {isEditing ? '(leave empty to keep current)' : '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              style={modalStyles.input}
              required={!isEditing}
              minLength={8}
            />
            <p style={modalStyles.help}>
              Password must be at least 8 characters with digits and uppercase letters.
            </p>
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              style={modalStyles.select}
              required
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Department</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              style={modalStyles.select}
            >
              <option value="">No Department</option>
              {departments.map(dept => (
                <option key={dept.name} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div style={modalStyles.actions}>
            <button type="button" onClick={onClose} style={modalStyles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={modalStyles.submitButton} disabled={loading}>
              {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getRoleBadgeStyle(role) {
  return {
    background: role === 'admin' ? 'linear-gradient(135deg, #fef5e7 0%, #fed7aa 100%)' : '#f7fafc',
    color: role === 'admin' ? '#d68910' : '#4a5568',
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem'
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
    gridTemplateColumns: '1.5fr 2fr 1fr 1.5fr 1fr 1fr',
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
    gridTemplateColumns: '1.5fr 2fr 1fr 1.5fr 1fr 1fr',
    gap: '1rem',
    padding: '1rem 1.5rem',
    alignItems: 'center',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '0.9rem'
  },
  nameCell: {
    fontWeight: 500,
    color: '#2d3748',
    display: 'flex',
    alignItems: 'center'
  },
  emailCell: {
    color: '#718096'
  },
  roleCell: {
    display: 'flex',
    justifyContent: 'center'
  },
  departmentCell: {
    color: '#718096'
  },
  dateCell: {
    color: '#718096',
    fontSize: '0.85rem'
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
    fontSize: '0.8rem'
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
  select: {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontFamily: 'inherit'
  },
  help: {
    margin: '0.5rem 0 0',
    fontSize: '0.8rem',
    color: '#718096'
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