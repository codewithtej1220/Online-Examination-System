"""
Question Generator - AI-powered question generation from syllabus
"""

import json
import re
from typing import List, Dict, Any
from .gemini_service import GeminiService


class QuestionGenerator:
    """
    Generate questions using RAG-based approach with Gemini AI
    """
    
    def __init__(self, gemini_service: GeminiService):
        self.gemini = gemini_service
    
    def generate(
        self,
        syllabus_text: str,
        question_type: str,
        count: int = 5,
        difficulty: str = "MEDIUM",
        subject_topic: str = ""
    ) -> List[Dict[str, Any]]:
        """
        Generate questions from syllabus content
        
        Args:
            syllabus_text: Extracted syllabus or topic text
            question_type: Type of questions (MCQ, Essay, FillInBlank)
            count: Number of questions to generate
            difficulty: Difficulty level (EASY, MEDIUM, HARD)
            subject_topic: Subject or topic name
        
        Returns:
            List of question dictionaries
        """
        if question_type == "MCQ":
            return self._generate_mcq(syllabus_text, count, difficulty, subject_topic)
        elif question_type == "Essay":
            return self._generate_essay(syllabus_text, count, difficulty, subject_topic)
        elif question_type == "FillInBlank":
            return self._generate_fill_in_blank(syllabus_text, count, difficulty, subject_topic)
        else:
            raise ValueError(f"Unsupported question type: {question_type}")
    
    def _generate_mcq(
        self,
        syllabus_text: str,
        count: int,
        difficulty: str,
        subject_topic: str
    ) -> List[Dict[str, Any]]:
        """Generate Multiple Choice Questions"""
        
        prompt = f"""
You are an expert question generator for academic assessments. Based on the following syllabus content, generate exactly {count} multiple-choice questions.

SYLLABUS CONTENT:
{syllabus_text}

REQUIREMENTS:
- Question Type: Multiple Choice (MCQ)
- Difficulty Level: {difficulty}
- Subject/Topic: {subject_topic if subject_topic else "General"}
- Generate exactly {count} questions
- Each question must have 4 options (A, B, C, D)
- Clearly identify the correct answer
- Questions should test conceptual understanding, not just memorization
- Vary the complexity across questions
- Ensure questions are unambiguous and have only one correct answer

OUTPUT FORMAT:
Generate a JSON array where each question object has this EXACT structure:
{{
    "content": "The question text here?",
    "question_type": "MCQ",
    "difficulty_level": "{difficulty}",
    "subject_topic": "{subject_topic if subject_topic else "General"}",
    "correct_answer": "A",
    "option_a": "First option",
    "option_b": "Second option",
    "option_c": "Third option",
    "option_d": "Fourth option"
}}

Return ONLY the JSON array, no additional text or formatting.
"""
        
        try:
            response = self.gemini.generate_structured_content(prompt, temperature=0.8)
            questions = self._parse_json_response(response)
            
            # Validate and clean questions
            validated_questions = []
            for q in questions[:count]:  # Ensure we don't exceed count
                if self._validate_mcq(q):
                    validated_questions.append(q)
            
            return validated_questions
        
        except Exception as e:
            raise Exception(f"MCQ generation failed: {str(e)}")
    
    def _generate_essay(
        self,
        syllabus_text: str,
        count: int,
        difficulty: str,
        subject_topic: str
    ) -> List[Dict[str, Any]]:
        """Generate Essay Questions"""
        
        prompt = f"""
You are an expert question generator for academic assessments. Based on the following syllabus content, generate exactly {count} essay questions.

SYLLABUS CONTENT:
{syllabus_text}

REQUIREMENTS:
- Question Type: Essay
- Difficulty Level: {difficulty}
- Subject/Topic: {subject_topic if subject_topic else "General"}
- Generate exactly {count} questions
- Questions should require analytical thinking and detailed explanations
- Provide an expected/model answer for each question
- Expected answers should be comprehensive (150-300 words)

OUTPUT FORMAT:
Generate a JSON array where each question object has this EXACT structure:
{{
    "content": "The essay question here?",
    "question_type": "Essay",
    "difficulty_level": "{difficulty}",
    "subject_topic": "{subject_topic if subject_topic else "General"}",
    "expected_answer": "A comprehensive model answer demonstrating the expected depth and coverage...",
    "correct_answer": null,
    "option_a": null,
    "option_b": null,
    "option_c": null,
    "option_d": null
}}

Return ONLY the JSON array, no additional text or formatting.
"""
        
        try:
            response = self.gemini.generate_structured_content(prompt, temperature=0.8)
            questions = self._parse_json_response(response)
            
            # Validate and clean questions
            validated_questions = []
            for q in questions[:count]:
                if self._validate_essay(q):
                    validated_questions.append(q)
            
            return validated_questions
        
        except Exception as e:
            raise Exception(f"Essay generation failed: {str(e)}")
    
    def _generate_fill_in_blank(
        self,
        syllabus_text: str,
        count: int,
        difficulty: str,
        subject_topic: str
    ) -> List[Dict[str, Any]]:
        """Generate Fill-in-the-Blank Questions"""
        
        prompt = f"""
You are an expert question generator for academic assessments. Based on the following syllabus content, generate exactly {count} fill-in-the-blank questions.

SYLLABUS CONTENT:
{syllabus_text}

REQUIREMENTS:
- Question Type: Fill-in-the-Blank
- Difficulty Level: {difficulty}
- Subject/Topic: {subject_topic if subject_topic else "General"}
- Generate exactly {count} questions
- Use _____ (5 underscores) to indicate the blank
- Questions should test key terminology and concepts
- Provide the correct answer for the blank

OUTPUT FORMAT:
Generate a JSON array where each question object has this EXACT structure:
{{
    "content": "The _____ is responsible for...",
    "question_type": "FillInBlank",
    "difficulty_level": "{difficulty}",
    "subject_topic": "{subject_topic if subject_topic else "General"}",
    "correct_answer": "CPU",
    "option_a": null,
    "option_b": null,
    "option_c": null,
    "option_d": null,
    "expected_answer": null
}}

Return ONLY the JSON array, no additional text or formatting.
"""
        
        try:
            response = self.gemini.generate_structured_content(prompt, temperature=0.7)
            questions = self._parse_json_response(response)
            
            # Validate and clean questions
            validated_questions = []
            for q in questions[:count]:
                if self._validate_fill_in_blank(q):
                    validated_questions.append(q)
            
            return validated_questions
        
        except Exception as e:
            raise Exception(f"Fill-in-blank generation failed: {str(e)}")
    
    def _parse_json_response(self, response: str) -> List[Dict[str, Any]]:
        """Parse JSON response from Gemini, handling various formats"""
        try:
            # Remove markdown code blocks if present
            response = re.sub(r'```json\s*', '', response)
            response = re.sub(r'```\s*$', '', response)
            response = response.strip()
            
            # Parse JSON
            data = json.loads(response)
            
            # Handle both array and single object responses
            if isinstance(data, dict):
                return [data]
            elif isinstance(data, list):
                return data
            else:
                raise ValueError("Invalid JSON structure")
        
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse JSON response: {str(e)}\nResponse: {response[:200]}")
    
    def _validate_mcq(self, question: Dict[str, Any]) -> bool:
        """Validate MCQ question structure"""
        required_fields = ['content', 'correct_answer', 'option_a', 'option_b', 'option_c', 'option_d']
        
        for field in required_fields:
            if field not in question or not question[field]:
                return False
        
        # Ensure correct_answer is A, B, C, or D
        if question['correct_answer'].upper() not in ['A', 'B', 'C', 'D']:
            question['correct_answer'] = 'A'  # Default fallback
        
        return True
    
    def _validate_essay(self, question: Dict[str, Any]) -> bool:
        """Validate Essay question structure"""
        return 'content' in question and question['content'] and \
               'expected_answer' in question and question['expected_answer']
    
    def _validate_fill_in_blank(self, question: Dict[str, Any]) -> bool:
        """Validate Fill-in-blank question structure"""
        return 'content' in question and question['content'] and \
               '_____' in question['content'] and \
               'correct_answer' in question and question['correct_answer']
