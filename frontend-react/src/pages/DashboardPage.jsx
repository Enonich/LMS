import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = `${window.location.origin}/api`;

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState({
    enrolledCount: 0,
    quizAccuracy: '0%',
    streak: 0
  });
  const [recentMaterials, setRecentMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/materials/enrolled`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const materials = res.data;
      setRecentMaterials(materials.slice(0, 4));
      setStats(prev => ({ ...prev, enrolledCount: materials.length }));

      // Load quiz stats from localStorage
      if (user) {
        const key = `userStats_${user.id}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const userStats = JSON.parse(stored);
            setStats(prev => ({
              ...prev,
              quizAccuracy: userStats.total > 0 
                ? `${userStats.correct}/${userStats.total}` 
                : '0/0',
              streak: userStats.streak || 0
            }));
          } catch (e) {}
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  function openMaterial(material) {
    window.location.hash = `#materials?view=${material.id}`;
  }

  return (
    <div style={{ background:'#ffffff', borderRadius:'20px', padding:'2rem', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', minHeight:'calc(100vh - 4rem)' }}>
      <div style={styles.header}>
        <div style={{ flex: 1 }}>
          <h2 style={styles.title}>📊 Learners Dashboard</h2>
          <p style={styles.subtitle}>Welcome back, {user?.full_name || 'Student'}!</p>
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: '#667eea' }}></i>
        </div>
      ) : (
        <>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <i className="fas fa-book-open" style={{ color: '#667eea', fontSize: '1.8rem' }}></i>
              </div>
              <div>
                <div style={styles.statValue}>{stats.enrolledCount}</div>
                <div style={styles.statLabel}>Enrolled Courses</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <i className="fas fa-brain" style={{ color: '#38a169', fontSize: '1.8rem' }}></i>
              </div>
              <div>
                <div style={styles.statValue}>{stats.quizAccuracy}</div>
                <div style={styles.statLabel}>Quiz Accuracy</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <i className="fas fa-fire" style={{ color: '#f6ad55', fontSize: '1.8rem' }}></i>
              </div>
              <div>
                <div style={styles.statValue}>{stats.streak}</div>
                <div style={styles.statLabel}>Study Streak</div>
              </div>
            </div>
          </div>

          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <h3 style={styles.tableTitle}>Recent Courses</h3>
              <button 
                style={styles.viewAllBtn}
                onClick={() => window.location.hash = '#materials'}
              >
                View All <i className="fas fa-arrow-right" style={{ marginLeft: '0.5rem' }}></i>
              </button>
            </div>

            {recentMaterials.length === 0 ? (
              <div style={styles.emptyState}>
                <i className="fas fa-inbox" style={{ fontSize: '3rem', color: '#cbd5e0', marginBottom: '1rem' }}></i>
                <p style={{ color: '#718096', marginBottom: '1rem' }}>No courses enrolled yet</p>
                <button 
                  style={styles.enrollBtn}
                  onClick={() => window.location.hash = '#materials'}
                >
                  <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
                  Browse Courses
                </button>
              </div>
            ) : (
              <div style={styles.table}>
                <div style={styles.tableHeaderRow}>
                  <span>Course Name</span>
                  <span>Department</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                {recentMaterials.map(material => (
                  <div key={material.id} style={styles.tableRow}>
                    <span style={styles.courseName}>
                      <i className={`fas fa-${getMaterialIcon(material.content_type)}`} 
                         style={{ marginRight: '0.75rem', color: '#667eea' }}></i>
                      {material.title}
                    </span>
                    <span style={styles.department}>{material.department}</span>
                    <span>
                      {material.file_exists === false ? (
                        <span style={styles.badgeError}>Missing</span>
                      ) : (
                        <span style={styles.badgeActive}>Active</span>
                      )}
                    </span>
                    <button 
                      style={styles.actionBtn}
                      onClick={() => openMaterial(material)}
                    >
                      <i className="fas fa-eye" style={{ marginRight: '0.5rem' }}></i>
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function getMaterialIcon(type) {
  const icons = {
    pdf: 'file-pdf',
    video: 'video',
    text: 'file-alt',
    document: 'file-word',
    image: 'image'
  };
  return icons[type] || 'book';
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    gap: '1rem'
  },
  title: {
    fontSize: '1.9rem',
    fontWeight: 700,
    margin: 0,
    color: '#1f2937'
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#718096',
    margin: '0.5rem 0 0'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  statCard: {
    background: 'linear-gradient(135deg, #ffffff 0%, #f7fafc 100%)',
    padding: '1.5rem',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    transition: 'all 0.3s',
    cursor: 'default'
  },
  statIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#1f2937',
    lineHeight: 1
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#718096',
    marginTop: '0.5rem'
  },
  tableCard: {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden'
  },
  tableHeader: {
    padding: '1.5rem',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  tableTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#1f2937'
  },
  viewAllBtn: {
    background: 'transparent',
    border: 'none',
    color: '#667eea',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
    fontFamily: 'inherit'
  },
  table: {
    display: 'flex',
    flexDirection: 'column'
  },
  tableHeaderRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1.5fr 1fr 1fr',
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
    gridTemplateColumns: '2fr 1.5fr 1fr 1fr',
    gap: '1rem',
    padding: '1rem 1.5rem',
    alignItems: 'center',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '0.9rem',
    transition: 'background 0.2s'
  },
  courseName: {
    fontWeight: 500,
    color: '#2d3748',
    display: 'flex',
    alignItems: 'center'
  },
  department: {
    color: '#718096'
  },
  badgeActive: {
    background: '#d4f4dd',
    color: '#2f855a',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 600,
    display: 'inline-block'
  },
  badgeError: {
    background: '#fed7d7',
    color: '#c53030',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 600,
    display: 'inline-block'
  },
  actionBtn: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyState: {
    padding: '4rem 2rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  enrollBtn: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '4rem 2rem'
  }
};
