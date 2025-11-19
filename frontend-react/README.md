# LMS React Frontend (Work in Progress)

This directory contains a React-based migration of the existing vanilla JS frontend found in `frontend/`. It aims to replicate and improve the current functionality:

- Authentication (login / register)
- Materials listing, enrollment, deletion, ghost cleanup
- PDF viewing via pdf.js (canvas rendering, zoom, page nav)
- Page-based progress tracking (mark page, complete material)
- Daily quiz (question fetch, answer submit, feedback)
- Schedule configuration

## Tech Stack
- React 18 + React Router
- Vite for dev/build
- axios for API calls
- pdfjs-dist for PDF rendering

## Getting Started
```bash
cd frontend-react
npm install
npm run dev
```
Open http://localhost:5173 — API calls are proxied to http://localhost:8000 (`/api` and `/uploads`). Ensure the FastAPI backend is running.

## Environment / API Assumptions
The API base is derived from `window.location.origin` and proxied; adjust `vite.config.js` if your backend runs on a different port.

## Component Overview
- `src/context/AuthContext.jsx` manages token & user state, login/logout.
- `src/components/DashboardLayout.jsx` sets up navigation & layout.
- `src/pages/MaterialsPage.jsx` shows materials & opens `PdfViewer` modal content.
- `src/components/PdfViewer.jsx` uses pdfjs-dist to render PDF pages.
- `src/pages/ProgressPage.jsx` displays progress with actions.
- `src/pages/QuizPage.jsx` handles daily quiz logic.
- `src/pages/SchedulePage.jsx` sets quiz time & days.

## Next Steps / TODO
- Port progress page to reflect real-time page events (current naive next page increment when marking page).
- Add material upload UI in React.
- Persist quiz stats & PDF viewer preferences.
- Migrate styling to a shared CSS (or Tailwind) rather than inline styles.
- Add error boundary & global loading indicators.
- Implement force delete UI in modal for missing files.
- Remove legacy Adobe viewer code once migration complete.

## Migration Strategy
You can run both frontends simultaneously during transition:
- Legacy: served by existing FastAPI static mount.
- React: Vite dev server, then build and serve the `dist` folder via FastAPI static route once stable.

To build production assets:
```bash
npm run build
```
Outputs to `frontend-react/dist/`. Add a new static route in FastAPI to serve this folder (e.g., `/app`).

## PDF Rendering Notes
The pdf.js worker is loaded from CDN. For offline or stricter CSP environments, vendor a local copy and update `workerSrc` accordingly.

## Troubleshooting
- If PDFs don't load: check the browser console for CORS or network errors; ensure `/uploads` proxy target matches backend.
- Auth token invalid after refresh: confirm backend `/auth/me` endpoint returns 200 with provided token.
- Page progress not updating: verify new endpoints exist (`/progress/{material_id}/page/{page}` & `/complete`).

## License
Internal migration work – follow repository's main license/usage guidelines.
