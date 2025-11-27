import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SchedulePage(){
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    department: user?.department || ''
  });

  function handleChange(field, value) {
    setProfile(prev => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    // In a real app, this would call an API to update profile
    alert('Profile update functionality coming soon!');
    setEditMode(false);
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          <i className="fas fa-user-cog" style={{ marginRight: '0.75rem' }}></i>
          Profile Settings
        </h2>
      </div>

      <div style={styles.card}>
        <div style={styles.avatarSection}>
          <div style={styles.avatar}>
            <i className="fas fa-user" style={{ fontSize: '3rem', color: '#667eea' }}></i>
          </div>
          <div style={styles.userInfo}>
            <h3 style={styles.userName}>{user?.full_name}</h3>
            <p style={styles.userEmail}>{user?.email}</p>
            <span style={{
              ...styles.roleBadge,
              background: user?.role === 'admin' ? '#667eea' : '#48bb78'
            }}>
              {user?.role === 'admin' ? '👑 Admin' : '👤 User'}
            </span>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Personal Information</h3>
            <button
              onClick={() => editMode ? handleSave() : setEditMode(true)}
              style={styles.editBtn}
            >
              <i className={`fas fa-${editMode ? 'save' : 'edit'}`} style={{ marginRight: '0.5rem' }}></i>
              {editMode ? 'Save Changes' : 'Edit Profile'}
            </button>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <i className="fas fa-user" style={styles.labelIcon}></i>
              Full Name
            </label>
            <input
              type="text"
              value={profile.full_name}
              onChange={e => handleChange('full_name', e.target.value)}
              disabled={!editMode}
              style={{...styles.input, opacity: editMode ? 1 : 0.7}}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <i className="fas fa-envelope" style={styles.labelIcon}></i>
              Email Address
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              style={{...styles.input, opacity: 0.7, cursor: 'not-allowed'}}
            />
            <p style={styles.helpText}>Email cannot be changed</p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <i className="fas fa-university" style={styles.labelIcon}></i>
              Department
            </label>
            <input
              type="text"
              value={profile.department}
              disabled
              style={{...styles.input, opacity: 0.7, cursor: 'not-allowed'}}
            />
            <p style={styles.helpText}>Department cannot be changed</p>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Account Statistics</h3>
          <div style={styles.statsGrid}>
            <div style={styles.statItem}>
              <div style={styles.statIcon}>📚</div>
              <div style={styles.statValue}>{user?.enrolled_materials?.length || 0}</div>
              <div style={styles.statLabel}>Enrolled Courses</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statIcon}>🎓</div>
              <div style={styles.statValue}>{user?.role || 'user'}</div>
              <div style={styles.statLabel}>Account Type</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statIcon}>🏛️</div>
              <div style={styles.statValue}>{user?.department || 'N/A'}</div>
              <div style={styles.statLabel}>Department</div>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
            About Quiz Schedules
          </h3>
          <div style={styles.infoBox}>
            <p style={styles.infoText}>
              Quiz schedules are managed by administrators. You will receive daily quizzes based on the schedule set by your admin.
            </p>
            {user?.role === 'admin' && (
              <p style={{...styles.infoText, color: '#667eea', fontWeight: 600, marginTop: '0.5rem'}}>
                As an admin, you can manage quiz schedules in the Admin Dashboard.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: '#ffffff',
    borderRadius: '20px',
    padding: '2rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    minHeight: 'calc(100vh - 4rem)'
  },
  header: {
    marginBottom: '2rem'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    margin: 0,
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center'
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '2rem',
    maxWidth: '800px',
    margin: '0 auto'
  },
  avatarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    paddingBottom: '2rem',
    borderBottom: '2px solid #f3f4f6',
    marginBottom: '2rem'
  },
  avatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid #667eea'
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1f2937',
    margin: '0 0 0.25rem'
  },
  userEmail: {
    fontSize: '0.95rem',
    color: '#6b7280',
    margin: '0 0 0.75rem'
  },
  roleBadge: {
    display: 'inline-block',
    padding: '0.4rem 1rem',
    borderRadius: '20px',
    color: '#fff',
    fontSize: '0.85rem',
    fontWeight: 600
  },
  section: {
    marginBottom: '2rem'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#1f2937',
    margin: '0 0 1.5rem'
  },
  editBtn: {
    padding: '0.6rem 1.25rem',
    background: 'linear-gradient(135deg,#667eea,#764ba2)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
    boxShadow: '0 4px 15px rgba(102,126,234,0.3)'
  },
  formGroup: {
    marginBottom: '1.5rem'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '0.5rem'
  },
  labelIcon: {
    marginRight: '0.5rem',
    color: '#667eea',
    width: '16px'
  },
  input: {
    width: '100%',
    padding: '0.875rem',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  helpText: {
    fontSize: '0.8rem',
    color: '#9ca3af',
    marginTop: '0.5rem',
    fontStyle: 'italic'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem'
  },
  statItem: {
    background: 'linear-gradient(135deg, rgba(102,126,234,0.05), rgba(118,75,162,0.05))',
    padding: '1.5rem',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid rgba(102,126,234,0.2)'
  },
  statIcon: {
    fontSize: '2rem',
    marginBottom: '0.5rem'
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: '0.25rem'
  },
  statLabel: {
    fontSize: '0.85rem',
    color: '#6b7280'
  },
  infoBox: {
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '12px',
    padding: '1.25rem',
    marginTop: '1rem'
  },
  infoText: {
    fontSize: '0.9rem',
    color: '#0c4a6e',
    margin: 0,
    lineHeight: 1.6
  }
};
