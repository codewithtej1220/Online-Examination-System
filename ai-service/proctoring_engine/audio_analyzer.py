"""
Audio Anomaly Detection Module
Uses Librosa for MFCC-based audio analysis
"""

import numpy as np
import librosa
from typing import Dict, List
from scipy.stats import zscore


class AudioAnalyzer:
    """
    Real-time audio analysis for detecting speech/whispering vs ambient noise
    """
    
    def __init__(self, sample_rate: int = 16000):
        """
        Initialize audio analyzer
        
        Args:
            sample_rate: Audio sample rate in Hz
        """
        self.sample_rate = sample_rate
        self.n_mfcc = 13  # Number of MFCC coefficients
        
        # Baseline ambient noise profile
        self.baseline_mfcc = None
        self.baseline_energy = None
        
        # Thresholds for anomaly detection
        self.energy_threshold = 0.02  # RMS energy threshold
        self.mfcc_deviation_threshold = 2.5  # Z-score threshold
        self.zero_crossing_threshold = 0.15  # Zero crossing rate for speech
        
        # History for trend analysis
        self.analysis_history = []
        self.max_history = 20
    
    def set_baseline(self, audio_bytes: bytes) -> Dict:
        """
        Set baseline ambient noise profile
        
        Args:
            audio_bytes: Audio data in bytes (raw PCM or WAV)
        
        Returns:
            Dictionary with baseline establishment result
        """
        try:
            # Load audio from bytes
            audio_data = self._bytes_to_audio(audio_bytes)
            
            # Extract features
            mfcc = self._extract_mfcc(audio_data)
            energy = self._calculate_energy(audio_data)
            
            # Store baseline
            self.baseline_mfcc = np.mean(mfcc, axis=1)
            self.baseline_energy = energy
            
            return {
                'success': True,
                'message': 'Baseline ambient noise profile established',
                'baseline_energy': float(energy),
                'mfcc_shape': mfcc.shape
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': f'Baseline extraction failed: {str(e)}'
            }
    
    def analyze_audio(self, audio_bytes: bytes, audio_metadata: Dict = None) -> Dict:
        """
        Analyze audio for speech/whispering detection
        
        Args:
            audio_bytes: Audio data in bytes
            audio_metadata: Optional metadata (duration, format, etc.)
        
        Returns:
            Dictionary with audio analysis results
        """
        try:
            # Load audio
            audio_data = self._bytes_to_audio(audio_bytes)
            
            # Extract features
            mfcc = self._extract_mfcc(audio_data)
            energy = self._calculate_energy(audio_data)
            zcr = self._calculate_zero_crossing_rate(audio_data)
            spectral_centroid = self._calculate_spectral_centroid(audio_data)
            
            # Detect speech/whispering
            speech_detected = self._detect_speech(audio_data, mfcc, energy, zcr)
            
            # Compare to baseline
            anomaly_score = self._calculate_anomaly_score(mfcc, energy)
            
            # Determine violation
            audio_violation = speech_detected['is_speech'] or anomaly_score > 0.7
            
            # Update history
            self._update_history({
                'energy': energy,
                'zcr': zcr,
                'speech_detected': speech_detected['is_speech'],
                'anomaly_score': anomaly_score
            })
            
            return {
                'success': True,
                'speech_detected': speech_detected['is_speech'],
                'speech_type': speech_detected['type'],
                'confidence': speech_detected['confidence'],
                'audio_violation': audio_violation,
                'features': {
                    'energy': float(energy),
                    'zero_crossing_rate': float(zcr),
                    'spectral_centroid': float(spectral_centroid),
                    'anomaly_score': float(anomaly_score)
                },
                'baseline_comparison': {
                    'energy_ratio': float(energy / self.baseline_energy) if self.baseline_energy else 1.0,
                    'has_baseline': self.baseline_mfcc is not None
                }
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'speech_detected': False,
                'audio_violation': False
            }
    
    def _bytes_to_audio(self, audio_bytes: bytes) -> np.ndarray:
        """
        Convert audio bytes to numpy array
        
        Assumes audio is in WAV format or raw PCM
        """
        try:
            # Try loading as WAV with librosa
            import io
            audio_data, sr = librosa.load(io.BytesIO(audio_bytes), sr=self.sample_rate)
            return audio_data
        except:
            # If WAV loading fails, assume raw PCM 16-bit
            audio_data = np.frombuffer(audio_bytes, dtype=np.int16)
            # Normalize to [-1, 1]
            audio_data = audio_data.astype(np.float32) / 32768.0
            return audio_data
    
    def _extract_mfcc(self, audio_data: np.ndarray) -> np.ndarray:
        """
        Extract Mel-Frequency Cepstral Coefficients
        
        Returns:
            MFCC matrix (n_mfcc x time_frames)
        """
        mfcc = librosa.feature.mfcc(
            y=audio_data,
            sr=self.sample_rate,
            n_mfcc=self.n_mfcc
        )
        return mfcc
    
    def _calculate_energy(self, audio_data: np.ndarray) -> float:
        """Calculate RMS energy of audio signal"""
        energy = np.sqrt(np.mean(audio_data ** 2))
        return float(energy)
    
    def _calculate_zero_crossing_rate(self, audio_data: np.ndarray) -> float:
        """
        Calculate zero crossing rate
        High ZCR indicates high-frequency content (speech/noise)
        """
        zcr = librosa.feature.zero_crossing_rate(audio_data)
        return float(np.mean(zcr))
    
    def _calculate_spectral_centroid(self, audio_data: np.ndarray) -> float:
        """
        Calculate spectral centroid
        Indicates where the "center of mass" of the spectrum is located
        """
        spectral_centroid = librosa.feature.spectral_centroid(
            y=audio_data,
            sr=self.sample_rate
        )
        return float(np.mean(spectral_centroid))
    
    def _detect_speech(self, audio_data: np.ndarray, mfcc: np.ndarray, 
                       energy: float, zcr: float) -> Dict:
        """
        Detect if audio contains speech or whispering
        
        Returns:
            Dictionary with detection results
        """
        # Speech detection criteria
        is_speech = False
        speech_type = 'ambient'
        confidence = 0.0
        
        # High energy + moderate ZCR = normal speech
        if energy > self.energy_threshold and 0.05 < zcr < 0.25:
            is_speech = True
            speech_type = 'normal_speech'
            confidence = 0.8
        
        # Low energy + high ZCR = whispering
        elif energy > self.energy_threshold * 0.3 and zcr > 0.15:
            is_speech = True
            speech_type = 'whispering'
            confidence = 0.6
        
        # Keyboard clicks: high ZCR, short bursts
        elif zcr > 0.2 and energy < self.energy_threshold * 2:
            is_speech = False
            speech_type = 'keyboard_clicks'
            confidence = 0.7
        
        # MFCC pattern analysis for speech
        if not is_speech:
            mfcc_std = np.std(mfcc, axis=1)
            if np.mean(mfcc_std) > 15:  # High MFCC variance indicates speech
                is_speech = True
                speech_type = 'possible_speech'
                confidence = 0.5
        
        return {
            'is_speech': is_speech,
            'type': speech_type,
            'confidence': confidence
        }
    
    def _calculate_anomaly_score(self, mfcc: np.ndarray, energy: float) -> float:
        """
        Calculate how different current audio is from baseline
        
        Returns:
            Anomaly score (0 = normal, 1 = highly anomalous)
        """
        if self.baseline_mfcc is None:
            return 0.0
        
        # Compare MFCCs
        current_mfcc_mean = np.mean(mfcc, axis=1)
        mfcc_distance = np.linalg.norm(current_mfcc_mean - self.baseline_mfcc)
        
        # Normalize distance to [0, 1]
        mfcc_score = min(1.0, mfcc_distance / 50.0)
        
        # Compare energy
        if self.baseline_energy > 0:
            energy_ratio = energy / self.baseline_energy
            energy_score = abs(1.0 - energy_ratio)
        else:
            energy_score = 0.0
        
        # Combined anomaly score
        anomaly_score = 0.7 * mfcc_score + 0.3 * energy_score
        
        return float(min(1.0, anomaly_score))
    
    def _update_history(self, analysis: Dict):
        """Update analysis history"""
        self.analysis_history.append(analysis)
        
        if len(self.analysis_history) > self.max_history:
            self.analysis_history.pop(0)
    
    def get_audio_trend(self) -> Dict:
        """
        Analyze audio trend over recent history
        
        Returns:
            Dictionary with trend analysis
        """
        if len(self.analysis_history) < 3:
            return {
                'trend': 'insufficient_data',
                'speech_frequency': 0.0,
                'average_energy': 0.0
            }
        
        speech_detections = [h['speech_detected'] for h in self.analysis_history]
        energies = [h['energy'] for h in self.analysis_history]
        
        speech_frequency = np.mean(speech_detections)
        average_energy = np.mean(energies)
        
        # Determine trend
        recent_speech_freq = np.mean(speech_detections[-5:])
        
        if recent_speech_freq > 0.6:
            trend = 'high_speech_activity'
        elif recent_speech_freq > 0.3:
            trend = 'moderate_speech_activity'
        else:
            trend = 'low_speech_activity'
        
        return {
            'trend': trend,
            'speech_frequency': float(speech_frequency),
            'average_energy': float(average_energy),
            'recent_speech_frequency': float(recent_speech_freq),
            'sample_count': len(self.analysis_history)
        }
    
    def reset(self):
        """Reset analyzer state"""
        self.analysis_history = []
    
    def has_baseline(self) -> bool:
        """Check if baseline has been set"""
        return self.baseline_mfcc is not None
