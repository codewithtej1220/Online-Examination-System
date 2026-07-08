/**
 * Proctoring Routes
 * Handles video uploads, proctoring logs, and session management
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../recordings');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const { examId, studentId, attemptId } = req.body;
    const timestamp = Date.now();
    const filename = `exam_${examId}_student_${studentId}_attempt_${attemptId}_${timestamp}.webm`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept video files only
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Upload video recording
router.post('/upload-recording', upload.single('video'), async (req, res) => {
  try {
    const { examId, studentId, attemptId, sessionId } = req.body;
    
    if (!req.file) {
      return ApiResponse.error(res, 'No video file uploaded', 400);
    }

    const filePath = `/recordings/${req.file.filename}`;
    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
    
    // Calculate retention date (90 days from now)
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() + 90);

    // Insert video recording metadata into database
    const sql = `
      INSERT INTO video_recordings 
      (attempt_id, student_user_id, exam_id, session_id, file_path, file_size_mb, status, retention_until)
      VALUES (?, ?, ?, ?, ?, ?, 'completed', ?)
    `;

    db.query(sql, [attemptId, studentId, examId, sessionId, filePath, fileSizeMB, retentionDate], (error, result) => {
      if (error) {
        logger.error('Error saving video recording metadata:', error);
        return ApiResponse.error(res, 'Failed to save recording metadata', 500);
      }

      logger.info(`Video recording uploaded: ${req.file.filename} (${fileSizeMB}MB)`);
      
      return ApiResponse.success(res, {
        recordingId: result.insertId,
        filename: req.file.filename,
        fileSizeMB,
        retentionDate
      }, 'Video recording uploaded successfully');
    });

  } catch (error) {
    logger.error('Video upload error:', error);
    return ApiResponse.error(res, error.message, 500);
  }
});

// Get proctoring logs for an attempt
router.get('/logs/:attemptId', verifyToken, async (req, res) => {
  try {
    const { attemptId } = req.params;

    const sql = `
      SELECT * FROM proctoring_logs 
      WHERE attempt_id = ? 
      ORDER BY timestamp DESC
    `;

    db.query(sql, [attemptId], (error, logs) => {
      if (error) {
        logger.error('Error fetching proctoring logs:', error);
        return ApiResponse.error(res, 'Failed to fetch logs', 500);
      }

      return ApiResponse.success(res, { logs });
    });

  } catch (error) {
    logger.error('Error in logs route:', error);
    return ApiResponse.error(res, error.message, 500);
  }
});

// Get proctoring summary for an attempt
router.get('/summary/:attemptId', verifyToken, async (req, res) => {
  try {
    const { attemptId } = req.params;

    const sql = `
      SELECT * FROM proctoring_summary 
      WHERE attempt_id = ?
    `;

    db.query(sql, [attemptId], (error, results) => {
      if (error) {
        logger.error('Error fetching proctoring summary:', error);
        return ApiResponse.error(res, 'Failed to fetch summary', 500);
      }

      if (results.length === 0) {
        return ApiResponse.success(res, { summary: null }, 'No summary found');
      }

      return ApiResponse.success(res, { summary: results[0] });
    });

  } catch (error) {
    logger.error('Error in summary route:', error);
    return ApiResponse.error(res, error.message, 500);
  }
});

// Get video recording for an attempt (faculty/admin only)
router.get('/recording/:attemptId', verifyToken, requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const { attemptId } = req.params;

    const sql = `
      SELECT * FROM video_recordings 
      WHERE attempt_id = ? AND status = 'completed'
      ORDER BY start_time DESC 
      LIMIT 1
    `;

    db.query(sql, [attemptId], (error, results) => {
      if (error) {
        logger.error('Error fetching video recording:', error);
        return ApiResponse.error(res, 'Failed to fetch recording', 500);
      }

      if (results.length === 0) {
        return ApiResponse.success(res, { recording: null }, 'No recording found');
      }

      const recording = results[0];
      const filePath = path.join(__dirname, '..', recording.file_path);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return ApiResponse.error(res, 'Recording file not found', 404);
      }

      // Log access for audit
      logger.info(`Video recording accessed by user ${req.user.user_id} for attempt ${attemptId}`);

      return ApiResponse.success(res, { recording });
    });

  } catch (error) {
    logger.error('Error in recording route:', error);
    return ApiResponse.error(res, error.message, 500);
  }
});

// Stream video recording
router.get('/stream/:recordingId', verifyToken, requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const { recordingId } = req.params;

    const sql = `SELECT * FROM video_recordings WHERE recording_id = ?`;

    db.query(sql, [recordingId], (error, results) => {
      if (error) {
        logger.error('Error fetching recording:', error);
        return res.status(500).send('Failed to fetch recording');
      }

      if (results.length === 0) {
        return res.status(404).send('Recording not found');
      }

      const recording = results[0];
      const filePath = path.join(__dirname, '..', recording.file_path);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).send('Recording file not found');
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        // Streaming with range support
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/webm',
        };
        
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        // Full file
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/webm',
        };
        
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
      }

      // Log access
      logger.info(`Video streamed by user ${req.user.user_id} for recording ${recordingId}`);
    });

  } catch (error) {
    logger.error('Error streaming video:', error);
    return res.status(500).send('Failed to stream video');
  }
});

// Get proctoring settings for an exam
router.get('/settings/:examId', verifyToken, async (req, res) => {
  try {
    const { examId } = req.params;

    const sql = `SELECT * FROM exam_proctoring_settings WHERE exam_id = ?`;

    db.query(sql, [examId], (error, results) => {
      if (error) {
        logger.error('Error fetching proctoring settings:', error);
        return ApiResponse.error(res, 'Failed to fetch settings', 500);
      }

      if (results.length === 0) {
        // Return default settings
        return ApiResponse.success(res, {
          settings: {
            proctoring_enabled: true,
            video_recording_enabled: true,
            face_detection_enabled: true,
            lockdown_mode_enabled: true,
            tab_switching_prevention: true,
            copy_paste_blocking: true,
            fullscreen_required: true,
            suspicious_score_threshold: 50
          }
        });
      }

      return ApiResponse.success(res, { settings: results[0] });
    });

  } catch (error) {
    logger.error('Error in settings route:', error);
    return ApiResponse.error(res, error.message, 500);
  }
});

// Update proctoring settings (faculty/admin only)
router.put('/settings/:examId', verifyToken, requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const { examId } = req.params;
    const settings = req.body;

    // Check if settings exist
    const checkSql = `SELECT * FROM exam_proctoring_settings WHERE exam_id = ?`;

    db.query(checkSql, [examId], (error, results) => {
      if (error) {
        logger.error('Error checking settings:', error);
        return ApiResponse.error(res, 'Failed to check settings', 500);
      }

      let sql;
      let params;

      if (results.length === 0) {
        // Insert new settings
        sql = `
          INSERT INTO exam_proctoring_settings 
          (exam_id, proctoring_enabled, video_recording_enabled, face_detection_enabled, 
           lockdown_mode_enabled, tab_switching_prevention, copy_paste_blocking, 
           fullscreen_required, suspicious_score_threshold)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        params = [
          examId,
          settings.proctoring_enabled ?? true,
          settings.video_recording_enabled ?? true,
          settings.face_detection_enabled ?? true,
          settings.lockdown_mode_enabled ?? true,
          settings.tab_switching_prevention ?? true,
          settings.copy_paste_blocking ?? true,
          settings.fullscreen_required ?? true,
          settings.suspicious_score_threshold ?? 50
        ];
      } else {
        // Update existing settings
        sql = `
          UPDATE exam_proctoring_settings 
          SET proctoring_enabled = ?, video_recording_enabled = ?, 
              face_detection_enabled = ?, lockdown_mode_enabled = ?,
              tab_switching_prevention = ?, copy_paste_blocking = ?,
              fullscreen_required = ?, suspicious_score_threshold = ?
          WHERE exam_id = ?
        `;
        params = [
          settings.proctoring_enabled ?? true,
          settings.video_recording_enabled ?? true,
          settings.face_detection_enabled ?? true,
          settings.lockdown_mode_enabled ?? true,
          settings.tab_switching_prevention ?? true,
          settings.copy_paste_blocking ?? true,
          settings.fullscreen_required ?? true,
          settings.suspicious_score_threshold ?? 50,
          examId
        ];
      }

      db.query(sql, params, (error) => {
        if (error) {
          logger.error('Error updating settings:', error);
          return ApiResponse.error(res, 'Failed to update settings', 500);
        }

        logger.info(`Proctoring settings updated for exam ${examId} by user ${req.user.user_id}`);
        return ApiResponse.success(res, { examId }, 'Settings updated successfully');
      });
    });

  } catch (error) {
    logger.error('Error in update settings route:', error);
    return ApiResponse.error(res, error.message, 500);
  }
});

// Analyze answer patterns for an attempt
router.get('/analyze-answers/:attemptId', verifyToken, requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const { attemptId } = req.params;
    const answerAnalysis = require('../services/answerAnalysisService');

    // Get exam ID for the attempt
    const attemptSql = `SELECT exam_id FROM exam_attempt WHERE attempt_id = ?`;
    
    db.query(attemptSql, [attemptId], (error, results) => {
      if (error || results.length === 0) {
        return ApiResponse.error(res, 'Attempt not found', 404);
      }

      const examId = results[0].exam_id;

      // Run comprehensive analysis
      answerAnalysis.comprehensiveAnalysis(attemptId, examId, (err, analysis) => {
        if (err) {
          logger.error('Error analyzing answers:', err);
          return ApiResponse.error(res, 'Failed to analyze answers', 500);
        }

        return ApiResponse.success(res, { analysis });
      });
    });

  } catch (error) {
    logger.error('Error in analyze-answers route:', error);
    return ApiResponse.error(res, error.message, 500);
  }
});

// Compare answers across students in an exam
router.get('/compare-answers/:examId', verifyToken, requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const { examId } = req.params;
    const answerAnalysis = require('../services/answerAnalysisService');

    answerAnalysis.compareStudentAnswers(examId, (err, comparison) => {
      if (err) {
        logger.error('Error comparing answers:', err);
        return ApiResponse.error(res, 'Failed to compare answers', 500);
      }

      return ApiResponse.success(res, { comparison });
    });

  } catch (error) {
    logger.error('Error in compare-answers route:', error);
    return ApiResponse.error(res, error.message, 500);
  }
});

module.exports = router;
