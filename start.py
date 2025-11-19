#!/usr/bin/env python3
"""
Startup script for the refactored LMS application
"""
import os
import sys
import subprocess
from pathlib import Path

def check_requirements():
    """Check if required packages are installed"""
    try:
        import fastapi
        import uvicorn
        import pymongo
        import sentence_transformers
        print("✅ All required packages are installed.")
        return True
    except ImportError as e:
        print(f"❌ Missing required package: {e}")
        print("Please run: pip install -r requirements.txt")
        return False

def check_mongodb():
    """Check if MongoDB is running"""
    try:
        from pymongo import MongoClient
        client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        print("✅ MongoDB is running.")
        return True
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("Please ensure MongoDB is installed and running.")
        return False

def check_ollama():
    """Check if Ollama is running"""
    try:
        result = subprocess.run(["ollama", "list"], capture_output=True, text=True, timeout=10)
        if "llama3.2" in result.stdout:
            print("✅ Ollama is running with llama3.2 model.")
            return True
        else:
            print("❌ llama3.2 model not found in Ollama.")
            print("Please run: ollama pull llama3.2:latest")
            return False
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print("❌ Ollama is not installed or not running.")
        print("Please install Ollama and run: ollama pull llama3.2:latest")
        return False

def main():
    """Main startup function"""
    print("🚀 Starting Learners Management System (Refactored)...")
    print("=" * 60)

    # Check requirements
    if not check_requirements():
        sys.exit(1)

    # Check MongoDB
    if not check_mongodb():
        sys.exit(1)

    # Check Ollama
    if not check_ollama():
        sys.exit(1)

    print("=" * 60)
    print("🎯 All checks passed! Starting server...")
    print("")
    print("🌐 Frontend:  http://127.0.0.1:8000")
    print("📚 API Docs:  http://127.0.0.1:8000/docs")
    print("🔧 API Root:  http://127.0.0.1:8000/api")
    print("")
    print("🛑 Press Ctrl+C to stop the server")
    print("=" * 60)

    # Start the server
    try:
        import uvicorn
        uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
    except KeyboardInterrupt:
        print("\n👋 Server stopped.")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
