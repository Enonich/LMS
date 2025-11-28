import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE = `${window.location.origin}/api`;

export default function DashboardPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    enrolledCount: 0,
    quizAccuracy: '0%',
    streak: 0
  });
  const [enrolledMaterials, setEnrolledMaterials] = useState([]);
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // Load enrolled materials
      const enrolledRes = await axios.get(`${API_BASE}/materials/enrolled`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const enrolled = enrolledRes.data;
      setEnrolledMaterials(enrolled);
      setStats(prev => ({ ...prev, enrolledCount: enrolled.length }));

      // Load available materials (from user's department)
      const availableRes = await axios.get(`${API_BASE}/materials?department=${user?.department || ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const available = availableRes.data;
      
      // Filter out already enrolled materials
      const unenrolled = available.filter(material => 
        !enrolled.some(enrolledMaterial => enrolledMaterial.id === material.id)
      );
      setAvailableMaterials(unenrolled.slice(0, 4)); // Show only first 4

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

  async function enrollInMaterial(materialId) {
    try {
      await axios.put(`${API_BASE}/materials/${materialId}/enroll`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh data after enrollment
      loadDashboardData();
      alert('Successfully enrolled in the course!');
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Failed to enroll in the course. Please try again.');
    }
  }

  function viewMaterial(material) {
    // Navigate to materials page with the selected material
    navigate('/materials', { state: { selectedMaterial: material } });
  }

  return (
    <div style={{ 
      background:'#ffffff', 
      borderRadius:'16px', 
      padding:'2.5rem', 
      boxShadow:'0 2px 8px rgba(0,0,0,0.1)', 
      minHeight:'calc(100vh - 4rem)',
      border:'1px solid #e5e7eb'
    }}>
      <div style={styles.header}>
        <div style={{ flex: 1 }}>
          <div style={styles.titleContainer}>
            <div style={styles.titleIcon}>
              <i className="fas fa-graduation-cap" style={{ fontSize: '1.8rem', color: '#667eea' }}></i>
            </div>
            <div>
              <h1 style={styles.title}>Learning Dashboard</h1>
              <p style={styles.subtitle}>Welcome back, {user?.full_name || 'Student'}!</p>
            </div>
          </div>
          <div style={styles.welcomeMessage}>
            <p style={styles.welcomeText}>
              Continue your learning journey and track your progress across all enrolled courses.
            </p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <div style={styles.currentDate}>
            <i className="fas fa-calendar-alt" style={{ marginRight: '0.5rem', color: '#718096' }}></i>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
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

          {/* Enrolled Courses Section */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                <i className="fas fa-bookmark" style={{ marginRight: '0.5rem', color: '#38a169' }}></i>
                My Enrolled Courses ({enrolledMaterials.length})
              </h3>
              <button 
                style={styles.viewAllBtn}
                onClick={() => navigate('/progress')}
              >
                View Progress <i className="fas fa-arrow-right" style={{ marginLeft: '0.5rem' }}></i>
              </button>
            </div>

            {enrolledMaterials.length === 0 ? (
              <div style={styles.emptyState}>
                <i className="fas fa-inbox" style={{ fontSize: '3rem', color: '#cbd5e0', marginBottom: '1rem' }}></i>
                <p style={{ color: '#718096', marginBottom: '1rem' }}>No courses enrolled yet</p>
                <button 
                  style={styles.enrollBtn}
                  onClick={() => navigate('/materials')}
                >
                  <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
                  Browse Courses
                </button>
              </div>
            ) : (
              <div style={styles.materialsGrid}>
                {enrolledMaterials.slice(0, 4).map(material => (
                  <div key={material.id} style={styles.materialCard}>
                    <div style={styles.materialHeader}>
                      <div style={styles.materialIcon}>
                        <i className={`fas fa-${getMaterialIcon(material.content_type)}`} 
                           style={{ color: '#38a169', fontSize: '1.2rem' }}></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={styles.materialTitle}>{material.title}</h4>
                        <div style={styles.materialMeta}>
                          <span>{material.department}</span>
                          <span>�</span>
                          <span>{material.content_type}</span>
                        </div>
                      </div>
                    </div>
                    <p style={styles.materialDescription}>
                      {material.description || 'No description available'}
                    </p>
                    <button 
                      style={styles.viewBtn}
                      onClick={() => viewMaterial(material)}
                    >
                      <i className="fas fa-play" style={{ marginRight: '0.5rem' }}></i>
                      Continue Learning
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Courses Section */}
          {availableMaterials.length > 0 && (
            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>
                  <i className="fas fa-compass" style={{ marginRight: '0.5rem', color: '#667eea' }}></i>
                  Available Courses ({availableMaterials.length})
                </h3>
                <button 
                  style={styles.viewAllBtn}
                  onClick={() => navigate('/materials')}
                >
                  View All <i className="fas fa-arrow-right" style={{ marginLeft: '0.5rem' }}></i>
                </button>
              </div>

              <div style={styles.materialsGrid}>
                {availableMaterials.map(material => (
                  <div key={material.id} style={styles.materialCard}>
                    <div style={styles.materialHeader}>
                      <div style={styles.materialIcon}>
                        <i className={`fas fa-${getMaterialIcon(material.content_type)}`} 
                           style={{ color: '#667eea', fontSize: '1.2rem' }}></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={styles.materialTitle}>{material.title}</h4>
                        <div style={styles.materialMeta}>
                          <span>{material.department}</span>
                          <span>�</span>
                          <span>{material.content_type}</span>
                        </div>
                      </div>
                    </div>
                    <p style={styles.materialDescription}>
                      {material.description || 'No description available'}
                    </p>
                    <button 
                      style={styles.enrollBtnSmall}
                      onClick={() => enrollInMaterial(material.id)}
                    >
                      <i className="fas fa-user-plus" style={{ marginRight: '0.5rem' }}></i>
                      Enroll
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
    marginBottom: '2.5rem',
    gap: '2rem',
    paddingBottom: '2rem',
    borderBottom: '2px solid #f1f5f9'
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '0.75rem'
  },
  titleIcon: {
    width: '70px',
    height: '70px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
    flexShrink: 0
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 900,
    margin: 0,
    color: '#1f2937',
    letterSpacing: '-0.03em',
    lineHeight: 1.1
  },
  subtitle: {
    fontSize: '1.15rem',
    color: '#64748b',
    margin: '0.5rem 0 0',
    fontWeight: 500,
    letterSpacing: '-0.01em'
  },
  welcomeMessage: {
    marginTop: '0.5rem'
  },
  welcomeText: {
    fontSize: '0.95rem',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.5,
    maxWidth: '600px'
  },
  headerActions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '1rem'
  },
  currentDate: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.9rem',
    color: '#64748b',
    fontWeight: 500,
    background: '#f8fafc',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  statCard: {
    background: '#ffffff',
    padding: '1.75rem',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    transition: 'all 0.2s',
    cursor: 'default'
  },
  statIcon: {
    width: '72px',
    height: '72px',
    borderRadius: '16px',
    background: '#f7fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  statValue: {
    fontSize: '2.25rem',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #1f2937 0%, #4a5568 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: 1,
    letterSpacing: '-0.02em'
  },
  statLabel: {
    fontSize: '0.925rem',
    color: '#718096',
    marginTop: '0.5rem',
    fontWeight: 500,
    letterSpacing: '0.01em'
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
  },
  sectionCard: {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
    marginBottom: '2rem',
    overflow: 'hidden'
  },
  sectionHeader: {
    padding: '1.5rem',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center'
  },
  materialsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
    padding: '1.5rem'
  },
  materialCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'all 0.2s',
    cursor: 'pointer'
  },
  materialHeader: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '0.75rem',
    alignItems: 'flex-start'
  },
  materialIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: '#f7fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  materialTitle: {
    margin: '0 0 0.25rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#2d3748',
    lineHeight: 1.3
  },
  materialMeta: {
    fontSize: '0.75rem',
    color: '#718096',
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center'
  },
  materialDescription: {
    fontSize: '0.8rem',
    color: '#4a5568',
    lineHeight: 1.5,
    marginBottom: '1rem',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  viewBtn: {
    background: 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '0.625rem 1.25rem',
    borderRadius: '12px',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(56,161,105,0.3)',
    letterSpacing: '0.02em'
  },
  enrollBtnSmall: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '0.625rem 1.25rem',
    borderRadius: '12px',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
    letterSpacing: '0.02em'
  }
};
