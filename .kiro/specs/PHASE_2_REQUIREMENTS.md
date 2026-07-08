# Phase 2: Enhanced Exam Experience - Requirements Document

## 📋 Overview
Phase 2 enhances the student exam experience with helpful tools and features that improve usability while maintaining exam security and integrity.

---

## 🎯 Feature 2.1: Exam Timer with Warnings

### Requirements

**FR-2.1.1: Visible Timer Display**
- System SHALL display remaining time prominently during exam
- Timer format: HH:MM:SS for exams >60 min, MM:SS for shorter exams
- Timer SHALL be visible but not distracting
- Timer SHALL sync with server time (not client-side only)

**FR-2.1.2: Time Warnings**
- System SHALL show warning when 25% time remaining (amber alert)
- System SHALL show critical warning when 10% time remaining (red alert)
- System SHALL show final warning at 2 minutes remaining
- Warnings SHALL include visual indicator + optional sound alert

**FR-2.1.3: Auto-Submit on Timeout**
- System SHALL automatically submit exam when time expires
- Student SHALL receive 10-second countdown before auto-submit
- Partially completed answers SHALL be saved
- System SHALL log auto-submit event

**FR-2.1.4: Time Extension**
- Faculty SHALL be able to extend time for individual students
- Extension notification SHALL appear to student in real-time
- Extended time SHALL be logged in database

### Acceptance Criteria
- [ ] Timer displays correctly and counts down
- [ ] Warnings appear at correct thresholds
- [ ] Auto-submit works when time expires
- [ ] Faculty can extend time remotely
- [ ] Time syncs with server (not manipulable)

### Technical Implementation
- **Frontend**: React state + useEffect timer
- **Backend**: Socket.io for real-time sync
- **Database**: Store start_time, end_time, extensions

---

## 🔖 Feature 2.2: Question Bookmarking/Flagging

### Requirements

**FR-2.2.1: Bookmark Questions**
- Student SHALL be able to mark questions for review
- Bookmark SHALL persist if student navigates away
- Bookmark indicator SHALL be visible on question list
- Student SHALL see count of bookmarked questions

**FR-2.2.2: Quick Navigation**
- System SHALL provide "Jump to Question" dropdown
- System SHALL highlight current question in list
- System SHALL show answered/unanswered status
- System SHALL allow "Jump to Next Unanswered"

**FR-2.2.3: Review Mode**
- System SHALL provide "Review Bookmarked" button
- Student SHALL be able to review all answers before submit
- System SHALL show summary: X answered, Y bookmarked, Z skipped

**FR-2.2.4: Visual Indicators**
- Answered questions: Green checkmark
- Bookmarked questions: Yellow flag icon
- Unanswered questions: Grey circle
- Current question: Blue highlight

### Acceptance Criteria
- [ ] Students can bookmark questions
- [ ] Bookmarks persist across navigation
- [ ] Question list shows status indicators
- [ ] Jump to question works correctly
- [ ] Review mode shows summary

### Technical Implementation
- **Frontend**: React state for bookmarks array
- **Storage**: localStorage for persistence
- **UI**: Question palette component

---

## 🧮 Feature 2.3: Calculator Widget

### Requirements

**FR-2.3.1: Calculator Availability**
- Calculator SHALL be available for math/science exams
- Faculty SHALL be able to enable/disable per exam
- Calculator SHALL be draggable within exam window
- Calculator SHALL not leave fullscreen mode

**FR-2.3.2: Calculator Features**
- Basic operations: +, -, ×, ÷
- Scientific functions: sin, cos, tan, √, x²,  x^y
- Memory functions: M+, M-, MR, MC
- History of calculations (last 10)
- Clear and backspace buttons

**FR-2.3.3: Calculator Restrictions**
- SHALL NOT have programming capabilities
- SHALL NOT store formulas or notes
- SHALL clear on exam start
- SHALL be disabled in non-math exams

**FR-2.3.4: Accessibility**
- Keyboard shortcuts for common operations
- Large buttons for touch screens
- High contrast mode available
- Screen reader compatible

### Acceptance Criteria
- [ ] Calculator appears when enabled
- [ ] All operations work correctly
- [ ] Calculator is draggable
- [ ] Faculty can enable/disable per exam
- [ ] Calculator restrictions enforced

### Technical Implementation
- **Frontend**: React calculator component
- **Library**: math.js for calculations
- **Position**: react-draggable for movement
- **Settings**: Stored in exam_settings table

---

## 📊 Feature 2.4: Progress Indicator

### Requirements

**FR-2.4.1: Visual Progress Bar**
- System SHALL show progress bar at top of exam
- Progress = (answered_questions / total_questions) × 100
- Progress bar SHALL be color-coded:
  - 0-33%: Red (low progress)
  - 34-66%: Amber (moderate progress)
  - 67-100%: Green (good progress)

**FR-2.4.2: Progress Statistics**
- System SHALL display: "X of Y questions answered"
- System SHALL display: "Z questions bookmarked"
- System SHALL display: "A questions unanswered"
- Statistics SHALL update in real-time

**FR-2.4.3: Section Progress**
- For multi-section exams, show per-section progress
- Display: "Section 1: 8/10 | Section 2: 5/12"
- Allow navigation between sections

**FR-2.4.4: Completion Warning**
- System SHALL warn if attempting to submit with unanswered questions
- Confirmation: "You have X unanswered questions. Submit anyway?"
- Option to return to exam or proceed with submission

### Acceptance Criteria
- [ ] Progress bar displays correctly
- [ ] Statistics update in real-time
- [ ] Color coding works as specified
- [ ] Warning appears for unanswered questions
- [ ] Section progress shows for multi-section exams

### Technical Implementation
- **Frontend**: React progress component
- **State**: Track answered questions array
- **UI**: Linear progress bar with statistics

---

## 💾 Feature 2.5: Auto-Save Functionality

### Requirements

**FR-2.5.1: Automatic Saving**
- System SHALL auto-save answers every 30 seconds
- System SHALL save immediately after answer selection
- System SHALL save immediately on question navigation
- Auto-save SHALL work silently (non-blocking)

**FR-2.5.2: Save Indicators**
- System SHALL show "Saving..." indicator during save
- System SHALL show "All changes saved" after successful save
- System SHALL show "Save failed - retrying" on error
- Save status SHALL be visible but non-intrusive

**FR-2.5.3: Offline Support**
- System SHALL queue saves when offline
- System SHALL sync queued saves when connection restored
- System SHALL warn student if offline >5 minutes
- Student SHALL be able to continue offline

**FR-2.5.4: Recovery on Disconnect**
- System SHALL restore last saved state on reconnection
- System SHALL not lose data on browser crash
- System SHALL allow continuing from saved state
- System SHALL log all save/restore events

**FR-2.5.5: Save History**
- System SHALL keep save history with timestamps
- Faculty SHALL be able to review save timeline
- System SHALL detect suspicious save patterns

### Acceptance Criteria
- [ ] Answers auto-save every 30 seconds
- [ ] Immediate save on answer selection
- [ ] Save indicators display correctly
- [ ] Offline queueing works
- [ ] Recovery after disconnect works
- [ ] No data loss on browser crash

### Technical Implementation
- **Frontend**: React auto-save hook
- **Storage**: localStorage + IndexedDB
- **Backend**: POST /api/student-answers/save-draft
- **Sync**: Service Worker for offline support

---

## 🎓 Feature 2.6: Practice Mode

### Requirements

**FR-2.6.1: Practice Exam Creation**
- System SHALL allow creating practice exams
- Practice exams SHALL be clearly marked "PRACTICE"
- Practice exams SHALL not affect student grades
- Faculty SHALL be able to designate exams as practice

**FR-2.6.2: Practice Mode Features**
- Student SHALL see correct answers immediately after submission
- System SHALL show explanations for wrong answers (if provided)
- Student SHALL be able to retake practice exams unlimited times
- Timer SHALL be optional in practice mode

**FR-2.6.3: Instant Feedback**
- System SHALL mark correct/incorrect immediately
- System SHALL show correct answer for wrong responses
- System SHALL display explanation text if available
- System SHALL show score breakdown by topic

**FR-2.6.4: Practice Analytics**
- Student SHALL see their practice attempt history
- System SHALL show improvement over attempts
- System SHALL identify weak areas
- System SHALL recommend topics to review

**FR-2.6.5: Proctoring in Practice**
- Proctoring SHALL be optional in practice mode
- Face detection SHALL be disabled by default
- Lockdown mode SHALL be optional
- Students SHALL be able to pause practice exams

### Acceptance Criteria
- [ ] Practice exams can be created
- [ ] Practice mode clearly distinguished from real exams
- [ ] Immediate feedback shows correct answers
- [ ] Students can retake unlimited times
- [ ] Practice analytics available
- [ ] Proctoring optional in practice mode

### Technical Implementation
- **Database**: Add `is_practice` flag to examination table
- **Frontend**: Different UI for practice mode
- **Backend**: Modified grading logic for practice
- **Analytics**: Store practice attempt statistics

---

## 📱 Feature 2.7: Mobile-Responsive Exam Interface

### Requirements

**FR-2.7.1: Responsive Design**
- Exam interface SHALL adapt to screen sizes 320px-2560px
- Mobile layout SHALL use vertical scrolling
- Touch targets SHALL be minimum 44×44px
- Font sizes SHALL scale appropriately

**FR-2.7.2: Mobile-Specific Features**
- System SHALL show mobile-optimized calculator
- System SHALL use native date/time pickers on mobile
- System SHALL support swipe gestures for navigation
- System SHALL prevent accidental zoom

**FR-2.7.3: Mobile Warnings**
- System SHALL warn if screen size <768px
- System SHALL recommend desktop for proctored exams
- System SHALL disable proctoring features on mobile
- System SHALL allow proceeding after acknowledgment

**FR-2.7.4: Touch Optimizations**
- Radio buttons SHALL be touch-friendly (larger)
- Checkboxes SHALL be easy to tap
- Text input SHALL trigger appropriate keyboards
- Scroll SHALL be smooth and natural

**FR-2.7.5: Performance on Mobile**
- Page load SHALL be <3 seconds on 4G
- Animations SHALL be 60fps
- Battery usage SHALL be optimized
- Data usage SHALL be minimized

### Acceptance Criteria
- [ ] Exam works on mobile devices (320px+)
- [ ] Touch interactions work smoothly
- [ ] Mobile warnings display appropriately
- [ ] Performance acceptable on mobile networks
- [ ] Battery drain is reasonable

### Technical Implementation
- **CSS**: Tailwind responsive classes
- **Testing**: Chrome DevTools mobile emulation
- **Optimization**: Lazy loading, code splitting
- **PWA**: Service worker for caching

---

## 🎨 UI/UX Requirements

### Student Exam Interface
- Clean, distraction-free design
- Helpful tools easily accessible
- Progress always visible
- Timer prominent but not stressful
- Professional, confidence-inspiring

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatible
- High contrast mode
- Adjustable font sizes

### Performance
- Page load <2 seconds
- Answer save <500ms
- Navigation instant
- Auto-save non-blocking
- 60fps animations

---

## 📊 Data & Storage Requirements

**New Database Columns**:
- `examination.calculator_enabled` BOOLEAN
- `examination.is_practice` BOOLEAN
- `examination.practice_attempts_allowed` INT
- `exam_attempt.bookmarked_questions` JSON
- `exam_attempt.time_extended_seconds` INT

**New Tables**:
- `answer_drafts` - Auto-save drafts
- `practice_attempts` - Practice exam history
- `exam_analytics` - Student performance data

**localStorage Data**:
- Current answers (backup)
- Bookmarks
- Calculator history
- Timer offset

---

## 🧪 Testing Requirements

**Unit Tests**:
- Timer countdown logic
- Auto-save functionality
- Calculator operations
- Progress calculations

**Integration Tests**:
- Auto-save + recovery
- Timer + auto-submit
- Bookmarks + navigation
- Mobile responsiveness

**User Acceptance Tests**:
- Complete exam flow with new features
- Practice mode workflow
- Mobile exam taking
- Recovery from disconnect

---

## 📈 Success Metrics

- Student satisfaction with exam experience: >85%
- Auto-save prevents data loss: 100%
- Mobile users can complete exams: >95%
- Practice mode adoption: >60% of students
- Timer-related anxiety: Reduced (survey)

---

## 🚀 Implementation Priority

**Phase 2A**: Core Features (Week 1)
- Exam timer with warnings
- Question bookmarking
- Progress indicator
- Auto-save functionality

**Phase 2B**: Enhanced Features (Week 2)
- Calculator widget
- Practice mode
- Mobile responsiveness

**Timeline**: 2 weeks for full Phase 2 completion

---

**Document Version**: 1.0  
**Last Updated**: June 21, 2026  
**Status**: ✅ Requirements Approved - Ready for Implementation
