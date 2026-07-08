"""
Gaze & Head Pose Tracking Module
Uses MediaPipe Face Mesh for real-time iris position and 3D head rotation
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Dict, Tuple, Optional
import time


class GazeTracker:
    """
    Real-time gaze and head pose tracking using MediaPipe Face Mesh
    """
    
    def __init__(self):
        """Initialize MediaPipe Face Mesh"""
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Gaze deviation tracking
        self.gaze_away_start = None
        self.gaze_away_threshold = 3.0  # seconds
        
        # Key landmark indices for pose estimation
        self.NOSE_TIP = 1
        self.CHIN = 152
        self.LEFT_EYE_CORNER = 263
        self.RIGHT_EYE_CORNER = 33
        self.LEFT_MOUTH_CORNER = 287
        self.RIGHT_MOUTH_CORNER = 57
    
    def analyze_frame(self, frame: np.ndarray) -> Dict:
        """
        Analyze single frame for gaze and head pose
        
        Args:
            frame: Input image frame (BGR format)
        
        Returns:
            Dictionary with gaze and pose analysis results
        """
        try:
            # Convert to RGB for MediaPipe
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.face_mesh.process(rgb_frame)
            
            if not results.multi_face_landmarks:
                return self._no_face_detected()
            
            # Get face landmarks
            face_landmarks = results.multi_face_landmarks[0]
            h, w = frame.shape[:2]
            
            # Extract 3D landmarks
            landmarks_3d = self._extract_3d_landmarks(face_landmarks, w, h)
            
            # Calculate head pose angles
            head_pose = self._calculate_head_pose(landmarks_3d, w, h)
            
            # Calculate gaze direction
            gaze_direction = self._calculate_gaze_direction(face_landmarks, w, h)
            
            # Detect if looking away
            is_looking_away = self._is_looking_away(head_pose, gaze_direction)
            
            # Track duration of looking away
            gaze_violation = self._track_gaze_duration(is_looking_away)
            
            return {
                'success': True,
                'face_detected': True,
                'head_pose': head_pose,
                'gaze_direction': gaze_direction,
                'is_looking_away': is_looking_away,
                'gaze_violation': gaze_violation,
                'gaze_away_duration': self._get_gaze_away_duration(),
                'landmarks_count': len(face_landmarks.landmark)
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'face_detected': False
            }
    
    def _extract_3d_landmarks(self, face_landmarks, width: int, height: int) -> np.ndarray:
        """Extract 3D coordinates of key facial landmarks"""
        landmarks = []
        indices = [
            self.NOSE_TIP,
            self.CHIN,
            self.LEFT_EYE_CORNER,
            self.RIGHT_EYE_CORNER,
            self.LEFT_MOUTH_CORNER,
            self.RIGHT_MOUTH_CORNER
        ]
        
        for idx in indices:
            landmark = face_landmarks.landmark[idx]
            landmarks.append([
                landmark.x * width,
                landmark.y * height,
                landmark.z * width  # Normalize z coordinate
            ])
        
        return np.array(landmarks, dtype=np.float64)
    
    def _calculate_head_pose(self, landmarks_3d: np.ndarray, width: int, height: int) -> Dict:
        """
        Calculate 3D head rotation angles (pitch, yaw, roll)
        """
        # Camera matrix (simplified)
        focal_length = width
        camera_center = (width / 2, height / 2)
        camera_matrix = np.array([
            [focal_length, 0, camera_center[0]],
            [0, focal_length, camera_center[1]],
            [0, 0, 1]
        ], dtype=np.float64)
        
        # 3D model points (generic face model)
        model_points = np.array([
            (0.0, 0.0, 0.0),             # Nose tip
            (0.0, -330.0, -65.0),        # Chin
            (-225.0, 170.0, -135.0),     # Left eye corner
            (225.0, 170.0, -135.0),      # Right eye corner
            (-150.0, -150.0, -125.0),    # Left mouth corner
            (150.0, -150.0, -125.0)      # Right mouth corner
        ], dtype=np.float64)
        
        # Distortion coefficients (assuming no distortion)
        dist_coeffs = np.zeros((4, 1))
        
        # Solve PnP to get rotation and translation vectors
        success, rotation_vector, translation_vector = cv2.solvePnP(
            model_points,
            landmarks_3d[:, :2],  # Use only x, y coordinates
            camera_matrix,
            dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE
        )
        
        if not success:
            return {'pitch': 0, 'yaw': 0, 'roll': 0}
        
        # Convert rotation vector to rotation matrix
        rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
        
        # Calculate Euler angles
        angles = self._rotation_matrix_to_euler_angles(rotation_matrix)
        
        return {
            'pitch': float(angles[0]),  # Up/down tilt
            'yaw': float(angles[1]),    # Left/right turn
            'roll': float(angles[2])    # Head tilt
        }
    
    def _rotation_matrix_to_euler_angles(self, R: np.ndarray) -> np.ndarray:
        """Convert rotation matrix to Euler angles (in degrees)"""
        sy = np.sqrt(R[0, 0] * R[0, 0] + R[1, 0] * R[1, 0])
        singular = sy < 1e-6
        
        if not singular:
            x = np.arctan2(R[2, 1], R[2, 2])
            y = np.arctan2(-R[2, 0], sy)
            z = np.arctan2(R[1, 0], R[0, 0])
        else:
            x = np.arctan2(-R[1, 2], R[1, 1])
            y = np.arctan2(-R[2, 0], sy)
            z = 0
        
        return np.degrees([x, y, z])
    
    def _calculate_gaze_direction(self, face_landmarks, width: int, height: int) -> Dict:
        """
        Calculate gaze direction based on iris position
        """
        # Left eye iris landmarks (468-477 for refined landmarks)
        left_iris_indices = [468, 469, 470, 471, 472]
        # Right eye iris landmarks
        right_iris_indices = [473, 474, 475, 476, 477]
        
        # Calculate iris centers
        left_iris_center = self._get_landmark_center(
            face_landmarks, left_iris_indices, width, height
        )
        right_iris_center = self._get_landmark_center(
            face_landmarks, right_iris_indices, width, height
        )
        
        # Get eye corners for reference
        left_eye_left = face_landmarks.landmark[self.LEFT_EYE_CORNER]
        left_eye_right = face_landmarks.landmark[362]  # Inner corner
        right_eye_left = face_landmarks.landmark[133]   # Inner corner
        right_eye_right = face_landmarks.landmark[self.RIGHT_EYE_CORNER]
        
        # Calculate gaze ratios (iris position relative to eye width)
        left_gaze_ratio = self._calculate_gaze_ratio(
            left_iris_center,
            (left_eye_left.x * width, left_eye_left.y * height),
            (left_eye_right.x * width, left_eye_right.y * height)
        )
        
        right_gaze_ratio = self._calculate_gaze_ratio(
            right_iris_center,
            (right_eye_left.x * width, right_eye_left.y * height),
            (right_eye_right.x * width, right_eye_right.y * height)
        )
        
        # Average gaze ratio
        avg_gaze_ratio = (left_gaze_ratio + right_gaze_ratio) / 2
        
        # Determine gaze direction
        if avg_gaze_ratio < 0.35:
            direction = 'left'
        elif avg_gaze_ratio > 0.65:
            direction = 'right'
        else:
            direction = 'center'
        
        return {
            'left_gaze_ratio': float(left_gaze_ratio),
            'right_gaze_ratio': float(right_gaze_ratio),
            'average_ratio': float(avg_gaze_ratio),
            'direction': direction
        }
    
    def _get_landmark_center(self, face_landmarks, indices: list, width: int, height: int) -> Tuple[float, float]:
        """Calculate center point of multiple landmarks"""
        x_coords = []
        y_coords = []
        
        for idx in indices:
            if idx < len(face_landmarks.landmark):
                landmark = face_landmarks.landmark[idx]
                x_coords.append(landmark.x * width)
                y_coords.append(landmark.y * height)
        
        if not x_coords:
            return (0, 0)
        
        return (np.mean(x_coords), np.mean(y_coords))
    
    def _calculate_gaze_ratio(self, iris_center: Tuple[float, float], 
                              eye_left: Tuple[float, float], 
                              eye_right: Tuple[float, float]) -> float:
        """Calculate normalized gaze position (0 = left, 0.5 = center, 1 = right)"""
        eye_width = eye_right[0] - eye_left[0]
        if eye_width == 0:
            return 0.5
        
        iris_position = iris_center[0] - eye_left[0]
        ratio = iris_position / eye_width
        
        # Clamp between 0 and 1
        return max(0.0, min(1.0, ratio))
    
    def _is_looking_away(self, head_pose: Dict, gaze_direction: Dict) -> bool:
        """
        Determine if student is looking away from screen
        """
        # Head pose thresholds (in degrees)
        YAW_THRESHOLD = 30      # Left/right turn
        PITCH_THRESHOLD = 25    # Up/down tilt
        
        # Check head pose
        if abs(head_pose['yaw']) > YAW_THRESHOLD:
            return True
        
        if abs(head_pose['pitch']) > PITCH_THRESHOLD:
            return True
        
        # Check gaze direction
        if gaze_direction['direction'] != 'center':
            # Allow slight deviations, but extreme gaze is suspicious
            if gaze_direction['average_ratio'] < 0.2 or gaze_direction['average_ratio'] > 0.8:
                return True
        
        return False
    
    def _track_gaze_duration(self, is_looking_away: bool) -> Dict:
        """
        Track how long student has been looking away
        """
        current_time = time.time()
        
        if is_looking_away:
            if self.gaze_away_start is None:
                self.gaze_away_start = current_time
            
            duration = current_time - self.gaze_away_start
            
            return {
                'violation': duration >= self.gaze_away_threshold,
                'duration': duration,
                'threshold': self.gaze_away_threshold
            }
        else:
            # Reset timer when looking at screen
            self.gaze_away_start = None
            return {
                'violation': False,
                'duration': 0,
                'threshold': self.gaze_away_threshold
            }
    
    def _get_gaze_away_duration(self) -> float:
        """Get current duration of looking away"""
        if self.gaze_away_start is None:
            return 0.0
        return time.time() - self.gaze_away_start
    
    def _no_face_detected(self) -> Dict:
        """Return result when no face is detected"""
        # Reset tracking when face not detected
        self.gaze_away_start = None
        
        return {
            'success': True,
            'face_detected': False,
            'head_pose': {'pitch': 0, 'yaw': 0, 'roll': 0},
            'gaze_direction': {'direction': 'unknown', 'average_ratio': 0.5},
            'is_looking_away': True,
            'gaze_violation': {
                'violation': False,
                'duration': 0,
                'threshold': self.gaze_away_threshold
            },
            'gaze_away_duration': 0
        }
    
    def reset(self):
        """Reset tracking state"""
        self.gaze_away_start = None
    
    def __del__(self):
        """Cleanup resources"""
        if hasattr(self, 'face_mesh'):
            self.face_mesh.close()
