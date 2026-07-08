"""
Biometric Face Verification Module
Uses DeepFace for continuous identity verification
"""

import cv2
import numpy as np
from typing import Dict, Optional
from deepface import DeepFace
import base64
from io import BytesIO
from PIL import Image


class FaceVerifier:
    """
    Continuous biometric identity verification using DeepFace
    """
    
    def __init__(self, model_name: str = 'Facenet'):
        """
        Initialize face verification system
        
        Args:
            model_name: DeepFace model to use (Facenet, VGG-Face, ArcFace, etc.)
        """
        self.model_name = model_name
        self.baseline_embedding = None
        self.baseline_image = None
        self.verification_threshold = 0.4  # Cosine distance threshold
        
        # Performance tracking
        self.verification_history = []
        self.max_history = 10
    
    def set_baseline(self, image: np.ndarray) -> Dict:
        """
        Set baseline face embedding from registration/login photo
        
        Args:
            image: Registration photo (BGR format)
        
        Returns:
            Dictionary with baseline extraction result
        """
        try:
            # Extract face embedding
            embedding = DeepFace.represent(
                img_path=image,
                model_name=self.model_name,
                enforce_detection=True,
                detector_backend='opencv'
            )
            
            if not embedding:
                return {
                    'success': False,
                    'error': 'No face detected in baseline image'
                }
            
            # Store baseline
            self.baseline_embedding = np.array(embedding[0]['embedding'])
            self.baseline_image = image.copy()
            
            return {
                'success': True,
                'message': 'Baseline face embedding established',
                'embedding_dimension': len(self.baseline_embedding)
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': f'Baseline extraction failed: {str(e)}'
            }
    
    def set_baseline_from_base64(self, base64_image: str) -> Dict:
        """
        Set baseline from base64 encoded image
        
        Args:
            base64_image: Base64 encoded image string
        
        Returns:
            Dictionary with baseline extraction result
        """
        try:
            # Decode base64 to image
            image = self._base64_to_image(base64_image)
            return self.set_baseline(image)
        
        except Exception as e:
            return {
                'success': False,
                'error': f'Base64 decoding failed: {str(e)}'
            }
    
    def verify_identity(self, frame: np.ndarray) -> Dict:
        """
        Verify current frame against baseline embedding
        
        Args:
            frame: Current video frame (BGR format)
        
        Returns:
            Dictionary with verification results
        """
        if self.baseline_embedding is None:
            return {
                'success': False,
                'error': 'Baseline not set. Call set_baseline() first',
                'identity_verified': False,
                'identity_violation': True
            }
        
        try:
            # Extract embedding from current frame
            embedding = DeepFace.represent(
                img_path=frame,
                model_name=self.model_name,
                enforce_detection=True,
                detector_backend='opencv'
            )
            
            if not embedding:
                return {
                    'success': True,
                    'identity_verified': False,
                    'identity_violation': True,
                    'reason': 'No face detected in frame',
                    'distance': 1.0
                }
            
            # Get current embedding
            current_embedding = np.array(embedding[0]['embedding'])
            
            # Calculate cosine distance
            distance = self._cosine_distance(self.baseline_embedding, current_embedding)
            
            # Verify identity
            identity_verified = distance < self.verification_threshold
            
            # Update history
            self._update_history(distance, identity_verified)
            
            # Calculate confidence
            confidence = 1.0 - (distance / self.verification_threshold)
            confidence = max(0.0, min(1.0, confidence))
            
            return {
                'success': True,
                'identity_verified': identity_verified,
                'identity_violation': not identity_verified,
                'distance': float(distance),
                'threshold': self.verification_threshold,
                'confidence': float(confidence),
                'model': self.model_name,
                'recent_average_distance': self._get_average_distance()
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'identity_verified': False,
                'identity_violation': True,
                'distance': 1.0
            }
    
    def verify_identity_from_base64(self, base64_frame: str) -> Dict:
        """
        Verify identity from base64 encoded frame
        
        Args:
            base64_frame: Base64 encoded frame string
        
        Returns:
            Dictionary with verification results
        """
        try:
            # Decode base64 to image
            frame = self._base64_to_image(base64_frame)
            return self.verify_identity(frame)
        
        except Exception as e:
            return {
                'success': False,
                'error': f'Frame decoding failed: {str(e)}',
                'identity_verified': False,
                'identity_violation': True
            }
    
    def _cosine_distance(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Calculate cosine distance between two embeddings
        
        Returns:
            Distance value (0 = identical, 2 = opposite)
        """
        # Normalize embeddings
        embedding1_norm = embedding1 / np.linalg.norm(embedding1)
        embedding2_norm = embedding2 / np.linalg.norm(embedding2)
        
        # Calculate cosine similarity
        similarity = np.dot(embedding1_norm, embedding2_norm)
        
        # Convert to distance (1 - similarity)
        distance = 1.0 - similarity
        
        return float(distance)
    
    def _update_history(self, distance: float, verified: bool):
        """Update verification history for trend analysis"""
        self.verification_history.append({
            'distance': distance,
            'verified': verified
        })
        
        # Keep only recent history
        if len(self.verification_history) > self.max_history:
            self.verification_history.pop(0)
    
    def _get_average_distance(self) -> float:
        """Calculate average distance from recent verifications"""
        if not self.verification_history:
            return 0.0
        
        distances = [h['distance'] for h in self.verification_history]
        return float(np.mean(distances))
    
    def get_verification_trend(self) -> Dict:
        """
        Analyze verification trend over recent history
        
        Returns:
            Dictionary with trend analysis
        """
        if len(self.verification_history) < 3:
            return {
                'trend': 'insufficient_data',
                'average_distance': 0.0,
                'success_rate': 0.0
            }
        
        distances = [h['distance'] for h in self.verification_history]
        verifications = [h['verified'] for h in self.verification_history]
        
        avg_distance = np.mean(distances)
        success_rate = np.mean(verifications)
        
        # Determine trend
        recent_avg = np.mean(distances[-3:])
        early_avg = np.mean(distances[:3])
        
        if recent_avg > early_avg * 1.2:
            trend = 'degrading'  # Identity match getting worse
        elif recent_avg < early_avg * 0.8:
            trend = 'improving'  # Identity match getting better
        else:
            trend = 'stable'
        
        return {
            'trend': trend,
            'average_distance': float(avg_distance),
            'success_rate': float(success_rate),
            'recent_average': float(recent_avg),
            'early_average': float(early_avg),
            'sample_count': len(self.verification_history)
        }
    
    def _base64_to_image(self, base64_string: str) -> np.ndarray:
        """Convert base64 string to OpenCV image"""
        # Remove data URI prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Convert to PIL Image
        pil_image = Image.open(BytesIO(image_data))
        
        # Convert to numpy array
        image_array = np.array(pil_image)
        
        # Convert RGB to BGR for OpenCV
        if len(image_array.shape) == 3 and image_array.shape[2] == 3:
            image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        
        return image_array
    
    def reset(self):
        """Reset verification state"""
        self.verification_history = []
    
    def has_baseline(self) -> bool:
        """Check if baseline has been set"""
        return self.baseline_embedding is not None
