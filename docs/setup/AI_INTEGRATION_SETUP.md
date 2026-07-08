# AI Integration Setup Guide

## Overview

This guide will help you set up and test the AI-powered question generation and essay evaluation features in OES Pro.

---

## Prerequisites

- ✅ Node.js (already installed)
- ✅ MySQL database (already running)
- ✅ Express backend (already setup)
- ✅ React frontend (already setup)
- ❌ Python 3.9+ (required for AI microservice)
- ❌ Gemini API key (required from Google AI Studio)

---

## Step 1: Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"**
4. Click **"Create API key in new project"**
5. Copy the generated API key
6. **Keep this key secret!**

---

## Step 2: Database Schema Update

Run the database migration to support new question types and AI features:

```cmd
mysql -u root -p online_exam_system < schema-updates-ai.sql
```

Or manually run the SQL in MySQL Workbench/phpMyAdmin:
- Open `schema-updates-ai.sql`
- Execute all statements

**What this does:**
- Expands `question_type` ENUM to include 'Essay' and 'FillInBlank'
- Adds `ai_generated` tracking column
- Creates `ai_generation_history` table
- Creates `essay_evaluations` table

---

## Step 3: Install Python (if not installed)

### Check if Python is installed:
```cmd
python --version
```

If you see **Python 3.9 or higher**, skip to Step 4.

### Install Python:
1. Download from [python.org](https://www.python.org/downloads/)
2. Run installer
3. ✅ **CHECK "Add Python to PATH"**
4. Click "Install Now"
5. Restart your terminal

---

## Step 4: Setup AI Microservice

### Navigate to AI service directory:
```cmd
cd ai-service
```

### Create `.env` file:
```cmd
copy .env.example .env
```

### Edit `.env` file and add your Gemini API key:
```
GEMINI_API_KEY=your_actual_api_key_here
PORT=8000
HOST=0.0.0.0
ALLOWED_ORIGINS=http://localhost:5000,http://localhost:5173
```

### Install dependencies and start:
```cmd
start.bat
```

**What this does:**
- Creates Python virtual environment
- Installs FastAPI, Gemini SDK, PDF parser, etc.
- Starts AI microservice on `http://localhost:8000`

### Verify AI service is running:
Open browser: `http://localhost:8000/health`

You should see:
```json
{
  "status": "healthy",
  "gemini_api": "connected"
}
```

---

## Step 5: Update Backend Environment

The backend `.env` file has been updated automatically, but verify it contains:

```
# AI Service Configuration
AI_SERVICE_URL=http://localhost:8000
```

---

## Step 6: Restart Backend and Frontend

### Terminal 1 - Backend:
```cmd
cd c:\Users\bhanu\OneDrive\Documents\Dbms_OES
node server.js
```

### Terminal 2 - Frontend:
```cmd
cd c:\Users\bhanu\OneDrive\Documents\Dbms_OES
npm run client:dev
```

### Terminal 3 - AI Microservice:
```cmd
cd c:\Users\bhanu\OneDrive\Documents\Dbms_OES\ai-service
start.bat
```

---

## Step 7: Test the Integration

### Login as Faculty:
1. Open `http://localhost:5173/app/`
2. Login with faculty credentials
3. Navigate to **"Question Bank"**
4. You should see **two tabs**: "Manual Creation" | "AI Co-Pilot"

### Test AI Co-Pilot:

#### Option 1: Upload Syllabus
1. Click "AI Co-Pilot" tab
2. Click upload area or drag a PDF/TXT file
3. Wait for text extraction
4. Select question type (MCQ, Essay, or Fill-in-blank)
5. Choose count (5, 10, 15, or 20)
6. Select difficulty (Easy, Medium, Hard)
7. Enter subject/topic
8. Click **"Generate Questions"**

#### Option 2: Paste Content
1. Click "AI Co-Pilot" tab
2. Paste syllabus content in text area (minimum 50 characters)
3. Follow steps 4-8 from Option 1

### Review Generated Questions:
- Questions appear in preview cards
- Each shows: difficulty badge, question type, content
- For MCQ: All 4 options with correct answer highlighted
- For Essay: Expected answer shown
- For Fill-in-blank: Correct answer shown

### Edit Questions (Optional):
1. Click **Edit** button on any question
2. Modify content or options
3. Click **"Done Editing"**

### Delete Questions (Optional):
- Click **Trash** icon to remove unwanted questions

### Save to Question Bank:
1. Click **"Approve & Save All"** button
2. Wait for success message
3. Questions are now in your question bank!

---

## Troubleshooting

### ❌ "AI service is unavailable"

**Solution:**
- Check if AI microservice is running on port 8000
- Open `http://localhost:8000/health` in browser
- If not running, navigate to `ai-service/` and run `start.bat`
- Check console for errors

### ❌ "GEMINI_API_KEY environment variable is required"

**Solution:**
- Ensure `.env` file exists in `ai-service/` directory
- Open `.env` and verify API key is present
- No quotes around the key
- Restart AI microservice

### ❌ "Failed to parse JSON response"

**Solution:**
- This usually means rate limiting or API error
- Wait 10 seconds and try again
- Reduce question count
- Check Gemini API quota at [Google AI Studio](https://makersuite.google.com/)

### ❌ "PDF appears to be empty"

**Solution:**
- Ensure PDF contains extractable text (not scanned image)
- Try converting PDF to TXT first
- Or copy-paste content directly

### ❌ Port 8000 already in use

**Solution:**
```cmd
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Or change port in ai-service/.env
PORT=8001
```

Then update backend `.env`:
```
AI_SERVICE_URL=http://localhost:8001
```

---

## Testing Essay Evaluation

Essay evaluation is automatically used when:
1. Faculty creates Essay-type questions using AI Co-Pilot
2. Students submit answers to Essay questions
3. Faculty views results and sees AI-suggested grades

*Note: Essay evaluation UI integration is planned for future phases*

---

## API Endpoints Reference

All AI endpoints require faculty authentication.

### Upload Syllabus
```
POST /api/ai/upload-syllabus
Headers: Authorization: Bearer <token>
Body: multipart/form-data with 'file' field
```

### Generate Questions
```
POST /api/ai/generate-questions
Headers: Authorization: Bearer <token>
Body: {
  "syllabusText": "...",
  "questionType": "MCQ|Essay|FillInBlank",
  "count": 5-20,
  "difficultyLevel": "EASY|MEDIUM|HARD",
  "subjectTopic": "..."
}
```

### Save Questions
```
POST /api/ai/save-questions
Headers: Authorization: Bearer <token>
Body: {
  "questions": [...]
}
```

### Evaluate Essay
```
POST /api/ai/evaluate-essay
Headers: Authorization: Bearer <token>
Body: {
  "questionContent": "...",
  "expectedAnswer": "...",
  "studentAnswer": "...",
  "maxMarks": 10
}
```

### AI Service Health
```
GET /api/ai/health
Headers: Authorization: Bearer <token>
```

---

## Success Checklist

- [ ] Database schema updated successfully
- [ ] Python 3.9+ installed
- [ ] Gemini API key obtained
- [ ] AI microservice running on port 8000
- [ ] AI service health check returns "healthy"
- [ ] Backend restarted with AI_SERVICE_URL configured
- [ ] Frontend shows "AI Co-Pilot" tab
- [ ] Successfully uploaded/pasted syllabus content
- [ ] Generated questions using AI
- [ ] Edited generated questions
- [ ] Saved questions to question bank
- [ ] Questions appear in "My Question Bank"

---

## What's Next?

Once AI integration is working:

1. **Create diverse questions** - Try different question types and difficulties
2. **Build exams** - Use AI-generated questions in your exams
3. **Monitor performance** - Check `ai_generation_history` table for usage stats
4. **Optimize prompts** - Modify prompts in `question_generator.py` for better results
5. **Scale up** - Adjust rate limits in `gemini_service.py` if needed

---

## Support

If you encounter issues not covered here:

1. Check console logs (backend, frontend, AI service)
2. Review `AI_INTEGRATION_PLAN.md` for architecture details
3. Check Gemini API status and quotas
4. Ensure all three services (backend, frontend, AI) are running
5. Verify network connectivity between services

---

**Congratulations!** 🎉 Your OES Pro now has AI-powered question generation!
