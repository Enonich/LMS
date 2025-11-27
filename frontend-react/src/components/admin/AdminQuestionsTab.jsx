import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = `${window.location.origin}/api`;

export default function AdminQuestionsTab({ token, user }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterDept, setFilterDept] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filter changes
    loadQuestions(filterDept, 1);
  }, [filterDept]);

  useEffect(() => {
    if (currentPage > 1 || totalPages > 1) { // Avoid loading on initial render
      loadQuestions(filterDept, currentPage);
    }
  }, [currentPage]);

  async function loadQuestions(dept = 'all', page = 1) {
    setLoading(true);
    try {
      const params = {};
      if (dept !== 'all') params.department = dept;
      params.page = page;
      params.limit = 10; // Fixed limit for now
      
      const res = await axios.get(`${API_BASE}/admin/questions/all`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setQuestions(res.data.questions);
      setTotalQuestions(res.data.total);
      setTotalPages(res.data.total_pages);
      setCurrentPage(res.data.page);
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Failed to load questions');
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

  async function deleteQuestion(questionId) {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      await axios.delete(`${API_BASE}/admin/questions/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadQuestions(filterDept);
      alert('Question deleted successfully');
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question');
    }
  }

  return (
    <div>
      {/* Header with Actions */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.sectionTitle}>Question Management</h3>
          <p style={styles.sectionSubtitle}>{totalQuestions} questions found</p>
        </div>
        <div style={styles.headerActions}>
          <button
            style={styles.secondaryButton}
            onClick={() => setShowUploadModal(true)}
          >
            <i className="fas fa-upload" style={{ marginRight: '0.5rem' }}></i>
            Upload File
          </button>
          <button
            style={styles.primaryButton}
            onClick={() => setShowCreateModal(true)}
          >
            <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
            Create Question
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <label style={styles.filterLabel}>
          <i className="fas fa-filter" style={{ marginRight: '0.5rem' }}></i>
          Filter by Department:
        </label>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept.name} value={dept.name}>{dept.name}</option>
          ))}
        </select>
      </div>

      {/* Questions Table */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: '#667eea' }}></i>
          <div style={{ color: '#718096', marginTop: '1rem' }}>Loading questions...</div>
        </div>
      ) : (
        <div style={styles.tableCard}>
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span>Question</span>
              <span>Type</span>
              <span>Department</span>
              <span>Actions</span>
            </div>
            {questions.length === 0 ? (
              <div style={styles.emptyState}>
                <i className="fas fa-inbox" style={{ fontSize: '3rem', color: '#cbd5e0', marginBottom: '1rem' }}></i>
                <p style={{ color: '#718096' }}>No questions found</p>
              </div>
            ) : (
              questions.map(question => (
                <div key={question.question_id} style={styles.tableRow}>
                  <span style={styles.questionText}>
                    {question.question_text.length > 100
                      ? `${question.question_text.substring(0, 100)}...`
                      : question.question_text
                    }
                  </span>
                  <span style={styles.questionType}>
                    <span style={getTypeBadgeStyle(question.question_type)}>
                      {question.question_type}
                    </span>
                  </span>
                  <span style={styles.department}>{question.department}</span>
                  <div style={styles.actions}>
                    <button
                      style={styles.actionButton}
                      onClick={() => {/* View question details */}}
                      title="View Details"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button
                      style={styles.dangerButton}
                      onClick={() => deleteQuestion(question.question_id)}
                      title="Delete Question"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={styles.pageButton}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span style={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            style={styles.pageButton}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Create Question Modal */}
      {showCreateModal && (
        <CreateQuestionModal
          token={token}
          departments={departments}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadQuestions(filterDept);
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Upload Questions Modal */}
      {showUploadModal && (
        <UploadQuestionsModal
          token={token}
          departments={departments}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            loadQuestions(filterDept);
            setShowUploadModal(false);
          }}
        />
      )}
    </div>
  );
}

function CreateQuestionModal({ token, departments, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    question_text: '',
    options: ['', '', '', ''],
    answer: '',
    department: '',
    question_type: 'multiple_choice',
    material_id: '',
    public_text: ''
  });
  const [loading, setLoading] = useState(false);

  // Update form data when question type changes
  const handleQuestionTypeChange = (newType) => {
    let newOptions = formData.options;
    let newAnswer = formData.answer;

    if (newType === 'true_false') {
      newOptions = ['True', 'False'];
      newAnswer = newAnswer || 'True'; // Default to True if not set
    } else if (newType === 'short_answer') {
      newOptions = [];
      newAnswer = newAnswer || ''; // Clear answer for manual input
    } else if (newType === 'multiple_choice') {
      newOptions = formData.options.length === 0 ? ['', '', '', ''] : formData.options;
    }

    setFormData({
      ...formData,
      question_type: newType,
      options: newOptions,
      answer: newAnswer
    });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    // Prepare data for submission
    const submitData = {
      ...formData,
      options: formData.question_type === 'multiple_choice' ? formData.options.filter(opt => opt.trim()) : 
               formData.question_type === 'true_false' ? ['True', 'False'] : []
    };

    try {
      await axios.post(`${API_BASE}/admin/questions/create`, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Question created successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error creating question:', error);
      alert(error.response?.data?.detail || 'Failed to create question');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={modalStyles.backdrop}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <h3 style={modalStyles.title}>Create New Question</h3>
          <button onClick={onClose} style={modalStyles.closeButton}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={modalStyles.form}>
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Question Text *</label>
            <textarea
              value={formData.question_text}
              onChange={(e) => setFormData({...formData, question_text: e.target.value})}
              style={modalStyles.textarea}
              required
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Question Type *</label>
            <select
              value={formData.question_type}
              onChange={(e) => handleQuestionTypeChange(e.target.value)}
              style={modalStyles.select}
              required
            >
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True/False</option>
              <option value="short_answer">Short Answer</option>
            </select>
          </div>

          {formData.question_type === 'multiple_choice' && (
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Options *</label>
              {formData.options.map((option, index) => (
                <input
                  key={index}
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...formData.options];
                    newOptions[index] = e.target.value;
                    setFormData({...formData, options: newOptions});
                  }}
                  style={modalStyles.input}
                  placeholder={`Option ${index + 1} (e.g., A) ${index === 0 ? 'Correct answer' : ''}`}
                  required
                />
              ))}
              <p style={modalStyles.help}>
                Enter the correct answer in the first option field, then add distractors.
              </p>
            </div>
          )}

          {formData.question_type === 'true_false' && (
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Correct Answer *</label>
              <select
                value={formData.answer}
                onChange={(e) => setFormData({...formData, answer: e.target.value})}
                style={modalStyles.select}
                required
              >
                <option value="">Select Answer</option>
                <option value="True">True</option>
                <option value="False">False</option>
              </select>
            </div>
          )}

          {formData.question_type === 'short_answer' && (
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Correct Answer *</label>
              <input
                type="text"
                value={formData.answer}
                onChange={(e) => setFormData({...formData, answer: e.target.value})}
                style={modalStyles.input}
                placeholder="Enter the expected answer"
                required
              />
              <p style={modalStyles.help}>
                Enter the exact answer expected (case-sensitive).
              </p>
            </div>
          )}

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Department *</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              style={modalStyles.select}
              required
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept.name} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Material ID (Optional)</label>
            <input
              type="text"
              value={formData.material_id}
              onChange={(e) => setFormData({...formData, material_id: e.target.value})}
              style={modalStyles.input}
            />
          </div>

          <div style={modalStyles.actions}>
            <button type="button" onClick={onClose} style={modalStyles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={modalStyles.submitButton} disabled={loading}>
              {loading ? 'Creating...' : 'Create Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UploadQuestionsModal({ token, departments, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file || !department) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('department', department);

    try {
      const response = await axios.post(`${API_BASE}/admin/questions/upload-file`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert(`Successfully extracted ${response.data.extracted_count} questions and uploaded ${response.data.uploaded_count}!`);
      onSuccess();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(error.response?.data?.detail || 'Failed to upload questions');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={modalStyles.backdrop}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <h3 style={modalStyles.title}>Upload Questions from File</h3>
          <button onClick={onClose} style={modalStyles.closeButton}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={modalStyles.form}>
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Department *</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              style={modalStyles.select}
              required
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept.name} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>File *</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files[0])}
              style={modalStyles.fileInput}
              required
            />
            <p style={modalStyles.fileHelp}>
              Supported formats: PDF, DOC, DOCX. Use Science Bowl format or numbered questions.
            </p>
          </div>

          <div style={modalStyles.actions}>
            <button type="button" onClick={onClose} style={modalStyles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={modalStyles.submitButton} disabled={loading || !file}>
              {loading ? 'Uploading...' : 'Upload & Extract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getTypeBadgeStyle(type) {
  const styles = {
    multiple_choice: { background: '#d4f4dd', color: '#2f855a' },
    true_false: { background: '#fef5e7', color: '#d68910' },
    short_answer: { background: '#e6f3ff', color: '#2b6cb0' }
  };
  return {
    ...styles[type] || styles.multiple_choice,
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
  headerActions: {
    display: 'flex',
    gap: '1rem'
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
  secondaryButton: {
    background: '#f7fafc',
    color: '#4a5568',
    border: '2px solid #e2e8f0',
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
    fontFamily: 'inherit'
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
    gridTemplateColumns: '3fr 1fr 1fr 1fr',
    gap: '0.75.75rem',
    padding: '0.75rem 1rem',
    background: '#f7fafc',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#4a5568',
    borderBottom: '1px solid #e5e7eb'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '3fr 1fr 1fr 1fr',
    gap: '0.75.75rem',
    padding: '0.75rem 1rem',
    alignItems: 'center',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '0.85rem'
  },
  questionText: {
    fontWeight: 500,
    color: '#2d3748',
    lineHeight: 1.2
  },
  questionType: {
    display: 'flex',
    justifyContent: 'center'
  },
  department: {
    color: '#718096'
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'center'
  },
  actionButton: {
    background: '#e6f3ff',
    color: '#2b6cb0',
    border: 'none',
    padding: '0.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.7rem'
  },
  dangerButton: {
    background: '#fed7d7',
    color: '#c53030',
    border: 'none',
    padding: '0.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.7rem'
  },
  emptyState: {
    padding: '4rem 2rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '2rem',
    padding: '1rem'
  },
  pageButton: {
    padding: '0.5rem 1rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  },
  pageInfo: {
    fontSize: '0.9rem',
    color: '#4a5568',
    fontWeight: 500
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
    maxWidth: '600px',
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
    minHeight: '100px',
    resize: 'vertical'
  },
  select: {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontFamily: 'inherit'
  },
  fileInput: {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontFamily: 'inherit'
  },
  fileHelp: {
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