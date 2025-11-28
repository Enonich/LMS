import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
const API_BASE = `${window.location.origin}/api`;

export default function QuizPage(){
  const { token, user } = useAuth();
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ total: 0, correct: 0, streak: 0 });
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState('');

  useEffect(()=>{ 
    if(token){ 
      load(); 
      loadStats();
    } 
  }, [token]);

  function loadStats(){
    const saved = localStorage.getItem(`quizStats_${user.id}`);
    if(saved){
      setStats(JSON.parse(saved));
    }
    const savedHistory = localStorage.getItem(`quizHistory_${user.id}`);
    if(savedHistory){
      setHistory(JSON.parse(savedHistory));
    }
  }

  function saveStats(correct, correctAnswer){
    const newStats = {
      total: stats.total + 1,
      correct: stats.correct + (correct ? 1 : 0),
      streak: correct ? stats.streak + 1 : 0
    };
    setStats(newStats);
    localStorage.setItem(`quizStats_${user.id}`, JSON.stringify(newStats));
    
    const newHistory = [{
      question: question.question_text,
      userAnswer: selected,
      correct,
      correctAnswer: correctAnswer,
      timestamp: new Date().toISOString()
    }, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem(`quizHistory_${user.id}`, JSON.stringify(newHistory));
  }

  async function load(){
    setLoading(true);
    try { 
      console.log('Fetching question from:', `${API_BASE}/questions/daily`);
      const res= await axios.get(`${API_BASE}/questions/daily`, { 
        headers:{ Authorization:`Bearer ${token}` } 
      }); 
      console.log('Question loaded:', res.data);
      setQuestion(res.data); 
    } catch(e){ 
      console.error('Error loading question:', e.response?.data || e.message);
      if (e.response?.status === 404) {
        console.warn('No questions available for your department:', user?.department);
      }
    } finally { 
      setLoading(false); 
    }
  }

  async function submit(){
    if(!selected || !selected.trim()) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/questions/answer`, { 
        question_id: question.question_id, 
        user_answer: selected 
      }, { 
        headers:{ Authorization:`Bearer ${token}` } 
      });
      
      if (res.data && typeof res.data.correct !== 'undefined') {
        setResult(res.data);
        saveStats(res.data.correct, res.data.correct_answer);
      } else {
        console.error('Invalid response format:', res.data);
        setResult({
          correct: false,
          correct_answer: 'Unknown',
          explanation: 'Received invalid response from server. Please try again.'
        });
      }
    } catch(e){ 
      console.error('Error submitting answer:', e.response?.data || e.message);
      // Show error in UI - don't try to access question.answer
      const errorMsg = e.response?.data?.detail || 'Failed to submit answer. Please try again.';
      setResult({
        correct: false,
        correct_answer: 'Unable to verify',
        explanation: errorMsg
      });
    } finally {
      setSubmitting(false);
    }
  }

  function nextQuestion(){
    setResult(null); 
    setSelected(null); 
    load();
  }

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>
            <i className="fas fa-brain" style={{ marginRight:'0.75rem' }}></i>
            Daily Quiz
          </h2>
          <p style={styles.subtitle}>
            Test your knowledge with questions from {user.department}
          </p>
        </div>
        <button 
          onClick={()=>setShowHistory(!showHistory)} 
          style={styles.historyBtn}
        >
          <i className={`fas fa-${showHistory ? 'quiz' : 'history'}`} style={{ marginRight:'0.5rem' }}></i>
          {showHistory ? 'Back to Quiz' : 'View History'}
        </button>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📊</div>
          <div style={styles.statValue}>{stats.total}</div>
          <div style={styles.statLabel}>Total Quizzes</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div style={styles.statValue}>{stats.correct}</div>
          <div style={styles.statLabel}>Correct Answers</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🎯</div>
          <div style={styles.statValue}>{accuracy}%</div>
          <div style={styles.statLabel}>Accuracy</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🔥</div>
          <div style={styles.statValue}>{stats.streak}</div>
          <div style={styles.statLabel}>Current Streak</div>
        </div>
      </div>

      {showHistory ? (
        <div style={styles.historyContainer}>
          <h3 style={styles.historyTitle}>Recent Quiz History</h3>
          {history.length === 0 ? (
            <div style={styles.emptyState}>
              <i className="fas fa-inbox" style={{ fontSize:'3rem', color:'#cbd5e0', marginBottom:'1rem' }}></i>
              <p>No quiz history yet. Start answering questions!</p>
            </div>
          ) : (
            <div style={styles.historyList}>
              {history.map((item, idx) => (
                <div key={idx} style={styles.historyItem}>
                  <div style={styles.historyHeader}>
                    <span style={{...styles.historyBadge, background: item.correct ? '#48bb78' : '#f56565'}}>
                      {item.correct ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                    <span style={styles.historyDate}>
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div style={styles.historyQuestion}>{item.question}</div>
                  <div style={styles.historyAnswers}>
                    <div>
                      <strong style={{ color:'#4a5568' }}>Your answer:</strong> {item.userAnswer}
                    </div>
                    {!item.correct && (
                      <div>
                        <strong style={{ color:'#48bb78' }}>Correct answer:</strong> {item.correctAnswer}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {loading && (
            <div style={styles.loadingState}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize:'2rem', color:'#667eea', marginBottom:'1rem' }}></i>
              <p>Loading question...</p>
            </div>
          )}
          
          {!loading && !question && (
            <div style={styles.emptyState}>
              <i className="fas fa-question-circle" style={{ fontSize:'3rem', color:'#cbd5e0', marginBottom:'1rem' }}></i>
              <p>No questions available for your department.</p>
              <button onClick={load} style={styles.retryBtn}>
                <i className="fas fa-sync-alt" style={{ marginRight:'0.5rem' }}></i>
                Try Again
              </button>
            </div>
          )}
          
          {question && !result && (
            <div style={styles.questionCard}>
              <div style={styles.questionHeader}>
                <span style={styles.questionBadge}>
                  <i className="fas fa-graduation-cap" style={{ marginRight:'0.5rem' }}></i>
                  {question.department}
                </span>
                <span style={styles.questionType}>
                  {question.question_type}
                </span>
              </div>
              
              <div style={styles.questionText}>{question.question_text}</div>
              
              {question.options && question.options.length > 0 ? (
                <div style={styles.optionsContainer}>
                  {question.options.map((opt, idx) => (
                    <button 
                      key={opt} 
                      onClick={()=>!submitting && setSelected(opt)} 
                      disabled={submitting}
                      style={{
                        ...styles.optionBtn,
                        background: selected===opt ? 'rgba(102,126,234,0.1)' : '#fff',
                        borderColor: selected===opt ? '#667eea' : '#e2e8f0',
                        borderWidth: selected===opt ? '2px' : '1px',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        opacity: submitting ? 0.6 : 1
                      }}
                    >
                      <span style={styles.optionLetter}>{String.fromCharCode(65 + idx)}</span>
                      <span>{opt}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={styles.inputContainer}>
                  <input 
                    type="text" 
                    value={selected || ''} 
                    onChange={e=>setSelected(e.target.value)} 
                    onKeyPress={e => e.key === 'Enter' && !submitting && submit()}
                    disabled={submitting}
                    style={{
                      ...styles.textInput,
                      cursor: submitting ? 'not-allowed' : 'text',
                      opacity: submitting ? 0.6 : 1
                    }} 
                    placeholder="Type your answer here..."
                  />
                </div>
              )}
              
              <button 
                onClick={submit} 
                disabled={!selected || !selected.trim() || submitting} 
                style={{
                  ...styles.submitBtn,
                  opacity: (!selected || !selected.trim() || submitting) ? 0.5 : 1,
                  cursor: (!selected || !selected.trim() || submitting) ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight:'0.5rem' }}></i>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane" style={{ marginRight:'0.5rem' }}></i>
                    Submit Answer
                  </>
                )}
              </button>
            </div>
          )}
          
          {result && (
            <div style={styles.resultCard}>
              <div style={{...styles.resultHeader, background: result.correct ? 'linear-gradient(135deg,#48bb78,#38a169)' : 'linear-gradient(135deg,#f56565,#e53e3e)'}}>
                <div style={styles.resultIcon}>
                  {result.correct ? '🎉' : '💡'}
                </div>
                <h3 style={styles.resultTitle}>
                  {result.correct ? 'Excellent!' : 'Not Quite Right'}
                </h3>
                <p style={styles.resultSubtitle}>
                  {result.correct ? 'You got it correct!' : `The correct answer is: ${result.correct_answer}`}
                </p>
              </div>
              
              {result.explanation && (
                <div style={styles.explanation}>
                  <div style={styles.explanationHeader}>
                    <i className="fas fa-lightbulb" style={{ marginRight:'0.5rem' }}></i>
                    Explanation
                  </div>
                  <div style={styles.explanationText}>{result.explanation}</div>
                </div>
              )}
              
              <div style={styles.resultActions}>
                <button onClick={nextQuestion} style={styles.nextBtn}>
                  <i className="fas fa-arrow-right" style={{ marginRight:'0.5rem' }}></i>
                  Next Question
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    background:'#ffffff',
    borderRadius:'16px',
    padding:'2rem',
    boxShadow:'0 2px 8px rgba(0,0,0,0.1)',
    maxHeight:'calc(100vh - 3rem)',
    overflowY:'auto',
    border:'1px solid #e5e7eb'
  },
  header: {
    display:'flex',
    justifyContent:'space-between',
    alignItems:'flex-start',
    marginBottom:'1rem',
    flexWrap:'wrap',
    gap:'0.75rem'
  },
  title: {
    fontSize:'1.75rem',
    fontWeight:800,
    margin:0,
    color:'#1f2937',
    display:'flex',
    alignItems:'center',
    letterSpacing:'-0.02em'
  },
  subtitle: {
    fontSize:'1rem',
    color:'#718096',
    margin:'0.5rem 0 0 0',
    fontWeight:500,
    letterSpacing:'-0.01em'
  },
  historyBtn: {
    padding:'0.75rem 1.5rem',
    background:'#f7fafc',
    border:'1px solid #e2e8f0',
    borderRadius:'10px',
    cursor:'pointer',
    fontSize:'0.9rem',
    fontWeight:500,
    color:'#4a5568',
    transition:'all 0.2s',
    display:'flex',
    alignItems:'center'
  },
  statsGrid: {
    display:'grid',
    gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))',
    gap:'0.75rem',
    marginBottom:'1rem'
  },
  statCard: {
    background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding:'1rem',
    borderRadius:'12px',
    textAlign:'center',
    color:'#fff',
    boxShadow:'0 4px 15px rgba(102,126,234,0.3)'
  },
  statIcon: {
    fontSize:'1.5rem',
    marginBottom:'0.25rem'
  },
  statValue: {
    fontSize:'1.5rem',
    fontWeight:700,
    marginBottom:'0.15rem'
  },
  statLabel: {
    fontSize:'0.85rem',
    opacity:0.9
  },
  questionCard: {
    background:'#fff',
    border:'1px solid #e5e7eb',
    borderRadius:'16px',
    padding:'1.5rem',
    maxWidth:'800px',
    margin:'0 auto',
    boxShadow:'0 2px 8px rgba(0,0,0,0.05)'
  },
  questionHeader: {
    display:'flex',
    justifyContent:'space-between',
    alignItems:'center',
    marginBottom:'1rem',
    flexWrap:'wrap',
    gap:'0.5rem'
  },
  questionBadge: {
    background:'rgba(102,126,234,0.1)',
    color:'#667eea',
    padding:'0.5rem 1rem',
    borderRadius:'20px',
    fontSize:'0.85rem',
    fontWeight:600,
    display:'flex',
    alignItems:'center'
  },
  questionType: {
    color:'#718096',
    fontSize:'0.85rem',
    fontStyle:'italic'
  },
  questionText: {
    fontSize:'1.2rem',
    fontWeight:700,
    color:'#1f2937',
    marginBottom:'1.5rem',
    lineHeight:1.6,
    letterSpacing:'-0.01em'
  },
  optionsContainer: {
    display:'flex',
    flexDirection:'column',
    gap:'0.6rem',
    marginBottom:'1rem'
  },
  optionBtn: {
    textAlign:'left',
    padding:'0.85rem 1rem',
    border:'1px solid #e2e8f0',
    borderRadius:'12px',
    cursor:'pointer',
    fontSize:'0.95rem',
    color:'#1f2937',
    background:'#fff',
    transition:'all 0.2s',
    display:'flex',
    alignItems:'center',
    gap:'0.75rem',
    fontWeight:500
  },
  optionLetter: {
    background:'#667eea',
    color:'#fff',
    width:'32px',
    height:'32px',
    borderRadius:'50%',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    fontWeight:700,
    fontSize:'0.9rem',
    flexShrink:0
  },
  inputContainer: {
    marginBottom:'1.5rem'
  },
  textInput: {
    width:'100%',
    padding:'1rem',
    border:'2px solid #e2e8f0',
    borderRadius:'12px',
    fontSize:'1rem',
    outline:'none',
    transition:'border-color 0.2s',
    boxSizing:'border-box',
    background:'#fff'
  },
  submitBtn: {
    width:'100%',
    background:'linear-gradient(135deg,#667eea,#764ba2)',
    color:'#fff',
    border:'none',
    padding:'0.85rem',
    borderRadius:'12px',
    fontSize:'0.95rem',
    fontWeight:600,
    cursor:'pointer',
    transition:'all 0.2s',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    boxShadow:'0 4px 15px rgba(102,126,234,0.4)'
  },
  resultCard: {
    background:'#fff',
    border:'1px solid #e5e7eb',
    borderRadius:'16px',
    maxWidth:'800px',
    margin:'0 auto',
    overflow:'hidden',
    boxShadow:'0 4px 20px rgba(0,0,0,0.1)'
  },
  resultHeader: {
    padding:'1.5rem',
    textAlign:'center',
    color:'#fff'
  },
  resultIcon: {
    fontSize:'3rem',
    marginBottom:'0.5rem'
  },
  resultTitle: {
    fontSize:'1.5rem',
    fontWeight:700,
    margin:'0 0 0.5rem'
  },
  resultSubtitle: {
    fontSize:'1.1rem',
    margin:0,
    opacity:0.95,
    fontWeight:500
  },
  explanation: {
    padding:'1.25rem',
    background:'#f7fafc'
  },
  explanationHeader: {
    fontSize:'1rem',
    fontWeight:600,
    color:'#2d3748',
    marginBottom:'0.75rem',
    display:'flex',
    alignItems:'center'
  },
  explanationText: {
    fontSize:'0.95rem',
    color:'#4a5568',
    lineHeight:1.7
  },
  resultActions: {
    padding:'1rem 1.25rem'
  },
  nextBtn: {
    width:'100%',
    background:'linear-gradient(135deg,#48bb78,#38a169)',
    color:'#fff',
    border:'none',
    padding:'0.85rem',
    borderRadius:'12px',
    fontSize:'0.95rem',
    fontWeight:600,
    cursor:'pointer',
    transition:'all 0.2s',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    boxShadow:'0 4px 15px rgba(72,187,120,0.4)'
  },
  loadingState: {
    textAlign:'center',
    padding:'2rem 1rem',
    color:'#718096'
  },
  emptyState: {
    textAlign:'center',
    padding:'2rem 1rem',
    color:'#718096'
  },
  retryBtn: {
    marginTop:'1rem',
    padding:'0.75rem 1.5rem',
    background:'#667eea',
    color:'#fff',
    border:'none',
    borderRadius:'10px',
    cursor:'pointer',
    fontSize:'0.9rem',
    fontWeight:500,
    display:'inline-flex',
    alignItems:'center'
  },
  historyContainer: {
    maxWidth:'900px',
    margin:'0 auto'
  },
  historyTitle: {
    fontSize:'1.25rem',
    fontWeight:700,
    color:'#1f2937',
    marginBottom:'1rem'
  },
  historyList: {
    display:'flex',
    flexDirection:'column',
    gap:'0.75rem',
    maxHeight:'60vh',
    overflowY:'auto'
  },
  historyItem: {
    background:'#fff',
    border:'1px solid #e5e7eb',
    borderRadius:'12px',
    padding:'1rem',
    boxShadow:'0 2px 4px rgba(0,0,0,0.05)'
  },
  historyHeader: {
    display:'flex',
    justifyContent:'space-between',
    alignItems:'center',
    marginBottom:'0.75rem',
    flexWrap:'wrap',
    gap:'0.5rem'
  },
  historyBadge: {
    padding:'0.4rem 0.8rem',
    borderRadius:'20px',
    fontSize:'0.8rem',
    fontWeight:600,
    color:'#fff'
  },
  historyDate: {
    fontSize:'0.8rem',
    color:'#718096'
  },
  historyQuestion: {
    fontSize:'0.95rem',
    fontWeight:600,
    color:'#2d3748',
    marginBottom:'0.75rem'
  },
  historyAnswers: {
    fontSize:'0.9rem',
    color:'#4a5568',
    display:'flex',
    flexDirection:'column',
    gap:'0.5rem'
  }
};
