import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
const API_BASE = `${window.location.origin}/api`;

export default function ProgressPage(){
  const { token } = useAuth();
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

  return (
    <div style={{ background:'#ffffff', borderRadius:'20px', padding:'2rem', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', minHeight:'calc(100vh - 4rem)' }}>
      <h2 style={title}>📈 My Progress</h2>
      {loading && <div>Loading...</div>}
      {!loading && materials.length===0 && <div>No enrolled materials.</div>}
      <div style={grid}>
        {materials.map(m => (
          <MaterialProgress key={m.id} material={m} token={token} onUpdate={()=>refreshProgress(m.id)} />
        ))}
      </div>
    </div>
  );
}

function MaterialProgress({ material, token, onUpdate }){
  const [progress, setProgress] = useState(null);
  const API_BASE = `${window.location.origin}/api`;
  useEffect(()=>{ load(); }, []);
  async function load(){ try { const res= await axios.get(`${API_BASE}/progress/${material.id}`, { headers:{ Authorization:`Bearer ${token}` } }); setProgress(res.data); } catch(e){ } }

  async function markPage(){
    if(!progress || !progress.completed_pages) return;
    // naive next page assumption
    const next = progress.completed_pages.length + 1;
    try { await axios.put(`${API_BASE}/progress/${material.id}/page/${next}`, null, { headers:{ Authorization:`Bearer ${token}` } }); load(); onUpdate(); } catch(e){ alert('Mark page failed'); }
  }

  async function markComplete(){
    try { await axios.put(`${API_BASE}/progress/${material.id}/complete`, null, { headers:{ Authorization:`Bearer ${token}` } }); load(); onUpdate(); } catch(e){ alert('Complete failed'); }
  }

  const pct = progress?.progress_percentage || 0;
  return (
    <div style={card}>
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <h3 style={{ margin:'0 0 .25rem', fontSize:'1.05rem' }}>{material.title}</h3>
        <div style={{ fontSize:'0.7rem', color:'#718096' }}>{pct}%</div>
      </div>
      <div style={barOuter}><div style={{ ...barInner, width:`${pct}%` }} /></div>
      <div style={{ fontSize:'0.6rem', color:'#4a5568', marginBottom:'.5rem' }}>{progress?.completed_pages?.length || 0} pages completed</div>
      <div style={{ display:'flex', gap:'.4rem' }}>
        <button style={btnPrimary} onClick={markPage}>Mark Page</button>
        <button style={btnSecondary} onClick={markComplete}>Complete</button>
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
const btnSecondary = { background:'#4a5568', color:'#fff', border:'none', padding:'0.4rem 0.6rem', borderRadius:'8px', fontSize:'.6rem', cursor:'pointer' };
