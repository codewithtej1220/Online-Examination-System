# OES Pro - Online Examination System

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A comprehensive, AI-powered online examination platform with advanced proctoring, automated grading, and intelligent question generation capabilities.

---

## Table of Contents

- [Key Features](#key-features)
- [Quick Start](#quick-start)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Configuration](#configuration)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Key Features

### AI-Powered Intelligence

- **Question Generation** - Generate MCQ, Essay, and Fill-in-blank questions from syllabus using Gemini AI
- **Essay Evaluation** - Semantic analysis and automated grading with detailed feedback
- **Multi-Modal Proctoring** - Real-time gaze tracking, face verification, audio analysis

### Role-Based Access

- **Admin** - System monitoring, user management, analytics dashboard
- **Faculty** - Question creation, exam management, live student monitoring
- **Student** - Exam taking, progress tracking, results viewing

### Advanced Proctoring

- Gaze and head pose tracking (MediaPipe)
- Biometric identity verification (DeepFace)
- Multi-face detection
- Audio anomaly detection
- Tab switching prevention
- Real-time violation logging

### Comprehensive Features

- Auto-evaluated MCQ questions
- Rich text editor with math equations
- Bulk question import (CSV/Excel)
- Randomized question ordering
- Timed examinations
- Real-time progress monitoring
- Detailed analytics and reporting

---

## Quick Start

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

**Full Guide:** See [HOW_TO_RUN.md](./HOW_TO_RUN.md)

---

## Technology Stack

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

## Project Structure

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
├── docs/                  # Documentation
│   ├── setup/            # Installation guides
│   ├── features/         # Feature documentation
│   └── archives/         # Historical docs
├── scripts/              # Utility scripts
│   ├── migrations/       # Database migrations
│   ├── testing/          # Test scripts
│   └── data/             # Sample data
├── .env.example          # Environment template
├── schema.sql            # Database schema
├── schema-updates-ai.sql # AI integration schema
├── server.js             # Express backend entry
├── package.json          # Node.js dependencies
└── README.md             # This file
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [HOW_TO_RUN.md](./HOW_TO_RUN.md) | Complete running instructions |
| [docs/QUICK_START.md](./docs/QUICK_START.md) | 5-minute quick start |
| [docs/features/AI_INTEGRATION_COMPLETE.md](./docs/features/AI_INTEGRATION_COMPLETE.md) | AI integration details |
| [docs/features/ADVANCED_PROCTORING_COMPLETE.md](./docs/features/ADVANCED_PROCTORING_COMPLETE.md) | Proctoring system documentation |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment guide |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Detailed code structure |
| [API Docs](http://localhost:8000/docs) | Interactive API documentation |

---

## Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin1` | `password123` |
| Faculty | `faculty1` | `password123` |
| Student | `student1` | `password123` |

---

## Configuration

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

## System Architecture

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

## API Endpoints

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
| PUT | `/api/exams/:id` | Update exam | Faculty |
| DELETE | `/api/exams/:id` | Delete exam | Faculty |

### Questions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/questions/all` | Get all questions | Faculty |
| POST | `/api/questions/add` | Create question | Faculty |
| PUT | `/api/questions/:id` | Update question | Faculty |
| DELETE | `/api/questions/:id` | Delete question | Faculty |

### AI Services

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/ai/upload-syllabus` | Upload syllabus file | Faculty |
| POST | `/api/ai/generate-questions` | Generate questions | Faculty |
| POST | `/api/ai/evaluate-essay` | Evaluate essay | Faculty |

### Proctoring

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/ai/proctor/start-session` | Start proctoring | Student |
| POST | `/api/ai/proctor/analyze-stream` | Analyze video/audio | Student |
| GET | `/api/ai/proctor/session-summary/:id` | Get session summary | Faculty |

Full API documentation available at `http://localhost:8000/docs` when AI service is running.

---

## Database Schema

### Core Tables

- `users` - User authentication and profiles
- `student` - Student information
- `faculty` - Faculty information
- `admin` - Administrator information

### Exam Tables

- `examination` - Exam definitions
- `question_bank` - Question repository
- `exam_questions` - Question-exam mapping
- `student_exam` - Exam assignments

### Activity Tables

- `attempt` - Exam attempts
- `student_answers` - Student responses
- `result` - Exam results

### Proctoring Tables

- `proctoring_session` - Proctoring sessions
- `proctoring_logs` - Violation logs

### AI Tables

- `ai_generation_history` - Question generation tracking
- `essay_evaluations` - AI essay evaluations

See [schema.sql](./schema.sql) for complete schema definition.

---

## Testing

```bash
# Run backend tests
npm test

# Run frontend in dev mode
npm run client:dev

# Check system health
curl http://localhost:5000/api/health
curl http://localhost:8000/health

# Run test scripts
.\scripts\testing\test-api.ps1
```

---

## Deployment

### Production Checklist

- Set `NODE_ENV=production` in `.env`
- Use strong JWT secret (32+ characters)
- Configure proper CORS origins
- Set up SSL/HTTPS
- Configure MySQL for production
- Set up backup strategy
- Build frontend: `npm run client:build`
- Test all features in production environment

### Deployment Options

1. **Traditional Hosting (VPS/Dedicated)**
   - Use PM2 for process management
   - Configure Nginx as reverse proxy
   - Set up SSL certificates

2. **Cloud Platforms**
   - Deploy backend to AWS EC2, Azure VM, or Google Compute
   - Deploy AI service to AWS Lambda or Google Cloud Run
   - Use managed MySQL (AWS RDS, Azure Database)

3. **Docker Deployment**
   - Build and run with Docker Compose
   - Container orchestration with Kubernetes

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## Contributing

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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Authors

**Team OES Pro**
- Full-stack development
- UI/UX design
- Database architecture
- AI/ML integration

---

## Acknowledgments

- Google Gemini AI for question generation
- MediaPipe for face tracking
- DeepFace for face verification
- OpenCV for computer vision
- Shadcn/UI for component library

---

## Support

- **Documentation:** [docs/](./docs/)
- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions

---

**Made with dedication for better online education**

---

## System Requirements

### Minimum Requirements

- **OS:** Windows 10/11, Linux, macOS
- **CPU:** 4 cores, 2.5 GHz
- **RAM:** 8 GB
- **Storage:** 10 GB free space
- **Network:** Broadband internet connection

### Recommended Requirements

- **OS:** Windows 11, Ubuntu 20.04+, macOS 12+
- **CPU:** 8 cores, 3.0 GHz
- **RAM:** 16 GB
- **Storage:** 20 GB SSD
- **Network:** High-speed internet connection
- **GPU:** Optional, for faster AI processing

---

## Performance Metrics

### Processing Speed

- Gaze tracking: 50-100ms per frame
- Face detection: 30-60ms per frame
- Identity verification: 200-400ms per frame
- Audio analysis: 100-200ms per sample
- **Total concurrent processing:** 400-600ms

### Scalability

- Supports 1 concurrent proctoring session per 2 CPU cores
- Database connection pooling for efficiency
- Microservice architecture for horizontal scaling
- Socket.io for real-time updates with minimal latency

---

## Security Features

### Authentication & Authorization

- JWT-based token authentication
- bcrypt password hashing (12 rounds)
- Role-based access control (RBAC)
- Session management
- Token expiration and refresh

### Data Protection

- SQL injection prevention (parameterized queries)
- XSS protection (input sanitization)
- CSRF protection
- Rate limiting on sensitive endpoints
- Input validation at all layers
- Secure file upload handling

### Proctoring Security

- Encrypted video/audio transmission
- Secure baseline storage
- Violation logging with timestamps
- Faculty-only access to proctoring data
- Student privacy compliance

---

## Troubleshooting

### Common Issues

**Database Connection Failed**
```
Error: ER_ACCESS_DENIED_ERROR
```
**Solution:** Check MySQL credentials in `.env` file

**Port Already in Use**
```
Error: EADDRINUSE: address already in use :::5000
```
**Solution:** Change `PORT` in `.env` or kill process using port
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**AI Service Not Starting**
```
Error: ModuleNotFoundError: No module named 'mediapipe'
```
**Solution:** Install Python dependencies
```bash
cd ai-service
pip install -r requirements.txt
```

**Camera Not Working**
**Solution:**
1. Check browser permissions
2. Close other apps using camera
3. Use "Skip Proctoring" for testing

---

## Maintenance

### Regular Tasks

- Database backups (daily recommended)
- Log rotation and cleanup
- Dependency updates (monthly)
- Security patches (as available)
- Performance monitoring
- Disk space monitoring

### Monitoring

- Check application logs in `logs/` directory
- Monitor database performance
- Track AI service response times
- Review violation logs for patterns
- Monitor system resource usage

---

## Version History

### Version 2.0.0 (Current)

- Complete AI-powered proctoring system
- Multi-modal integrity monitoring
- Advanced question generation
- Enhanced student exam experience
- Real-time faculty monitoring
- Professional project structure
- Comprehensive documentation

### Version 1.0.0

- Basic exam management
- Manual question creation
- Simple proctoring features
- Student and faculty roles

---

**Project Status:** Production Ready  
**Last Updated:** 2026-07-08  
**Maintained By:** Team OES Pro
