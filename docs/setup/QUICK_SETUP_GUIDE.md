# 🚀 Quick Setup Guide - Test All Features

## The Issue
The features ARE integrated, but you need to set up the exam flow first:
1. Faculty creates questions
2. Faculty creates an exam
3. Faculty assigns questions to exam
4. Faculty assigns exam to student
5. THEN student can take the exam and see all Phase 1-6 features!

---

## 📋 Step-by-Step Setup

### Step 1: Login as Faculty
```
URL: http://localhost:5000
Username: faculty1
Password: pass
```

### Step 2: Create Questions (or Import via Excel)

#### Option A: Create Manually
1. You'll be on **"Question Bank"** view
2. Fill in the form:
   ```
   Question Content: What is 2 + 2?
   Option A: 3
   Option B: 4
   Option C: 5
   Option D: 6
   Correct Answer: B
   Difficulty: EASY
   Subject: Mathematics
   ```
3. Click **"Save Question to Bank"**
4. Create 5-10 questions this way

#### Option B: Use Excel Import (Phase 3 Feature!)
1. At the top, click **"Download Template"** button
2. Open the downloaded Excel file
3. Add multiple questions following the format:
   ```
   content | option_a | option_b | option_c | option_d | correct_answer | difficulty_level | subject_topic | tags
   What is 2+2? | 3 | 4 | 5 | 6 | B | EASY | Math | arithmetic
   Capital of France? | London | Paris | Berlin | Rome | B | EASY | Geography | capitals
   ... add more rows ...
   ```
4. Save the Excel file
5. Click **"Upload Excel/CSV"**
6. Select your file
7. Preview will show
8. Click **"Import X Questions"**
9. ✅ All questions imported instantly!

### Step 3: Create an Exam
1. Click **"Exam Creation"** in sidebar
2. Fill in the **"Create Exam"** form:
   ```
   Title: Midterm Exam
   Duration: 30 (minutes)
   Scheduled Time: (leave blank or set future time)
   ```
3. Click **"Create Exam"**
4. Note the **Exam ID** that appears (e.g., "Exam ID: 5")

### Step 4: Assign Questions to Exam
1. Still in "Exam Creation" view
2. In **"Assign Question to Exam"** section:
   ```
   Exam ID: 5 (the one you just created)
   Question ID: 1 (from your question bank)
   ```
3. Click **"Assign Question"**
4. Repeat for multiple questions (at least 5-10 questions)
   - Change Question ID each time (1, 2, 3, 4, 5...)
   - Keep same Exam ID

### Step 5: Assign Exam to Student
1. Still in "Exam Creation" view
2. In **"Assign Exam to Student"** section:
   ```
   Exam ID: 5 (your exam)
   Student User ID: 3 (or whatever student ID you have)
   ```
3. Click **"Assign to Student"**
4. ✅ Student can now take the exam!

---

## 🎓 Step 6: Take Exam as Student (SEE ALL FEATURES!)

### Login as Student
```
Logout (top-right)
Login with:
Username: student1
Password: pass
```

### Verify ID
1. Click **"ID Verification"** in sidebar
2. Enter your student ID (should match user_id, e.g., 3)
3. Click **"Verify Student ID"**
4. ✅ Message shows "X exam(s) assigned"

### Start Exam - THIS IS WHERE MAGIC HAPPENS!
1. Click **"Assigned Exams"** in sidebar
2. Select your exam from dropdown ("Midterm Exam")
3. Click **"Start Exam"**

### 🎬 Phase 1 Features Appear:
```
┌─────────────────────────────────────────────────────────┐
│  🎥 PROCTORED EXAM SETUP SCREEN                         │
│                                                         │
│  ┌─────────────┐  ┌─────────────────────────────────┐ │
│  │ Camera      │  │ Requirements:                   │ │
│  │ Preview     │  │ ○ Webcam enabled                │ │
│  │             │  │ ○ Microphone enabled            │ │
│  │ [Video]     │  │ ○ Fullscreen required           │ │
│  │             │  │ 🔴 Recording enabled             │ │
│  └─────────────┘  └─────────────────────────────────┘ │
│                                                         │
│  Proctoring Rules:                                      │
│  • Face must be visible                                 │
│  • No tab switching                                     │
│  • Copy/paste blocked                                   │
│                                                         │
│  [Enable Camera & Microphone] ← Click this             │
│  [Start Proctored Exam] ← Then click this              │
└─────────────────────────────────────────────────────────┘
```

4. Click **"Enable Camera & Microphone"** (allow permissions in browser)
5. Camera preview appears ✅
6. Click **"Start Proctored Exam"**

### 🎯 Phase 2 Features Appear:
```
┌──────────────────────────────────────────────────────────┐
│ 🔴 Recording (top bar)                                   │
│ Faces: 1 | Looking: Forward | Risk: 5                  │
└──────────────────────────────────────────────────────────┘

┌────────────────────────────────┬─────────────────────────┐
│ EXAM                           │ NAVIGATION SIDEBAR      │
│                                │                         │
│ Midterm Exam                   │ ⏱ Timer: 29:45         │
│ Time: 29:45 ⏰ ← TIMER HERE!   │    (countdown live)     │
│                                │                         │
│ Question 1 of 10               │ Progress: ███░░░ 3/10  │
│                                │                         │
│ Q1. What is 2+2?               │ ✅ 3 Answered          │
│ ○ A. 3                         │ 🚩 1 Bookmarked        │
│ ● B. 4 ← Selected              │ ⭕ 6 Remaining         │
│ ○ C. 5                         │                         │
│ ○ D. 6                         │ [◄ Prev] [🚩] [≡] [►]  │
│                                │                         │
│ ✓ Answer saved                 │ [Jump to Unanswered]   │
│                                │ [👁 Review All]        │
│ [Submit Exam]                  │                         │
│                                │ [🧮 Show Calculator]    │
└────────────────────────────────┴─────────────────────────┘
```

### Test Each Feature:

**1. Timer (Phase 2):**
- Watch the countdown in top-right
- It will show warnings at 25%, 10%, and 2 minutes remaining
- Color changes: Green → Yellow → Orange → Red

**2. Navigation (Phase 2):**
- Click **[► Next]** to go to next question
- Click **[◄ Prev]** to go back
- Click **[≡]** to open question palette (grid view)
- In palette, click any question number to jump to it

**3. Bookmarks (Phase 2):**
- Click **[🚩]** flag icon to bookmark current question
- Flag turns amber ✅
- Bookmarked questions show in palette with flag
- Click again to unbookmark

**4. Calculator (Phase 2):**
- Click **"Show Calculator"**
- Floating calculator appears ✅
- Try: 2 + 2 = 4
- Click "Scientific" for sin, cos, tan, sqrt
- Drag it around the screen
- Minimize when not needed

**5. Auto-save:**
- Select any answer
- Message appears: "✓ Answer saved automatically"
- No need to click Save!

**6. Progress Bar:**
- Watch it fill up as you answer questions
- Shows: "8/10 answered"

---

## 👨‍🏫 Test Faculty Monitoring (Phase 3)

### While Student is Taking Exam:
1. Open another browser/incognito window
2. Login as faculty: `faculty1` / `pass`
3. Click **"Student Monitoring"** in sidebar

### You'll See:
```
┌─────────────────────────────────────────────────────────┐
│ 📹 Faculty Monitoring Dashboard                         │
│                                                         │
│ ┌──────────────┐                                       │
│ │ Student #3   │  ← Live video feed of student        │
│ │ [Video Feed] │                                       │
│ │              │                                       │
│ │ 🟢 Normal    │                                       │
│ │ Risk: 12     │                                       │
│ │              │                                       │
│ │ [⏸ Pause]   │  ← Control buttons                    │
│ │ [⏹ Stop]    │                                       │
│ │ [💬 Message] │                                       │
│ └──────────────┘                                       │
│                                                         │
│ Alerts:                                                 │
│ 🟡 Student #3: Tab switch detected                     │
│ 🟢 Student #3: Exam progressing normally               │
└─────────────────────────────────────────────────────────┘
```

**Test Actions:**
- Click **[💬 Message]** to send message to student
- Click **[⏸ Pause]** to pause their exam
- Click **[⏹ Stop]** to terminate exam
- Watch alerts appear in real-time

---

## 👨‍💼 Test Admin Features (Phase 4-5)

### Login as Admin
```
Logout
Login with:
Username: admin
Password: admin123
```

### Test Analytics (Phase 4)
1. You'll be on **"System Monitoring"** dashboard
2. Look for:
   ```
   📊 Metric Cards:
   - Total Users: 156
   - Total Exams: 43
   - Avg Score: 75%
   - Violations: 3

   📈 Charts:
   - Line Chart: Exam trends over week
   - Doughnut Chart: User distribution
   ```
3. Hover over charts to see tooltips ✅

### Test Gamification (Phase 5)
1. Click **"Gamification"** in sidebar (🏆 Trophy icon)
2. Look for:
   ```
   ⭐ Points: 1,250
   🏆 Level: 8
   🎯 Streak: 5 days
   🎖 Badges: 3

   Achievement cards:
   ✅ First Steps (unlocked, green border)
   🔒 Perfect Score (locked, progress bar 85%)
   ✅ Speed Demon (unlocked)
   🔒 Streak Master (progress bar 42%)
   ```

---

## ✅ Verification Checklist

After completing setup, you should see:

**Student Portal:**
- [x] Proctoring setup screen appears
- [x] Camera preview works
- [x] Exam timer counts down
- [x] Question navigation sidebar visible
- [x] Can open calculator
- [x] Can bookmark questions
- [x] Palette shows all questions
- [x] Progress bar updates
- [x] Answers auto-save

**Faculty Portal:**
- [x] Excel import button visible
- [x] Can upload and preview questions
- [x] Rich text editor has formatting toolbar
- [x] Monitoring shows student video feed
- [x] Can see real-time alerts
- [x] Control buttons work

**Admin Portal:**
- [x] Analytics charts display
- [x] Metric cards show data
- [x] Gamification view accessible
- [x] Achievement cards visible

---

## 🐛 Troubleshooting

### "No exams assigned"
- Make sure you assigned exam to student (Step 5)
- Check student user_id matches

### "Camera not working"
- Allow camera/mic permissions in browser
- Check if camera is in use by another app
- Try different browser

### "Questions not showing in exam"
- Make sure you assigned questions to exam (Step 4)
- Need at least 1 question assigned

### "Features not visible"
- Hard refresh browser: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Clear browser cache
- Check console for errors (F12)

---

## 🎯 Quick Test Scenario

**Fastest way to see all features:**

1. **Faculty**: Import 10 questions via Excel (2 minutes)
2. **Faculty**: Create exam, assign questions, assign to student (2 minutes)
3. **Student**: Start exam → See proctoring, timer, navigation, calculator (5 minutes)
4. **Faculty**: Open monitoring → See student live feed (1 minute)
5. **Admin**: View analytics and gamification (2 minutes)

**Total time: ~12 minutes to see ALL features!**

---

## 📱 Test Credentials

| Role | Username | Password | User ID (approx) |
|------|----------|----------|------------------|
| Admin | admin | admin123 | 1 |
| Faculty | faculty1 | pass | 2 |
| Student | student1 | pass | 3 |

*User IDs may vary based on your registration order*

---

## 💡 Pro Tips

1. **Use Excel Import**: Fastest way to add many questions
2. **Open Multiple Windows**: Test student + faculty monitoring simultaneously
3. **Test Timer Warnings**: Create a 3-minute exam to see warnings quickly
4. **Test Proctoring**: Try tab switching to trigger alerts
5. **Check Console**: F12 → Console for any errors

---

## 🎊 Success!

When you complete this setup, you'll experience:
- ✅ Full proctored exam with video recording
- ✅ Live countdown timer with warnings
- ✅ Question navigation with bookmarks
- ✅ Working calculator
- ✅ Real-time faculty monitoring
- ✅ Analytics dashboard
- ✅ Gamification system

**All Phase 1-6 features fully functional!** 🚀

---

**Need help?** Check the browser console (F12) for any errors.
