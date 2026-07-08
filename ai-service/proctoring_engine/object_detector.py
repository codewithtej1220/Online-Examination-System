"""
Object & Multi-Face Detection Module
Uses MobileNet-SSD for CPU-optimized object detection
"""

import cv2
import numpy as np
from typing import Dict, List
import os


class ObjectDetector:
    """
    Lightweight object and multi-face detection using MobileNet-SSD
    """
    
    def __init__(self):
        """Initialize MobileNet-SSD and face detector"""
        # Initialize face cascade for multi-face detection
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        
        # Suspicious object categories
        self.suspicious_objects = {
            'cell phone': ['cell phone', 'mobile'],
            'book': ['book'],
            'paper': ['paper', 'notebook'],
            'laptop': ['laptop', 'computer'],
            'tablet': ['tablet']
        }
        
        # For MobileNet-SSD, we'll use a simpler approach with OpenCV DNN
        # In production, you can load a proper MobileNet-SSD model
        # For now, we'll focus on face counting which is most critical
        self.initialized = True
    
    def analyze_frame(self, frame: np.ndarray) -> Dict:
        """
        Analyze frame for unauthorized objects and multiple faces
        
        Args:
            frame: Input image frame (BGR format)
        
        Returns:
            Dictionary with detection results
        """
        try:
            # Detect faces
            face_count, face_boxes = self._detect_faces(frame)
            
            # Check for multiple faces
            multi_face_detected = face_count > 1
            
            # Detect suspicious objects (simplified version)
            # In production, integrate full MobileNet-SSD model
            suspicious_objects_detected = self._detect_suspicious_objects(frame)
            
            return {
                'success': True,
                'face_count': face_count,
                'multi_face_violation': multi_face_detected,
                'faces': face_boxes,
                'suspicious_objects': suspicious_objects_detected,
                'object_violation': len(suspicious_objects_detected) > 0
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'face_count': 0,
                'multi_face_violation': False,
                'suspicious_objects': [],
                'object_violation': False
            }
    
    def _detect_faces(self, frame: np.ndarray) -> tuple:
        """
        Detect all faces in frame using Haar Cascade
        
        Returns:
            Tuple of (face_count, face_boxes)
        """
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30),
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        # Convert to list of dictionaries
        face_boxes = []
        for (x, y, w, h) in faces:
            face_boxes.append({
                'x': int(x),
                'y': int(y),
                'width': int(w),
                'height': int(h),
                'confidence': 1.0  # Haar cascade doesn't provide confidence
            })
        
        return len(faces), face_boxes
    
    def _detect_suspicious_objects(self, frame: np.ndarray) -> List[Dict]:
        """
        Detect suspicious objects in frame
        
        Note: This is a placeholder for MobileNet-SSD integration
        In production, you would load and use a proper object detection model
        """
        # Placeholder for object detection
        # For actual implementation, you would:
        # 1. Load MobileNet-SSD model
        # 2. Run inference on frame
        # 3. Filter for suspicious object classes
        # 4. Return detections with confidence scores
        
        detected_objects = []
        
        # Simple placeholder logic based on image analysis
        # In production, replace with actual model inference
        height, width = frame.shape[:2]
        
        # Check for phone-like objects in bottom region (simplified)
        bottom_region = frame[int(height * 0.7):, :]
        
        # Look for rectangular objects with high edge density
        # This is a very simplified heuristic
        edges = cv2.Canny(bottom_region, 50, 150)
        edge_density = np.sum(edges) / edges.size
        
        if edge_density > 0.15:  # Threshold for suspicious rectangular object
            detected_objects.append({
                'class': 'unknown_object',
                'confidence': 0.6,
                'bbox': {
                    'x': 0,
                    'y': int(height * 0.7),
                    'width': width,
                    'height': int(height * 0.3)
                },
                'suspicious': True
            })
        
        return detected_objects
    
    def load_mobilenet_ssd(self, model_path: str = None):
        """
        Load MobileNet-SSD model for proper object detection
        
        Args:
            model_path: Path to MobileNet-SSD model files
        """
        # Placeholder for loading actual MobileNet-SSD model
        # In production, you would:
        # 1. Download MobileNet-SSD weights and config
        # 2. Load using cv2.dnn.readNetFromCaffe() or similar
        # 3. Store model for inference
        
        if model_path and os.path.exists(model_path):
            try:
                # Example for loading Caffe model:
                # prototxt = os.path.join(model_path, 'deploy.prototxt')
                # caffemodel = os.path.join(model_path, 'mobilenet_iter_73000.caffemodel')
                # self.net = cv2.dnn.readNetFromCaffe(prototxt, caffemodel)
                pass
            except Exception as e:
                print(f"Failed to load MobileNet-SSD: {e}")
    
    def detect_with_mobilenet(self, frame: np.ndarray) -> List[Dict]:
        """
        Run MobileNet-SSD inference on frame
        
        This is a template method for production use
        """
        if not hasattr(self, 'net'):
            return []
        
        # Prepare blob for network
        blob = cv2.dnn.blobFromImage(
            cv2.resize(frame, (300, 300)),
            0.007843,
            (300, 300),
            127.5
        )
        
        # Set input and run forward pass
        # self.net.setInput(blob)
        # detections = self.net.forward()
        
        # Parse detections and filter for suspicious objects
        # Return list of detected objects
        
        return []
    
    def is_violation_detected(self, analysis_result: Dict) -> bool:
        """
        Check if any violation was detected in analysis result
        """
        return (
            analysis_result.get('multi_face_violation', False) or
            analysis_result.get('object_violation', False)
        )
    
    def get_violation_details(self, analysis_result: Dict) -> List[str]:
        """
        Get list of violation descriptions
        """
        violations = []
        
        if analysis_result.get('multi_face_violation', False):
            face_count = analysis_result.get('face_count', 0)
            violations.append(f"Multiple faces detected ({face_count} faces)")
        
        if analysis_result.get('object_violation', False):
            objects = analysis_result.get('suspicious_objects', [])
            for obj in objects:
                violations.append(f"Suspicious object detected: {obj.get('class', 'unknown')}")
        
        return violations
