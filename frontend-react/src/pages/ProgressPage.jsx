import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
const API_BASE = `${window.location.origin}/api`;

export default function ProgressPage(){
  const { token } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ if(token){ load(); } }, [token]);

  async function load(){
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/materials/enrolled`, { headers:{ Authorization:`Bearer ${token}` } });
      setMaterials(res.data);
    } catch(e){ console.error(e); } finally { setLoading(false); }
  }

  async function refreshProgress(id){
    // placeholder for future granular refresh
    load();
  }

  const continueLearning = (material) => {
    // Navigate to materials page with the specific material
    navigate('/materials', { state: { selectedMaterial: material } });
  };

  return (
    <div style={{ background:'#ffffff', borderRadius:'20px', padding:'2rem', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', minHeight:'calc(100vh - 4rem)' }}>
      <h2 style={title}>📈 My Progress</h2>
      {loading && <div>Loading...</div>}
      {!loading && materials.length===0 && <div>No enrolled materials.</div>}
      <div style={grid}>
        {materials.map(m => (
          <MaterialProgress key={m.id} material={m} token={token} onUpdate={()=>refreshProgress(m.id)} onContinue={() => continueLearning(m)} />
        ))}
      </div>
    </div>
  );
}

function MaterialProgress({ material, token, onUpdate, onContinue }){
  const [progress, setProgress] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const API_BASE = `${window.location.origin}/api`;
  
  useEffect(()=>{ load(); }, []);
  
  async function load(){ 
    try { 
      const res = await axios.get(`${API_BASE}/progress/${material.id}`, { headers:{ Authorization:`Bearer ${token}` } }); 
      setProgress(res.data); 
    } catch(e){ } 
  }

  async function markComplete(){
    try { 
      await axios.put(`${API_BASE}/progress/${material.id}/complete`, null, { headers:{ Authorization:`Bearer ${token}` } }); 
      load(); 
      onUpdate(); 
    } catch(e){ 
      alert('Complete failed'); 
    }
  }

  const pct = progress?.progress_percentage || 0;
  const isCompleted = pct >= 100;

  return (
    <div style={card}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin:'0 0 .25rem', fontSize:'1.05rem' }}>{material.title}</h3>
          <div style={{ fontSize:'0.7rem', color:'#718096', marginBottom: '0.5rem' }}>
            {material.content_type} • {isCompleted ? 'Completed' : 'In Progress'}
          </div>
        </div>
        <div style={{ fontSize:'0.7rem', color:'#718096', textAlign:'right' }}>
          {pct}% complete
        </div>
      </div>
      
      <div style={barOuter}>
        <div style={{ ...barInner, width:`${pct}%` }} />
      </div>
      
      <div style={{ fontSize:'0.6rem', color:'#4a5568', marginBottom:'.5rem' }}>
        {material.content_type === 'pdf' ? 
          `Page ${Math.floor((pct / 100) * (material.total_pages || 1))}/${material.total_pages || '?'}` :
          material.content_type === 'video' ? 
          'Watch the full video to complete' :
          'Complete the material to unlock quiz'
        }
      </div>
      
      <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>
        {!isCompleted && (
          <>
            <button style={btnContinue} onClick={onContinue}>
              <i className="fas fa-play" style={{ marginRight: '0.25rem' }}></i>
              Continue Learning
            </button>
            <button style={btnPrimary} onClick={markComplete}>
              Mark as Complete
            </button>
          </>
        )}
        {isCompleted && (
          <button style={btnQuiz} onClick={() => setShowQuiz(true)}>
            <i className="fas fa-question-circle" style={{ marginRight: '0.25rem' }}></i>
            Take Quiz
          </button>
        )}
      </div>
      
      {showQuiz && (
        <QuizModal 
          material={material} 
          token={token} 
          onClose={() => setShowQuiz(false)} 
        />
      )}
    </div>
  );
}

function QuizModal({ material, token, onClose }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  
  const API_BASE = `${window.location.origin}/api`;
  
  useEffect(() => {
    loadQuiz();
  }, []);
  
  async function loadQuiz() {
    try {
      // For now, we'll create a simple quiz. Later this can be enhanced with AI-generated quizzes
      const mockQuiz = {
        questions: [
          {
            id: 1,
            question: `What is the main topic of "${material.title}"?`,
            options: [
              "Option A",
              "Option B", 
              "Option C",
              "Option D"
            ],
            correct: 0
          },
          {
            id: 2,
            question: "Which of the following concepts was covered?",
            options: [
              "Concept 1",
              "Concept 2",
              "Concept 3", 
              "Concept 4"
            ],
            correct: 1
          }
        ]
      };
      setQuiz(mockQuiz);
    } catch (e) {
      console.error('Failed to load quiz', e);
    } finally {
      setLoading(false);
    }
  }
  
  const handleAnswer = (questionId, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };
  
  const submitQuiz = () => {
    if (!quiz) return;
    
    let correct = 0;
    quiz.questions.forEach(q => {
      if (answers[q.id] === q.correct) {
        correct++;
      }
    });
    
    const finalScore = Math.round((correct / quiz.questions.length) * 100);
    setScore(finalScore);
    setSubmitted(true);
  };
  
  if (loading) {
    return (
      <div style={{
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
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#667eea', marginBottom: '1rem' }}></i>
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{
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
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, color: '#1f2937' }}>Quiz: {material.title}</h3>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#6b7280'
          }}>×</button>
        </div>
        
        {!submitted ? (
          <div>
            {quiz?.questions.map((q, index) => (
              <div key={q.id} style={{ marginBottom: '2rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
                  {index + 1}. {q.question}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {q.options.map((option, optIndex) => (
                    <label key={optIndex} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem',
                      border: `2px solid ${answers[q.id] === optIndex ? '#667eea' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: answers[q.id] === optIndex ? '#f3f4f6' : 'white'
                    }}>
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={optIndex}
                        checked={answers[q.id] === optIndex}
                        onChange={() => handleAnswer(q.id, optIndex)}
                        style={{ marginRight: '0.75rem' }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button 
                onClick={submitQuiz}
                disabled={Object.keys(answers).length !== quiz?.questions.length}
                style={{
                  background: Object.keys(answers).length === quiz?.questions.length ? 
                    'linear-gradient(135deg,#667eea,#764ba2)' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  cursor: Object.keys(answers).length === quiz?.questions.length ? 'pointer' : 'not-allowed'
                }}
              >
                Submit Quiz
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '4rem',
              color: score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444',
              marginBottom: '1rem'
            }}>
              {score >= 70 ? '🎉' : score >= 50 ? '👍' : '💪'}
            </div>
            <h3 style={{ color: '#1f2937', marginBottom: '1rem' }}>
              Quiz Complete!
            </h3>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444',
              marginBottom: '1rem'
            }}>
              {score}%
            </div>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              {score >= 70 ? 
                'Excellent work! You have a good understanding of the material.' :
                score >= 50 ? 
                'Good job! You might want to review some concepts.' :
                'Keep studying! Practice makes perfect.'
              }
            </p>
            <button 
              onClick={onClose}
              style={{
                background: 'linear-gradient(135deg,#667eea,#764ba2)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const title = { fontSize:'1.9rem', fontWeight:700, margin:'0 0 1.25rem', color:'#1f2937' };
const grid = { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1rem' };
const card = { background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', padding:'1rem', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' };
const barOuter = { width:'100%', height:'8px', background:'#e2e8f0', borderRadius:'4px', overflow:'hidden', margin:'0.4rem 0' };
const barInner = { height:'100%', background:'linear-gradient(135deg,#667eea,#764ba2)', transition:'width .3s' };
const btnPrimary = { background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', border:'none', padding:'0.4rem 0.6rem', borderRadius:'8px', fontSize:'.6rem', cursor:'pointer' };
const btnContinue = { background:'linear-gradient(135deg,#48bb78,#38a169)', color:'#fff', border:'none', padding:'0.4rem 0.6rem', borderRadius:'8px', fontSize:'.6rem', cursor:'pointer' };
const btnQuiz = { background:'linear-gradient(135deg,#9f7aea,#667eea)', color:'#fff', border:'none', padding:'0.4rem 0.6rem', borderRadius:'8px', fontSize:'.6rem', cursor:'pointer' };
