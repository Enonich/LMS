import React, { useEffect, useState, Suspense } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import MaterialUploadModal from '../components/MaterialUploadModal';

// Lazy load heavy components
const PdfViewer = React.lazy(() => import('../components/PdfViewer'));
const VideoPlayer = React.lazy(() => import('../components/VideoPlayer'));

const API_BASE = `${window.location.origin}/api`;

export default function MaterialsPage() {
  const { token, user } = useAuth();
  const location = useLocation();
  const [materials, setMaterials] = useState([]);
  const [enrolledMaterials, setEnrolledMaterials] = useState([]);
  const [materialProgress, setMaterialProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeMaterial, setActiveMaterial] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterDept, setFilterDept] = useState('all');
  const [activeTab, setActiveTab] = useState('available'); // 'available', 'enrolled', 'completed'

  useEffect(() => {
    if (token && user) load();
  }, [token, user]);

  // Handle navigation from progress page
  useEffect(() => {
    if (location.state?.selectedMaterial && materials.length > 0) {
      const material = materials.find(m => m.id === location.state.selectedMaterial.id);
      if (material) {
        setActiveMaterial(material);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, materials]);

  // Handle URL hash for direct material open
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const urlParams = new URLSearchParams(hash.substring(hash.indexOf('?') + 1));
    const viewId = urlParams.get('view');
    if (viewId && materials.length > 0) {
      const material = materials.find(m => m.id === viewId);
      if (material) {
        setActiveMaterial(material);
        window.location.hash = '#materials';
      }
    }
  }, [materials]);

  async function load() {
    setLoading(true);
    try {
      const params = user?.role === 'admin' ? {} : { department: user?.department };
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_BASE}/materials${queryString ? '?' + queryString : ''}`;

      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setMaterials(res.data);

      if (user?.role !== 'admin') {
        await loadEnrolledMaterials();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadEnrolledMaterials() {
    try {
      const res = await axios.get(`${API_BASE}/progress`, { headers: { Authorization: `Bearer ${token}` } });
      const progressData = res.data;

      const enrolledIds = progressData.map(p => p.material_id);
      const progressMap = {};
      progressData.forEach(p => {
        progressMap[p.material_id] = {
          completed: p.completed,
          progress: p.progress_percentage || 0,
          last_accessed: p.last_accessed
        };
      });

      setEnrolledMaterials(enrolledIds);
      setMaterialProgress(progressMap);
    } catch (e) {
      console.error('Failed to load enrolled materials:', e);
    }
  }

  async function enroll(id) {
    try {
      await axios.put(`${API_BASE}/materials/${id}/enroll`, null, { headers: { Authorization: `Bearer ${token}` } });
      load();
      alert('Enrolled successfully!');
    } catch (e) {
      alert(e.response?.data?.detail || 'Enroll failed');
    }
  }

  async function forceDelete(id) {
    if (!window.confirm('Force delete this ghost material? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_BASE}/materials/${id}/force`, { headers: { Authorization: `Bearer ${token}` } });
      load();
    } catch (e) {
      alert('Force delete failed');
    }
  }

  async function deleteMaterial(id) {
    if (!window.confirm('Delete this material permanently?')) return;
    try {
      await axios.delete(`${API_BASE}/materials/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      load();
    } catch (e) {
      alert('Delete failed');
    }
  }

  function openMaterial(m) {
    setActiveMaterial(m);
  }

  function closeMaterial() {
    setActiveMaterial(null);
  }

  // Moved outside renderMaterialCard
  function renderRelatedMaterialsNav(currentMaterial) {
    const allRelatedMaterials = materials
      .filter(m => {
        if (m.department !== currentMaterial.department) return false;
        const currentTitle = currentMaterial.title.toLowerCase();
        const otherTitle = m.title.toLowerCase();

        const pattern = /^(.+?)\s*[-:]\s*(part|lesson|module|chapter|section)\s*\d+/i;
        const currentMatch = currentTitle.match(pattern);
        const otherMatch = otherTitle.match(pattern);

        if (currentMatch && otherMatch) {
          return currentMatch[1].trim() === otherMatch[1].trim();
        }
        return currentTitle.substring(0, 20) === otherTitle.substring(0, 20);
      })
      .sort((a, b) => a.title.localeCompare(b.title));

    if (allRelatedMaterials.length <= 1) return null;

    const currentIndex = allRelatedMaterials.findIndex(m => m.id === currentMaterial.id);
    const prevMaterial = currentIndex > 0 ? allRelatedMaterials[currentIndex - 1] : null;
    const nextMaterial = currentIndex < allRelatedMaterials.length - 1 ? allRelatedMaterials[currentIndex + 1] : null;

    return (
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {prevMaterial && (
          <button style={navBtn} onClick={() => setActiveMaterial(prevMaterial)} title={prevMaterial.title}>
            <i className="fas fa-chevron-left"></i>
          </button>
        )}
        <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 500 }}>
          {currentIndex + 1} / {allRelatedMaterials.length}
        </span>
        {nextMaterial && (
          <button style={navBtn} onClick={() => setActiveMaterial(nextMaterial)} title={nextMaterial.title}>
            <i className="fas fa-chevron-right"></i>
          </button>
        )}
      </div>
    );
  }

  function renderMaterialCard(m, isAdminView) {
    const isOwner = user && m.uploaded_by === user.id;
    const isEnrolled = enrolledMaterials.includes(m.id);
    const progress = materialProgress[m.id];
    const isCompleted = progress?.completed;

    const iconMap = {
      pdf: { icon: 'file-pdf', color: '#e53e3e' },
      doc: { icon: 'file-word', color: '#2b6cb0' },
      docx: { icon: 'file-word', color: '#2b6cb0' },
      video: { icon: 'video', color: '#d69e2e' },
      text: { icon: 'file-alt', color: '#38a169' }
    };
    const typeInfo = iconMap[m.content_type] || { icon: 'book', color: '#667eea' };

    return (
      <div
        key={m.id}
        style={{
          ...card,
          ...(m.file_exists === false ? cardWarning : {}),
          ...(isCompleted ? cardCompleted : {})
        }}
      >
        <div style={cardHeader}>
          <div style={cardIcon}>
            <i className={`fas fa-${typeInfo.icon}`} style={{ color: typeInfo.color, fontSize: '1.5rem' }}></i>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={cardTitle}>
              {m.title}
              {m.file_exists === false && <span style={badgeWarning}>Warning: Missing File</span>}
              {m.pdf_header_valid === false && <span style={badgeWarning}>Warning: Invalid PDF</span>}
              {isCompleted && <span style={badgeSuccess}>Completed</span>}
            </h3>
            <div style={cardMeta}>
              <span><i className="fas fa-university"></i> {m.department}</span>
              <span>•</span>
              <span><i className="fas fa-tag"></i> {m.content_type === 'doc' || m.content_type === 'docx' ? 'Word Document' : m.content_type}</span>
              {m.total_pages && <><span>•</span><span><i className="fas fa-file"></i> {m.total_pages} pages</span></>}
              {progress && !isCompleted && <><span>•</span><span><i className="fas fa-chart-line"></i> {progress.progress}%</span></>}
            </div>
          </div>
        </div>
        <p style={cardDescription}>{m.description || 'No description provided'}</p>
        <div style={cardActions}>
          {!isAdminView && !isEnrolled && (
            <button style={btnPrimary} onClick={() => enroll(m.id)}>
              <i className="fas fa-user-plus"></i> Enroll
            </button>
          )}
          <button style={btnSecondary} onClick={() => openMaterial(m)}>
            <i className="fas fa-eye"></i> {isEnrolled ? 'Continue' : 'View'}
          </button>
          {isOwner && (
            <button style={btnDanger} onClick={() => deleteMaterial(m.id)}>
              <i className="fas fa-trash-alt"></i>
            </button>
          )}
          {m.file_exists === false && (
            <button style={btnDangerAlt} onClick={() => forceDelete(m.id)}>
              <i className="fas fa-skull"></i>
            </button>
          )}
        </div>
      </div>
    );
  }

  const departments = ['all', ...new Set(materials.map(m => m.department).filter(Boolean))];
  const filteredMaterials = user?.role === 'admin'
    ? (filterDept === 'all' ? materials : materials.filter(m => m.department === filterDept))
    : materials;

  const displayedMaterials = user?.role === 'admin'
    ? filteredMaterials
    : materials.filter(m => {
        if (activeTab === 'available') return !enrolledMaterials.includes(m.id);
        if (activeTab === 'enrolled') return enrolledMaterials.includes(m.id) && !materialProgress[m.id]?.completed;
        if (activeTab === 'completed') return enrolledMaterials.includes(m.id) && materialProgress[m.id]?.completed;
        return true;
      });

  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.85)', 
      backdropFilter: 'blur(30px) saturate(180%)',
      borderRadius: '24px', 
      padding: '2.5rem', 
      boxShadow: '0 10px 40px rgba(0,0,0,0.12), 0 0 60px rgba(102,126,234,0.08), inset 0 0 0 1px rgba(255,255,255,0.3)', 
      minHeight: 'calc(100vh - 4rem)',
      border: '1px solid rgba(255,255,255,0.3)',
      animation: 'fadeIn 0.6s ease'
    }}>
      {!user ? (
        <div style={loadingContainer}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: '#667eea', marginBottom: '1rem' }}></i>
          <div style={{ color: '#718096' }}>Loading user profile...</div>
        </div>
      ) : (
        <>
          <div style={headerSection}>
            <div>
              <h2 style={title}>Learning Materials</h2>
              <p style={subtitle}>
                {user?.role === 'admin'
                  ? `${materials.length} materials available`
                  : `${materials.filter(m => !enrolledMaterials.includes(m.id)).length} available • ${enrolledMaterials.filter(id => !materialProgress[id]?.completed).length} in progress • ${enrolledMaterials.filter(id => materialProgress[id]?.completed).length} completed`
                }
              </p>
            </div>
            {user?.role === 'admin' && (
              <button style={uploadBtn} onClick={() => setShowUploadModal(true)}>
                <i className="fas fa-plus"></i> Upload Material
              </button>
            )}
          </div>

          {materials.length > 0 && user?.role === 'admin' && (
            <div style={filterSection}>
              <label style={filterLabel}><i className="fas fa-filter"></i> Filter by Department:</label>
              {departments.map(dept => (
                <button
                  key={dept}
                  style={{ ...filterBtn, ...(filterDept === dept ? filterBtnActive : {}) }}
                  onClick={() => setFilterDept(dept)}
                >
                  {dept === 'all' ? 'All' : dept}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div style={loadingContainer}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: '#667eea' }}></i>
              <div>Loading materials...</div>
            </div>
          )}

          {!loading && materials.length === 0 && (
            <div style={emptyState}>
              <i className="fas fa-inbox" style={{ fontSize: '4rem', color: '#cbd5e0' }}></i>
              <h3>No materials available yet</h3>
              <p>{user?.role === 'admin' ? 'Upload your first material to get started' : 'Check back later!'}</p>
              {user?.role === 'admin' && (
                <button style={uploadBtn} onClick={() => setShowUploadModal(true)}>
                  <i className="fas fa-plus"></i> Upload Material
                </button>
              )}
            </div>
          )}

          {!loading && materials.length > 0 && user?.role !== 'admin' && (
            <div style={tabContainer}>
              <button style={{ ...tabBtn, ...(activeTab === 'available' ? tabBtnActive : {}) }} onClick={() => setActiveTab('available')}>
                <i className="fas fa-book-open"></i> Available ({materials.filter(m => !enrolledMaterials.includes(m.id)).length})
              </button>
              <button style={{ ...tabBtn, ...(activeTab === 'enrolled' ? tabBtnActive : {}) }} onClick={() => setActiveTab('enrolled')}>
                <i className="fas fa-play-circle"></i> In Progress
              </button>
              <button style={{ ...tabBtn, ...(activeTab === 'completed' ? tabBtnActive : {}) }} onClick={() => setActiveTab('completed')}>
                <i className="fas fa-check-circle"></i> Completed
              </button>
            </div>
          )}

          <div style={grid}>
            {displayedMaterials.map(m => renderMaterialCard(m, user?.role === 'admin'))}
          </div>

          {/* Preview Modal */}
          {activeMaterial && (
            <div style={modalBackdrop} onClick={closeMaterial}>
              <div style={modal} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h3 style={{ margin: 0 }}>{activeMaterial.title}</h3>
                    {renderRelatedMaterialsNav(activeMaterial)}
                  </div>
                  <button onClick={closeMaterial} style={closeBtn}>×</button>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  {activeMaterial.content_type === 'pdf' && (
                    <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center' }}><i className="fas fa-spinner fa-spin fa-2x"></i><br />Loading PDF...</div>}>
                      <PdfViewer material={activeMaterial} token={token} />
                    </Suspense>
                  )}
                  {activeMaterial.content_type === 'video' && (
                    <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center' }}><i className="fas fa-spinner fa-spin fa-2x"></i><br />Loading video...</div>}>
                      <VideoPlayer material={activeMaterial} token={token} />
                    </Suspense>
                  )}
                  {activeMaterial.content_type === 'text' && activeMaterial.content && (
                    <pre style={{ whiteSpace: 'pre-wrap', background: '#fff', padding: '1.5rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                      {activeMaterial.content}
                    </pre>
                  )}
                  {(activeMaterial.content_type === 'doc' || activeMaterial.content_type === 'docx') && (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                      <i className="fas fa-file-word" style={{ fontSize: '5rem', color: '#2b6cb0' }}></i>
                      <h3>Microsoft Word Document</h3>
                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                        <button style={btnPrimary} onClick={() => window.open(`${API_BASE}/materials/${activeMaterial.id}/file`, '_blank')}>
                          Open in Browser
                        </button>
                        <button style={btnSecondary} onClick={() => {
                          const link = document.createElement('a');
                          link.href = `${API_BASE}/materials/${activeMaterial.id}/file`;
                          link.download = activeMaterial.title + (activeMaterial.content_type === 'docx' ? '.docx' : '.doc');
                          link.click();
                        }}>
                          Download
                        </button>
                      </div>
                    </div>
                  )}
                  {activeMaterial.content_type.startsWith('image/') && (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <img
                        src={`${API_BASE}/materials/${activeMaterial.id}/file`}
                        alt={activeMaterial.title}
                        style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'block';
                        }}
                      />
                      <div style={{ display: 'none', padding: '2rem' }}>
                        <i className="fas fa-image" style={{ fontSize: '4rem', color: '#cbd5e0' }}></i>
                        <h3>Image Preview Unavailable</h3>
                        <button style={btnSecondary} onClick={() => {
                          const link = document.createElement('a');
                          link.href = `${API_BASE}/materials/${activeMaterial.id}/file`;
                          link.download = activeMaterial.title;
                          link.click();
                        }}>
                          Download Image
                        </button>
                      </div>
                    </div>
                  )}
                  {!['pdf', 'video', 'text', 'doc', 'docx'].includes(activeMaterial.content_type) &&
                   !activeMaterial.content_type.startsWith('image/') && (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                      <i className="fas fa-file" style={{ fontSize: '5rem', color: '#cbd5e0' }}></i>
                      <h3>Preview Not Available</h3>
                      <p>Content type: <code>{activeMaterial.content_type}</code></p>
                      <button style={btnSecondary} onClick={() => {
                        const link = document.createElement('a');
                        link.href = `${API_BASE}/materials/${activeMaterial.id}/file`;
                        link.download = activeMaterial.title;
                        link.click();
                      }}>
                        Download File
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Upload Modal */}
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
        </>
      )}
    </div>
  );
}

// === MODERN STYLES ===
const headerSection = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' };
const title = { fontSize: '2.2rem', fontWeight: 900, margin: 0, color: '#1f2937', letterSpacing: '-0.03em', textShadow: '0 2px 10px rgba(0,0,0,0.05)' };
const subtitle = { fontSize: '1rem', color: '#718096', margin: '0.5rem 0 0', fontWeight: 500 };
const uploadBtn = { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', padding: '0.875rem 1.75rem', borderRadius: '14px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 16px rgba(102,126,234,0.4), 0 0 30px rgba(118,75,162,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s ease', letterSpacing: '0.02em' };
const filterSection = { display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '2rem', padding: '1.25rem', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid rgba(229,231,235,0.6)', flexWrap: 'wrap' };
const filterLabel = { fontSize: '1rem', fontWeight: 700, color: '#4a5568', display: 'flex', alignItems: 'center', gap: '0.5rem' };
const filterBtn = { padding: '0.625rem 1.25rem', background: 'rgba(247,250,252,0.8)', color: '#4a5568', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', backdropFilter: 'blur(10px)' };
const filterBtnActive = { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', borderColor: 'transparent', boxShadow: '0 4px 12px rgba(102,126,234,0.3)' };
const loadingContainer = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderRadius: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '1px solid rgba(229,231,235,0.6)' };
const emptyState = { ...loadingContainer, textAlign: 'center' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.75rem' };
const card = { background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(229,231,235,0.6)', borderRadius: '18px', padding: '1.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer', position: 'relative', overflow: 'hidden' };
const cardWarning = { borderColor: 'rgba(254,215,170,0.8)', background: 'linear-gradient(135deg, rgba(255,250,240,0.95), rgba(254,243,199,0.9))', backdropFilter: 'blur(10px)' };
const cardCompleted = { borderColor: 'rgba(154,230,180,0.8)', background: 'linear-gradient(135deg, rgba(240,255,244,0.95), rgba(198,246,213,0.9))', backdropFilter: 'blur(10px)' };
const cardHeader = { display: 'flex', gap: '1.25rem', marginBottom: '1.25rem', alignItems: 'flex-start' };
const cardIcon = { width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(102,126,234,0.15)', transition: 'all 0.3s ease' };
const cardTitle = { margin: '0 0 0.75rem', fontSize: '1.15rem', fontWeight: 700, color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', letterSpacing: '-0.01em' };
const cardMeta = { fontSize: '0.85rem', color: '#718096', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', fontWeight: 500 };
const cardDescription = { fontSize: '0.925rem', color: '#4a5568', lineHeight: 1.6, marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' };
const cardActions = { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' };
const btnPrimary = { ...uploadBtn, padding: '0.75rem 1.25rem', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(102,126,234,0.3)' };
const btnSecondary = { background: 'rgba(247,250,252,0.9)', backdropFilter: 'blur(10px)', color: '#4a5568', border: '2px solid rgba(226,232,240,0.6)', padding: '0.75rem 1.25rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s ease' };
const btnDanger = { background: 'linear-gradient(135deg, #fc8181, #e53e3e)', color: '#fff', border: 'none', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(252,129,129,0.3)', transition: 'all 0.3s ease' };
const btnDangerAlt = { background: 'linear-gradient(135deg, #c53030, #9b2c2c)', color: '#fff', border: 'none', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(197,48,48,0.3)', transition: 'all 0.3s ease' };
const tabContainer = { display: 'flex', gap: '0.5rem', marginBottom: '2rem', padding: '0.625rem', background: 'rgba(247,250,252,0.9)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(226,232,240,0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
const tabBtn = { flex: 1, padding: '0.875rem 1.25rem', background: 'transparent', color: '#4a5568', border: 'none', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.3s ease' };
const tabBtnActive = { background: 'rgba(255,255,255,0.95)', color: '#667eea', boxShadow: '0 2px 8px rgba(102,126,234,0.15)', fontWeight: 700, backdropFilter: 'blur(10px)' };
const navBtn = { background: 'rgba(247,250,252,0.9)', backdropFilter: 'blur(10px)', color: '#4a5568', border: '2px solid rgba(226,232,240,0.6)', borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const modalBackdrop = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000, animation: 'fadeIn 0.3s ease' };
const modal = { background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(30px)', width: '90vw', maxWidth: '1100px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 100px rgba(102,126,234,0.2)', border: '1px solid rgba(255,255,255,0.3)', animation: 'scaleIn 0.4s ease' };
const closeBtn = { background: 'rgba(113,128,150,0.1)', backdropFilter: 'blur(10px)', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#718096', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', lineHeight: 1 };

// Modern Badges
const badgeWarning = { background: 'linear-gradient(135deg, rgba(254,245,231,0.9), rgba(254,215,170,0.8))', backdropFilter: 'blur(10px)', color: '#d68910', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(214,137,16,0.2)' };
const badgeSuccess = { background: 'linear-gradient(135deg, rgba(198,246,213,0.9), rgba(154,230,180,0.8))', backdropFilter: 'blur(10px)', color: '#22543d', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(34,84,61,0.2)' };