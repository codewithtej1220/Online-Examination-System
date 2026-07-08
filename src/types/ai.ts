/**
 * TypeScript interfaces for AI Integration features
 */

export type QuestionType = 'MCQ' | 'Essay' | 'FillInBlank';
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface GeneratedQuestion {
  content: string;
  question_type: QuestionType;
  difficulty_level: DifficultyLevel;
  subject_topic: string;
  correct_answer?: string; // For MCQ (A, B, C, D) or FillInBlank
  option_a?: string; // For MCQ
  option_b?: string; // For MCQ
  option_c?: string; // For MCQ
  option_d?: string; // For MCQ
  expected_answer?: string; // For Essay
}

export interface QuestionGenerationRequest {
  syllabusText: string;
  questionType: QuestionType;
  count: number;
  difficultyLevel: DifficultyLevel;
  subjectTopic?: string;
}

export interface QuestionGenerationResponse {
  success: boolean;
  message: string;
  questions: GeneratedQuestion[];
}

export interface FileUploadResponse {
  success: boolean;
  message: string;
  data: {
    filename: string;
    extractedText: string;
    wordCount: number;
  };
}

export interface SaveQuestionsRequest {
  questions: GeneratedQuestion[];
}

export interface SaveQuestionsResponse {
  success: boolean;
  message: string;
  savedQuestions: Array<{
    question_id: number;
    content: string;
  }>;
  totalSaved: number;
  totalFailed: number;
}

export interface EssayEvaluationRequest {
  questionContent: string;
  expectedAnswer: string;
  studentAnswer: string;
  maxMarks: number;
}

export interface EssayEvaluation {
  score: number;
  maxScore: number;
  feedback: string;
  suggestions: string[];
}

export interface EssayEvaluationResponse {
  success: boolean;
  evaluation: EssayEvaluation;
}

export interface AIGenerationHistory {
  generation_id: number;
  syllabus_filename: string;
  question_type: string;
  requested_count: number;
  generated_count: number;
  difficulty_level: string;
  subject_topic: string;
  created_at: string;
}

export interface AIServiceHealth {
  success: boolean;
  aiService: {
    status: 'healthy' | 'degraded' | 'offline';
    url: string;
    gemini_api?: string;
    services?: {
      question_generation: boolean;
      essay_evaluation: boolean;
      file_extraction: boolean;
    };
    error?: string;
  };
}
