"""
Essay Evaluator - AI-powered semantic evaluation of essay answers
"""

from typing import Dict, Any, List
from .gemini_service import GeminiService
import json
import re


class EssayEvaluator:
    """
    Evaluate essay answers using semantic analysis with Gemini AI
    """
    
    def __init__(self, gemini_service: GeminiService):
        self.gemini = gemini_service
    
    def evaluate(
        self,
        question_content: str,
        expected_answer: str,
        student_answer: str,
        max_marks: float = 10.0
    ) -> Dict[str, Any]:
        """
        Evaluate essay answer using AI semantic comparison
        
        Args:
            question_content: The essay question asked
            expected_answer: Model/expected answer
            student_answer: Student's submitted answer
            max_marks: Maximum marks for this question
        
        Returns:
            Dictionary containing:
            - score: Calculated score
            - maxScore: Maximum possible score
            - feedback: Detailed feedback text
            - suggestions: List of improvement suggestions
        """
        
        prompt = f"""
You are an expert academic evaluator. Evaluate the following essay answer based on semantic similarity, content coverage, and understanding demonstrated.

QUESTION:
{question_content}

EXPECTED/MODEL ANSWER:
{expected_answer}

STUDENT'S ANSWER:
{student_answer}

EVALUATION CRITERIA:
- Content Accuracy (40%): Are the key concepts correct?
- Completeness (30%): Does it cover all important points from the expected answer?
- Understanding (20%): Does the student demonstrate deep understanding?
- Expression (10%): Is the answer well-structured and clear?

MAXIMUM MARKS: {max_marks}

OUTPUT FORMAT:
Provide your evaluation in the following JSON structure:
{{
    "score": <calculated score out of {max_marks}, rounded to 1 decimal>,
    "maxScore": {max_marks},
    "breakdown": {{
        "content_accuracy": <score out of {max_marks * 0.4}>,
        "completeness": <score out of {max_marks * 0.3}>,
        "understanding": <score out of {max_marks * 0.2}>,
        "expression": <score out of {max_marks * 0.1}>
    }},
    "feedback": "<A paragraph of 3-5 sentences providing constructive feedback on the student's answer>",
    "strengths": ["<strength 1>", "<strength 2>"],
    "weaknesses": ["<weakness 1>", "<weakness 2>"],
    "suggestions": ["<specific improvement suggestion 1>", "<specific improvement suggestion 2>"]
}}

Be fair but critical. Award partial credit for partially correct answers. 
Return ONLY the JSON object, no additional text or formatting.
"""
        
        try:
            response = self.gemini.generate_structured_content(prompt, temperature=0.3)
            evaluation_data = self._parse_json_response(response)
            
            # Validate and format response
            validated_evaluation = self._validate_evaluation(evaluation_data, max_marks)
            
            return validated_evaluation
        
        except Exception as e:
            raise Exception(f"Essay evaluation failed: {str(e)}")
    
    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """Parse JSON response from Gemini"""
        try:
            # Remove markdown code blocks if present
            response = re.sub(r'```json\s*', '', response)
            response = re.sub(r'```\s*$', '', response)
            response = response.strip()
            
            # Parse JSON
            data = json.loads(response)
            
            return data
        
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse evaluation JSON: {str(e)}\nResponse: {response[:200]}")
    
    def _validate_evaluation(self, data: Dict[str, Any], max_marks: float) -> Dict[str, Any]:
        """Validate and clean evaluation data"""
        
        # Extract and validate score
        score = float(data.get('score', 0))
        score = max(0, min(score, max_marks))  # Clamp between 0 and max_marks
        score = round(score, 1)  # Round to 1 decimal place
        
        # Extract feedback
        feedback = data.get('feedback', 'No feedback provided')
        
        # Extract suggestions (combine from various sources)
        suggestions = []
        
        if 'suggestions' in data and isinstance(data['suggestions'], list):
            suggestions.extend(data['suggestions'])
        
        if 'weaknesses' in data and isinstance(data['weaknesses'], list):
            suggestions.extend([f"Address: {w}" for w in data['weaknesses']])
        
        # Ensure we have at least one suggestion
        if not suggestions:
            suggestions = ["Review the model answer for key concepts that may be missing"]
        
        return {
            "score": score,
            "maxScore": max_marks,
            "feedback": feedback,
            "suggestions": suggestions[:5]  # Limit to top 5 suggestions
        }
    
    def batch_evaluate(
        self,
        evaluations: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Evaluate multiple essays in batch
        
        Args:
            evaluations: List of evaluation requests, each with:
                - question_content
                - expected_answer
                - student_answer
                - max_marks
        
        Returns:
            List of evaluation results
        """
        results = []
        
        for eval_request in evaluations:
            try:
                result = self.evaluate(
                    question_content=eval_request['question_content'],
                    expected_answer=eval_request['expected_answer'],
                    student_answer=eval_request['student_answer'],
                    max_marks=eval_request.get('max_marks', 10.0)
                )
                results.append(result)
            except Exception as e:
                # On error, return zero score with error message
                results.append({
                    "score": 0.0,
                    "maxScore": eval_request.get('max_marks', 10.0),
                    "feedback": f"Evaluation failed: {str(e)}",
                    "suggestions": ["Please contact faculty for manual evaluation"]
                })
        
        return results
