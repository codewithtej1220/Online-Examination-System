# Phase 1: Exam Security Suite - Requirements Document

## 📋 Overview
Phase 1 implements comprehensive exam security features including live video proctoring, AI-powered cheat detection, exam lockdown mode, and environment monitoring.

---

## 🎯 Feature 1.1: Live Video Proctoring

### Requirements

**FR-1.1.1: Real-time Webcam Capture**
- System SHALL capture student webcam video during exam
- Video quality: 640x480 minimum resolution
- Frame rate: Minimum 15 FPS
- Student MUST grant camera permission before exam starts
- Camera feed SHALL be visible to student (small corner preview)

**FR-1.1.2: Face Detection & Recognition**
- System SHALL detect faces in real-time using AI
- MediaPipe/OpenCV SHALL be used for face detection
- System SHALL verify exactly 1 face is present
- System SHALL alert if 0 or 2+ faces detected for >3 seconds

**FR-1.1.3: Head Movement Tracking**
- System SHALL track head pose (forward, left, right, up, down)
- System SHALL detect looking away >5 seconds
- Looking away SHALL trigger medium severity alert
- Head pose data SHALL be logged with timestamps

**FR-1.1.4: Multiple Face Detection**
- System SHALL detect when multiple faces appear
- Multiple faces >2 seconds SHALL trigger critical alert
- Alert SHALL indicate "possible unauthorized assistance"
- Faculty SHALL be notified immediately

**FR-1.1.5: Video Recording**
- System SHALL record entire exam session video
- Video SHALL be stored in MP4/WebM format
- Storage location: `/recordings/{exam_id}/{student_id}/{attempt_id}.webm`
- Video SHALL be accessible to faculty for review
- Retention period: 90 days (configurable)

**FR-1.1.6: AI Suspicious Activity Alerts**
- System SHALL analyze frames every 2 seconds
- AI SHALL calculate suspicious score (0-100)
- Suspicious score >50 SHALL trigger high alert
- Alerts SHALL be categorized: no_face, multiple_faces, looking_away, suspicious_movement

### Acceptance Criteria
- [ ] Student can enable camera before exam
- [ ] Camera preview shows during exam setup
- [ ] Exam cannot start without camera enabled
- [ ] Face detection works in various lighting conditions
- [ ] Multiple faces trigger immediate alerts
- [ ] Looking away >5 seconds triggers alert
- [ ] Video recording starts with exam
- [ ] Faculty can review recordings post-exam
- [ ] Suspicious activities are detected and logged

### Technical Implementation
- **Frontend**: React + WebRTC + Socket.io-client
- **Backend**: Node.js + Socket.io
- **AI Service**: Python Flask + OpenCV + MediaPipe
- **Storage**: Local filesystem (future: S3/Cloud storage)

---

## 🔒 Feature 1.2: Exam Lockdown Mode

### Requirements

**FR-1.2.1: Full-screen Enforcement**
- System SHALL request fullscreen before exam starts
- Exam SHALL not start without fullscreen mode
- System SHALL detect fullscreen exit
- Exiting fullscreen SHALL trigger high severity alert
- System MAY allow 1 warning before action

**FR-1.2.2: Tab Switching Detection**
- System SHALL detect browser tab visibility changes
- Tab switching SHALL be prevented with warnings
- Each tab switch SHALL be logged with timestamp
- Tab switch SHALL trigger high severity alert
- Faculty SHALL be notified in real-time

**FR-1.2.3: Copy-Paste Blocking**
- System SHALL prevent copy operations (Ctrl+C, right-click copy)
- System SHALL prevent paste operations (Ctrl+V)
- System SHALL prevent cut operations (Ctrl+X)
- Attempted copy/paste SHALL trigger medium alert
- Alert message SHALL be shown to student

**FR-1.2.4: Right-click Disable**
- System SHALL disable context menu (right-click)
- Right-click attempt SHALL be silently prevented
- No alert for right-click (non-critical)

**FR-1.2.5: Browser Console Blocking**
- System SHALL detect DevTools opening (F12, Ctrl+Shift+I)
- Console opening SHALL trigger high alert
- Faculty SHALL be notified immediately

**FR-1.2.6: Screenshot Prevention**
- System SHALL attempt to block screenshot (browser limitation)
- Print Screen detection (where possible)
- Watermark student ID on exam content as deterrent

**FR-1.2.7: Keyboard Monitoring**
- System SHALL log suspicious key combinations
- Alt+Tab, Windows key, etc. SHALL be monitored
- Frequent escape key presses SHALL be logged

### Acceptance Criteria
- [ ] Fullscreen is enforced before exam
- [ ] Exiting fullscreen triggers immediate alert
- [ ] Tab switching is detected and reported
- [ ] Copy/paste operations are blocked
- [ ] Right-click context menu is disabled
- [ ] DevTools opening triggers alert
- [ ] All violations are logged with timestamps
- [ ] Faculty receives real-time notifications

### Technical Implementation
- **Frontend**: JavaScript Fullscreen API, Event Listeners
- **Security**: Content Security Policy headers
- **Monitoring**: Socket.io real-time events

---

## 🌍 Feature 1.3: Environment Monitoring

### Requirements

**FR-1.3.1: Background Noise Detection**
- System SHALL monitor audio levels (without recording)
- Web Audio API SHALL analyze ambient noise
- Sudden loud sounds SHALL trigger alert
- Multiple voices SHALL trigger high alert

**FR-1.3.2: Multiple Monitor Detection**
- System SHALL detect if multiple monitors are connected
- Screen.orientation and window.screen APIs SHALL be used
- Multi-monitor setup SHALL show warning
- Student SHALL be advised to disable extra monitors

**FR-1.3.3: Mobile Device Detection**
- System SHALL warn if exam accessed from mobile
- Exams SHOULD be taken on desktop/laptop
- Mobile access MAY be restricted by faculty setting

**FR-1.3.4: Eye Tracking Patterns**
- System SHALL analyze eye movement from video
- Excessive eye movement to sides SHALL be flagged
- Looking at second screen SHALL be inferred from patterns

**FR-1.3.5: Keyboard/Mouse Activity Patterns**
- System SHALL log typing speed and patterns
- Sudden stops in activity SHALL be monitored
- Copy-paste attempts SHALL be correlated with mouse movement

### Acceptance Criteria
- [ ] Audio monitoring works without recording speech
- [ ] Multiple monitor setup is detected
- [ ] Mobile device access shows appropriate warning
- [ ] Eye movement patterns are analyzed
- [ ] Activity patterns are logged

### Technical Implementation
- **Audio**: Web Audio API (AnalyserNode)
- **Display**: Screen Detection API
- **Device**: UserAgent detection
- **Analysis**: Statistical pattern recognition

---

## 🤖 Feature 1.4: AI Cheat Detection

### Requirements

**FR-1.4.1: Unusual Answer Patterns**
- System SHALL analyze answer submission timing
- Answers submitted too quickly SHALL be flagged
- Pattern: All questions answered in <30% of allocated time
- Statistical analysis of answer distribution

**FR-1.4.2: Too-fast Submission**
- System SHALL calculate minimum reasonable time per question
- Example: MCQ with 4 options needs minimum 15 seconds
- Submissions faster than threshold SHALL trigger alert
- Multiple too-fast submissions SHALL increase suspicion score

**FR-1.4.3: Similar Answers Across Students**
- System SHALL compare answer sequences between students
- Exact match patterns SHALL be flagged
- Similarity score using Levenshtein distance
- Faculty SHALL review students with >80% similarity

**FR-1.4.4: Copy Detection Algorithms**
- Text similarity for descriptive answers
- Cosine similarity for pattern matching
- N-gram analysis for phrase matching

**FR-1.4.5: Plagiarism Checking**
- Compare answers against online sources (future integration)
- Internal database of previous submissions
- Flag suspiciously sophisticated answers

### Acceptance Criteria
- [ ] Too-fast submissions are detected
- [ ] Answer patterns are analyzed
- [ ] Similar answers between students are flagged
- [ ] Statistical reports generated post-exam
- [ ] Faculty receives suspicious activity report

### Technical Implementation
- **Analysis**: Python/Node.js algorithms
- **Algorithms**: Levenshtein distance, Cosine similarity
- **ML Models**: TensorFlow (future: NLP models)
- **Database**: Store answer patterns for comparison

---

## 🎨 UI/UX Requirements

### Student Exam Interface
- Clean, distraction-free exam UI
- Small corner video preview (can't be closed)
- Proctoring status bar at top
- Alert notifications (non-intrusive)
- Professional, not intimidating design

### Faculty Monitoring Dashboard
- Grid view of all active students
- Real-time video feeds
- Alert notifications with severity colors
- Student flagging system
- Intervention controls (message, pause, terminate)

---

## 📊 Data & Storage Requirements

**Video Storage**
- Format: WebM (VP8/VP9 codec)
- Average size: ~50MB per hour at 480p
- Compression: Enabled
- Storage: Local initially, migrate to cloud

**Logs & Analytics**
- All events logged in database
- Proctoring_logs table with columns:
  - log_id, attempt_id, student_id, exam_id
  - event_type, severity, message, timestamp
  - suspicious_score, frame_data (JSON)

**Performance**
- Frame analysis: <500ms per frame
- Socket latency: <100ms
- UI remains responsive during proctoring
- No impact on exam question loading

---

## 🔐 Privacy & Compliance

- Student consent required before exam
- Privacy policy displayed during setup
- Video retention period clearly stated
- GDPR compliance: Right to deletion
- Faculty access controls (only assigned exams)
- Admin audit logs for video access

---

## 🧪 Testing Requirements

**Unit Tests**
- Face detection accuracy >95%
- Head pose detection accuracy >90%
- Event detection reliability 100%

**Integration Tests**
- Socket.io communication
- Python microservice integration
- Video recording start/stop

**Load Tests**
- 100 concurrent proctoring sessions
- Socket.io scalability test
- Python service performance under load

**User Acceptance Tests**
- End-to-end exam flow
- Faculty monitoring dashboard
- Video playback functionality

---

## 📈 Success Metrics

- Cheat detection rate: Target >80%
- False positive rate: <5%
- System uptime during exams: >99.9%
- Student satisfaction: >70% (post-survey)
- Faculty adoption: >90% use proctoring features

---

## 🚀 Deployment Plan

**Phase 1A**: Core proctoring (video + face detection)
**Phase 1B**: Lockdown mode + tab switching
**Phase 1C**: Environment monitoring
**Phase 1D**: AI cheat detection algorithms

**Timeline**: 2-3 weeks for full Phase 1 completion

---

## 📝 Open Questions & Decisions

1. **Video Storage**: Cloud vs Local? (Decision: Start local, migrate to AWS S3)
2. **Mobile Support**: Block or allow with warnings? (Decision: Allow with warnings)
3. **Browser Support**: Chrome only initially? (Decision: Chrome/Edge, Firefox support later)
4. **Faculty Review**: Manual or AI-assisted? (Decision: Both - AI flags, faculty reviews)

---

**Document Version**: 1.0
**Last Updated**: June 21, 2026
**Status**: ✅ Requirements Approved - Implementation In Progress
