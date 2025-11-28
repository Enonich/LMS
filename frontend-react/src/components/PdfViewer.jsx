import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import 'pdfjs-dist/web/pdf_viewer.css';
import axios from 'axios';

// For pdfjs-dist 5.x, use the legacy worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.mjs',
  import.meta.url
).toString();

const API_BASE = `${window.location.origin}/api`;

export default function PdfViewer({ material, token }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pageInputRef = useRef(null);
  const [doc, setDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [total, setTotal] = useState(material?.total_pages ?? null);
  const [scale, setScale] = useState(() => {
    const saved = localStorage.getItem(`pdf_scale_${material?.id}`);
    return saved ? parseFloat(saved) : 1.15;
  });
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);

  const pdfUrl = material?.file_path ? `${API_BASE}/materials/${material.id}/file` : null;

  useEffect(() => { 
    if (material?.id) fetchProgress(); 
  }, [material?.id, token]);

  async function fetchProgress() {
    if (!material?.id) return;
    try {
      const res = await axios.get(`${API_BASE}/progress/${material.id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setProgress(res.data);
    } catch (e) {
      console.warn('Fetch progress failed', e);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!pdfUrl) {
        setStatus('No file path');
        return;
      }
      try {
        setStatus('Loading PDF...');

        const resp = await axios.get(pdfUrl, { 
          responseType: 'arraybuffer', 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (cancelled) return;

        const loadingTask = pdfjsLib.getDocument({ data: resp.data });
        const loaded = await loadingTask.promise;
        if (cancelled) return;
        
        setDoc(loaded);
        setTotal(loaded.numPages);
        setStatus('');
      } catch (err) {
        console.error('PDF load failed', err);
        setStatus('Load failed: ' + (err.message || 'Unknown error'));
      }
    }
    load();
    return () => { cancelled = true; };
  }, [pdfUrl, token]);

  useEffect(() => {
    if (material?.id) {
      localStorage.setItem(`pdf_scale_${material.id}`, String(scale));
    }
  }, [scale, material?.id]);

  // Render first page when doc loads
  useEffect(() => {
    if (doc) {
      renderPage(1, doc, true);
    }
  }, [doc]);

  async function renderPage(num, documentInstance = doc, skipProgressUpdate = false) {
    if (!documentInstance || !canvasRef.current) return;
    
    setStatus(`Rendering page ${num}...`);
    try {
      const page = await documentInstance.getPage(num);
      const viewport = page.getViewport({ scale, rotation });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      
      await page.render({ canvasContext: ctx, viewport }).promise;
      setPageNum(num);
      setStatus('');
      
      if (!skipProgressUpdate) {
        updateProgress(num).catch(() => {});
      }
    } catch (e) {
      console.error('Render failed', e);
      setStatus('Render failed: ' + (e.message || 'Unknown error'));
    }
  }

  const goToPrevPage = useCallback(() => { 
    if (pageNum > 1) renderPage(pageNum - 1); 
  }, [pageNum, doc]);
  
  const goToNextPage = useCallback(() => { 
    if (doc && pageNum < doc.numPages) renderPage(pageNum + 1); 
  }, [pageNum, doc]);
  
  const goToFirstPage = useCallback(() => {
    if (doc && pageNum !== 1) renderPage(1);
  }, [pageNum, doc]);

  const goToLastPage = useCallback(() => {
    if (doc && pageNum !== doc.numPages) renderPage(doc.numPages);
  }, [pageNum, doc]);

  const jumpToPage = (e) => { 
    const v = parseInt(e.target.value, 10); 
    if (doc && v >= 1 && v <= doc.numPages) renderPage(v); 
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };
  
  const zoomIn = useCallback(() => { 
    setScale(s => Math.min(s + 0.15, 3)); 
  }, []);
  
  const zoomOut = useCallback(() => { 
    setScale(s => Math.max(s - 0.15, 0.5)); 
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1.15);
  }, []);

  const rotateRight = useCallback(() => {
    setRotation(r => (r + 90) % 360);
  }, []);

  const rotateLeft = useCallback(() => {
    setRotation(r => (r - 90 + 360) % 360);
  }, []);
  
  const toggleFullscreen = useCallback(() => { 
    setFullscreen(f => !f); 
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target.tagName === 'INPUT' && e.target !== pageInputRef.current) return;

      switch(e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          goToPrevPage();
          break;
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          goToNextPage();
          break;
        case 'Home':
          e.preventDefault();
          goToFirstPage();
          break;
        case 'End':
          e.preventDefault();
          goToLastPage();
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          zoomOut();
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            resetZoom();
          }
          break;
        case 'f':
        case 'F':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
        case 'r':
          if (e.shiftKey) {
            e.preventDefault();
            rotateLeft();
          } else {
            e.preventDefault();
            rotateRight();
          }
          break;
        case 'Escape':
          if (fullscreen) {
            e.preventDefault();
            setFullscreen(false);
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevPage, goToNextPage, goToFirstPage, goToLastPage, zoomIn, zoomOut, resetZoom, rotateRight, rotateLeft, toggleFullscreen, fullscreen]);

  // Re-render current page when scale or rotation changes
  useEffect(() => {
    if (doc && pageNum && canvasRef.current) {
      renderPage(pageNum, doc, true);
    }
  }, [scale, rotation]);

  async function updateProgress(currentPage) {
    if (!total || !currentPage || !material?.id) return;
    try {
      const progressPercentage = Math.round((currentPage / total) * 100);
      await axios.put(`${API_BASE}/progress/${material.id}`, {
        progress_percentage: progressPercentage,
        completed_pages: [currentPage]
      }, { headers: { Authorization: `Bearer ${token}` } });
      fetchProgress();
    } catch (e) {
      console.warn('Update progress failed', e);
    }
  }

  async function markPageComplete() {
    if (!pageNum || !material?.id) return;
    try {
      await axios.put(`${API_BASE}/progress/${material.id}/page/${pageNum}`, 
        null, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchProgress();
    } catch (e) {
      console.warn('Mark page failed', e);
    }
  }

  async function markMaterialComplete() {
    if (!material?.id) return;
    try {
      await axios.put(`${API_BASE}/progress/${material.id}/complete`, 
        null, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchProgress();
    } catch (e) {
      console.warn('Complete failed', e);
    }
  }

  function downloadPdf() {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = material?.title || 'document.pdf';
      link.click();
    }
  }

  const pct = progress?.progress_percentage ?? 0;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
     
      <div className={`pdf-toolbar ${fullscreen ? 'fullscreen' : ''}`}>
        {/* Zoom controls */}
        <button onClick={zoomOut} title="Zoom out (-)" disabled={scale <= 0.5}>
          <i className="fas fa-search-minus" />
        </button>
        <span style={{ 
          fontSize: '0.75rem', 
          padding: '0.25rem 0.6rem', 
          borderRadius: '6px',
          minWidth: '3.5rem',
          textAlign: 'center'
        }}>
          {Math.round(scale * 100)}%
        </span>
        <button onClick={zoomIn} title="Zoom in (+)" disabled={scale >= 3}>
          <i className="fas fa-search-plus" />
        </button>
        <button onClick={resetZoom} title="Reset zoom (Ctrl/Cmd + 0)">
          <i className="fas fa-compress-arrows-alt" />
        </button>

        <div style={{ width: 8 }} />

        {/* Rotation controls */}
        <button onClick={rotateLeft} title="Rotate left (Shift + R)">
          <i className="fas fa-undo" />
        </button>
        <button onClick={rotateRight} title="Rotate right (R)">
          <i className="fas fa-redo" />
        </button>

        <div style={{ width: 8 }} />

        {/* View controls */}
        <button onClick={toggleFullscreen} title={fullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen (F)'}>
          <i className={`fas fa-${fullscreen ? 'compress' : 'expand'}`} />
        </button>
        <button onClick={downloadPdf} title="Download PDF">
          <i className="fas fa-download" />
        </button>

        <div style={{ width: 8 }} />

        {/* Progress controls */}
        <button onClick={markPageComplete} title="Mark current page as complete" className="pdf-mini-btn">
          <i className="fas fa-check" /> Page
        </button>
        <button onClick={markMaterialComplete} title="Mark entire material as complete" className="pdf-mini-btn-green">
          <i className="fas fa-check-double" /> All
        </button>

        {/* Status indicators */}
        {status && <span style={{ marginLeft: 12, fontSize: '0.75rem' }}>{status}</span>}
        {progress && (
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '60px',
              height: '4px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${pct}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #667eea, #764ba2)',
                transition: 'width 0.3s ease'
              }} />
            </div>
            {pct}%
          </span>
        )}
      </div>

      <div className={`pdf-canvas-wrap ${fullscreen ? 'fullscreen' : ''}`} style={{ marginTop: 12 }}>
        <canvas ref={canvasRef} />
      </div>

      {/* Navigation controls - moved to bottom */}
      <div className={`pdf-navigation ${fullscreen ? 'fullscreen' : ''}`} style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '0.5rem',
        marginTop: '1rem',
        padding: '0.75rem',
        background: 'rgba(0,0,0,0.03)',
        borderRadius: '8px'
      }}>
        <button onClick={goToFirstPage} disabled={pageNum <= 1} title="First page (Home)">
          <i className="fas fa-step-backward" />
        </button>
        <button onClick={goToPrevPage} disabled={pageNum <= 1} title="Previous page (← or PageUp)">
          <i className="fas fa-chevron-left" />
        </button>
        
        {/* Page indicator */}
        <span style={{ 
          fontSize: '0.9rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          background: 'rgba(0,0,0,0.08)', 
          padding: '0.5rem 0.75rem', 
          borderRadius: '8px' 
        }}>
          <i className="fas fa-file" style={{ fontSize: '0.8rem' }} />
          Page 
          <input 
            ref={pageInputRef}
            type="number" 
            value={pageNum} 
            min={1} 
            max={total || ''} 
            onChange={jumpToPage}
            onKeyDown={handlePageInputKeyDown}
            style={{ width: '3.5rem' }} 
            title="Jump to page (type and press Enter)"
          /> 
          / {total || '?'}
        </span>
        
        <button onClick={goToNextPage} disabled={!doc || pageNum >= (doc?.numPages || 0)} title="Next page (→, PageDown, or Space)">
          <i className="fas fa-chevron-right" />
        </button>
        <button onClick={goToLastPage} disabled={!doc || pageNum >= (doc?.numPages || 0)} title="Last page (End)">
          <i className="fas fa-step-forward" />
        </button>
      </div>
    </div>
  );
}