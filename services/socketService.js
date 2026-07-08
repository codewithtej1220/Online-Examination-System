/**
 * Socket.io Service - Real-time Proctoring Communication
 * Handles: Video streaming, Live monitoring, Faculty alerts, Exam lockdown enforcement
 */

const { Server } = require('socket.io');
const axios = require('axios');
const db = require('../config/db');
const logger = require('../utils/logger');

let io;
const activeSessions = new Map();
const facultyConnections = new Map();

// Configuration
const PROCTORING_SERVICE_URL = process.env.PROCTORING_SERVICE_URL || 'http://localhost:5001';
const FRAME_ANALYSIS_INTERVAL = 2000; // Analyze every 2 seconds

// Helper function to log violations to database
function logViolation(session, eventType, severity, message, suspiciousScore = 0, metadata = null) {
  const sql = `
    INSERT INTO proctoring_logs 
    (attempt_id, student_user_id, exam_id, session_id, event_type, severity, message, suspicious_score, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(sql, [
    session.attemptId,
    session.studentId,
    session.examId,
    session.sessionId,
    eventType,
    severity,
    message,
    suspiciousScore,
    metadata ? JSON.stringify(metadata) : null
  ], (error) => {
    if (error) {
      logger.error('Error logging violation:', error);
    }
  });
}

// Helper function to update proctoring summary
function updateProcotoringSummary(attemptId, updates) {
  // Check if summary exists
  const checkSql = 'SELECT summary_id FROM proctoring_summary WHERE attempt_id = ?';
  
  db.query(checkSql, [attemptId], (error, results) => {
    if (error) {
      logger.error('Error checking summary:', error);
      return;
    }

    if (results.length === 0) {
      // Create new summary
      const insertSql = `
        INSERT INTO proctoring_summary 
        (attempt_id, student_user_id, exam_id, session_id, ${Object.keys(updates).join(', ')})
        VALUES (?, ?, ?, ?, ${Object.keys(updates).map(() => '?').join(', ')})
      `;
      // We'll need session data, so this is simplified
      logger.warn('Summary creation needs session context');
    } else {
      // Update existing summary
      const updateFields = Object.keys(updates).map(key => `${key} = ${key} + ?`).join(', ');
      const updateSql = `UPDATE proctoring_summary SET ${updateFields} WHERE attempt_id = ?`;
      const values = [...Object.values(updates), attemptId];
      
      db.query(updateSql, values, (error) => {
        if (error) {
          logger.error('Error updating summary:', error);
        }
      });
    }
  });
}

function initializeSocketService(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    maxHttpBufferSize: 1e7 // 10MB for video frames
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Student joins exam session
    socket.on('student:join-exam', async (data) => {
      const { examId, studentId, attemptId } = data;
      const sessionId = `exam_${examId}_student_${studentId}_${attemptId}`;
      
      socket.join(sessionId);
      socket.join(`exam_${examId}`); // Also join exam room for broadcasts
      
      activeSessions.set(socket.id, {
        sessionId,
        examId,
        studentId,
        attemptId,
        startTime: new Date(),
        alertCount: 0,
        violations: []
      });

      console.log(`👨‍🎓 Student ${studentId} joined exam ${examId} (Session: ${sessionId})`);

      socket.emit('proctoring:session-started', {
        sessionId,
        message: 'Proctoring session started'
      });

      // Notify faculty monitoring this exam
      io.to(`faculty_exam_${examId}`).emit('student:joined', {
        studentId,
        sessionId,
        timestamp: new Date()
      });
    });

    // Faculty joins monitoring room
    socket.on('faculty:monitor-exam', (data) => {
      const { examId, facultyId } = data;
      const monitoringRoom = `faculty_exam_${examId}`;
      
      socket.join(monitoringRoom);
      facultyConnections.set(socket.id, { examId, facultyId });

      console.log(`👨‍🏫 Faculty ${facultyId} monitoring exam ${examId}`);

      // Send current students in exam
      const studentsInExam = Array.from(activeSessions.values())
        .filter(session => session.examId === examId)
        .map(session => ({
          studentId: session.studentId,
          sessionId: session.sessionId,
          startTime: session.startTime,
          alertCount: session.alertCount
        }));

      socket.emit('monitoring:students-list', studentsInExam);
    });

    // Receive video frame from student for analysis
    socket.on('proctoring:send-frame', async (data) => {
      const session = activeSessions.get(socket.id);
      if (!session) {
        socket.emit('proctoring:error', { message: 'Session not found' });
        return;
      }

      try {
        // Send frame to Python microservice for AI analysis
        const response = await axios.post(`${PROCTORING_SERVICE_URL}/api/proctoring/analyze`, {
          session_id: session.sessionId,
          frame: data.frame
        }, {
          timeout: 5000
        });

        const analysis = response.data;

        // Update session with violations
        if (analysis.alerts && analysis.alerts.length > 0) {
          session.alertCount += analysis.alerts.length;
          session.violations.push(...analysis.alerts.map(alert => ({
            ...alert,
            timestamp: new Date()
          })));

          // Log to database
          analysis.alerts.forEach(alert => {
            logViolation(session, alert.type, alert.severity, alert.message, analysis.suspicious_score, {
              face_count: analysis.face_count,
              head_pose: analysis.head_pose
            });
          });

          // Update summary counts
          const summaryUpdates = { total_alerts: analysis.alerts.length };
          analysis.alerts.forEach(alert => {
            if (alert.severity === 'critical') summaryUpdates.critical_alerts = 1;
            else if (alert.severity === 'high') summaryUpdates.high_alerts = 1;
            else if (alert.severity === 'medium') summaryUpdates.medium_alerts = 1;
            else summaryUpdates.low_alerts = 1;

            if (alert.type === 'no_face') summaryUpdates.no_face_violations = 1;
            else if (alert.type === 'multiple_faces') summaryUpdates.multiple_faces_violations = 1;
            else if (alert.type === 'looking_away') summaryUpdates.looking_away_violations = 1;
          });
          updateProcotoringSummary(session.attemptId, summaryUpdates);

          // Send alert to student
          socket.emit('proctoring:alert', {
            alerts: analysis.alerts,
            suspiciousScore: analysis.suspicious_score
          });

          // Notify faculty monitoring this exam
          io.to(`faculty_exam_${session.examId}`).emit('monitoring:violation', {
            studentId: session.studentId,
            sessionId: session.sessionId,
            alerts: analysis.alerts,
            suspiciousScore: analysis.suspicious_score,
            timestamp: new Date()
          });
        }

        // Send analysis result back to student (for debugging/UI)
        socket.emit('proctoring:analysis', {
          faceCount: analysis.face_count,
          headPose: analysis.head_pose,
          suspiciousScore: analysis.suspicious_score
        });

      } catch (error) {
        console.error('Error analyzing frame:', error.message);
        // Continue silently - don't interrupt student exam
      }
    });

    // Tab switching detection
    socket.on('proctoring:tab-switch', (data) => {
      const session = activeSessions.get(socket.id);
      if (!session) return;

      const violation = {
        type: 'tab_switch',
        severity: 'high',
        message: 'Student switched browser tabs',
        timestamp: new Date()
      };

      session.alertCount++;
      session.violations.push(violation);

      // Log to database
      logViolation(session, 'tab_switch', 'high', 'Student switched browser tabs', 40);
      updateProcotoringSummary(session.attemptId, { 
        total_alerts: 1, 
        high_alerts: 1,
        tab_switch_violations: 1 
      });

      socket.emit('proctoring:alert', {
        alerts: [violation],
        suspiciousScore: 40
      });

      io.to(`faculty_exam_${session.examId}`).emit('monitoring:violation', {
        studentId: session.studentId,
        sessionId: session.sessionId,
        alerts: [violation],
        suspiciousScore: 40,
        timestamp: new Date()
      });
    });

    // Copy/paste detection
    socket.on('proctoring:copy-paste', (data) => {
      const session = activeSessions.get(socket.id);
      if (!session) return;

      const violation = {
        type: 'copy_paste',
        severity: 'medium',
        message: `Student attempted to ${data.action}`,
        timestamp: new Date()
      };

      session.alertCount++;
      session.violations.push(violation);

      // Log to database
      logViolation(session, 'copy_paste', 'medium', `Student attempted to ${data.action}`, 25);
      updateProcotoringSummary(session.attemptId, { 
        total_alerts: 1, 
        medium_alerts: 1,
        copy_paste_violations: 1 
      });

      socket.emit('proctoring:alert', {
        alerts: [violation],
        suspiciousScore: 25
      });

      io.to(`faculty_exam_${session.examId}`).emit('monitoring:violation', {
        studentId: session.studentId,
        sessionId: session.sessionId,
        alerts: [violation],
        suspiciousScore: 25,
        timestamp: new Date()
      });
    });

    // Student exits fullscreen
    socket.on('proctoring:exit-fullscreen', () => {
      const session = activeSessions.get(socket.id);
      if (!session) return;

      const violation = {
        type: 'exit_fullscreen',
        severity: 'high',
        message: 'Student exited fullscreen mode',
        timestamp: new Date()
      };

      session.alertCount++;
      session.violations.push(violation);

      // Log to database
      logViolation(session, 'exit_fullscreen', 'high', 'Student exited fullscreen mode', 35);
      updateProcotoringSummary(session.attemptId, { 
        total_alerts: 1, 
        high_alerts: 1,
        exit_fullscreen_violations: 1 
      });

      socket.emit('proctoring:alert', {
        alerts: [violation],
        suspiciousScore: 35
      });

      io.to(`faculty_exam_${session.examId}`).emit('monitoring:violation', {
        studentId: session.studentId,
        sessionId: session.sessionId,
        alerts: [violation],
        suspiciousScore: 35,
        timestamp: new Date()
      });
    });

    // High noise detected
    socket.on('proctoring:high-noise', (data) => {
      const session = activeSessions.get(socket.id);
      if (!session) return;

      const violation = {
        type: 'high_noise',
        severity: 'medium',
        message: `High background noise detected (level: ${Math.round(data.level)})`,
        timestamp: new Date()
      };

      session.alertCount++;
      session.violations.push(violation);

      // Log to database
      logViolation(session, 'high_noise', 'medium', violation.message, 20, { noise_level: data.level });
      updateProcotoringSummary(session.attemptId, { 
        total_alerts: 1, 
        medium_alerts: 1 
      });

      socket.emit('proctoring:alert', {
        alerts: [violation],
        suspiciousScore: 20
      });

      io.to(`faculty_exam_${session.examId}`).emit('monitoring:violation', {
        studentId: session.studentId,
        sessionId: session.sessionId,
        alerts: [violation],
        suspiciousScore: 20,
        timestamp: new Date()
      });
    });

    // Multiple monitors detected
    socket.on('proctoring:multiple-monitors', (data) => {
      const session = activeSessions.get(socket.id);
      if (!session) return;

      const violation = {
        type: 'multiple_monitors',
        severity: 'medium',
        message: 'Multiple monitors detected on student system',
        timestamp: new Date()
      };

      session.alertCount++;
      session.violations.push(violation);

      // Log to database
      logViolation(session, 'multiple_monitors', 'medium', violation.message, 15);
      updateProcotoringSummary(session.attemptId, { 
        total_alerts: 1, 
        medium_alerts: 1 
      });

      io.to(`faculty_exam_${session.examId}`).emit('monitoring:violation', {
        studentId: session.studentId,
        sessionId: session.sessionId,
        alerts: [violation],
        suspiciousScore: 15,
        timestamp: new Date()
      });
    });

    // Faculty sends message to student
    socket.on('faculty:send-message', (data) => {
      const { sessionId, message } = data;
      io.to(sessionId).emit('proctoring:faculty-message', {
        message,
        timestamp: new Date()
      });
    });

    // Faculty pauses exam for student
    socket.on('faculty:pause-exam', (data) => {
      const { sessionId } = data;
      io.to(sessionId).emit('exam:paused-by-faculty', {
        message: 'Exam paused by faculty',
        timestamp: new Date()
      });
    });

    // Faculty terminates exam for student
    socket.on('faculty:terminate-exam', (data) => {
      const { sessionId, reason } = data;
      io.to(sessionId).emit('exam:terminated-by-faculty', {
        reason,
        timestamp: new Date()
      });
    });

    // Student disconnects
    socket.on('disconnect', () => {
      const session = activeSessions.get(socket.id);
      if (session) {
        console.log(`👋 Student ${session.studentId} disconnected from exam ${session.examId}`);
        
        io.to(`faculty_exam_${session.examId}`).emit('student:disconnected', {
          studentId: session.studentId,
          sessionId: session.sessionId,
          duration: Date.now() - session.startTime,
          alertCount: session.alertCount,
          timestamp: new Date()
        });

        activeSessions.delete(socket.id);
      }

      const facultyConnection = facultyConnections.get(socket.id);
      if (facultyConnection) {
        console.log(`👋 Faculty ${facultyConnection.facultyId} stopped monitoring`);
        facultyConnections.delete(socket.id);
      }
    });
  });

  console.log('✅ Socket.io service initialized');
  return io;
}

function getActiveSessions() {
  return Array.from(activeSessions.entries()).map(([socketId, session]) => ({
    socketId,
    ...session
  }));
}

function getSessionByStudent(studentId, examId) {
  for (const [socketId, session] of activeSessions.entries()) {
    if (session.studentId === studentId && session.examId === examId) {
      return { socketId, ...session };
    }
  }
  return null;
}

module.exports = {
  initializeSocketService,
  getActiveSessions,
  getSessionByStudent
};
