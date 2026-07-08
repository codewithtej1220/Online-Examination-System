"""
Gemini AI Service - Core integration with Google's Gemini API
"""

import google.generativeai as genai
from typing import Optional
import time


class GeminiService:
    """
    Wrapper for Google's Gemini API with rate limiting and error handling
    """
    
    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash"):
        """
        Initialize Gemini service
        
        Args:
            api_key: Google Gemini API key
            model_name: Gemini model to use (default: gemini-1.5-flash)
        """
        self.api_key = api_key
        self.model_name = model_name
        
        # Configure Gemini
        genai.configure(api_key=api_key)
        
        # Initialize model
        self.model = genai.GenerativeModel(model_name)
        
        # Rate limiting
        self.last_request_time = 0
        self.min_request_interval = 1.0  # Minimum 1 second between requests
    
    def test_connection(self) -> bool:
        """
        Test connection to Gemini API
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            response = self.model.generate_content("Test connection")
            return response.text is not None
        except Exception as e:
            print(f"Gemini connection test failed: {e}")
            return False
    
    def _rate_limit(self):
        """Apply rate limiting between requests"""
        current_time = time.time()
        elapsed = current_time - self.last_request_time
        
        if elapsed < self.min_request_interval:
            sleep_time = self.min_request_interval - elapsed
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    def generate_content(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_output_tokens: Optional[int] = None
    ) -> str:
        """
        Generate content using Gemini API
        
        Args:
            prompt: Input prompt for content generation
            temperature: Sampling temperature (0.0 to 1.0)
            max_output_tokens: Maximum tokens to generate
        
        Returns:
            str: Generated content
        
        Raises:
            Exception: If API request fails
        """
        # Apply rate limiting
        self._rate_limit()
        
        try:
            # Configure generation parameters
            generation_config = {
                "temperature": temperature,
                "top_p": 0.95,
                "top_k": 40,
            }
            
            if max_output_tokens:
                generation_config["max_output_tokens"] = max_output_tokens
            
            # Generate content
            response = self.model.generate_content(
                prompt,
                generation_config=generation_config
            )
            
            if not response or not response.text:
                raise Exception("Empty response from Gemini API")
            
            return response.text.strip()
        
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")
    
    def generate_structured_content(
        self,
        prompt: str,
        temperature: float = 0.7
    ) -> str:
        """
        Generate structured JSON content
        
        Args:
            prompt: Input prompt requesting JSON output
            temperature: Sampling temperature
        
        Returns:
            str: Generated JSON content
        """
        # Add JSON formatting instruction to prompt
        structured_prompt = f"""
{prompt}

IMPORTANT: Respond with ONLY valid JSON. Do not include any markdown formatting, code blocks, or explanatory text.
Start your response directly with the opening curly brace or square bracket of the JSON object/array.
"""
        
        return self.generate_content(
            prompt=structured_prompt,
            temperature=temperature,
            max_output_tokens=4000
        )
