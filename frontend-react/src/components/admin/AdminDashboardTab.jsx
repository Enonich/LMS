import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = `${window.location.origin}/api`;

export default function AdminDashboardTab({ token, user }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMaterials: 0,
    totalQuestions: 0,
    totalSchedules: 0,
    activeSchedules: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [usersRes, materialsRes, questionsRes, schedulesRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/users/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/materials`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/admin/questions/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/admin/quiz-schedule/all`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const users = usersRes.data;
      const materials = materialsRes.data;
      const questionsData = questionsRes.data;
      const schedules = schedulesRes.data;

      setStats({
        totalUsers: users.length,
        totalMaterials: materials.length,
        totalQuestions: questionsData.total,
        totalSchedules: schedules.length,
        activeSchedules: schedules.filter(s => s.active).length
      });

      // Generate recent activity (mock data for now)
      const activity = [
        { type: 'user', action: 'New user registered', time: '2 hours ago' },
        { type: 'material', action: 'Material uploaded', time: '4 hours ago' },
        { type: 'question', action: 'Questions extracted', time: '1 day ago' },
        { type: 'schedule', action: 'Schedule updated', time: '2 days ago' }
      ];
      setRecentActivity(activity);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: '#667eea' }}></i>
        <div style={{ color: '#718096', marginTop: '1rem' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <i className="fas fa-users" style={{ color: '#667eea', fontSize: '1.8rem' }}></i>
          </div>
          <div>
            <div style={styles.statValue}>{stats.totalUsers}</div>
            <div style={styles.statLabel}>Total Users</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <i className="fas fa-book" style={{ color: '#38a169', fontSize: '1.8rem' }}></i>
          </div>
          <div>
            <div style={styles.statValue}>{stats.totalMaterials}</div>
            <div style={styles.statLabel}>Learning Materials</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <i className="fas fa-question-circle" style={{ color: '#f6ad55', fontSize: '1.8rem' }}></i>
          </div>
          <div>
            <div style={styles.statValue}>{stats.totalQuestions}</div>
            <div style={styles.statLabel}>Questions</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <i className="fas fa-calendar-alt" style={{ color: '#e53e3e', fontSize: '1.8rem' }}></i>
          </div>
          <div>
            <div style={styles.statValue}>{stats.activeSchedules}/{stats.totalSchedules}</div>
            <div style={styles.statLabel}>Active Schedules</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={styles.activityCard}>
        <div style={styles.activityHeader}>
          <h3 style={styles.activityTitle}>Recent Activity</h3>
        </div>
        <div style={styles.activityList}>
          {recentActivity.map((activity, index) => (
            <div key={index} style={styles.activityItem}>
              <div style={styles.activityIcon}>
                <i className={`fas fa-${getActivityIcon(activity.type)}`} style={{ color: getActivityColor(activity.type) }}></i>
              </div>
              <div style={styles.activityContent}>
                <div style={styles.activityAction}>{activity.action}</div>
                <div style={styles.activityTime}>{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.actionsCard}>
        <h3 style={styles.actionsTitle}>Quick Actions</h3>
        <div style={styles.actionsGrid}>
          <button style={styles.actionButton}>
            <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
            Add User
          </button>
          <button style={styles.actionButton}>
            <i className="fas fa-upload" style={{ marginRight: '0.5rem' }}></i>
            Upload Material
          </button>
          <button style={styles.actionButton}>
            <i className="fas fa-question-circle" style={{ marginRight: '0.5rem' }}></i>
            Extract Questions
          </button>
          <button style={styles.actionButton}>
            <i className="fas fa-calendar-plus" style={{ marginRight: '0.5rem' }}></i>
            Create Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

function getActivityIcon(type) {
  const icons = {
    user: 'user-plus',
    material: 'book',
    question: 'question-circle',
    schedule: 'calendar-alt'
  };
  return icons[type] || 'circle';
}

function getActivityColor(type) {
  const colors = {
    user: '#667eea',
    material: '#38a169',
    question: '#f6ad55',
    schedule: '#e53e3e'
  };
  return colors[type] || '#718096';
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem'
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
    transition: 'all 0.3s'
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
  activityCard: {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
    marginBottom: '2rem',
    overflow: 'hidden'
  },
  activityHeader: {
    padding: '1.5rem',
    borderBottom: '1px solid #e5e7eb'
  },
  activityTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#1f2937'
  },
  activityList: {
    padding: '1rem'
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    borderRadius: '8px',
    transition: 'background 0.2s'
  },
  activityIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    background: '#f7fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  activityContent: {
    flex: 1
  },
  activityAction: {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: '#2d3748'
  },
  activityTime: {
    fontSize: '0.8rem',
    color: '#718096',
    marginTop: '0.25rem'
  },
  actionsCard: {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
    padding: '1.5rem'
  },
  actionsTitle: {
    margin: '0 0 1.5rem',
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#1f2937'
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  actionButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};