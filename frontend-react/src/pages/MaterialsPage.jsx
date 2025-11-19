import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PdfViewer from '../components/PdfViewer';
import MaterialUploadModal from '../components/MaterialUploadModal';

const API_BASE = `${window.location.origin}/api`;

export default function MaterialsPage(){
  const { token, user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMaterial, setActiveMaterial] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterDept, setFilterDept] = useState('all');

  useEffect(()=>{ if(token){ load(); } }, [token]);

  async function load(){
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/materials`, { headers:{ Authorization:`Bearer ${token}` } });
      setMaterials(res.data);
    } catch(e){ console.error(e); } finally { setLoading(false); }
  }

  async function enroll(id){
    try {
      await axios.put(`${API_BASE}/materials/${id}/enroll`, null, { headers:{ Authorization:`Bearer ${token}` } });
      load();
      alert('Enrolled');
    } catch(e){ alert(e.response?.data?.detail || 'Enroll failed'); }
  }

  async function forceDelete(id){
    if(!window.confirm('Force delete material?')) return;
    try { await axios.delete(`${API_BASE}/materials/${id}/force`, { headers:{ Authorization:`Bearer ${token}` } }); load(); } catch(e){ alert('Force delete failed'); }
  }

  async function deleteMaterial(id){
    if(!window.confirm('Delete material?')) return;
    try { await axios.delete(`${API_BASE}/materials/${id}`, { headers:{ Authorization:`Bearer ${token}` } }); load(); } catch(e){ alert('Delete failed'); }
  }

  function openMaterial(m){ setActiveMaterial(m); }
  function closeMaterial(){ setActiveMaterial(null); }

  const departments = ['all', ...new Set(materials.map(m => m.department))];
  const filteredMaterials = filterDept === 'all' 
    ? materials 
    : materials.filter(m => m.department === filterDept);

  return (
    <div style={{ background:'#ffffff', borderRadius:'20px', padding:'2rem', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', minHeight:'calc(100vh - 4rem)' }}>
      <div style={headerSection}>
        <div>
          <h2 style={title}>📚 Learning Materials</h2>
          <p style={subtitle}>{materials.length} materials available</p>
        </div>
        <button style={uploadBtn} onClick={() => setShowUploadModal(true)}>
          <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
          Upload Material
        </button>
      </div>

      {materials.length > 0 && (
        <div style={filterSection}>
          <label style={filterLabel}>
            <i className="fas fa-filter" style={{ marginRight: '0.5rem' }}></i>
            Filter by Department:
          </label>
          {departments.map(dept => (
            <button
              key={dept}
              style={{
                ...filterBtn,
                ...(filterDept === dept ? filterBtnActive : {})
              }}
              onClick={() => setFilterDept(dept)}
            >
              {dept === 'all' ? 'All' : dept}
            </button>
          ))}
        </div>
      )}
      {loading && (
        <div style={loadingContainer}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: '#667eea', marginBottom: '1rem' }}></i>
          <div style={{ color: '#718096', fontSize: '1rem' }}>Loading materials...</div>
        </div>
      )}
      {!loading && materials.length === 0 && (
        <div style={emptyState}>
          <i className="fas fa-inbox" style={{ fontSize: '4rem', color: '#cbd5e0', marginBottom: '1rem' }}></i>
          <h3 style={{ margin: '0 0 0.5rem', color: '#2d3748' }}>No materials available yet</h3>
          <p style={{ fontSize:'0.9rem', color:'#718096', marginBottom: '1.5rem' }}>
            Get started by uploading your first learning material
          </p>
          <button style={uploadBtn} onClick={() => setShowUploadModal(true)}>
            <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
            Upload Material
          </button>
        </div>
      )}
      <div style={grid}>
        {filteredMaterials.map(m => {
          const isOwner = user && m.uploaded_by === user.id;
          const iconMap = {
            pdf: { icon: 'file-pdf', color: '#e53e3e' },
            video: { icon: 'video', color: '#d69e2e' },
            text: { icon: 'file-alt', color: '#38a169' }
          };
          const typeInfo = iconMap[m.content_type] || { icon: 'book', color: '#667eea' };
          
          return (
            <div key={m.id} style={{...card, ...(m.file_exists === false ? cardWarning : {})}}>
              <div style={cardHeader}>
                <div style={cardIcon} className="card-icon">
                  <i className={`fas fa-${typeInfo.icon}`} style={{ color: typeInfo.color, fontSize: '1.5rem' }}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={cardTitle}>
                    {m.title}
                    {m.file_exists===false && <span style={badge} title="File missing on server">⚠️ Missing</span>}
                    {m.pdf_header_valid===false && <span style={{...badge, background: '#fef5e7', color: '#d68910'}}>⚠️ Invalid</span>}
                  </h3>
                  <div style={cardMeta}>
                    <span><i className="fas fa-university" style={{ marginRight: '0.3rem', fontSize: '0.75rem' }}></i>{m.department}</span>
                    <span>•</span>
                    <span><i className="fas fa-tag" style={{ marginRight: '0.3rem', fontSize: '0.75rem' }}></i>{m.content_type}</span>
                    {m.total_pages && <><span>•</span><span><i className="fas fa-file" style={{ marginRight: '0.3rem', fontSize: '0.75rem' }}></i>{m.total_pages} pages</span></>}
                  </div>
                </div>
              </div>
              <p style={cardDescription}>{m.description || 'No description provided'}</p>
              <div style={cardActions}>
                <button style={btnPrimary} onClick={()=>enroll(m.id)} title="Enroll in this material">
                  <i className="fas fa-user-plus" style={{ marginRight: '0.4rem' }}></i>
                  Enroll
                </button>
                <button style={btnSecondary} onClick={()=>openMaterial(m)} title="View material">
                  <i className="fas fa-eye" style={{ marginRight: '0.4rem' }}></i>
                  View
                </button>
                {isOwner && (
                  <button style={btnDanger} onClick={()=>deleteMaterial(m.id)} title="Delete material">
                    <i className="fas fa-trash-alt"></i>
                  </button>
                )}
                {m.file_exists===false && (
                  <button style={btnDangerAlt} onClick={()=>forceDelete(m.id)} title="Force delete ghost entry">
                    <i className="fas fa-skull"></i>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeMaterial && (
        <div style={modalBackdrop}>
          <div style={modal}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ margin:0 }}>{activeMaterial.title}</h3>
              <button onClick={closeMaterial} style={closeBtn}>×</button>
            </div>
            <div style={{ marginTop:'0.75rem' }}>
              {activeMaterial.content_type==='pdf' ? (
                <PdfViewer material={activeMaterial} token={token} />
              ) : activeMaterial.content_type==='text' && activeMaterial.content ? (
                <pre style={{ whiteSpace:'pre-wrap', background:'#fff', padding:'1rem', borderRadius:'8px', fontSize:'.75rem' }}>{activeMaterial.content}</pre>
              ) : (
                <div>Preview not implemented for this type.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <MaterialUploadModal
          token={token}
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={() => {
            load();
            setShowUploadModal(false);
          }}
        />
      )}
    </div>
  );
}

const headerSection = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
  flexWrap: 'wrap',
  gap: '1rem'
};

const title = { fontSize:'1.9rem', fontWeight:700, margin:'0', color:'#1f2937' };
const subtitle = { fontSize: '0.9rem', color: '#718096', margin: '0.25rem 0 0' };

const uploadBtn = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: '#fff',
  border: 'none',
  padding: '0.75rem 1.5rem',
  borderRadius: '12px',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  fontFamily: 'inherit'
};

const filterSection = {
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'center',
  marginBottom: '1.5rem',
  padding: '1rem',
  background: '#fff',
  borderRadius: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  flexWrap: 'wrap'
};

const filterLabel = {
  fontSize: '0.9rem',
  fontWeight: 600,
  color: '#4a5568',
  display: 'flex',
  alignItems: 'center'
};

const filterBtn = {
  padding: '0.5rem 1rem',
  background: '#f7fafc',
  color: '#4a5568',
  border: '2px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '0.85rem',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontFamily: 'inherit'
};

const filterBtnActive = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: '#fff',
  borderColor: '#667eea'
};

const loadingContainer = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4rem 2rem',
  background: '#fff',
  borderRadius: '16px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

const emptyState = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4rem 2rem',
  background: '#fff',
  borderRadius: '16px',
  textAlign: 'center',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};
const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: '1.5rem',
  marginBottom: '2rem'
};

const card = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '16px',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  transition: 'all 0.3s',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden'
};

const cardWarning = {
  borderColor: '#fed7aa',
  background: '#fffaf0'
};

const cardHeader = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '1rem',
  alignItems: 'flex-start'
};

const cardIcon = {
  width: '50px',
  height: '50px',
  borderRadius: '12px',
  background: '#f7fafc',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'all 0.3s'
};

const cardTitle = {
  margin: '0 0 0.5rem',
  fontSize: '1.1rem',
  fontWeight: 600,
  color: '#2d3748',
  lineHeight: 1.3,
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  flexWrap: 'wrap'
};

const cardMeta = {
  fontSize: '0.8rem',
  color: '#718096',
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center',
  flexWrap: 'wrap'
};

const cardDescription = {
  fontSize: '0.875rem',
  color: '#4a5568',
  lineHeight: 1.6,
  marginBottom: '1.25rem',
  minHeight: '60px',
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
};

const cardActions = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap'
};

const btnPrimary = {
  background: 'linear-gradient(135deg, #667eea, #764ba2)',
  color: '#fff',
  border: 'none',
  padding: '0.625rem 1rem',
  borderRadius: '10px',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontFamily: 'inherit',
  display: 'flex',
  alignItems: 'center',
  boxShadow: '0 2px 8px rgba(102,126,234,0.3)'
};

const btnSecondary = {
  background: '#f7fafc',
  color: '#4a5568',
  border: '2px solid #e2e8f0',
  padding: '0.625rem 1rem',
  borderRadius: '10px',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontFamily: 'inherit',
  display: 'flex',
  alignItems: 'center'
};

const btnDanger = {
  background: '#fc8181',
  color: '#fff',
  border: 'none',
  padding: '0.625rem 0.875rem',
  borderRadius: '10px',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontFamily: 'inherit'
};

const btnDangerAlt = {
  background: '#c53030',
  color: '#fff',
  border: 'none',
  padding: '0.625rem 0.875rem',
  borderRadius: '10px',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontFamily: 'inherit'
};

const badge = {
  background: '#fed7d7',
  color: '#c53030',
  padding: '0.2rem 0.6rem',
  borderRadius: '6px',
  fontSize: '0.7rem',
  fontWeight: 600,
  whiteSpace: 'nowrap'
};
const modalBackdrop = { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:5000 };
const modal = { background:'#fff', width:'90vw', maxWidth:'1000px', maxHeight:'90vh', overflowY:'auto', borderRadius:'16px', padding:'1rem', boxShadow:'0 10px 40px rgba(0,0,0,0.4)' };
const closeBtn = { background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'#718096' };
