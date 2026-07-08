"""
AI Microservice for OES Pro
FastAPI application for AI-powered question generation and essay evaluation
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import os
import base64
import numpy as np
import cv2
from dotenv import load_dotenv

from services.gemini_service import GeminiService
from services.question_generator import QuestionGenerator
from services.essay_evaluator import EssayEvaluator
from utils.file_extractor import FileExtractor

# Import proctoring engine
from proctoring_engine import ProctoringPipeline

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="OES Pro AI Service",
    description="AI-powered question generation and essay evaluation microservice",
    version="1.0.0"
)

# CORS configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY environment variable is required")

gemini_service = GeminiService(api_key=gemini_api_key)
question_generator = QuestionGenerator(gemini_service)
essay_evaluator = EssayEvaluator(gemini_service)
file_extractor = FileExtractor()

# Initialize proctoring pipeline (session-based, will be managed per student)
proctoring_sessions = {}  # Dictionary to store active proctoring sessions by student_id


# ==================== Request/Response Models ====================

class QuestionGenerationRequest(BaseModel):
    syllabusText: str = Field(..., description="Extracted syllabus or topic text")
    questionType: str = Field(..., description="Type: MCQ, Essay, or FillInBlank")
    count: int = Field(default=5, ge=1, le=20, description="Number of questions to generate")
    difficultyLevel: str = Field(default="MEDIUM", description="Difficulty: EASY, MEDIUM, or HARD")
    subjectTopic: str = Field(default="", description="Subject or topic name")


class GeneratedQuestion(BaseModel):
    content: str
    question_type: str
    difficulty_level: str
    subject_topic: str
    correct_answer: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    expected_answer: Optional[str] = None  # For Essay/FillInBlank


class QuestionGenerationResponse(BaseModel):
    success: bool
    questions: List[GeneratedQuestion]
    message: str


class EssayEvaluationRequest(BaseModel):
    questionContent: str = Field(..., description="The essay question asked")
    expectedAnswer: str = Field(..., description="Model/expected answer")
    studentAnswer: str = Field(..., description="Student's submitted answer")
    maxMarks: float = Field(default=10.0, description="Maximum marks for this question")


class EssayEvaluation(BaseModel):
    score: float
    maxScore: float
    feedback: str
    suggestions: List[str]


class EssayEvaluationResponse(BaseModel):
    success: bool
    evaluation: EssayEvaluation


class FileUploadResponse(BaseModel):
    success: bool
    message: str
    extractedText: str
    wordCount: int


# Proctoring Models
class ProctoringAnalysisRequest(BaseModel):
    studentId: int = Field(..., description="Student user ID")
    examId: int = Field(..., description="Exam ID")
    attemptId: int = Field(..., description="Attempt ID")
    frameData: str = Field(..., description="Base64 encoded video frame")
    audioData: Optional[str] = Field(None, description="Base64 encoded audio bytes")
    audioMetadata: Optional[Dict] = Field(None, description="Audio metadata")


class ProctoringSessionRequest(BaseModel):
    studentId: int
    examId: int
    attemptId: int
    baselineImage: Optional[str] = Field(None, description="Base64 encoded baseline photo")
    baselineAudio: Optional[str] = Field(None, description="Base64 encoded ambient audio")


# ==================== API Endpoints ====================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "OES Pro AI Service",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check with Gemini API connectivity"""
    try:
        # Test Gemini connection
        is_connected = gemini_service.test_connection()
        
        return {
            "status": "healthy" if is_connected else "degraded",
            "gemini_api": "connected" if is_connected else "disconnected",
            "services": {
                "question_generation": True,
                "essay_evaluation": True,
                "file_extraction": True
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


@app.post("/extract-text", response_model=FileUploadResponse)
async def extract_text_from_file(file: UploadFile = File(...)):
    """
    Extract text from uploaded PDF or TXT file
    """
    try:
        # Validate file type
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in ['pdf', 'txt']:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type: {file_extension}. Only PDF and TXT are supported."
            )
        
        # Read file content
        content = await file.read()
        
        # Extract text based on file type
        if file_extension == 'pdf':
            extracted_text = file_extractor.extract_from_pdf(content)
        else:  # txt
            extracted_text = file_extractor.extract_from_txt(content)
        
        word_count = len(extracted_text.split())
        
        return FileUploadResponse(
            success=True,
            message="Text extracted successfully",
            extractedText=extracted_text,
            wordCount=word_count
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")


@app.post("/generate-questions", response_model=QuestionGenerationResponse)
async def generate_questions(request: QuestionGenerationRequest):
    """
    Generate questions using Gemini AI based on syllabus content
    """
    try:
        # Validate request
        if not request.syllabusText or len(request.syllabusText.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Syllabus text too short. Provide at least 50 characters."
            )
        
        valid_types = ['MCQ', 'Essay', 'FillInBlank']
        if request.questionType not in valid_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid question type. Must be one of: {', '.join(valid_types)}"
            )
        
        valid_difficulties = ['EASY', 'MEDIUM', 'HARD']
        if request.difficultyLevel not in valid_difficulties:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid difficulty level. Must be one of: {', '.join(valid_difficulties)}"
            )
        
        # Generate questions using AI
        questions = question_generator.generate(
            syllabus_text=request.syllabusText,
            question_type=request.questionType,
            count=request.count,
            difficulty=request.difficultyLevel,
            subject_topic=request.subjectTopic
        )
        
        # Convert to response format
        generated_questions = [GeneratedQuestion(**q) for q in questions]
        
        return QuestionGenerationResponse(
            success=True,
            questions=generated_questions,
            message=f"Successfully generated {len(generated_questions)} {request.questionType} questions"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Question generation failed: {str(e)}"
        )


@app.post("/evaluate-essay", response_model=EssayEvaluationResponse)
async def evaluate_essay(request: EssayEvaluationRequest):
    """
    Evaluate essay answer using AI semantic comparison
    """
    try:
        # Validate request
        if not request.questionContent or not request.studentAnswer:
            raise HTTPException(
                status_code=400,
                detail="Question content and student answer are required"
            )
        
        if request.maxMarks <= 0:
            raise HTTPException(
                status_code=400,
                detail="Maximum marks must be greater than 0"
            )
        
        # Evaluate using AI
        evaluation_result = essay_evaluator.evaluate(
            question_content=request.questionContent,
            expected_answer=request.expectedAnswer,
            student_answer=request.studentAnswer,
            max_marks=request.maxMarks
        )
        
        evaluation = EssayEvaluation(**evaluation_result)
        
        return EssayEvaluationResponse(
            success=True,
            evaluation=evaluation
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Essay evaluation failed: {str(e)}"
        )


# ==================== Proctoring Endpoints ====================

@app.post("/api/ai/proctor/start-session")
async def start_proctoring_session(request: ProctoringSessionRequest):
    """
    Start a new proctoring session for a student
    """
    try:
        session_key = f"{request.studentId}_{request.examId}_{request.attemptId}"
        
        # Create new proctoring pipeline for this session
        pipeline = ProctoringPipeline()
        
        # Setup baselines if provided
        baseline_image = None
        baseline_audio = None
        
        if request.baselineImage:
            # Decode base64 baseline image
            import base64
            import numpy as np
            img_data = base64.b64decode(request.baselineImage.split(',')[1] if ',' in request.baselineImage else request.baselineImage)
            nparr = np.frombuffer(img_data, np.uint8)
            baseline_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if request.baselineAudio:
            baseline_audio = base64.b64decode(request.baselineAudio.split(',')[1] if ',' in request.baselineAudio else request.baselineAudio)
        
        # Start session
        result = pipeline.start_session(baseline_image, baseline_audio)
        
        # Store session
        proctoring_sessions[session_key] = pipeline
        
        return {
            "success": True,
            "message": "Proctoring session started",
            "sessionKey": session_key,
            **result
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start proctoring session: {str(e)}"
        )


@app.post("/api/ai/proctor/analyze-stream")
async def analyze_proctoring_stream(request: ProctoringAnalysisRequest):
    """
    Analyze video frame and audio for proctoring violations
    Thread-safe concurrent processing of all checks
    """
    try:
        session_key = f"{request.studentId}_{request.examId}_{request.attemptId}"
        
        # Get or create session
        if session_key not in proctoring_sessions:
            # Auto-create session if not exists
            pipeline = ProctoringPipeline()
            pipeline.start_session()
            proctoring_sessions[session_key] = pipeline
        else:
            pipeline = proctoring_sessions[session_key]
        
        # Decode audio if provided
        audio_bytes = None
        if request.audioData:
            import base64
            audio_bytes = base64.b64decode(
                request.audioData.split(',')[1] if ',' in request.audioData else request.audioData
            )
        
        # Analyze stream
        analysis_result = pipeline.analyze_stream(
            frame_data=request.frameData,
            audio_data=audio_bytes,
            audio_metadata=request.audioMetadata
        )
        
        # Add session info
        analysis_result['studentId'] = request.studentId
        analysis_result['examId'] = request.examId
        analysis_result['attemptId'] = request.attemptId
        
        return analysis_result
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Proctoring analysis failed: {str(e)}"
        )


@app.get("/api/ai/proctor/session-summary/{student_id}/{exam_id}/{attempt_id}")
async def get_session_summary(student_id: int, exam_id: int, attempt_id: int):
    """
    Get session summary and statistics
    """
    try:
        session_key = f"{student_id}_{exam_id}_{attempt_id}"
        
        if session_key not in proctoring_sessions:
            raise HTTPException(
                status_code=404,
                detail="Session not found"
            )
        
        pipeline = proctoring_sessions[session_key]
        summary = pipeline.get_session_summary()
        
        return {
            "success": True,
            "studentId": student_id,
            "examId": exam_id,
            "attemptId": attempt_id,
            **summary
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get session summary: {str(e)}"
        )


@app.post("/api/ai/proctor/end-session/{student_id}/{exam_id}/{attempt_id}")
async def end_proctoring_session(student_id: int, exam_id: int, attempt_id: int):
    """
    End proctoring session and get final report
    """
    try:
        session_key = f"{student_id}_{exam_id}_{attempt_id}"
        
        if session_key not in proctoring_sessions:
            raise HTTPException(
                status_code=404,
                detail="Session not found"
            )
        
        pipeline = proctoring_sessions[session_key]
        final_report = pipeline.end_session()
        
        # Remove session
        del proctoring_sessions[session_key]
        
        return {
            "success": True,
            "studentId": student_id,
            "examId": exam_id,
            "attemptId": attempt_id,
            **final_report
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to end session: {str(e)}"
        )


# ==================== Server Startup ====================

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"""
    ╔═══════════════════════════════════════════════════╗
    ║         OES Pro AI Microservice                  ║
    ║                                                   ║
    ║  Server running on: http://{host}:{port}        ║
    ║  Documentation: http://{host}:{port}/docs       ║
    ║  Health check: http://{host}:{port}/health      ║
    ╚═══════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
