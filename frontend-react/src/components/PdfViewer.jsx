import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';
import axios from 'axios';

// Use the matching worker version for pdfjs-dist 5.4.394
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.394/pdf.worker.mjs';

const API_BASE = `${window.location.origin}/api`;

export default function PdfViewer({ material, token }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [doc, setDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [total, setTotal] = useState(material.total_pages || null);
  const [scale, setScale] = useState(() => {
    const saved = localStorage.getItem(`pdf_scale_${material.id}`);
    return saved ? parseFloat(saved) : 1.15;
  });
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(null); // {progress_percentage, completed_pages}
  const [fullscreen, setFullscreen] = useState(false);

  // Use the API endpoint to fetch PDFs with proper headers and authentication
  const pdfUrl = material.file_path 
    ? `${API_BASE}/materials/${material.id}/file`
    : null;

  useEffect(() => { fetchProgress(); }, []);

  async function fetchProgress() {
    try {
      const res = await axios.get(`${API_BASE}/progress/${material.id}`, { headers:{ Authorization:`Bearer ${token}` } });
      setProgress(res.data);
    } catch(e){ /* silent */ }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!pdfUrl) {
        setStatus('No file path');
        return;
      }
      try {
        setStatus('Loading...');
        console.log('Loading PDF from:', pdfUrl);
        
        // Fetch with authentication
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          httpHeaders: {
            'Authorization': `Bearer ${token}`
          },
          withCredentials: false
        });
        
        const loaded = await loadingTask.promise;
        if (cancelled) return;
        setDoc(loaded);
        setTotal(loaded.numPages);
        setStatus('');
        const savedPage = localStorage.getItem(`pdf_last_page_${material.id}`);
        const startPage = savedPage ? Math.min(Math.max(parseInt(savedPage,10),1), loaded.numPages) : 1;
        renderPage(startPage, loaded, true);
      } catch (e) {
        console.error('PDF load failed:', e);
        console.error('URL:', pdfUrl);
        console.error('Material:', material);
        setStatus(`Load failed: ${e.message || 'Unknown error'}`);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [pdfUrl, token]);

  useEffect(()=>{ localStorage.setItem(`pdf_scale_${material.id}`, String(scale)); }, [scale, material.id]);

  async function renderPage(num, d = doc, initial=false) {
    if (!d) return;
    setStatus(`Rendering ${num}...`);
    const page = await d.getPage(num);
    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;
    setStatus('');
    setPageNum(num);
    if(!initial){ localStorage.setItem(`pdf_last_page_${material.id}`, String(num)); }
  }

  function prev() { if (pageNum > 1) renderPage(pageNum - 1); }
  function next() { if (doc && pageNum < doc.numPages) renderPage(pageNum + 1); }
  function jump(e) { const v = parseInt(e.target.value, 10); if(doc && v>=1 && v<=doc.numPages) renderPage(v); }
  function zoomIn(){ setScale(s => { const ns = Math.min(s + 0.15, 3); renderPage(pageNum); return ns; }); }
  function zoomOut(){ setScale(s => { const ns = Math.max(s - 0.15, 0.5); renderPage(pageNum); return ns; }); }
  function toggleFullscreen(){ setFullscreen(f => !f); }

  async function markPageComplete(){
    if(!pageNum) return;
    try {
      await axios.put(`${API_BASE}/progress/${material.id}/page/${pageNum}`, null, { headers:{ Authorization:`Bearer ${token}` } });
      fetchProgress();
    } catch(e){ console.warn('Mark page failed', e); }
  }

  async function markMaterialComplete(){
    try {
      await axios.put(`${API_BASE}/progress/${material.id}/complete`, null, { headers:{ Authorization:`Bearer ${token}` } });
      fetchProgress();
    } catch(e){ console.warn('Complete failed', e); }
  }

  const pct = progress?.progress_percentage ?? 0;
  const completedCount = progress?.completed_pages?.length || 0;

  return (
    <div ref={containerRef} style={{ position:'relative' }}>
      <div className={`pdf-toolbar ${fullscreen? 'fullscreen':''}`}>
        <button onClick={prev} disabled={pageNum<=1} title="Previous page">
          <i className="fas fa-chevron-left"></i>
        </button>
        <button onClick={next} disabled={!doc || pageNum>=doc.numPages} title="Next page">
          <i className="fas fa-chevron-right"></i>
        </button>
        <span style={{ fontSize:'0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
          <i className="fas fa-file" style={{ fontSize: '0.7rem' }}></i>
          Page <input type="number" value={pageNum} min={1} max={total||''} onChange={jump}/> / {total||'?'}
        </span>
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', height: '24px', margin: '0 0.25rem' }}></div>
        <button onClick={zoomOut} title="Zoom out" disabled={scale <= 0.5}>
          <i className="fas fa-search-minus"></i>
        </button>
        <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.8rem', borderRadius: '8px', minWidth: '50px', textAlign: 'center' }}>
          {Math.round(scale * 100)}%
        </span>
        <button onClick={zoomIn} title="Zoom in" disabled={scale >= 3}>
          <i className="fas fa-search-plus"></i>
        </button>
        <button onClick={toggleFullscreen} title={fullscreen? 'Exit Fullscreen':'Fullscreen'}>
          <i className={`fas fa-${fullscreen ? 'compress' : 'expand'}`}></i>
        </button>
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', height: '24px', margin: '0 0.25rem' }}></div>
        <button onClick={markPageComplete} title="Mark current page as complete" className="pdf-mini-btn">
          <i className="fas fa-check"></i> Page
        </button>
        <button onClick={markMaterialComplete} title="Mark entire material as complete" className="pdf-mini-btn-green">
          <i className="fas fa-check-double"></i> All
        </button>
        {status && (
          <span style={{ fontSize:'0.75rem', color:'#cbd5e0', background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
            <i className="fas fa-circle-notch fa-spin" style={{ marginRight: '0.5rem' }}></i>
            {status}
          </span>
        )}
        {progress && (
          <span style={{ fontSize:'0.75rem', color:'#9ae6b4', background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.8rem', borderRadius: '8px', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-chart-line"></i>
            {pct}% • {completedCount}/{total || '?'} pages
          </span>
        )}
      </div>
      <div className={`pdf-canvas-wrap ${fullscreen? 'fullscreen':''}`}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

// Styles consolidated into global.css
