# Learners Management System (LMS) - Refactored

A modern, production-ready learning management system with AI-powered assessment built with FastAPI, MongoDB, and LangChain.

## 🎯 Key Features

- **User Management**: Registration, authentication, JWT tokens
- **Learning Materials**: Upload & manage PDFs, videos, text content
- **AI-Powered Quizzes**: Daily questions with LLM explanations
- **Progress Tracking**: Real-time learning analytics
- **Smart Scheduling**: Automated question delivery
- **Modern UI**: Responsive web interface

## 📁 Project Structure

```
LMS/
├── app.py                      # Main FastAPI application
├── start.py                    # Startup script with health checks
├── requirements.txt            # Python dependencies
├── README.md                   # This file
│
├── src/                        # Source code
│   ├── api/                    # API route handlers
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── materials.py       # Materials management
│   │   ├── quiz.py            # Quiz endpoints
│   │   └── progress.py        # Progress tracking
│   │
│   ├── core/                   # Core functionality
│   │   ├── config.py          # Configuration settings
│   │   ├── database.py        # MongoDB connection
│   │   ├── models.py          # Pydantic models
│   │   └── security.py        # Auth utilities
│   │
│   ├── services/               # Business logic
│   │   ├── auth_service.py    # Authentication service
│   │   ├── material_service.py # Materials management
│   │   ├── quiz_service.py    # Quiz functionality
│   │   ├── progress_service.py # Progress tracking
│   │   └── ai_service.py      # AI/LLM integration
│   │
│   └── utils/                  # Utilities
│       ├── validation_utils.py # Input validation
│       ├── rate_limiting.py   # Rate limiting
│       └── logging_config.py  # Logging setup
│
├── frontend/                   # Web interface
│   └── index.html             # Main UI
│
├── scripts/                    # Utility scripts
│   ├── database_indexes.py    # DB setup & indexes
│   └── benchmark.py           # Performance testing
│
├── tests/                      # Test suite
│   └── test_backend.py        # Unit tests
│
├── docs/                       # Documentation
│   ├── API_DOCS.md            # API reference
│   ├── DEPLOYMENT.md          # Deployment guide
│   └── VERIFICATION_REPORT.md # System verification
│
├── config/                     # Configuration
│   └── .env.example           # Environment template
│
├── uploads/                    # Uploaded files (auto-created)
└── logs/                       # Application logs (auto-created)
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Setup Environment
```bash
# Copy environment template
cp config/.env.example .env

# Generate secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Add this to .env as SECRET_KEY
```

### 3. Initialize Database
```bash
python scripts/database_indexes.py
```

### 4. Start Application
```bash
python start.py
```

### 5. Access Application
- **Frontend**: http://127.0.0.1:8000 (Web application)
- **API Docs**: http://127.0.0.1:8000/docs (Interactive docs)
- **API Root**: http://127.0.0.1:8000/api (API endpoints)

## 📚 Architecture

### Clean Architecture Principles
- **Separation of Concerns**: API, Services, Core modules
- **Dependency Injection**: Services as singletons
- **Single Responsibility**: Each module has one purpose
- **Testability**: Easy to mock and test

### Tech Stack
- **Backend**: FastAPI (async Python)
- **Database**: MongoDB
- **AI/ML**: LangChain + Ollama (Llama 3.2)
- **Authentication**: JWT tokens with bcrypt
- **Validation**: Pydantic models
- **Scheduling**: APScheduler

## 🧪 Testing

```bash
# Run all tests
pytest tests/test_backend.py -v

# Run with coverage
pytest tests/test_backend.py --cov=src

# Run benchmarks
python scripts/benchmark.py
```

## 📖 Documentation

- **API Reference**: `docs/API_DOCS.md`
- **Deployment Guide**: `docs/DEPLOYMENT.md`
- **Verification Report**: `docs/VERIFICATION_REPORT.md`

## 🔧 Configuration

Edit `.env` file or set environment variables:

```bash
# Security
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
MONGO_URL=mongodb://localhost:27017/

# AI/LLM
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest

# Server
API_HOST=127.0.0.1
API_PORT=8000
DEBUG=False
```

## 🔒 Security Features

- ✅ Password strength validation
- ✅ JWT token authentication
- ✅ Input sanitization
- ✅ Rate limiting
- ✅ CORS protection
- ✅ SQL/NoSQL injection prevention

## 📈 Performance

- **API Response**: < 100ms (auth endpoints)
- **Quiz Questions**: < 200ms
- **LLM Explanations**: 1-3 seconds
- **Concurrent Users**: 100+ (tested)

## 🛠️ Development

### Adding New Features

1. **Models**: Add to `src/core/models.py`
2. **Service**: Create in `src/services/`
3. **API Routes**: Add to `src/api/`
4. **Tests**: Add to `tests/`

### Code Style
- Follow PEP 8
- Use type hints
- Add docstrings
- Write tests

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Check if MongoDB is running
mongod --version
# Start MongoDB
mongod
```

**Ollama Model Not Found**
```bash
# Pull the model
ollama pull llama3.2:latest
```

**Import Errors**
```bash
# Ensure you're in the project root
cd /path/to/LMS
python start.py
```

## 📝 License

MIT License - See LICENSE file

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 Support

- Check `docs/` folder for detailed documentation
- Review logs in `logs/` directory
- Check API docs at `/docs` endpoint
- Create an issue for bugs/features

---

**Built with ❤️ using FastAPI, MongoDB, and AI**
