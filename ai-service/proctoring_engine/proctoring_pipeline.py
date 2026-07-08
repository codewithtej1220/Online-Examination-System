"""
Main Proctoring Pipeline
Orchestrates all proctoring components with concurrent execution
"""

import cv2
import numpy as np
import base64
from typing import Dict, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

from .gaze_tracker import GazeTracker
from .object_detector import ObjectDetector
from .face_verifier import FaceVerifier
from .audio_analyzer import AudioAnalyzer


class ProctoringPipeline:
    """
    Main pipeline for coordinating all proctoring analyses
    """
    
    def __init__(self):
        """Initialize all proctoring components"""
        self.gaze_tracker = GazeTracker()
        self.object_detector = ObjectDetector()
        self.face_verifier = FaceVerifier(model_name='Facenet')
        self.audio_analyzer = AudioAnalyzer()
        
        # Thread pool for concurrent execution
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        # Session tracking
        self.session_start_time = None
        self.frame_count = 0
        self.violation_counts = {
            'gaze': 0,
            'multi_face': 0,
            'object': 0,
            'identity': 0,
            'audio': 0
        }
    
    def start_session(self, baseline_image: Optional[np.ndarray] = None, 
                      baseline_audio: Optional[bytes] = None) -> Dict:
        """
        Start proctoring session with baseline setup
        
        Args:
            baseline_image: Student's reference photo for identity verification
            baseline_audio: Baseline ambient noise sample
        
        Returns:
            Dictionary with session initialization result
        """
        self.session_start_time = time.time()
        self.frame_count = 0
        
        # Reset all components
        self.gaze_tracker.reset()
        self.face_verifier.reset()
        self.audio_analyzer.reset()
        
        # Clear violation counts
        for key in self.violation_counts:
            self.violation_counts[key] = 0
        
        results = {
            'success': True,
            'session_started': True,
            'timestamp': self.session_start_time,
            'baseline_setup': {}
        }
        
        # Set identity baseline
        if baseline_image is not None:
            identity_result = self.face_verifier.set_baseline(baseline_image)
            results['baseline_setup']['identity'] = identity_result
        
        # Set audio baseline
        if baseline_audio is not None:
            audio_result = self.audio_analyzer.set_baseline(baseline_audio)
            results['baseline_setup']['audio'] = audio_result
        
        return results
    
    def analyze_stream(self, frame_data: str, audio_data: Optional[bytes] = None,
                       audio_metadata: Optional[Dict] = None) -> Dict:
        """
        Analyze single frame and audio data with concurrent processing
        
        Args:
            frame_data: Base64 encoded frame string
            audio_data: Optional audio bytes
            audio_metadata: Optional audio metadata
        
        Returns:
            Dictionary with comprehensive analysis results
        """
        try:
            start_time = time.time()
            self.frame_count += 1
            
            # Decode frame
            frame = self._decode_frame(frame_data)
            
            if frame is None:
                return {
                    'success': False,
                    'error': 'Failed to decode frame',
                    'frame_number': self.frame_count
                }
            
            # Run all analyses concurrently
            analysis_results = self._run_concurrent_analysis(frame, audio_data, audio_metadata)
            
            # Aggregate results
            aggregated = self._aggregate_results(analysis_results)
            
            # Update violation counts
            self._update_violation_counts(aggregated)
            
            # Calculate processing time
            processing_time = time.time() - start_time
            
            # Build final response
            response = {
                'success': True,
                'frame_number': self.frame_count,
                'timestamp': time.time(),
                'processing_time_ms': round(processing_time * 1000, 2),
                'analyses': analysis_results,
                'aggregated_violations': aggregated,
                'violation_summary': self.violation_counts.copy(),
                'session_duration_seconds': round(time.time() - self.session_start_time, 2) if self.session_start_time else 0
            }
            
            return response
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'frame_number': self.frame_count
            }
    
    def _run_concurrent_analysis(self, frame: np.ndarray, 
                                  audio_data: Optional[bytes],
                                  audio_metadata: Optional[Dict]) -> Dict:
        """
        Execute all analyses concurrently using thread pool
        """
        futures = {}
        results = {}
        
        # Submit gaze tracking
        futures['gaze'] = self.executor.submit(
            self.gaze_tracker.analyze_frame, frame
        )
        
        # Submit object detection
        futures['object'] = self.executor.submit(
            self.object_detector.analyze_frame, frame
        )
        
        # Submit identity verification (if baseline set)
        if self.face_verifier.has_baseline():
            futures['identity'] = self.executor.submit(
                self.face_verifier.verify_identity, frame
            )
        
        # Submit audio analysis (if audio provided and baseline set)
        if audio_data and self.audio_analyzer.has_baseline():
            futures['audio'] = self.executor.submit(
                self.audio_analyzer.analyze_audio, audio_data, audio_metadata
            )
        
        # Collect results as they complete
        for analysis_type, future in futures.items():
            try:
                results[analysis_type] = future.result(timeout=5.0)
            except Exception as e:
                results[analysis_type] = {
                    'success': False,
                    'error': f'Analysis timeout or error: {str(e)}'
                }
        
        return results
    
    def _aggregate_results(self, analysis_results: Dict) -> Dict:
        """
        Aggregate all analysis results into violation flags
        """
        violations = {
            'has_violations': False,
            'active_violations': [],
            'severity': 'none'
        }
        
        # Gaze violations
        if 'gaze' in analysis_results and analysis_results['gaze'].get('success'):
            gaze_data = analysis_results['gaze']
            if gaze_data.get('gaze_violation', {}).get('violation'):
                violations['active_violations'].append({
                    'type': 'gaze_deviation',
                    'severity': 'medium',
                    'details': f"Looking away for {gaze_data.get('gaze_away_duration', 0):.1f}s"
                })
        
        # Multi-face violations
        if 'object' in analysis_results and analysis_results['object'].get('success'):
            object_data = analysis_results['object']
            if object_data.get('multi_face_violation'):
                violations['active_violations'].append({
                    'type': 'multiple_faces',
                    'severity': 'high',
                    'details': f"{object_data.get('face_count', 0)} faces detected"
                })
            
            # Suspicious object violations
            if object_data.get('object_violation'):
                suspicious_objects = object_data.get('suspicious_objects', [])
                for obj in suspicious_objects:
                    violations['active_violations'].append({
                        'type': 'unauthorized_object',
                        'severity': 'high',
                        'details': f"Detected: {obj.get('class', 'unknown')}"
                    })
        
        # Identity violations
        if 'identity' in analysis_results and analysis_results['identity'].get('success'):
            identity_data = analysis_results['identity']
            if identity_data.get('identity_violation'):
                violations['active_violations'].append({
                    'type': 'identity_mismatch',
                    'severity': 'critical',
                    'details': f"Face match confidence: {identity_data.get('confidence', 0):.2f}"
                })
        
        # Audio violations
        if 'audio' in analysis_results and analysis_results['audio'].get('success'):
            audio_data = analysis_results['audio']
            if audio_data.get('audio_violation'):
                speech_type = audio_data.get('speech_type', 'unknown')
                violations['active_violations'].append({
                    'type': 'audio_anomaly',
                    'severity': 'medium',
                    'details': f"Detected: {speech_type}"
                })
        
        # Set has_violations flag
        violations['has_violations'] = len(violations['active_violations']) > 0
        
        # Determine overall severity
        if violations['has_violations']:
            severities = [v['severity'] for v in violations['active_violations']]
            if 'critical' in severities:
                violations['severity'] = 'critical'
            elif 'high' in severities:
                violations['severity'] = 'high'
            elif 'medium' in severities:
                violations['severity'] = 'medium'
            else:
                violations['severity'] = 'low'
        
        return violations
    
    def _update_violation_counts(self, aggregated: Dict):
        """Update violation count statistics"""
        for violation in aggregated.get('active_violations', []):
            violation_type = violation['type']
            
            if 'gaze' in violation_type:
                self.violation_counts['gaze'] += 1
            elif 'multiple_faces' in violation_type:
                self.violation_counts['multi_face'] += 1
            elif 'object' in violation_type:
                self.violation_counts['object'] += 1
            elif 'identity' in violation_type:
                self.violation_counts['identity'] += 1
            elif 'audio' in violation_type:
                self.violation_counts['audio'] += 1
    
    def _decode_frame(self, frame_data: str) -> Optional[np.ndarray]:
        """
        Decode base64 frame to OpenCV image
        """
        try:
            # Remove data URI prefix if present
            if ',' in frame_data:
                frame_data = frame_data.split(',')[1]
            
            # Decode base64
            image_data = base64.b64decode(frame_data)
            
            # Convert to numpy array
            nparr = np.frombuffer(image_data, np.uint8)
            
            # Decode image
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            return frame
        
        except Exception as e:
            print(f"Frame decode error: {e}")
            return None
    
    def get_session_summary(self) -> Dict:
        """
        Get comprehensive session summary
        
        Returns:
            Dictionary with session statistics and trends
        """
        if self.session_start_time is None:
            return {
                'error': 'No active session'
            }
        
        duration = time.time() - self.session_start_time
        
        # Get component trends
        gaze_trend = self.gaze_tracker._get_gaze_away_duration()
        identity_trend = self.face_verifier.get_verification_trend() if self.face_verifier.has_baseline() else {}
        audio_trend = self.audio_analyzer.get_audio_trend() if self.audio_analyzer.has_baseline() else {}
        
        return {
            'session_duration_seconds': round(duration, 2),
            'total_frames_analyzed': self.frame_count,
            'frames_per_minute': round((self.frame_count / duration) * 60, 2) if duration > 0 else 0,
            'violation_summary': self.violation_counts.copy(),
            'total_violations': sum(self.violation_counts.values()),
            'trends': {
                'gaze_away_duration': gaze_trend,
                'identity_verification': identity_trend,
                'audio_analysis': audio_trend
            },
            'risk_score': self._calculate_risk_score()
        }
    
    def _calculate_risk_score(self) -> float:
        """
        Calculate overall risk score (0-100)
        
        Higher score = more suspicious behavior
        """
        if self.frame_count == 0:
            return 0.0
        
        # Weight different violation types
        weights = {
            'identity': 10.0,  # Most critical
            'multi_face': 8.0,
            'object': 7.0,
            'audio': 5.0,
            'gaze': 3.0
        }
        
        # Calculate weighted score
        score = 0.0
        for vtype, count in self.violation_counts.items():
            if vtype in weights:
                # Normalize by frame count and apply weight
                violation_rate = count / self.frame_count
                score += violation_rate * weights[vtype]
        
        # Cap at 100
        return min(100.0, score * 10)
    
    def end_session(self) -> Dict:
        """
        End proctoring session and get final report
        
        Returns:
            Dictionary with final session report
        """
        summary = self.get_session_summary()
        
        # Reset session
        self.session_start_time = None
        self.frame_count = 0
        
        return {
            'session_ended': True,
            'final_report': summary
        }
    
    def __del__(self):
        """Cleanup resources"""
        if hasattr(self, 'executor'):
            self.executor.shutdown(wait=False)
