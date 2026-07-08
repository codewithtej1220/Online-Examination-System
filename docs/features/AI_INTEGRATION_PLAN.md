# AI Integration Plan - Online Examination System

## Executive Summary

This document outlines the implementation plan for integrating AI-powered features into OES Pro, based on Gemini's comprehensive prompt. The integration adds intelligent question generation and evaluation capabilities while maintaining the existing MySQL, Express, and React/TypeScript architecture.

---

## Current State Analysis

### ✅ **ALREADY IMPLEMENTED** (No action needed)

#### Security Features in `ProctoredExam.tsx`
All security features mentioned in Gemini's prompt are **already fully implemented**:

1. **Tab Switching Detection** ✅
   - Uses `document.visibilitychange` event
   - Emits `proctoring:tab-switch` via Socket.io
   - Shows alert to student

2. **Copy/Paste/Cut Prevention** ✅
   - Prevents `copy`, `paste`, and `cut` clipboard events
   - Emits `proctoring:copy-paste` via Socket.io
   - Shows blocking alert

3. **Right-Click Blocking** ✅
   - Prevents `contextmenu` event during exam

4. **Fullscreen Enforcement** ✅
   - Monitors fullscreen state changes
   - Emits `proctoring:exit-fullscreen` if exited
   - Gracefully skips on localhost for testing

5. **Real-time Monitoring** ✅
   - Socket.io connection established
   - All events transmitted to faculty dashboard
   - Camera/microphone monitoring active

**Conclusion:** Security implementation is production-ready. No changes needed.

---

## ❌ **NOT IMPLEMENTED** (Must build)

### 1. Hybrid Faculty Dashboard with AI Co-Pilot
**Location:** `src/App.tsx` - FacultyWorkspace component

**What's needed:**
- Dual-mode UI for Manual + AI Co-Pilot question creation
- File dropzone for syllabus/document upload (PDF/TXT)
- Question type selector (MCQ, Fill-in-the-blanks, Essay)
- Question count selector
- "Generate Drafts" button
- Preview/edit interface for AI-generated questions
- "Approve & Save to Question Bank" functionality
- Split-screen grading interface for essay evaluation

### 2. Backend AI Routes (Express)
**Location:** New files required

**What's needed:**
- `routes/aiRoutes.js` - AI-specific endpoints
- `controllers/aiController.js` - Business logic for AI operations
- Integration with existing question_bank schema

**Endpoints to create:**
```
POST /api/ai/upload-syllabus
POST /api/ai/generate-questions
POST /api/ai/evaluate-essay
```

### 3. Python FastAPI Microservice
**Location:** New directory `ai-service/`

**What's needed:**
- FastAPI application setup
- Gemini API integration for:
  - RAG-based question generation from syllabus
  - Essay evaluation with semantic scoring
- Text extraction from PDF/TXT files
- Question format validation
- Communication with Express backend

---

## Implementation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + TypeScript)           │
│                                                             │
│  ┌─────────────────────────────────────────────────┐      │
│  │   FacultyWorkspace - Question Management        │      │
│  │                                                   │      │
│  │   [Manual Mode]  |  [AI Co-Pilot Mode]          │      │
│  │                  |                               │      │
│  │   - Text Input   |  - Upload Syllabus (PDF/TXT) │      │
│  │   - Options      |  - Select: MCQ/Essay/FIB     │      │
│  │   - Save         |  - Count: 5, 10, 15          │      │
│  │                  |  - Generate Drafts Button    │      │
│  │                  |  - Preview & Edit Generated  │      │
│  │                  |  - Approve & Save            │      │
│  └─────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/REST
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXPRESS BACKEND (Node.js)                  │
│                                                             │
│  ┌─────────────────────────────────────────────────┐      │
│  │   /api/ai/upload-syllabus                       │      │
│  │   /api/ai/generate-questions                    │      │
│  │   /api/ai/evaluate-essay                        │      │
│  └─────────────────────────────────────────────────┘      │
│                          │                                  │
│                          │ Internal HTTP                    │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────┐      │
│  │   MySQL Database (question_bank table)          │      │
│  │   - Stores approved questions                   │      │
│  │   - Maps to existing schema                     │      │
│  └─────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/REST
                          ▼
┌─────────────────────────────────────────────────────────────┐
│            PYTHON FASTAPI MICROSERVICE                      │
│                                                             │
│  ┌─────────────────────────────────────────────────┐      │
│  │   POST /generate-questions                      │      │
│  │   - Extract text from PDF/TXT                   │      │
│  │   - Use Gemini for RAG-based generation         │      │
│  │   - Return structured question JSON             │      │
│  └─────────────────────────────────────────────────┘      │
│                                                             │
│  ┌─────────────────────────────────────────────────┐      │
│  │   POST /evaluate-essay                          │      │
│  │   - Compare student answer vs expected          │      │
│  │   - Semantic similarity scoring                 │      │
│  │   - Return grade + feedback                     │      │
│  └─────────────────────────────────────────────────┘      │
│                                                             │
│  ┌─────────────────────────────────────────────────┐      │
│  │   Gemini API Integration                        │      │
│  │   - google-generativeai library                 │      │
│  │   - RAG with embeddings                         │      │
│  │   - Few-shot prompting                          │      │
│  └─────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema Compatibility

The existing `question_bank` table structure:

```sql
CREATE TABLE question_bank (
    question_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    faculty_user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    question_type ENUM('MCQ') NOT NULL DEFAULT 'MCQ',
    difficulty_level ENUM('EASY','MEDIUM','HARD') NOT NULL,
    subject_topic VARCHAR(150),
    tags VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    correct_answer TEXT,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT
);
```

**Required Changes:**
- Expand `question_type` ENUM to include `'Essay'` and `'FillInBlank'`
- All other fields remain compatible
- AI-generated questions will map directly to this schema

---

## Implementation Phases

### **Phase 1: Database Schema Update**
- [ ] Alter `question_type` ENUM to support Essay and FillInBlank
- [ ] Add migration script
- [ ] Test backward compatibility

### **Phase 2: Python FastAPI Microservice**
- [ ] Create `ai-service/` directory structure
- [ ] Setup FastAPI application
- [ ] Integrate Gemini API
- [ ] Implement PDF/TXT text extraction
- [ ] Create `/generate-questions` endpoint
- [ ] Create `/evaluate-essay` endpoint
- [ ] Add CORS for Express communication
- [ ] Write startup script

### **Phase 3: Express Backend AI Routes**
- [ ] Create `routes/aiRoutes.js`
- [ ] Create `controllers/aiController.js`
- [ ] Implement file upload handling (multer)
- [ ] Proxy requests to Python microservice
- [ ] Validate and save questions to database
- [ ] Add authentication middleware
- [ ] Register routes in `server.js`

### **Phase 4: Frontend UI - AI Co-Pilot Mode**
- [ ] Create TypeScript interfaces for AI types
- [ ] Add dual-mode toggle in FacultyWorkspace
- [ ] Build file dropzone component
- [ ] Add question type/count selectors
- [ ] Implement "Generate Drafts" handler
- [ ] Create preview/edit interface
- [ ] Add "Approve & Save" functionality
- [ ] Loading states and error handling

### **Phase 5: Frontend UI - Essay Grading**
- [ ] Create split-screen grading view
- [ ] Left panel: Student answer display
- [ ] Right panel: AI suggestions
- [ ] Manual override capability
- [ ] Save final grade to database

### **Phase 6: Testing & Documentation**
- [ ] Test end-to-end flow
- [ ] Verify database integration
- [ ] Check demo credentials compatibility
- [ ] Write usage documentation
- [ ] Update README with AI features

---

## Technical Requirements

### Dependencies to Add

**Backend (Express):**
```json
{
  "dependencies": {
    "multer": "^2.2.0",  // ✅ Already installed
    "axios": "^1.18.0"    // ✅ Already installed
  }
}
```

**Python Microservice:**
```
fastapi==0.115.0
uvicorn==0.32.0
google-generativeai==0.8.0
PyPDF2==3.0.1
python-multipart==0.0.17
python-dotenv==1.0.0
```

### Environment Variables

**Backend (.env):**
```
AI_SERVICE_URL=http://localhost:8000
```

**Python (.env):**
```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8000
```

---

## API Contracts

### 1. Upload Syllabus
```
POST /api/ai/upload-syllabus
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
  file: <PDF or TXT file>

Response:
{
  "success": true,
  "message": "Syllabus uploaded successfully",
  "extractedText": "Computer Networks involves...",
  "wordCount": 1500
}
```

### 2. Generate Questions
```
POST /api/ai/generate-questions
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "syllabusText": "Computer Networks involves...",
  "questionType": "MCQ",
  "count": 10,
  "difficultyLevel": "MEDIUM",
  "subjectTopic": "Computer Networks"
}

Response:
{
  "success": true,
  "questions": [
    {
      "content": "What is the purpose of TCP?",
      "question_type": "MCQ",
      "difficulty_level": "MEDIUM",
      "subject_topic": "Computer Networks",
      "correct_answer": "A",
      "option_a": "Reliable data transmission",
      "option_b": "IP addressing",
      "option_c": "Routing",
      "option_d": "DNS resolution"
    }
  ]
}
```

### 3. Evaluate Essay
```
POST /api/ai/evaluate-essay
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "questionContent": "Explain TCP/IP model",
  "expectedAnswer": "The TCP/IP model has 4 layers...",
  "studentAnswer": "TCP/IP is a networking protocol...",
  "maxMarks": 10
}

Response:
{
  "success": true,
  "evaluation": {
    "score": 7.5,
    "maxScore": 10,
    "feedback": "Good understanding of basic concepts. Missing details on Application layer.",
    "suggestions": ["Add more details about layers", "Explain protocols in each layer"]
  }
}
```

---

## File Structure (New Files)

```
Dbms_OES/
├── routes/
│   └── aiRoutes.js                    [NEW]
├── controllers/
│   └── aiController.js                [NEW]
├── ai-service/                        [NEW DIRECTORY]
│   ├── main.py                        [NEW]
│   ├── requirements.txt               [NEW]
│   ├── .env                           [NEW]
│   ├── services/
│   │   ├── gemini_service.py          [NEW]
│   │   ├── question_generator.py      [NEW]
│   │   └── essay_evaluator.py         [NEW]
│   └── utils/
│       └── file_extractor.py          [NEW]
├── src/
│   ├── types/
│   │   └── ai.ts                      [NEW]
│   └── App.tsx                        [MODIFIED]
└── schema-updates.sql                 [NEW]
```

---

## Risk Assessment & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gemini API rate limits | High | Implement request queuing, caching, retry logic |
| PDF parsing failures | Medium | Fallback to manual input, support multiple formats |
| Microservice downtime | High | Graceful degradation to manual mode, health checks |
| Quality of generated questions | Medium | Faculty review/edit before approval, feedback loop |
| Database schema changes | Low | Migration scripts, backward compatibility checks |

---

## Success Criteria

✅ Faculty can upload syllabus and generate questions  
✅ AI-generated questions appear in preview interface  
✅ Faculty can edit before saving to question bank  
✅ Questions integrate seamlessly with existing exam creation flow  
✅ Essay grading provides AI suggestions  
✅ No breaking changes to existing functionality  
✅ Demo credentials continue working  
✅ All security features remain functional  

---

## Next Steps

1. **Review and approve this plan**
2. **Set up Gemini API key**
3. **Begin Phase 1: Database updates**
4. **Implement Phase 2: Python microservice**
5. **Continue through remaining phases**

---

**Document Version:** 1.0  
**Last Updated:** Context Transfer Session  
**Status:** Ready for Implementation
