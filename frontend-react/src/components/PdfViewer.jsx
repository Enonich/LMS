import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import 'pdfjs-dist/web/pdf_viewer.css';
import axios from 'axios';

// PDF.js worker: Configure with multiple fallback options
try {
  // Try Vite-friendly import.meta.url first
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString();
} catch (e) {
  try {
    // Fallback to CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    console.log('Using CDN for PDF.js worker');
  } catch (e2) {
    console.error('Could not resolve pdf.worker:', e2);
  }
}

const API_BASE = `${window.location.origin}/api`;

export default function PdfViewer({ material, token }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
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

  const pdfUrl = material?.file_path ? `${API_BASE}/materials/${material.id}/file` : null;

  useEffect(() => { fetchProgress(); }, []);

  async function fetchProgress() {
    try {
      const res = await axios.get(`${API_BASE}/progress/${material.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setProgress(res.data);
    } catch (e) {
      // ignore
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

        // Fetch PDF bytes with Authorization header to avoid CORS/credential issues
        const resp = await axios.get(pdfUrl, { responseType: 'arraybuffer', headers: { Authorization: `Bearer ${token}` } });
        if (cancelled) return;

        const loadingTask = pdfjsLib.getDocument({ data: resp.data });
        const loaded = await loadingTask.promise;
        if (cancelled) return;
        setDoc(loaded);
        setTotal(loaded.numPages);
        setStatus('');
        await renderPage(1, loaded, true);
      } catch (err) {
        console.error('PDF load failed', err);
        setStatus('Load failed');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [pdfUrl, token]);

  useEffect(() => {
    if (material?.id) localStorage.setItem(`pdf_scale_${material.id}`, String(scale));
  }, [scale, material]);

  async function renderPage(num, documentInstance = doc, initial = false) {
    if (!documentInstance) return;
    setStatus(`Rendering ${num}...`);
    try {
      const page = await documentInstance.getPage(num);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      setPageNum(num);
      setStatus('');
      if (!initial) {
        // Update progress on page change (best effort)
        updateProgress(num).catch(() => {});
      }
    } catch (e) {
      console.error('Render failed', e);
      setStatus('Render failed');
    }
  }

  function prev() { if (pageNum > 1) renderPage(pageNum - 1); }
  function next() { if (doc && pageNum < doc.numPages) renderPage(pageNum + 1); }
  function jump(e) { const v = parseInt(e.target.value, 10); if (doc && v >= 1 && v <= doc.numPages) renderPage(v); }
  function zoomIn() { setScale(s => Math.min(s + 0.15, 3)); }
  function zoomOut() { setScale(s => Math.max(s - 0.15, 0.5)); }
  function toggleFullscreen() { setFullscreen(f => !f); }

  useEffect(() => {
    // when scale changes, re-render current page
    if (doc) renderPage(pageNum, doc, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale]);

  async function updateProgress(currentPage) {
    if (!total || !currentPage) return;
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
    if (!pageNum) return;
    try {
      await axios.put(`${API_BASE}/progress/${material.id}/page/${pageNum}`, null, { headers: { Authorization: `Bearer ${token}` } });
      fetchProgress();
    } catch (e) {
      console.warn('Mark page failed', e);
    }
  }

  async function markMaterialComplete() {
    try {
      await axios.put(`${API_BASE}/progress/${material.id}/complete`, null, { headers: { Authorization: `Bearer ${token}` } });
      fetchProgress();
    } catch (e) {
      console.warn('Complete failed', e);
    }
  }

  const pct = progress?.progress_percentage ?? 0;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div className={`pdf-toolbar ${fullscreen ? 'fullscreen' : ''}`}>
        <button onClick={prev} disabled={pageNum <= 1} title="Previous page"><i className="fas fa-chevron-left" /></button>
        <button onClick={next} disabled={!doc || pageNum >= (doc?.numPages || 0)} title="Next page"><i className="fas fa-chevron-right" /></button>
        <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.08)', padding: '0.25rem 0.5rem', borderRadius: '8px' }}>
          <i className="fas fa-file" style={{ fontSize: '0.7rem' }} />
          Page <input type="number" value={pageNum} min={1} max={total || ''} onChange={jump} style={{ width: '3rem' }} /> / {total || '?'}
        </span>
        <div style={{ width: 8 }} />
        <button onClick={zoomOut} title="Zoom out" disabled={scale <= 0.5}><i className="fas fa-search-minus" /></button>
        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>{Math.round(scale * 100)}%</span>
        <button onClick={zoomIn} title="Zoom in" disabled={scale >= 3}><i className="fas fa-search-plus" /></button>
        <button onClick={toggleFullscreen} title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}><i className={`fas fa-${fullscreen ? 'compress' : 'expand'}`} /></button>
        <div style={{ width: 8 }} />
        <button onClick={markPageComplete} title="Mark current page as complete" className="pdf-mini-btn"><i className="fas fa-check" /> Page</button>
        <button onClick={markMaterialComplete} title="Mark entire material as complete" className="pdf-mini-btn-green"><i className="fas fa-check-double" /> All</button>
        {status && <span style={{ marginLeft: 12, fontSize: '0.75rem' }}>{status}</span>}
        {progress && <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>{pct}% • Page {pageNum}/{total || '?'}</span>}
      </div>
      <div className={`pdf-canvas-wrap ${fullscreen ? 'fullscreen' : ''}`} style={{ marginTop: 12 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
