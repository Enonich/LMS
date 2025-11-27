import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = `${window.location.origin}/api`;

export default function AdminSchedulesTab({ token, user }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    loadSchedules();
    loadDepartments();
  }, []);

  async function loadSchedules() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin/quiz-schedule/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedules(res.data);
    } catch (error) {
      console.error('Error loading schedules:', error);
      alert('Failed to load schedules');
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

  async function deleteSchedule(scheduleId) {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;

    try {
      await axios.delete(`${API_BASE}/admin/quiz-schedule/${scheduleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadSchedules();
      alert('Schedule deleted successfully');
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule');
    }
  }

  async function toggleSchedule(scheduleId, currentActive) {
    try {
      await axios.put(`${API_BASE}/admin/quiz-schedule/${scheduleId}`, {
        active: !currentActive
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadSchedules();
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Failed to update schedule');
    }
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div>
      {/* Header with Actions */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.sectionTitle}>Quiz Schedule Management</h3>
          <p style={styles.sectionSubtitle}>
            {schedules.filter(s => s.active).length} active schedules
          </p>
        </div>
        <button
          style={styles.primaryButton}
          onClick={() => setShowCreateModal(true)}
        >
          <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
          Create Schedule
        </button>
      </div>

      {/* Schedules Table */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: '#667eea' }}></i>
          <div style={{ color: '#718096', marginTop: '1rem' }}>Loading schedules...</div>
        </div>
      ) : (
        <div style={styles.tableCard}>
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span>Time</span>
              <span>Days</span>
              <span>Department</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {schedules.length === 0 ? (
              <div style={styles.emptyState}>
                <i className="fas fa-calendar-plus" style={{ fontSize: '3rem', color: '#cbd5e0', marginBottom: '1rem' }}></i>
                <p style={{ color: '#718096' }}>No quiz schedules configured</p>
                <button
                  style={styles.primaryButton}
                  onClick={() => setShowCreateModal(true)}
                >
                  <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
                  Create First Schedule
                </button>
              </div>
            ) : (
              schedules.map(schedule => (
                <div key={schedule._id} style={styles.tableRow}>
                  <span style={styles.timeCell}>
                    <i className="fas fa-clock" style={{ marginRight: '0.5rem', color: '#667eea' }}></i>
                    {schedule.quiz_time}
                  </span>
                  <span style={styles.daysCell}>
                    {schedule.days_of_week.map(day => dayNames[day]).join(', ')}
                  </span>
                  <span style={styles.departmentCell}>
                    {schedule.department || 'All Departments'}
                  </span>
                  <span style={styles.statusCell}>
                    <button
                      onClick={() => toggleSchedule(schedule._id, schedule.active)}
                      style={{
                        ...styles.statusButton,
                        ...(schedule.active ? styles.statusActive : styles.statusInactive)
                      }}
                    >
                      {schedule.active ? 'Active' : 'Inactive'}
                    </button>
                  </span>
                  <div style={styles.actionsCell}>
                    <button
                      style={styles.actionButton}
                      onClick={() => setEditingSchedule(schedule)}
                      title="Edit Schedule"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      style={styles.dangerButton}
                      onClick={() => deleteSchedule(schedule._id)}
                      title="Delete Schedule"
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

      {/* Create/Edit Schedule Modal */}
      {(showCreateModal || editingSchedule) && (
        <ScheduleModal
          token={token}
          schedule={editingSchedule}
          departments={departments}
          onClose={() => {
            setShowCreateModal(false);
            setEditingSchedule(null);
          }}
          onSuccess={() => {
            loadSchedules();
            setShowCreateModal(false);
            setEditingSchedule(null);
          }}
        />
      )}
    </div>
  );
}

function ScheduleModal({ token, schedule, departments, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    quiz_time: '09:00',
    days_of_week: [1], // Monday by default
    department: '',
    active: true
  });
  const [loading, setLoading] = useState(false);
  const isEditing = !!schedule;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (schedule) {
      setFormData({
        quiz_time: schedule.quiz_time || '09:00',
        days_of_week: schedule.days_of_week || [1],
        department: schedule.department || '',
        active: schedule.active !== false
      });
    } else {
      setFormData({
        quiz_time: '09:00',
        days_of_week: [1],
        department: '',
        active: true
      });
    }
  }, [schedule]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        await axios.put(`${API_BASE}/admin/quiz-schedule/${schedule._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Schedule updated successfully!');
      } else {
        await axios.post(`${API_BASE}/admin/quiz-schedule/create`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Schedule created successfully!');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert(error.response?.data?.detail || 'Failed to save schedule');
    } finally {
      setLoading(false);
    }
  }

  function toggleDay(dayIndex) {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(dayIndex)
        ? prev.days_of_week.filter(d => d !== dayIndex)
        : [...prev.days_of_week, dayIndex].sort()
    }));
  }

  return (
    <div style={modalStyles.backdrop}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <h3 style={modalStyles.title}>
            {isEditing ? 'Edit Quiz Schedule' : 'Create Quiz Schedule'}
          </h3>
          <button onClick={onClose} style={modalStyles.closeButton}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={modalStyles.form}>
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Quiz Time *</label>
            <input
              type="time"
              value={formData.quiz_time}
              onChange={(e) => setFormData({...formData, quiz_time: e.target.value})}
              style={modalStyles.input}
              required
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Days of Week *</label>
            <div style={modalStyles.daysGrid}>
              {dayNames.map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(index)}
                  style={{
                    ...modalStyles.dayButton,
                    ...(formData.days_of_week.includes(index) ? modalStyles.dayButtonActive : {})
                  }}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Department (Optional)</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              style={modalStyles.select}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.name} value={dept.name}>{dept.name}</option>
              ))}
            </select>
            <p style={modalStyles.help}>
              Leave empty to apply to all departments, or select specific department.
            </p>
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
                style={modalStyles.checkbox}
              />
              Active Schedule
            </label>
          </div>

          <div style={modalStyles.actions}>
            <button type="button" onClick={onClose} style={modalStyles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={modalStyles.submitButton} disabled={loading}>
              {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Schedule' : 'Create Schedule')}
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
    gridTemplateColumns: '1fr 2fr 1.5fr 1fr 1fr',
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
    gridTemplateColumns: '1fr 2fr 1.5fr 1fr 1fr',
    gap: '1rem',
    padding: '1rem 1.5rem',
    alignItems: 'center',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '0.9rem'
  },
  timeCell: {
    fontWeight: 500,
    color: '#2d3748',
    display: 'flex',
    alignItems: 'center'
  },
  daysCell: {
    color: '#718096',
    fontSize: '0.85rem'
  },
  departmentCell: {
    color: '#718096'
  },
  statusCell: {
    display: 'flex',
    justifyContent: 'center'
  },
  statusButton: {
    padding: '0.25rem 0.75rem',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  statusActive: {
    background: '#d4f4dd',
    color: '#2f855a'
  },
  statusInactive: {
    background: '#fed7d7',
    color: '#c53030'
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
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '0.5rem'
  },
  dayButton: {
    padding: '0.5rem',
    border: '2px solid #e5e7eb',
    borderRadius: '6px',
    background: '#f7fafc',
    color: '#4a5568',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  dayButtonActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    borderColor: '#667eea'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#2d3748',
    cursor: 'pointer'
  },
  checkbox: {
    width: '16px',
    height: '16px'
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