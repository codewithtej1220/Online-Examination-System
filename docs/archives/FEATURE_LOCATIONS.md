# 🗺️ Feature Locations Guide

Quick reference for finding all Phase 1-6 features in the application.

---

## 🎓 STUDENT PORTAL

### Login
```
http://localhost:5000
→ Login with student credentials
```

### 1. ID Verification View
**Navigation**: Auto-opens first (or click "ID Verification" in sidebar)
```
Features:
- Enter student ID to verify
- View assigned exams count
```

### 2. Assigned Exams View → **MAIN FEATURES HERE**
**Navigation**: Click "Assigned Exams" in sidebar

#### Before Starting Exam:
```
┌─────────────────────────────────────────┐
│  Exam Selection Card                    │
│  - Dropdown: Select exam                │
│  - Shows: Title, Duration, Schedule     │
│  - Button: [Start Exam]                 │
└─────────────────────────────────────────┘
```

#### After Clicking "Start Exam":
```
┌─────────────────────────────────────────────────────────┐
│  PROCTORING SETUP SCREEN (Phase 1)                      │
│  ┌───────────────────┐  ┌──────────────────────────┐   │
│  │  Camera Preview   │  │  Requirements Checklist: │   │
│  │  [Video Feed]     │  │  ✓ Webcam enabled        │   │
│  │                   │  │  ✓ Microphone enabled    │   │
│  │  [Live Indicator] │  │  ⚠ Multiple monitors     │   │
│  └───────────────────┘  │  □ Fullscreen required   │   │
│                         │  🔴 Recording enabled     │   │
│  Proctoring Rules:      └──────────────────────────┘   │
│  • Face must be visible                                 │
│  • No tab switching                                     │
│  • Copy/paste blocked                                   │
│                                                          │
│  [Start Proctored Exam] ← Click to begin               │
└─────────────────────────────────────────────────────────┘
```

#### During Exam (After Proctoring Setup):
```
┌────────────────────────────────────────────────────────────────────────┐
│ 🔴 Recording Status Bar (Top)                                          │
│ Faces: 1 | Looking: Forward | Risk Score: 12                          │
└────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┬────────────────────────────────┐
│  EXAM CARD (Left - 70%)              │  NAVIGATION PANEL (Right 30%)  │
│  ┌──────────────────────────────────┐│  ┌───────────────────────────┐│
│  │ Title: Midterm Exam              ││  │ ⏱ Exam Timer (Phase 2)    ││
│  │ Timer: 45:23 remaining  ⏰        ││  │   Time: 45:23             ││
│  │                                  ││  │   [Color changes by time]  ││
│  │ Question 5 of 20                 ││  └───────────────────────────┘│
│  └──────────────────────────────────┘││                                │
│                                       ││  ┌───────────────────────────┐│
│  ┌──────────────────────────────────┐││  │ Progress Bar (Phase 2)     ││
│  │ Q5. What is 2+2?                 ││  │ ████████░░░░ 8/20 answered││
│  │                                  ││  │                            ││
│  │ ○ A. 3                           ││  │ ✅ 8 Answered              ││
│  │ ● B. 4  ← Selected               ││  │ 🚩 2 Bookmarked            ││
│  │ ○ C. 5                           ││  │ ⭕ 10 Remaining            ││
│  │ ○ D. 6                           ││  └───────────────────────────┘│
│  └──────────────────────────────────┘││                                │
│                                       ││  [◄ Previous] [🚩] [≡] [Next ►]
│  [Submit Exam for Grading]           ││                                │
│                                       ││  [Jump to Next Unanswered]    │
│  ✓ Answer saved automatically        ││  [👁 Review All]              │
└──────────────────────────────────────┴────────────────────────────────┘
                                       │  ┌───────────────────────────┐│
                                       │  │ Question Palette (click ≡)││
                                       │  │ [1✓][2✓][3✓][4✓][5🔵]     ││
                                       │  │ [6🚩][7][8✓][9][10]       ││
                                       │  │ ... etc ...               ││
                                       │  │                           ││
                                       │  │ Legend:                   ││
                                       │  │ 🔵 Current                ││
                                       │  │ ✓ Answered                ││
                                       │  │ 🚩 Bookmarked             ││
                                       │  │ ○ Unanswered              ││
                                       │  └───────────────────────────┘│
                                       │                                │
                                       │  [🧮 Show Calculator]          │
                                       └────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📹 Video Preview (Bottom Right)     │  ← Small corner camera view
│ [Your face]                         │
│ 🔴 REC                              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🧮 Calculator Widget (Phase 2)      │  ← Draggable, appears if enabled
│ ┌─────────────────────────────────┐ │
│ │ Calculator         [_][□][×]    │ │
│ │ Memory: 0    Last: 25+5=30     │ │
│ │                                 │ │
│ │         Display: 30             │ │
│ │                                 │ │
│ │ [sin][cos][tan][√]              │ │
│ │ [x²][x^y][π][e]                 │ │
│ │ [M+][M-][MR][MC]                │ │
│ │                                 │ │
│ │ [AC]  [⌫]  [÷]                  │ │
│ │ [7][8][9]  [×]                  │ │
│ │ [4][5][6]  [-]                  │ │
│ │ [1][2][3]  [+]                  │ │
│ │  [0]  [.]  [=]                  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Timing Warnings (Phase 2):
```
When 25% time left:
┌────────────────────────────────────────────────────────┐
│ ⚠ 25% of exam time remaining. Plan accordingly.       │
│                                          [Dismiss]     │
└────────────────────────────────────────────────────────┘

When 10% time left:
┌────────────────────────────────────────────────────────┐
│ ⚠ 10% of exam time remaining. Review your answers.    │
│                                          [Dismiss]     │
└────────────────────────────────────────────────────────┘

When 2 minutes left:
┌────────────────────────────────────────────────────────┐
│ 🚨 Only 2 minutes remaining! Complete your exam.      │
│                                          [Dismiss]     │
└────────────────────────────────────────────────────────┘

Last 10 seconds:
┌────────────────────────────────────────────────────────┐
│              Auto-submitting in                        │
│                                                        │
│                    7                                   │
│                                                        │
│     Your exam will be submitted automatically         │
└────────────────────────────────────────────────────────┘
```

### 3. Results View
**Navigation**: Click "Auto-evaluated Result" in sidebar
```
Shows completed exams with scores
```

---

## 👨‍🏫 FACULTY PORTAL

### Login
```
http://localhost:5000
→ Login with faculty credentials
```

### 1. Question Bank View → **IMPORT & EDITOR HERE**
**Navigation**: Auto-opens first (or click "Question Bank" in sidebar)

```
┌─────────────────────────────────────────────────────────────┐
│  📤 Question Import (Phase 3)                               │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Import Questions                                      │ │
│  │                                                       │ │
│  │ [📥 Download Template]  [📊 Upload Excel/CSV]       │ │
│  │                                                       │ │
│  │ Preview: (if file uploaded)                          │ │
│  │ 1. What is 2+2?                                      │ │
│  │    A) 3  B) 4 ✓  C) 5  D) 6                         │ │
│  │ 2. Capital of France?                                │ │
│  │    ...                                               │ │
│  │                                                       │ │
│  │ ✅ Loaded 50 questions                              │ │
│  │ [Import 50 Questions]                                │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ✍️ Create Auto-Evaluated MCQ                               │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Question Content                              [🎤]   │ │
│  │ ┌───────────────────────────────────────────────────┐│ │
│  │ │ Rich Text Editor (Phase 3)                       ││ │
│  │ │ [B][I][U] [H1▼] [🔢][•] [∫formula] [</>][🖼][🔗]  ││ │
│  │ │                                                   ││ │
│  │ │ What is the solution to: x² + 5x + 6 = 0        ││ │
│  │ │                                                   ││ │
│  │ │ Supports:                                         ││ │
│  │ │ - Math equations: ∫₀^∞ e^(-x²) dx               ││ │
│  │ │ - Formatted text: **bold** _italic_              ││ │
│  │ │ - Images and links                               ││ │
│  │ └───────────────────────────────────────────────────┘│ │
│  │                                                       │ │
│  │ Option A: [x = -2, x = -3]                    [🎤]   │ │
│  │ Option B: [x = 2, x = 3]                      [🎤]   │ │
│  │ Option C: [x = -1, x = -6]                    [🎤]   │ │
│  │ Option D: [No real solutions]                 [🎤]   │ │
│  │                                                       │ │
│  │ Correct: [A▼]  Difficulty: [MEDIUM▼]                │ │
│  │ Subject: [Algebra]  Tags: [quadratic,factoring]     │ │
│  │                                                       │ │
│  │ [+ Save Question to Bank]                            │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📋 Question Bank (120 questions)                           │
│  [Table showing all questions]                              │
└─────────────────────────────────────────────────────────────┘
```

### 2. Exam Creation View
**Navigation**: Click "Exam Creation" in sidebar
```
Standard exam creation form
- Create exams
- Assign questions
- Assign students
```

### 3. Student Monitoring View → **PROCTORING DASHBOARD HERE**
**Navigation**: Click "Student Monitoring" in sidebar

```
┌───────────────────────────────────────────────────────────────────┐
│  📹 Faculty Monitoring Dashboard (Phase 3)                        │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Student #12 │  │ Student #15 │  │ Student #18 │              │
│  │ [Video Feed]│  │ [Video Feed]│  │ [Video Feed]│              │
│  │             │  │             │  │             │              │
│  │ 🟢 Normal   │  │ 🟡 Warning  │  │ 🔴 Critical │              │
│  │ Risk: 5     │  │ Risk: 45    │  │ Risk: 87    │              │
│  │             │  │             │  │             │              │
│  │ [⏸ Pause]  │  │ [⏸ Pause]  │  │ [⏸ Pause]  │              │
│  │ [⏹ Stop]   │  │ [⏹ Stop]   │  │ [⏹ Stop]   │              │
│  │ [💬 Msg]    │  │ [💬 Msg]    │  │ [💬 Msg]    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                   │
│  Alerts:                                                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🔴 Student #18: Multiple faces detected (2 people visible)  ││
│  │ 🟡 Student #15: Tab switch detected                         ││
│  │ 🟡 Student #12: Looking away for 8 seconds                  ││
│  │ 🟢 Student #09: Exam progressing normally                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  [Filter: All] [Search students]                                 │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│  📊 Student Exam Attempts                                         │
│  [Table showing attempt history, scores, timestamps]              │
└───────────────────────────────────────────────────────────────────┘
```

---

## 👨‍💼 ADMIN PORTAL

### Login
```
http://localhost:5000
→ Login with admin credentials
```

### 1. System Monitoring View (Dashboard) → **ANALYTICS HERE**
**Navigation**: Auto-opens first (or click "System monitoring" in sidebar)

```
┌───────────────────────────────────────────────────────────────────┐
│  📊 Advanced Analytics Dashboard (Phase 4)                        │
│                                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐│
│  │ 👥 Total     │ │ 📄 Total     │ │ 📈 Avg       │ │ ⚠ Viol.  ││
│  │    Users     │ │    Exams     │ │    Score     │ │   Count   ││
│  │              │ │              │ │              │ │           ││
│  │    156       │ │     43       │ │    75%       │ │     3     ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘│
│                                                                   │
│  ┌───────────────────────────────┐  ┌──────────────────────────┐│
│  │ Exam Attempts Trend           │  │ User Distribution        ││
│  │ ┌───────────────────────────┐ │  │ ┌────────────────────── ││
│  │ │   📈 Line Chart           │ │  │ │   🍩 Doughnut Chart   ││
│  │ │                           │ │  │ │                       ││
│  │ │    ●                      │ │  │ │    80% Students       ││
│  │ │   ●                       │ │  │ │    15% Faculty        ││
│  │ │  ●   ●                    │ │  │ │     5% Admins         ││
│  │ │ ●     ●  ●                │ │  │ │                       ││
│  │ │ Mon Tue Wed Thu Fri Sat   │ │  │ │                       ││
│  │ └───────────────────────────┘ │  │ └────────────────────── ││
│  └───────────────────────────────┘  └──────────────────────────┘│
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│  📋 Recent Activity                                               │
│  [Table: Latest exam attempts and results]                        │
└───────────────────────────────────────────────────────────────────┘
```

### 2. Users & Results View
**Navigation**: Click "Users & Results" in sidebar
```
Standard user management
- View all users
- View all results
```

### 3. Gamification View → **NEW FEATURE HERE**
**Navigation**: Click "Gamification" in sidebar (🏆 Trophy icon)

```
┌───────────────────────────────────────────────────────────────────┐
│  🏆 Student Gamification & Achievements (Phase 5)                 │
│                                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐│
│  │ ⭐ Points    │ │ 🏆 Level     │ │ 🎯 Streak    │ │ 🎖 Badges││
│  │              │ │              │ │              │ │           ││
│  │   1,250      │ │      8       │ │   5 days     │ │     3     ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘│
│                                                                   │
│  Achievements:                                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ✅ 🏆 First Steps                                     🎖    ││
│  │    Complete your first exam                                 ││
│  │    Status: UNLOCKED                                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🔒 🏆 Perfect Score                                          ││
│  │    Score 100% on any exam                                   ││
│  │    Progress: ████████████████░░░░ 85%                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ✅ ⚡ Speed Demon                                      🎖    ││
│  │    Complete an exam in under 10 minutes                     ││
│  │    Status: UNLOCKED                                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🔒 🔥 Streak Master                                          ││
│  │    Maintain a 7-day login streak                            ││
│  │    Progress: ████████░░░░░░░░░░░░ 42%                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🔒 📚 Question Master                                        ││
│  │    Answer 100 questions correctly                           ││
│  │    Progress: ████████████████░░░░ 67%                       ││
│  └─────────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────────┘
```

### 4. Database Console View
**Navigation**: Click "Database Console" in sidebar
```
SQL query interface
- Execute SELECT queries
- View table data
- Quick query buttons
```

---

## 🎯 Quick Feature Access Summary

| Feature | Role | Location | How to Access |
|---------|------|----------|---------------|
| **Proctored Exam** | Student | Assigned Exams | Start any exam → Setup screen appears |
| **Exam Timer** | Student | During Exam | Top-right corner of exam card |
| **Question Navigation** | Student | During Exam | Right sidebar |
| **Calculator** | Student | During Exam | Click "Show Calculator" button |
| **Question Import** | Faculty | Question Bank | Top card with upload button |
| **Rich Text Editor** | Faculty | Question Bank | Question content field |
| **Faculty Monitoring** | Faculty | Student Monitoring | Real-time dashboard with video feeds |
| **Admin Analytics** | Admin | System Monitoring | Dashboard with charts |
| **Gamification** | Admin | Gamification | New nav item (Trophy icon) |

---

## 🔍 Feature Visibility Matrix

```
┌─────────────────────────┬─────────┬─────────┬───────┐
│ Feature                 │ Student │ Faculty │ Admin │
├─────────────────────────┼─────────┼─────────┼───────┤
│ Proctored Exam          │    ✅   │         │       │
│ Exam Timer              │    ✅   │         │       │
│ Question Navigation     │    ✅   │         │       │
│ Calculator              │    ✅   │         │       │
│ Auto-save               │    ✅   │         │       │
│ Question Import         │         │    ✅   │       │
│ Rich Text Editor        │         │    ✅   │       │
│ Faculty Monitoring      │         │    ✅   │       │
│ Admin Analytics         │         │         │   ✅  │
│ Gamification            │         │         │   ✅  │
└─────────────────────────┴─────────┴─────────┴───────┘
```

---

## 💡 Pro Tips

1. **Test Proctoring**: Use two browser windows - one as student, one as faculty monitoring
2. **Calculator**: Drag it anywhere on screen, minimize when not needed
3. **Bookmarks**: Use for questions you want to review before submitting
4. **Import**: Download template first to see exact format needed
5. **Rich Editor**: Click formula button (∫) to add math equations
6. **Monitoring**: Filter by risk level to focus on suspicious students
7. **Analytics**: Charts update in real-time as data changes
8. **Gamification**: Shows aggregate data from all students

---

**All features are now integrated and accessible! 🎉**
