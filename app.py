"""
Main FastAPI application (Refactored)
"""
import os
os.environ["USE_TF"] = "0"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pathlib import Path

from src.core.config import settings
from src.core.database import db
from src.api import auth, materials, quiz, progress

# Initialize scheduler
scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    db.connect()
    scheduler.start()
    print(f"✅ {settings.APP_NAME} v{settings.APP_VERSION} started")
    yield
    # Shutdown
    scheduler.shutdown()
    db.disconnect()
    print("👋 Application shutdown")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers (with /api prefix)
app.include_router(auth.router, prefix="/api/auth")
app.include_router(materials.router, prefix="/api/materials")
app.include_router(quiz.router, prefix="/api/questions")
app.include_router(progress.router, prefix="/api/progress")

# Serve static assets (React frontend build) and uploaded files
app.mount("/assets", StaticFiles(directory="frontend-react/dist/assets"), name="assets")
app.mount("/static", StaticFiles(directory="frontend-react/dist/static"), name="static")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/api")
async def api_root():
    """API root endpoint"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "frontend": "/"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.get("/")
async def serve_frontend():
    """Serve the React frontend application"""
    frontend_path = Path("frontend-react/dist/index.html")
    if frontend_path.exists():
        return FileResponse(frontend_path)
    return {"message": "React frontend not found. Please run 'npm run build' in frontend-react directory."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
