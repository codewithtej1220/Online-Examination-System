# 📁 Project Structure

Complete overview of the OES Pro directory structure and file organization.

## Root Directory

```
Dbms_OES/
├── 📂 Core Application Files
├── 📂 Configuration Files
├── 📂 Source Code Directories
├── 📂 Documentation
└── 📂 Scripts & Utilities
```

---

## 📂 Core Application Files

```
Dbms_OES/
├── server.js                   # Express backend entry point
├── package.json                # Node.js dependencies and scripts
├── schema.sql                  # Main database schema
├── schema-updates-ai.sql       # AI integration schema updates
├── .env                        # Environment variables (not in git)
├── .env.example                # Environment template
└── .gitignore                  # Git ignore rules
```

---

## 📂 Source Code

### Frontend (React + TypeScript)
```
src/
├── components/                 # React components
│   ├── ui/                    # Reusable UI components
│   ├── ProctoredExam.tsx      # Proctoring interface
│   ├── AICoPilot.tsx          # AI question generation
│   └── ...
├── types/                      # TypeScript type definitions
│   └── ai.ts                  # AI-related types
├── lib/                        # Utility libraries
├── hooks/                      # Custom React hooks
├── styles.css                  # Global styles
└── App.tsx                     # Main application component
```

### Backend (Express.js)
```
controllers/                    # Request handlers
├── authController.js          # Authentication logic
├── examController.js          # Exam management
├── questionController.js      # Question operations
├── aiController.js            # AI service integration
└── ...

routes/                         # API route definitions
├── authRoutes.js              # Authentication endpoints
├── examRoutes.js              # Exam endpoints
├── questionRoutes.js          # Question endpoints
├── aiRoutes.js                # AI service endpoints
└── ...

middleware/                     # Express middleware
├── authMiddleware.js          # JWT verification
├── errorHandler.js            # Error handling
├── rateLimiter.js             # Rate limiting
└── validator.js               # Input validation

services/                       # Business logic
├── socketService.js           # Socket.io management
└── ...

config/                         # Configuration
└── db.js                      # Database connection

utils/                          # Utility functions
├── logger.js                  # Winston logger
└── ApiResponse.js             # Standardized responses
```

### AI Microservice (Python FastAPI)
```
ai-service/
├── main.py                     # FastAPI application
├── requirements.txt            # Python dependencies
├── .env.example                # Environment template
├── services/                   # AI service modules
│   ├── gemini_service.py      # Gemini AI integration
│   ├── question_generator.py  # Question generation
│   └── essay_evaluator.py     # Essay evaluation
├── utils/                      # Utility modules
│   └── file_extractor.py      # PDF/TXT extraction
└── proctoring_engine/          # Advanced proctoring
    ├── gaze_tracker.py        # Gaze & head pose tracking
    ├── object_detector.py     # Multi-face & object detection
    ├── face_verifier.py       # Biometric verification
    ├── audio_analyzer.py      # Audio anomaly detection
    └── proctoring_pipeline.py # Main orchestration
```

---

## 📂 Documentation

```
docs/
├── README.md                   # Documentation index
├── QUICK_START.md              # Quick start guide
├── QUICK_REFERENCE.txt         # Command reference
├── setup/                      # Setup guides
│   ├── INSTALLATION.md
│   ├── CONFIGURATION.md
│   ├── AI_INTEGRATION_SETUP.md
│   └── ...
├── features/                   # Feature documentation
│   ├── AI_INTEGRATION_COMPLETE.md
│   ├── ADVANCED_PROCTORING_COMPLETE.md
│   └── AI_INTEGRATION_PLAN.md
└── archives/                   # Historical documentation
    └── ...
```

---

## 📂 Scripts & Utilities

```
scripts/
├── migrations/                 # Database migration scripts
│   ├── create-phase2-tables.js
│   ├── create-proctoring-tables.js
│   ├── run-phase2-migration.js
│   ├── run-proctoring-migration.js
│   └── fix-assignment.js
├── testing/                    # Test scripts and utilities
│   ├── test-api.ps1
│   ├── test-complete-system.ps1
│   ├── test-system-simple.ps1
│   ├── test-phase1-complete.js
│   ├── test-phase2-complete.js
│   └── run-test-data.js
├── data/                       # SQL data files
│   ├── quick-populate-data.sql
│   └── quick-test-data.sql
├── legacy/                     # Deprecated code and scripts
│   └── proctoring-service-old/ # Old Flask proctoring (use ai-service instead)
└── seed.js                     # Database seeding script

Startup Scripts (Root):
├── START_ALL_SERVERS.bat       # Start all services
├── STOP_ALL_SERVERS.bat        # Stop all services
└── SETUP_FIRST_TIME.bat        # First-time setup
```

---

## 📂 Database & Migrations

```
Database Files (Root):
├── schema.sql                  # Main database schema
├── schema-updates-ai.sql       # AI integration updates
└── migrations/                 # Migration SQL files
    ├── 001_add_indexes.sql
    ├── 002_add_audit_log.sql
    ├── 003_add_proctoring_logs.sql
    ├── 004_phase2_enhancements.sql
    └── 005_phase3_faculty_tools.sql

Migration Scripts:
└── scripts/migrations/         # Migration execution scripts
    ├── create-phase2-tables.js
    ├── create-proctoring-tables.js
    ├── run-phase2-migration.js
    ├── run-proctoring-migration.js
    └── fix-assignment.js
```

---

## 📂 Public & Static Files

```
public/                         # Static files served by Express
├── app/                       # Built React application
└── legacy/                    # Legacy demo files
    └── test.html             # Standalone legacy demo (accessible at /legacy)

templates/                      # Email/notification templates
└── ...
```

---

## 📂 Configuration Files

```
Configuration:
├── .eslintrc.json             # ESLint configuration
├── jest.config.js             # Jest testing config
├── postcss.config.js          # PostCSS config
├── tailwind.config.js         # Tailwind CSS config
├── tsconfig.json              # TypeScript config
├── tsconfig.node.json         # TypeScript Node config
├── vite.config.mjs            # Vite bundler config
└── render.yaml                # Render deployment config
```

---

## 📂 Generated/Runtime Directories

```
Generated (Not in Git):
├── node_modules/              # Node.js packages
├── logs/                      # Application logs
├── recordings/                # Proctoring recordings
└── public/app/                # Built frontend (production)
```

---

## File Count Summary

| Category | Count |
|----------|-------|
| Root Files (Essential) | 27 |
| Source Files (Frontend) | ~50+ |
| Controllers/Routes (Backend) | ~20 |
| AI Service Modules | ~10 |
| Documentation Files (Organized) | ~15 |
| Configuration Files | ~10 |
| Scripts & Utilities | ~15 |
| Migration Scripts | ~10 |

---

## Key Entry Points

| Component | Entry Point | Port |
|-----------|-------------|------|
| Frontend | `src/main.tsx` via `index.html` | 5173 |
| Backend | `server.js` | 5000 |
| AI Service | `ai-service/main.py` | 8000 |

---

## Important Paths

| Purpose | Path |
|---------|------|
| Frontend Source | `src/` |
| Backend API | `controllers/`, `routes/` |
| AI Proctoring | `ai-service/proctoring_engine/` |
| AI Services | `ai-service/services/` |
| Documentation | `docs/` |
| Configuration | `.env`, `ai-service/.env` |
| Database Schema | `schema.sql`, `schema-updates-ai.sql` |
| Startup Scripts | Root directory (`.bat` files) |
| Migration Scripts | `scripts/migrations/` |
| Test Scripts | `scripts/testing/` |
| Sample Data | `scripts/data/` |
| Legacy Code | `scripts/legacy/`, `public/legacy/` |

---

## Adding New Features

### Frontend Component
1. Create in `src/components/`
2. Import in `src/App.tsx`
3. Add types in `src/types/` if needed

### Backend Endpoint
1. Add controller in `controllers/`
2. Add route in `routes/`
3. Register in `server.js`

### AI Capability
1. Add module in `ai-service/services/` or `proctoring_engine/`
2. Add endpoint in `ai-service/main.py`
3. Add controller in `controllers/aiController.js`

---

**Last Updated:** Clean-up and Organization Phase - FINAL ✅

**Status:** Production-ready professional structure

**Root Directory:** 27 essential files (down from 80+)
