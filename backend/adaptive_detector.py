#!/usr/bin/env python3
"""
Adaptive Fraud Detector - sistem mai fin și precis
Calibrare automată + scoring sofisticat
"""

import numpy as np
from collections import deque
from typing import Tuple, Optional


class AdaptiveFraudDetector:
    """
    Wrapper peste FraudDetector care adaugă:
    - Threshold adaptiv bazat pe distribuția probabilităților
    - Scoring sofisticat (nu doar probabilitate)
    - Confidence level
    - Auto-calibrare pe primele N tranzacții
    """
    
    def __init__(self, base_detector, calibration_size: int = 50, target_fraud_rate: float = 0.15):
        """
        Args:
            base_detector: FraudDetector de bază
            calibration_size: Număr de tranzacții pentru calibrare
            target_fraud_rate: Rata țintă de fraud (15% rezonabil)
        """
        self.detector = base_detector
        self.calibration_size = calibration_size
        self.target_fraud_rate = target_fraud_rate
        
        # Calibration data
        self.calibration_probs = deque(maxlen=calibration_size)
        self.is_calibrated = False
        self.adaptive_threshold = base_detector.threshold
        
        # Recent transactions for monitoring
        self.recent_probs = deque(maxlen=100)
        self.recent_predictions = deque(maxlen=100)
        
        # Statistics
        self.total_processed = 0
        self.total_fraud = 0
    
    def predict_with_confidence(self, df) -> Tuple[np.ndarray, np.ndarray, np.ndarray, float]:
        """
        Predictie cu confidence score.
        
        Returns:
            predictions: Binary predictions (0/1)
            probabilities: Raw probabilities
            confidence: Confidence score pentru fiecare (0-1)
            fraud_rate: Current fraud rate
        """
        # Get base prediction
        predictions, probabilities, _ = self.detector.predict(df)
        
        # Add to calibration if needed
        if not self.is_calibrated:
            for prob in probabilities:
                self.calibration_probs.append(prob)
            
            # Check if ready to calibrate
            if len(self.calibration_probs) >= self.calibration_size:
                self._calibrate()
        
        # Calculate confidence based on distance from threshold
        confidence = self._calculate_confidence(probabilities)
        
        # Adaptive prediction using calibrated threshold
        adaptive_predictions = (probabilities < self.adaptive_threshold).astype(int)
        
        # Update statistics
        self.total_processed += len(predictions)
        self.total_fraud += adaptive_predictions.sum()
        
        # Store recent data
        for prob, pred in zip(probabilities, adaptive_predictions):
            self.recent_probs.append(prob)
            self.recent_predictions.append(pred)
        
        # Recalibrate periodically
        if self.total_processed % 100 == 0 and self.is_calibrated:
            self._recalibrate()
        
        fraud_rate = self.total_fraud / self.total_processed if self.total_processed > 0 else 0
        
        return adaptive_predictions, probabilities, confidence, fraud_rate
    
    def _calibrate(self):
        """Calibrate threshold based on collected probabilities"""
        probs = np.array(self.calibration_probs)
        
        # Use percentile to set threshold
        # Target fraud rate of 15% → use 15th percentile as threshold
        percentile = self.target_fraud_rate * 100
        self.adaptive_threshold = np.percentile(probs, percentile)
        
        self.is_calibrated = True
        
        print(f"\n🎯 ADAPTIVE CALIBRATION COMPLETE!")
        print(f"   Collected {len(probs)} samples")
        print(f"   Probability range: [{probs.min():.6e}, {probs.max():.6e}]")
        print(f"   Median: {np.median(probs):.6e}")
        print(f"   Original threshold: {self.detector.threshold:.6e}")
        print(f"   ✨ NEW adaptive threshold: {self.adaptive_threshold:.6e}")
        print(f"   Target fraud rate: {self.target_fraud_rate*100:.1f}%")
        print()
    
    def _recalibrate(self):
        """Recalibrate based on recent predictions"""
        if len(self.recent_probs) < 50:
            return
        
        current_fraud_rate = np.mean(self.recent_predictions)
        
        # Adjust threshold if fraud rate is too far from target
        if abs(current_fraud_rate - self.target_fraud_rate) > 0.1:  # 10% tolerance
            probs = np.array(self.recent_probs)
            percentile = self.target_fraud_rate * 100
            new_threshold = np.percentile(probs, percentile)
            
            # Smooth adjustment (don't jump too much)
            self.adaptive_threshold = 0.7 * self.adaptive_threshold + 0.3 * new_threshold
            
            print(f"🔄 Recalibrated threshold: {self.adaptive_threshold:.6e} (fraud rate: {current_fraud_rate:.2%})")
    
    def _calculate_confidence(self, probabilities: np.ndarray) -> np.ndarray:
        """
        Calculate confidence score based on distance from threshold.
        
        High confidence when:
        - Very low probability (far below threshold) → likely fraud
        - Very high probability (far above threshold) → likely normal
        
        Low confidence when:
        - Close to threshold → uncertain
        """
        # Distance from threshold (normalized)
        distances = np.abs(np.log10(probabilities + 1e-20) - np.log10(self.adaptive_threshold + 1e-20))
        
        # Convert to confidence (0-1)
        # Distance > 2 orders of magnitude → high confidence
        confidence = np.clip(distances / 2.0, 0, 1)
        
        return confidence
    
    def get_statistics(self) -> dict:
        """Get current statistics"""
        return {
            'total_processed': self.total_processed,
            'total_fraud': self.total_fraud,
            'fraud_rate': self.total_fraud / max(self.total_processed, 1),
            'is_calibrated': self.is_calibrated,
            'adaptive_threshold': self.adaptive_threshold,
            'original_threshold': self.detector.threshold,
            'threshold_multiplier': self.adaptive_threshold / self.detector.threshold if self.detector.threshold > 0 else 1,
        }
    
    def should_flag(self, probability: float, confidence: float, min_confidence: float = 0.3) -> bool:
        """
        Decide if transaction should be flagged.
        Only flag if confidence is high enough.
        
        Args:
            probability: Transaction probability
            confidence: Confidence score (0-1)
            min_confidence: Minimum confidence to flag (default 0.3)
        
        Returns:
            True if should flag as fraud
        """
        is_fraud = probability < self.adaptive_threshold
        is_confident = confidence >= min_confidence
        
        return is_fraud and is_confident


def format_confidence(confidence: float) -> str:
    """Format confidence as emoji + text"""
    if confidence >= 0.7:
        return f"🔥 {confidence:.2f} (HIGH)"
    elif confidence >= 0.4:
        return f"⚠️  {confidence:.2f} (MEDIUM)"
    else:
        return f"❓ {confidence:.2f} (LOW)"

