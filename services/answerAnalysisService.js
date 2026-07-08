/**
 * Answer Pattern Analysis Service
 * Detects suspicious answer patterns: too-fast submissions, similar answers, unusual patterns
 */

const db = require('../config/db');
const logger = require('../utils/logger');

/**
 * Analyze answer submission timing
 * Detects if student answered too quickly
 */
function analyzeSubmissionTiming(attemptId, callback) {
  const sql = `
    SELECT 
      sa.answer_id,
      sa.question_id,
      sa.answered_at,
      q.question_type,
      ea.started_at,
      TIMESTAMPDIFF(SECOND, ea.started_at, sa.answered_at) AS time_to_answer
    FROM student_answer sa
    JOIN exam_attempt ea ON sa.attempt_id = ea.attempt_id
    JOIN question q ON sa.question_id = q.question_id
    WHERE sa.attempt_id = ?
    ORDER BY sa.answered_at ASC
  `;

  db.query(sql, [attemptId], (error, answers) => {
    if (error) {
      logger.error('Error analyzing timing:', error);
      return callback(error, null);
    }

    const violations = [];
    let previousTime = null;

    answers.forEach((answer, index) => {
      const timeBetween = previousTime 
        ? (new Date(answer.answered_at) - new Date(previousTime)) / 1000 
        : answer.time_to_answer;

      // Flag if answered in less than 5 seconds (too fast for reading + thinking)
      if (timeBetween < 5) {
        violations.push({
          type: 'too_fast_answer',
          severity: 'medium',
          message: `Question ${answer.question_id} answered in ${Math.round(timeBetween)}s (suspiciously fast)`,
          questionId: answer.question_id,
          timeSeconds: timeBetween
        });
      }

      previousTime = answer.answered_at;
    });

    // Check overall completion time
    if (answers.length > 0) {
      const totalTime = answers[answers.length - 1].time_to_answer;
      const avgTimePerQuestion = totalTime / answers.length;

      // If average time per question is less than 10 seconds, flag it
      if (avgTimePerQuestion < 10) {
        violations.push({
          type: 'unusually_fast_exam',
          severity: 'high',
          message: `Exam completed in ${Math.round(totalTime)}s (${Math.round(avgTimePerQuestion)}s per question - unusually fast)`,
          totalTimeSeconds: totalTime,
          avgTimePerQuestion: avgTimePerQuestion
        });
      }
    }

    callback(null, {
      totalAnswers: answers.length,
      violations,
      suspiciousScore: violations.length * 15
    });
  });
}

/**
 * Compare answers between students in the same exam
 * Detects similar answer patterns (potential collaboration/cheating)
 */
function compareStudentAnswers(examId, callback) {
  const sql = `
    SELECT 
      sa.attempt_id,
      ea.student_user_id,
      sa.question_id,
      sa.selected_option,
      sa.answer_text,
      sa.answered_at
    FROM student_answer sa
    JOIN exam_attempt ea ON sa.attempt_id = ea.attempt_id
    WHERE ea.exam_id = ?
    ORDER BY sa.question_id, ea.student_user_id
  `;

  db.query(sql, [examId], (error, allAnswers) => {
    if (error) {
      logger.error('Error comparing answers:', error);
      return callback(error, null);
    }

    // Group by question
    const questionGroups = {};
    allAnswers.forEach(answer => {
      if (!questionGroups[answer.question_id]) {
        questionGroups[answer.question_id] = [];
      }
      questionGroups[answer.question_id].push(answer);
    });

    const similarities = [];

    // Compare students' answers for each question
    Object.keys(questionGroups).forEach(questionId => {
      const answers = questionGroups[questionId];
      
      // Compare each pair of students
      for (let i = 0; i < answers.length; i++) {
        for (let j = i + 1; j < answers.length; j++) {
          const answer1 = answers[i];
          const answer2 = answers[j];

          // For MCQs, check if same option selected
          if (answer1.selected_option && answer2.selected_option) {
            if (answer1.selected_option === answer2.selected_option) {
              // This is expected for correct answers, but track it
              if (!similarities.find(s => 
                s.student1 === answer1.student_user_id && 
                s.student2 === answer2.student_user_id
              )) {
                similarities.push({
                  student1: answer1.student_user_id,
                  student2: answer2.student_user_id,
                  matchingAnswers: 1,
                  totalCompared: 1
                });
              } else {
                const existing = similarities.find(s => 
                  s.student1 === answer1.student_user_id && 
                  s.student2 === answer2.student_user_id
                );
                existing.matchingAnswers++;
                existing.totalCompared++;
              }
            }
          }

          // For text answers, calculate similarity
          if (answer1.answer_text && answer2.answer_text) {
            const similarity = calculateTextSimilarity(answer1.answer_text, answer2.answer_text);
            if (similarity > 0.8) { // 80% similar
              similarities.push({
                student1: answer1.student_user_id,
                student2: answer2.student_user_id,
                questionId: questionId,
                similarity: similarity,
                type: 'text_similarity'
              });
            }
          }
        }
      }
    });

    // Flag student pairs with high similarity
    const violations = [];
    similarities.forEach(sim => {
      if (sim.matchingAnswers && sim.totalCompared) {
        const matchPercentage = (sim.matchingAnswers / sim.totalCompared) * 100;
        if (matchPercentage > 80) {
          violations.push({
            type: 'high_answer_similarity',
            severity: 'critical',
            message: `Students ${sim.student1} and ${sim.student2} have ${Math.round(matchPercentage)}% matching answers`,
            student1: sim.student1,
            student2: sim.student2,
            matchPercentage: matchPercentage
          });
        }
      }
    });

    callback(null, {
      totalComparisons: similarities.length,
      violations,
      suspiciousScore: violations.length * 50
    });
  });
}

/**
 * Calculate text similarity using Levenshtein distance
 */
function calculateTextSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;

  const str1 = text1.toLowerCase().trim();
  const str2 = text2.toLowerCase().trim();

  if (str1 === str2) return 1;

  const len1 = str1.length;
  const len2 = str2.length;

  // Levenshtein distance algorithm
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len2][len1];
  const maxLen = Math.max(len1, len2);
  
  return 1 - (distance / maxLen);
}

/**
 * Detect unusual answer patterns
 * e.g., all answers are 'A', alternating patterns, etc.
 */
function detectUnusualPatterns(attemptId, callback) {
  const sql = `
    SELECT 
      sa.question_id,
      sa.selected_option,
      sa.is_correct,
      sa.answered_at
    FROM student_answer sa
    WHERE sa.attempt_id = ?
    ORDER BY sa.answered_at ASC
  `;

  db.query(sql, [attemptId], (error, answers) => {
    if (error) {
      logger.error('Error detecting patterns:', error);
      return callback(error, null);
    }

    const violations = [];
    const options = answers.map(a => a.selected_option).filter(o => o);

    if (options.length === 0) {
      return callback(null, { violations, suspiciousScore: 0 });
    }

    // Check for single option pattern (all A, all B, etc.)
    const optionCounts = {};
    options.forEach(opt => {
      optionCounts[opt] = (optionCounts[opt] || 0) + 1;
    });

    Object.keys(optionCounts).forEach(option => {
      const percentage = (optionCounts[option] / options.length) * 100;
      if (percentage > 70) {
        violations.push({
          type: 'single_option_pattern',
          severity: 'medium',
          message: `${Math.round(percentage)}% of answers are option '${option}' (unusual pattern)`,
          option: option,
          percentage: percentage
        });
      }
    });

    // Check for alternating pattern (A, B, A, B, ...)
    let alternatingCount = 0;
    for (let i = 1; i < options.length; i++) {
      if (options[i] !== options[i - 1]) {
        alternatingCount++;
      }
    }
    const alternatingPercentage = (alternatingCount / (options.length - 1)) * 100;
    if (alternatingPercentage > 80) {
      violations.push({
        type: 'alternating_pattern',
        severity: 'medium',
        message: `Answers show alternating pattern (${Math.round(alternatingPercentage)}% changes)`,
        percentage: alternatingPercentage
      });
    }

    // Check for sequential pattern (A, B, C, D, A, B, C, D, ...)
    let sequentialCount = 0;
    for (let i = 1; i < options.length; i++) {
      if (options[i].charCodeAt(0) - options[i - 1].charCodeAt(0) === 1) {
        sequentialCount++;
      }
    }
    const sequentialPercentage = (sequentialCount / (options.length - 1)) * 100;
    if (sequentialPercentage > 50) {
      violations.push({
        type: 'sequential_pattern',
        severity: 'medium',
        message: `Answers show sequential pattern (${Math.round(sequentialPercentage)}% sequential)`,
        percentage: sequentialPercentage
      });
    }

    callback(null, {
      totalAnswers: answers.length,
      violations,
      suspiciousScore: violations.length * 20
    });
  });
}

/**
 * Comprehensive analysis - runs all checks
 */
function comprehensiveAnalysis(attemptId, examId, callback) {
  analyzeSubmissionTiming(attemptId, (err1, timingResult) => {
    if (err1) return callback(err1, null);

    detectUnusualPatterns(attemptId, (err2, patternResult) => {
      if (err2) return callback(err2, null);

      // Combine results
      const allViolations = [
        ...(timingResult.violations || []),
        ...(patternResult.violations || [])
      ];

      const totalSuspiciousScore = 
        (timingResult.suspiciousScore || 0) + 
        (patternResult.suspiciousScore || 0);

      callback(null, {
        attemptId,
        examId,
        totalViolations: allViolations.length,
        violations: allViolations,
        suspiciousScore: totalSuspiciousScore,
        analysis: {
          timing: timingResult,
          patterns: patternResult
        }
      });
    });
  });
}

module.exports = {
  analyzeSubmissionTiming,
  compareStudentAnswers,
  detectUnusualPatterns,
  comprehensiveAnalysis,
  calculateTextSimilarity
};
