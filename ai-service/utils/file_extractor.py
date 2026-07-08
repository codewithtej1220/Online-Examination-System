"""
File Extractor - Extract text from PDF and TXT files
"""

from PyPDF2 import PdfReader
from io import BytesIO
from typing import Union


class FileExtractor:
    """
    Extract text content from uploaded files
    """
    
    def extract_from_pdf(self, file_content: bytes) -> str:
        """
        Extract text from PDF file
        
        Args:
            file_content: PDF file content as bytes
        
        Returns:
            Extracted text
        
        Raises:
            Exception: If PDF extraction fails
        """
        try:
            # Create BytesIO object from bytes
            pdf_file = BytesIO(file_content)
            
            # Read PDF
            pdf_reader = PdfReader(pdf_file)
            
            # Extract text from all pages
            text_parts = []
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
            
            # Combine all text
            full_text = '\n\n'.join(text_parts)
            
            # Clean up text
            full_text = self._clean_text(full_text)
            
            if not full_text or len(full_text.strip()) < 10:
                raise Exception("PDF appears to be empty or contains no extractable text")
            
            return full_text
        
        except Exception as e:
            raise Exception(f"PDF extraction failed: {str(e)}")
    
    def extract_from_txt(self, file_content: bytes) -> str:
        """
        Extract text from TXT file
        
        Args:
            file_content: TXT file content as bytes
        
        Returns:
            Extracted text
        
        Raises:
            Exception: If text extraction fails
        """
        try:
            # Try different encodings
            encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
            
            text = None
            for encoding in encodings:
                try:
                    text = file_content.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue
            
            if text is None:
                raise Exception("Could not decode text file with supported encodings")
            
            # Clean up text
            text = self._clean_text(text)
            
            if not text or len(text.strip()) < 10:
                raise Exception("Text file appears to be empty")
            
            return text
        
        except Exception as e:
            raise Exception(f"Text extraction failed: {str(e)}")
    
    def _clean_text(self, text: str) -> str:
        """
        Clean and normalize extracted text
        
        Args:
            text: Raw extracted text
        
        Returns:
            Cleaned text
        """
        # Remove excessive whitespace
        text = ' '.join(text.split())
        
        # Remove non-printable characters (but keep newlines and tabs)
        text = ''.join(char for char in text if char.isprintable() or char in '\n\t')
        
        # Normalize line breaks
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        
        # Remove excessive empty lines (more than 2 consecutive)
        while '\n\n\n' in text:
            text = text.replace('\n\n\n', '\n\n')
        
        return text.strip()
    
    def extract_metadata(self, file_content: bytes, file_type: str) -> dict:
        """
        Extract metadata from file
        
        Args:
            file_content: File content as bytes
            file_type: File type (pdf or txt)
        
        Returns:
            Dictionary with metadata (word count, character count, etc.)
        """
        try:
            if file_type.lower() == 'pdf':
                text = self.extract_from_pdf(file_content)
            else:
                text = self.extract_from_txt(file_content)
            
            words = text.split()
            
            return {
                "word_count": len(words),
                "character_count": len(text),
                "line_count": text.count('\n') + 1,
                "is_valid": len(words) >= 10  # At least 10 words
            }
        
        except Exception:
            return {
                "word_count": 0,
                "character_count": 0,
                "line_count": 0,
                "is_valid": False
            }
