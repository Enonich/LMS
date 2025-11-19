import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
const API_BASE = `${window.location.origin}/api`;

export default function SchedulePage(){
  const { token, user } = useAuth();
  const [time, setTime] = useState('');
  const [days, setDays] = useState([]);
  const [status, setStatus] = useState(null);

  function toggleDay(d){ setDays(prev => prev.includes(d)? prev.filter(x=>x!==d): [...prev,d]); }

  async function submit(e){
    e.preventDefault(); setStatus(null);
    try {
      await axios.post(`${API_BASE}/schedule`, { user_id: user.id, question_time: time, days_of_week: days }, { headers:{ Authorization:`Bearer ${token}` } });
      setStatus('Schedule saved');
    } catch(e){ setStatus('Failed to save'); }
  }

  return (
    <div style={{ background:'#ffffff', borderRadius:'20px', padding:'2rem', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', minHeight:'calc(100vh - 4rem)' }}>
      <h2 style={title}>⚙️ Quiz Schedule</h2>
      <form onSubmit={submit} style={card}>
        {status && <div style={{ fontSize:'0.7rem', marginBottom:'0.5rem', color: status.includes('Failed')? '#e53e3e':'#2f855a' }}>{status}</div>}
        <label style={lbl}>Question Time</label>
        <input type="time" value={time} onChange={e=>setTime(e.target.value)} required style={input} />
        <label style={lbl}>Days of Week</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((n,i)=>(
            <button type="button" key={i} onClick={()=>toggleDay(i)} style={{ ...dayBtn, background: days.includes(i)? 'linear-gradient(135deg,#667eea,#764ba2)':'#e2e8f0', color: days.includes(i)? '#fff':'#4a5568' }}>{n}</button>
          ))}
        </div>
        <button type="submit" style={btnPrimary}>Set Schedule</button>
      </form>
    </div>
  );
}

const title = { fontSize:'1.9rem', fontWeight:700, margin:'0 0 1.25rem', color:'#1f2937' };
const card = { background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', padding:'1.25rem', maxWidth:'520px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' };
const lbl = { display:'block', fontSize:'0.75rem', fontWeight:600, color:'#4a5568', marginTop:'0.75rem' };
const input = { width:'100%', padding:'0.65rem', border:'2px solid #e2e8f0', borderRadius:'8px', marginTop:'0.35rem' };
const dayBtn = { border:'none', padding:'0.5rem 0.75rem', borderRadius:'8px', cursor:'pointer', fontSize:'0.65rem' };
const btnPrimary = { marginTop:'1rem', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', border:'none', padding:'0.6rem 1rem', borderRadius:'8px', fontSize:'0.75rem', cursor:'pointer' };
