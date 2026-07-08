# AI Integration Quick Start 🚀

## ⚡ 5-Minute Setup

### 1️⃣ Get API Key (2 min)
Visit: https://makersuite.google.com/app/apikey  
→ Sign in → Create API key → **Copy it**

### 2️⃣ Update Database (1 min)
```cmd
mysql -u root -p online_exam_system < schema-updates-ai.sql
```

### 3️⃣ Configure AI Service (1 min)
```cmd
cd ai-service
copy .env.example .env
notepad .env
```
Paste your API key:
```
GEMINI_API_KEY=your_key_here
```

### 4️⃣ Start Services (1 min)
**Terminal 1 - AI Service:**
```cmd
cd ai-service
start.bat
```

**Terminal 2 - Backend:**
```cmd
node server.js
```

**Terminal 3 - Frontend:**
```cmd
npm run client:dev
```

---

## ✅ Quick Test

1. Open `http://localhost:5173/app/`
2. Login as **faculty**
3. Click **"Question Bank"**
4. Switch to **"AI Co-Pilot"** tab
5. Paste some text (min 50 characters)
6. Select: MCQ, 5 questions, Medium
7. Click **"Generate Questions"**
8. Wait 10-20 seconds
9. Review & click **"Approve & Save All"**
10. ✨ Done!

---

## 🎯 Common Commands

### Check AI Service Health:
```
http://localhost:8000/health
```

### Restart AI Service:
```cmd
cd ai-service
start.bat
```

### View Logs:
- AI Service: Check terminal window
- Backend: Look for AI-related logs
- Frontend: Open browser console (F12)

---

## 🔥 Troubleshooting

| Problem | Solution |
|---------|----------|
| "AI service unavailable" | Check if port 8000 is running |
| "GEMINI_API_KEY required" | Add API key to `ai-service/.env` |
| "Failed to parse JSON" | Wait 10s, try again (rate limit) |
| Port 8000 in use | Change PORT in `.env` to 8001 |

---

## 📚 Full Documentation

- **Setup Guide:** `AI_INTEGRATION_SETUP.md`
- **Architecture:** `AI_INTEGRATION_PLAN.md`
- **Complete Details:** `AI_INTEGRATION_COMPLETE.md`

---

## 🎓 Sample Syllabus for Testing

```
Data Structures and Algorithms covers fundamental concepts including arrays,
linked lists, stacks, queues, trees, graphs, sorting algorithms, searching
algorithms, and complexity analysis. Students learn Big O notation, recursion,
dynamic programming, and greedy algorithms. The course emphasizes problem-
solving skills and algorithm optimization techniques for efficient software
development.
```

Paste this → Generate → See the magic! ✨

---

## 🌟 Features

✅ Upload PDF/TXT syllabus  
✅ Generate MCQ, Essay, Fill-in-blank  
✅ Edit generated questions  
✅ Save to question bank  
✅ 3 difficulty levels  
✅ Subject/topic tagging  

---

**Need Help?** Check the full setup guide or troubleshooting section!
