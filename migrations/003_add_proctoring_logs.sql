-- Migration 003: Add Proctoring Logs Table
-- Purpose: Store proctoring events, violations, and AI analysis results

-- Create proctoring_logs table
CREATE TABLE IF NOT EXISTS proctoring_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    student_user_id INT NOT NULL,
    exam_id INT NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'low',
    message TEXT NOT NULL,
    suspicious_score INT DEFAULT 0,
    frame_data JSON DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_attempt (attempt_id),
    INDEX idx_student (student_user_id),
    INDEX idx_exam (exam_id),
    INDEX idx_session (session_id),
    INDEX idx_severity (severity),
    INDEX idx_timestamp (timestamp),
    INDEX idx_event_type (event_type),
    
    FOREIGN KEY (student_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES examination(exam_id) ON DELETE CASCADE,
    FOREIGN KEY (attempt_id) REFERENCES exam_attempt(attempt_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create video_recordings table
CREATE TABLE IF NOT EXISTS video_recordings (
    recording_id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    student_user_id INT NOT NULL,
    exam_id INT NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_mb DECIMAL(10, 2) DEFAULT NULL,
    duration_seconds INT DEFAULT NULL,
    status ENUM('recording', 'completed', 'failed', 'deleted') DEFAULT 'recording',
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME DEFAULT NULL,
    retention_until DATE DEFAULT NULL,
    
    INDEX idx_attempt (attempt_id),
    INDEX idx_student (student_user_id),
    INDEX idx_exam (exam_id),
    INDEX idx_status (status),
    INDEX idx_retention (retention_until),
    
    FOREIGN KEY (student_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES examination(exam_id) ON DELETE CASCADE,
    FOREIGN KEY (attempt_id) REFERENCES exam_attempt(attempt_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create proctoring_summary table (aggregated stats per attempt)
CREATE TABLE IF NOT EXISTS proctoring_summary (
    summary_id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL UNIQUE,
    student_user_id INT NOT NULL,
    exam_id INT NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    total_frames_analyzed INT DEFAULT 0,
    total_alerts INT DEFAULT 0,
    critical_alerts INT DEFAULT 0,
    high_alerts INT DEFAULT 0,
    medium_alerts INT DEFAULT 0,
    low_alerts INT DEFAULT 0,
    average_suspicious_score DECIMAL(5, 2) DEFAULT 0,
    max_suspicious_score INT DEFAULT 0,
    no_face_violations INT DEFAULT 0,
    multiple_faces_violations INT DEFAULT 0,
    looking_away_violations INT DEFAULT 0,
    tab_switch_violations INT DEFAULT 0,
    copy_paste_violations INT DEFAULT 0,
    exit_fullscreen_violations INT DEFAULT 0,
    overall_risk_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    faculty_flagged BOOLEAN DEFAULT FALSE,
    faculty_notes TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_attempt (attempt_id),
    INDEX idx_student (student_user_id),
    INDEX idx_exam (exam_id),
    INDEX idx_risk_level (overall_risk_level),
    INDEX idx_faculty_flagged (faculty_flagged),
    
    FOREIGN KEY (student_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES examination(exam_id) ON DELETE CASCADE,
    FOREIGN KEY (attempt_id) REFERENCES exam_attempt(attempt_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create exam_proctoring_settings table (per-exam proctoring configuration)
CREATE TABLE IF NOT EXISTS exam_proctoring_settings (
    settings_id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL UNIQUE,
    proctoring_enabled BOOLEAN DEFAULT TRUE,
    video_recording_enabled BOOLEAN DEFAULT TRUE,
    face_detection_enabled BOOLEAN DEFAULT TRUE,
    lockdown_mode_enabled BOOLEAN DEFAULT TRUE,
    tab_switching_prevention BOOLEAN DEFAULT TRUE,
    copy_paste_blocking BOOLEAN DEFAULT TRUE,
    right_click_blocking BOOLEAN DEFAULT TRUE,
    fullscreen_required BOOLEAN DEFAULT TRUE,
    multiple_monitors_allowed BOOLEAN DEFAULT FALSE,
    mobile_access_allowed BOOLEAN DEFAULT FALSE,
    max_tab_switches INT DEFAULT 3,
    max_fullscreen_exits INT DEFAULT 1,
    auto_terminate_on_critical BOOLEAN DEFAULT FALSE,
    suspicious_score_threshold INT DEFAULT 50,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (exam_id) REFERENCES examination(exam_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default proctoring settings for existing exams
INSERT INTO exam_proctoring_settings (exam_id)
SELECT exam_id FROM examination
WHERE exam_id NOT IN (SELECT exam_id FROM exam_proctoring_settings);

COMMIT;
