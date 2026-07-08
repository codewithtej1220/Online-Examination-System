# 🎓 OES Pro - Online Examination System

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A comprehensive, AI-powered online examination platform with advanced proctoring, automated grading, and intelligent question generation capabilities.

---

## ✨ Key Features

### 🤖 **AI-Powered Intelligence**
- **Question Generation** - Generate MCQ, Essay, and Fill-in-blank questions from syllabus using Gemini AI
- **Essay Evaluation** - Semantic analysis and automated grading with detailed feedback
- **Multi-Modal Proctoring** - Real-time gaze tracking, face verification, audio analysis

### 👥 **Role-Based Access**
- **Admin** - System monitoring, user management, analytics dashboard
- **Faculty** - Question creation, exam management, live student monitoring
- **Student** - Exam taking, progress tracking, results viewing

### 🔒 **Advanced Proctoring**
- Gaze & head pose tracking (MediaPipe)
- Biometric identity verification (DeepFace)
- Multi-face detection
- Audio anomaly detection
- Tab switching prevention
- Real-time violation logging

### 📊 **Comprehensive Features**
- Auto-evaluated MCQ questions
- Rich text editor with math equations
- Bulk question import (CSV/Excel)
- Randomized question ordering
- Timed examinations
- Real-time progress monitoring
- Detailed analytics and reporting

---

## 🚀 Quick Start

### Prerequisites
- MySQL 8.0+
- Node.js 20+
- Python 3.9+

### Installation

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd Dbms_OES
   SETUP_FIRST_TIME.bat
   ```

2. **Configure environment:**
   - Edit `.env` - Set MySQL credentials
   - Edit `ai-service\.env` - Add Gemini API key

3. **Start the system:**
   ```bash
   START_ALL_SERVERS.bat
   ```

4. **Access application:**
   ```
   http://localhost:5173/app/
   ```

**📖 Full Guide:** See [HOW_TO_RUN.md](./HOW_TO_RUN.md)

---

## 📁 Project Structure

```
Dbms_OES/
├── src/                    # React frontend (TypeScript)
├── controllers/            # Express route controllers
├── routes/                 # API route definitions
├── services/              # Business logic services
├── ai-service/            # Python FastAPI microservice
│   └── proctoring_engine/ # Computer vision & AI modules
├── config/                # Database and app configuration
├── middleware/            # Express middleware
├── public/                # Static assets
├── docs/                  # 📚 Documentation
│   ├── setup/            # Installation guides
│   ├── features/         # Feature documentation
│   └── archives/         # Historical docs
├── scripts/              # Utility scripts
├── .env.example          # Environment template
├── schema.sql            # Database schema
├── schema-updates-ai.sql # AI integration schema
├── server.js             # Express backend entry
├── package.json          # Node.js dependencies
└── README.md             # This file
```

---

## 🛠️ Technology Stack

### Frontend
- **React 18.3** + **TypeScript 5.6**
- **Vite** - Lightning-fast dev server
- **TailwindCSS** - Utility-first styling
- **Shadcn/UI** - Modern component library
- **Socket.io Client** - Real-time communication

### Backend
- **Express 5.2** - Node.js web framework
- **MySQL 8.0** - Relational database
- **Socket.io** - WebSocket server
- **JWT** - Authentication
- **Multer** - File uploads

### AI Microservice
- **FastAPI** - Python async framework
- **Gemini AI** - Question generation & evaluation
- **OpenCV** - Computer vision
- **MediaPipe** - Face mesh & tracking
- **DeepFace** - Face verification
- **Librosa** - Audio analysis
- **TensorFlow** - Deep learning

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [HOW_TO_RUN.md](./HOW_TO_RUN.md) | Complete running instructions |
| [docs/QUICK_START.md](./docs/QUICK_START.md) | 5-minute quick start |
| [docs/features/](./docs/features/) | Feature documentation |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment |
| [API Docs](http://localhost:8000/docs) | Interactive API documentation |

---

## 🎯 Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin1` | `password123` |
| Faculty | `faculty1` | `password123` |
| Student | `student1` | `password123` |

---

## 🔧 Configuration

### Environment Variables

**Backend (`.env`):**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=online_exam_system
JWT_SECRET=your_secret_key
AI_SERVICE_URL=http://localhost:8000
```

**AI Service (`ai-service/.env`):**
```env
GEMINI_API_KEY=your_gemini_api_key
PORT=8000
ALLOWED_ORIGINS=http://localhost:5000,http://localhost:5173
```

---

## 📊 System Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  React Frontend │◄────►│ Express Backend │◄────►│ MySQL Database  │
│   (Port 5173)   │      │   (Port 5000)   │      │   (Port 3306)   │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                  │
                                  │ HTTP/REST
                                  ▼
                         ┌─────────────────┐
                         │  Python FastAPI │
                         │  AI Microservice│
                         │   (Port 8000)   │
                         └─────────────────┘
```

---

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run frontend in dev mode
npm run client:dev

# Check system health
curl http://localhost:5000/api/health
curl http://localhost:8000/health
```

---

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

Quick production start:
```bash
npm run client:build
NODE_ENV=production node server.js
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

**Team OES Pro**

---

## 🙏 Acknowledgments

- Google Gemini AI for question generation
- MediaPipe for face tracking
- DeepFace for face verification
- OpenAI for inspiration

---

## 📞 Support

- 📖 Documentation: [docs/](./docs/)
- 🐛 Issues: Open an issue on GitHub
- 💬 Discussions: GitHub Discussions

---

**Made with ❤️ for better online education**

<div align="center">

![OES Pro](https://img.shields.io/badge/OES-Pro-6366f1?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8+-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

**A modern, feature-rich examination platform with AI-powered proctoring, real-time monitoring, and automated evaluation.**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [API](#-api-endpoints) • [Demo](#-demo-credentials)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [User Roles](#-user-roles)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Configuration](#-configuration)
- [Demo Credentials](#-demo-credentials)
- [Screenshots](#-screenshots)
- [Development](#-development)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**OES Pro** is a comprehensive, enterprise-grade online examination system designed for educational institutions. It features role-based access control, AI-powered proctoring, real-time monitoring, automated evaluation, and advanced analytics.

### Key Highlights

- 🎥 **AI-Powered Proctoring** - Face detection, tab switching prevention, fullscreen lockdown
- ⚡ **Real-Time Monitoring** - Faculty can monitor students live during exams
- 🤖 **Auto-Evaluation** - Instant MCQ grading with detailed analytics
- 📊 **Advanced Analytics** - Performance tracking, trends, and insights
- 🎮 **Gamification** - Achievements, badges, and progress tracking
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- 🎨 **Modern UI** - Beautiful, accessible interface with dark mode
- 🔒 **Enterprise Security** - JWT authentication, encrypted passwords, rate limiting

---

## ✨ Features

### For Students 👨‍🎓
- ✅ **ID Verification** - Secure student identification
- ✅ **Proctored Exams** - Camera/microphone monitoring with face detection
- ✅ **Smart Navigation** - Question bookmarking, auto-save, progress tracking
- ✅ **Built-in Tools** - Calculator, timer, question navigator
- ✅ **Instant Results** - Auto-evaluated scores with detailed breakdown
- ✅ **Progress Dashboard** - Track performance, achievements, and rankings

### For Faculty 👨‍🏫
- ✅ **Question Bank** - Create, import (CSV/Excel), and manage questions
- ✅ **Rich Text Editor** - Support for formulas, images, and formatting
- ✅ **Voice Input** - Speech-to-text for question creation
- ✅ **Exam Builder** - Flexible exam creation with scheduling
- ✅ **Live Monitoring** - Real-time student tracking during exams
- ✅ **Alert System** - Automatic notifications for suspicious behavior
- ✅ **Analytics Dashboard** - Student performance insights

### For Admins 👨‍💼
- ✅ **System Dashboard** - Real-time system metrics and health
- ✅ **User Management** - Create and manage all user accounts
- ✅ **SQL Console** - Direct database query interface
- ✅ **Advanced Analytics** - System-wide performance reports
- ✅ **Activity Logs** - Complete audit trail
- ✅ **Gamification Control** - Manage achievements and rewards

### Technical Features 🔧
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Socket.io** - Real-time bidirectional communication
- ✅ **Video Recording** - Exam session recording and storage
- ✅ **Face Detection** - AI-powered monitoring (via OpenCV/cloud API)
- ✅ **Auto-Save** - Never lose student answers
- ✅ **Rate Limiting** - API protection against abuse
- ✅ **Input Validation** - Server-side validation with express-validator
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Logging** - Winston-based structured logging

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express 5
- **Database**: MySQL 8+
- **Real-time**: Socket.io
- **Authentication**: JWT + bcryptjs
- **Validation**: express-validator, Joi
- **Logging**: Winston
- **Security**: Helmet, CORS, rate-limiter

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **UI Library**: Shadcn UI + Radix UI
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **State Management**: React Hooks
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts, Chart.js
- **Rich Text**: React Quill
- **File Parsing**: PapaParse, XLSX

### Proctoring
- **Video**: RecordRTC
- **Face Detection**: OpenCV (Python service) or cloud API
- **Audio Analysis**: Web Audio API
- **Screen Monitoring**: Fullscreen API, Visibility API

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20 or higher
- **MySQL** 8 or higher
- **npm** or **yarn**

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Dbms_OES
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**

Copy `.env.example` to `.env` and update:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=online_exam_system

# JWT
JWT_SECRET=your_secure_secret_key
JWT_EXPIRES_IN=24h

# Server
PORT=5000
NODE_ENV=development

# Client
CLIENT_URL=http://localhost:5173
```

4. **Set up database**
```bash
# Create database and run schema
mysql -u root -p < schema.sql
```

5. **Start the application**

**Backend:**
```bash
npm start
# Backend runs on http://localhost:5000
```

**Frontend:**
```bash
npm run client:dev
# Frontend runs on http://localhost:5173/app/
```

6. **Access the application**
- Frontend: **http://localhost:5173/app/**
- Backend API: **http://localhost:5000**

---

## 📁 Project Structure

```
Dbms_OES/
├── 📂 config/                 # Configuration files
│   └── db.js                  # MySQL connection
├── 📂 controllers/            # Business logic
│   ├── authController.js      # Authentication
│   ├── examController.js      # Exam management
│   ├── questionController.js  # Question CRUD
│   ├── attemptController.js   # Exam attempts
│   ├── resultController.js    # Results
│   ├── evaluationController.js # Auto-evaluation
│   └── ...
├── 📂 middleware/             # Express middleware
│   ├── authMiddleware.js      # JWT verification
│   ├── roleMiddleware.js      # Role-based access
│   └── validator.js           # Input validation
├── 📂 routes/                 # API routes
│   ├── authRoutes.js
│   ├── examRoutes.js
│   ├── questionRoutes.js
│   └── ...
├── 📂 src/                    # Frontend source
│   ├── 📂 components/         # React components
│   │   ├── 📂 ui/            # UI primitives
│   │   ├── ProctoredExam.tsx # Proctoring component
│   │   ├── AdminAnalytics.tsx # Admin dashboard
│   │   └── ...
│   ├── 📂 hooks/             # Custom React hooks
│   ├── 📂 lib/               # Utilities
│   ├── App.tsx               # Main app component
│   ├── main.tsx              # Entry point
│   └── styles.css            # Global styles
├── 📂 public/                # Static files
├── 📂 recordings/            # Exam recordings
├── 📂 logs/                  # Application logs
├── 📄 server.js              # Express server
├── 📄 schema.sql             # Database schema
├── 📄 package.json           # Dependencies
├── 📄 vite.config.mjs        # Vite configuration
├── 📄 tailwind.config.js     # Tailwind configuration
└── 📄 .env                   # Environment variables
```

---

## 👥 User Roles

### 🔷 Admin
**Full system control and monitoring**

- Create/manage users (Admin, Faculty, Student)
- View system-wide analytics
- Access all exams and results
- SQL console access
- System configuration
- Audit logs

**Dashboard**: System metrics, user statistics, activity monitoring

### 🔶 Faculty
**Exam creation and student monitoring**

- Create/import questions (bulk CSV/Excel upload)
- Build and schedule exams
- Assign exams to students
- Monitor exams in real-time
- Receive proctoring alerts
- Evaluate and publish results
- View student performance analytics

**Dashboard**: Question bank, exam management, live monitoring

### 🔵 Student
**Take exams and view results**

- Verify identity (Student ID verification)
- View assigned exams
- Take proctored exams
- Auto-save answers
- Use built-in calculator
- Navigate questions easily
- View instant results
- Track progress and achievements

**Dashboard**: Assigned exams, results, performance tracking

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | User login | No |

### Exams
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/exams/all` | Get all exams | Yes |
| POST | `/api/exams/create` | Create exam | Faculty |
| GET | `/api/exams/:id` | Get exam details | Yes |
| GET | `/api/exams/paper/:id` | Get exam paper | Student |
| PUT | `/api/exams/:id` | Update exam | Faculty |
| DELETE | `/api/exams/:id` | Delete exam | Faculty |

### Questions
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/questions/all` | Get all questions | Faculty |
| POST | `/api/questions/add` | Create question | Faculty |
| PUT | `/api/questions/:id` | Update question | Faculty |
| DELETE | `/api/questions/:id` | Delete question | Faculty |
| POST | `/api/questions/import` | Bulk import | Faculty |

### Attempts & Results
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/attempts/start` | Start exam | Student |
| POST | `/api/attempts/submit` | Submit exam | Student |
| GET | `/api/attempts/all` | Get all attempts | Faculty |
| POST | `/api/student-answers/save` | Save answer | Student |
| GET | `/api/results/all` | Get all results | Yes |
| GET | `/api/results/student/:id` | Get student results | Student |

### Proctoring
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/proctoring/upload-recording` | Upload video | Yes |
| Socket | `student:join-exam` | Join exam session | Yes |
| Socket | `proctoring:send-frame` | Send video frame | Yes |
| Socket | `proctoring:tab-switch` | Report tab switch | Yes |

**Full API Documentation**: See [API.md](./docs/API.md)

---

## 🗄️ Database Schema

### Core Tables

**users** - Main user authentication table
```sql
user_id, username, password_hash, role, email, created_at
```

**student** - Student profile information
```sql
student_id, user_id, current_semester, major_program, enrollment_date
```

**faculty** - Faculty profile information
```sql
faculty_id, user_id, department, specialization, join_date
```

**admin** - Admin profile information
```sql
admin_id, user_id, admin_level, permissions
```

### Exam Tables

**examination** - Exam definitions
```sql
exam_id, title, description, duration_minutes, scheduled_time, 
faculty_user_id, total_marks, passing_marks, created_at
```

**question_bank** - Question repository
```sql
question_id, content, question_type, correct_answer, options, 
difficulty_level, subject_topic, tags, created_by, created_at
```

**exam_questions** - Questions per exam
```sql
exam_question_id, exam_id, question_id, question_order
```

**student_exam** - Exam assignments
```sql
assignment_id, student_user_id, exam_id, assigned_at, status
```

### Activity Tables

**attempt** - Exam attempts
```sql
attempt_id, student_user_id, exam_id, start_time, end_time, 
status (ONGOING/SUBMITTED), created_at
```

**student_answers** - Student responses
```sql
answer_id, attempt_id, question_id, selected_answer, 
answered_at, time_taken
```

**result** - Exam results
```sql
result_id, attempt_id, exam_id, total_marks, submitted_at, 
is_published
```

### Proctoring Tables

**proctoring_session** - Proctoring sessions
```sql
session_id, exam_id, student_user_id, start_time, end_time, 
recording_path, status
```

**proctoring_logs** - Violation logs
```sql
log_id, session_id, event_type, severity, description, 
timestamp, evidence_path
```

**View complete schema**: [schema.sql](./schema.sql)

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment | development | No |
| `PORT` | Server port | 5000 | No |
| `DB_HOST` | MySQL host | localhost | Yes |
| `DB_PORT` | MySQL port | 3306 | No |
| `DB_USER` | MySQL username | root | Yes |
| `DB_PASSWORD` | MySQL password | - | Yes |
| `DB_NAME` | Database name | online_exam_system | Yes |
| `JWT_SECRET` | JWT secret key | - | Yes |
| `JWT_EXPIRES_IN` | Token expiry | 24h | No |
| `CLIENT_URL` | Frontend URL | http://localhost:5173 | No |
| `BCRYPT_SALT_ROUNDS` | Password rounds | 12 | No |
| `LOG_LEVEL` | Logging level | info | No |

### Security Configuration

**JWT Secret**: Generate a secure random key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Rate Limiting**: Configured in `server.js`
- Login: 5 attempts per 15 minutes
- API: 100 requests per 15 minutes

---

## 🎮 Demo Credentials

### Test Accounts

**Admin Account:**
```
Username: admin
Password: admin123
Role: Administrator
```

**Faculty Account:**
```
Username: faculty
Password: faculty123
Role: Faculty Member
Department: Computer Science
```

**Student Account:**
```
Username: student
Password: student123
Role: Student
Student ID: Check after registration
```

### Creating New Accounts

1. Register via UI at `/app/`
2. Choose role (Admin/Faculty/Student)
3. Fill required information
4. **Note the User ID** displayed after registration
5. Use credentials to login

---

## 📸 Screenshots

### Student Dashboard
![Student Dashboard](./docs/screenshots/student-dashboard.png)

### Proctored Exam Interface
![Proctored Exam](./docs/screenshots/proctored-exam.png)

### Faculty Monitoring
![Faculty Monitoring](./docs/screenshots/faculty-monitoring.png)

### Admin Analytics
![Admin Analytics](./docs/screenshots/admin-analytics.png)

---

## 🔧 Development

### Available Scripts

```bash
# Backend
npm start              # Start production server
npm run dev            # Start development server (not working on Windows)

# Frontend
npm run client:dev     # Start Vite dev server
npm run client:build   # Build for production
npm run client:preview # Preview production build

# Database
npm run seed           # Seed database with sample data

# Testing
npm test               # Run tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report

# Code Quality
npm run lint           # Lint code
npm run lint:fix       # Fix linting issues
npm run format         # Format with Prettier
```

### Development Workflow

1. **Start backend**:
```bash
npm start
```

2. **Start frontend** (in another terminal):
```bash
npm run client:dev
```

3. **Access application**:
- Frontend: http://localhost:5173/app/
- Backend: http://localhost:5000
- Hot reload enabled on both!

### Adding New Features

1. **Backend** (API endpoint):
   - Create controller in `controllers/`
   - Define routes in `routes/`
   - Add middleware if needed
   - Update schema if database changes needed

2. **Frontend** (UI component):
   - Create component in `src/components/`
   - Add to main app flow in `App.tsx`
   - Style with Tailwind classes
   - Test responsiveness

---

## 🚢 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use strong JWT secret
- [ ] Configure proper CORS origins
- [ ] Set up SSL/HTTPS
- [ ] Configure MySQL for production
- [ ] Set up backup strategy
- [ ] Configure logging (Winston)
- [ ] Set up monitoring (PM2/New Relic)
- [ ] Build frontend: `npm run client:build`
- [ ] Test all features

### Deployment Options

#### Option 1: Traditional Hosting (VPS/Dedicated)

```bash
# Install PM2 for process management
npm install -g pm2

# Build frontend
npm run client:build

# Start with PM2
pm2 start server.js --name oes-api
pm2 startup
pm2 save

# Serve frontend with Nginx
# Configure Nginx to serve public/ directory
```

#### Option 2: Render.com (Easy deployment)

1. Connect GitHub repository
2. Set environment variables
3. Deploy backend as Web Service
4. Deploy frontend as Static Site

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

#### Option 3: Docker

```bash
# Build and run with Docker
docker-compose up -d
```

---

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
Error: ER_ACCESS_DENIED_ERROR
```
**Solution**: Check MySQL credentials in `.env`

#### Port Already in Use
```bash
Error: EADDRINUSE: address already in use :::5000
```
**Solution**: Change `PORT` in `.env` or kill process using port
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

#### Camera Not Working
**Solution**: 
1. Check browser permissions
2. Close other apps using camera
3. Use "Skip Proctoring" for testing
4. See [PROCTORING_TROUBLESHOOTING.md](./PROCTORING_TROUBLESHOOTING.md)

#### Results Not Showing
**Solution**: Fixed! Results now include student_user_id via JOINs
See [EXAM_SUBMISSION_FIX.md](./EXAM_SUBMISSION_FIX.md)

#### Frontend Not Loading
```bash
# Clear cache and rebuild
rm -rf node_modules dist public/app
npm install
npm run client:build
```

### Getting Help

1. Check documentation files in project root
2. Review console logs (F12 in browser)
3. Check server logs in `logs/` directory
4. Open an issue on GitHub

---

## 📚 Documentation

Comprehensive documentation available in project root:

| File | Description |
|------|-------------|
| [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) | Step-by-step setup |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment |
| [API.md](./docs/API.md) | Complete API reference |
| [PROCTORING_TROUBLESHOOTING.md](./PROCTORING_TROUBLESHOOTING.md) | Camera/proctoring issues |
| [EXAM_SUBMISSION_FIX.md](./EXAM_SUBMISSION_FIX.md) | Submission bug fixes |
| [UI_UPGRADE_PLAN.md](./UI_UPGRADE_PLAN.md) | UI enhancement roadmap |
| [UI_IMPROVEMENTS_IMPLEMENTED.md](./UI_IMPROVEMENTS_IMPLEMENTED.md) | New UI components |
| [PROCTORING_UI_ENHANCEMENT.md](./PROCTORING_UI_ENHANCEMENT.md) | Proctoring UI improvements |

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

- **Backend**: ESLint configuration
- **Frontend**: TypeScript strict mode
- **Commits**: Conventional commits format
- **Code style**: Prettier formatting

---

## 📄 License

This project is licensed under the ISC License.

---

## 👨‍💻 Authors

**Project Team**
- Full-stack development
- UI/UX design
- Database architecture
- Proctoring system

---

## 🙏 Acknowledgments

- **Shadcn UI** - Beautiful UI components
- **Radix UI** - Accessible primitives
- **TailwindCSS** - Utility-first CSS
- **Socket.io** - Real-time engine
- **RecordRTC** - WebRTC recording
- **React Hook Form** - Form management
- **Recharts** - Charting library

---

## 📞 Support

- 📧 Email: support@oes.edu
- 🐛 Issues: [GitHub Issues](https://github.com/yourrepo/issues)
- 📖 Docs: [Documentation](./docs/)
- 💬 Discord: [Join Server](https://discord.gg/yourserver)

---

<div align="center">

**Built with ❤️ for education**

[⬆ Back to Top](#-online-examination-system-oes-pro)

</div>
