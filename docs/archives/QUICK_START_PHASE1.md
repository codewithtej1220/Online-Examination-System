# ⚡ Phase 1 Quick Start Guide

## 🚀 Start Testing in 3 Steps

### Step 1: Start Python AI Service
```bash
cd proctoring-service
python proctoring_service.py
```
✅ Service running on **http://localhost:5001**

### Step 2: Start Backend
```bash
npm start
```
✅ Backend running on **http://localhost:5000**

### Step 3: Start Frontend
```bash
npm run client:dev
```
✅ Frontend running on **http://localhost:5173**

---

## 🧪 Quick Test

### Test as Student
1. Open **http://localhost:5173**
2. Login: **Rahul** (student)
3. Go to "Assigned Exams"
4. Click an exam → Grant camera permission
5. Start proctored exam
6. **Try violations** to see alerts:
   - Look away → alert
   - Tab switch → blocked
   - Copy/paste → blocked

### Test as Faculty
1. Login: **Naresh** (faculty)
2. Go to "Student Monitoring"
3. Select exam
4. **Watch live alerts** from students
5. Send a message to student
6. Review violation feed

---

## ✅ Features Working

✅ Video proctoring with face detection  
✅ Head movement tracking  
✅ Background noise detection  
✅ Multiple monitor detection  
✅ Lockdown mode (fullscreen, tab blocking)  
✅ Real-time faculty alerts  
✅ Video recording & upload  
✅ Answer pattern analysis  

---

## 📊 Verify Installation

```bash
node test-phase1-complete.js
```

Should show:
- ✅ All database tables verified
- ✅ Socket.io server ready
- ✅ Video storage ready
- ✅ Answer analysis loaded

---

## 🐛 Troubleshooting

**Python service won't start?**
```bash
pip install -r proctoring-service/requirements.txt
```

**Camera not working?**
- Use Chrome or Edge browser
- Check browser permissions
- Grant camera & microphone access

**Backend errors?**
- Check MySQL is running
- Verify .env file has correct password

---

## 📁 Important Files

- `src/components/ProctoredExam.tsx` - Student proctoring interface
- `src/components/FacultyMonitoring.tsx` - Faculty dashboard
- `proctoring-service/proctoring_service.py` - AI service
- `services/socketService.js` - Real-time server
- `services/answerAnalysisService.js` - Answer analysis

---

## 🎯 What's Next?

**Phase 1**: ✅ Complete  
**Phase 2**: Enhanced Exam Experience (ready to start)

---

**Ready to test? Start the 3 services above! 🚀**
