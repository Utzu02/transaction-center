"""
Main fraud detector class that combines feature engineering and anomaly detection.
"""

import numpy as np
import pandas as pd
from typing import Optional, Dict, List, Tuple
import pickle
import json
from datetime import datetime

from anomaly_detection import (
    estimate_gaussian,
    multivariate_gaussian,
    optimal_threshold,
    identify_outliers
)
from feature_engineering import (
    extract_features,
    prepare_features_for_model,
    add_temporal_features,
    normalize_features,
    get_feature_columns
)


class FraudDetector:
    """
    POS Fraud Detector using Gaussian Anomaly Detection.
    """
    
    def __init__(self, feature_columns: Optional[List[str]] = None):
        """
        Initialize fraud detector.
        
        Args:
            feature_columns: List of feature columns to use
        """
        self.feature_columns = feature_columns or get_feature_columns()
        self.mean_values = None
        self.covariance_matrix = None
        self.threshold = None
        self.normalization_mean = None
        self.normalization_std = None
        self.encoders = None  # For categorical encoding
        self.training_columns = None  # Store column names from training
        self.is_trained = False
        self.metrics = {}
        
    def train(self, df: pd.DataFrame, n_samples: Optional[int] = None) -> Dict:
        """
        Train the fraud detector on transaction data.
        
        Args:
            df: DataFrame with transaction data (must include 'is_fraud' column)
            n_samples: Optional limit on number of samples to use
            
        Returns:
            Dictionary with training metrics
        """
        if 'is_fraud' not in df.columns:
            raise ValueError("Training data must include 'is_fraud' column")
        
        # Limit samples if specified
        if n_samples is not None and n_samples < len(df):
            df = df.head(n_samples)
        
        print(f"Training on {len(df)} samples...")
        
        # Extract features (will encode all strings to numbers)
        df_features, self.encoders = extract_features(df, n_samples=None, encoders=None)
        df_features = add_temporal_features(df_features)
        
        # Prepare feature matrix - this applies ALL excludes
        X = prepare_features_for_model(df_features, feature_columns=None)
        y = df_features['is_fraud'].values if 'is_fraud' in df_features.columns else df['is_fraud'].values
        
        # NOW get training columns - AFTER excludes are applied
        # These are the EXACT columns that prepare_features_for_model uses
        exclude_cols = [
            'is_fraud', 'cc_num', 'acct_num', 'ssn', 'unix_time', 'zip',
            'city', 'job', 'dob', 'trans_time', 'trans_date',
            'lat', 'long', 'merch_lat', 'merch_long',
            'city_pop', 'city_pop_capped', 'amt',
        ]
        numeric_cols = df_features.select_dtypes(include=[np.number]).columns
        self.training_columns = [col for col in numeric_cols if col not in exclude_cols]
        
        # Verify shape matches
        if X.shape[1] != len(self.training_columns):
            raise ValueError(f"Feature mismatch: Matrix has {X.shape[1]} features but training_columns has {len(self.training_columns)}")
        
        print(f"Using {len(self.training_columns)} features: {self.training_columns}")
        print(f"Feature matrix shape: {X.shape}")
        print(f"Fraud rate: {y.mean():.4f}")
        
        # Normalize features
        X_normalized, self.normalization_mean, self.normalization_std = normalize_features(X)
        
        # Estimate Gaussian parameters (using only non-fraud transactions)
        X_normal = X_normalized[y == 0]
        self.mean_values, self.covariance_matrix = estimate_gaussian(X_normal)
        
        # Calculate probabilities for all transactions
        probabilities = multivariate_gaussian(X_normalized, self.mean_values, self.covariance_matrix)
        
        # Debug: Show probability distribution
        print(f"\nTraining probability stats:")
        print(f"  Normal (fraud=0): min={probabilities[y==0].min():.6e}, max={probabilities[y==0].max():.6e}, median={np.median(probabilities[y==0]):.6e}")
        print(f"  Fraud (fraud=1):  min={probabilities[y==1].min():.6e}, max={probabilities[y==1].max():.6e}, median={np.median(probabilities[y==1]):.6e}")
        
        # Find optimal threshold
        self.threshold, F1, precision, recall = optimal_threshold(y, probabilities)
        
        self.is_trained = True
        self.metrics = {
            'F1': F1,
            'precision': precision,
            'recall': recall,
            'threshold': self.threshold,
            'n_features': X_normalized.shape[1],
            'n_samples': len(df),
            'fraud_rate': float(y.mean())
        }
        
        print(f"\nTraining complete!")
        print(f"Threshold: {self.threshold:.6e}")
        print(f"F1 Score: {F1:.4f}")
        print(f"Precision: {precision:.4f}")
        print(f"Recall: {recall:.4f}")
        
        return self.metrics
    
    def predict(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame]:
        """
        Predict fraud on new transaction data.
        
        Args:
            df: DataFrame with transaction data
            
        Returns:
            predictions: Binary predictions (0=normal, 1=fraud)
            probabilities: Probability values from Gaussian model
            df_processed: DataFrame with all features
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction")
        
        # Extract features using trained encoders
        df_features, _ = extract_features(df, n_samples=None, encoders=self.encoders)
        df_features = add_temporal_features(df_features)
        
        # Get all numeric columns (before alignment)
        numeric_cols = df_features.select_dtypes(include=[np.number]).columns.tolist()
        
        print(f"Test has {len(numeric_cols)} numeric columns before alignment")
        print(f"Training had {len(self.training_columns)} columns")
        
        # Align columns with training data BEFORE extracting matrix
        # Add missing columns with zeros
        for col in self.training_columns:
            if col not in df_features.columns:
                print(f"  Adding missing column: {col}")
                df_features[col] = 0
        
        # Keep only training columns (drop extra columns)
        extra_cols = [col for col in numeric_cols if col not in self.training_columns and col != 'is_fraud']
        if extra_cols:
            print(f"  Dropping {len(extra_cols)} extra columns: {extra_cols[:5]}...")
            df_features = df_features.drop(columns=extra_cols, errors='ignore')
        
        # Prepare feature matrix using training columns
        X = df_features[self.training_columns].values
        
        # Handle NaN values
        col_mean = np.nanmean(X, axis=0)
        inds = np.where(np.isnan(X))
        if len(inds[0]) > 0:
            X[inds] = np.take(col_mean, inds[1])
        
        print(f"Prediction feature matrix shape: {X.shape} (should match training)")
        
        # Debug BEFORE normalization
        print(f"\nBefore normalization:")
        print(f"  X stats: min={X.min():.2f}, max={X.max():.2f}, mean={X.mean():.2f}")
        print(f"  Training mean range: [{self.normalization_mean.min():.2f}, {self.normalization_mean.max():.2f}]")
        print(f"  Training std range: [{self.normalization_std.min():.6f}, {self.normalization_std.max():.2f}]")
        print(f"  Any std=0? {(self.normalization_std == 0).sum()} features")
        
        # Normalize using training statistics
        X_normalized = (X - self.normalization_mean) / self.normalization_std
        
        # Debug AFTER normalization
        print(f"\nAfter normalization:")
        print(f"  X_norm stats: min={X_normalized.min():.2f}, max={X_normalized.max():.2f}, mean={X_normalized.mean():.2f}")
        print(f"  NaN count: {np.isnan(X_normalized).sum()}")
        print(f"  Inf count: {np.isinf(X_normalized).sum()}")
        
        # Replace NaN/Inf with 0
        X_normalized = np.nan_to_num(X_normalized, nan=0.0, posinf=0.0, neginf=0.0)
        
        # Calculate probabilities
        probabilities = multivariate_gaussian(X_normalized, self.mean_values, self.covariance_matrix)
        
        # Debug info
        print(f"\nProbability stats: min={probabilities.min():.6e}, max={probabilities.max():.6e}, median={np.median(probabilities):.6e}")
        print(f"Threshold: {self.threshold:.6e}")
        print(f"Samples below threshold: {(probabilities < self.threshold).sum()} / {len(probabilities)}")
        
        # Make predictions
        predictions = (probabilities < self.threshold).astype(int)
        
        return predictions, probabilities, df_features
    
    def predict_single(self, transaction: Dict) -> Tuple[int, float, Dict]:
        """
        Predict fraud for a single transaction (for real-time detection).
        
        Args:
            transaction: Dictionary with transaction data
            
        Returns:
            prediction: Binary prediction (0=normal, 1=fraud)
            probability: Probability value
            details: Dictionary with additional information
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction")
        
        # Convert to DataFrame
        df = pd.DataFrame([transaction])
        
        # Get prediction
        predictions, probabilities, df_processed = self.predict(df)
        
        details = {
            'probability': float(probabilities[0]),
            'threshold': float(self.threshold),
            'confidence': float(abs(probabilities[0] - self.threshold) / self.threshold),
            'prediction': int(predictions[0]),
            'timestamp': datetime.now().isoformat()
        }
        
        return int(predictions[0]), float(probabilities[0]), details
    
    def evaluate(self, df: pd.DataFrame) -> Dict:
        """
        Evaluate model on test data.
        
        Args:
            df: DataFrame with transaction data (must include 'is_fraud' column)
            
        Returns:
            Dictionary with evaluation metrics
        """
        if 'is_fraud' not in df.columns:
            raise ValueError("Test data must include 'is_fraud' column")
        
        predictions, probabilities, df_processed = self.predict(df)
        y_true = df['is_fraud'].values
        
        # Calculate metrics
        true_positives = np.sum((predictions == 1) & (y_true == 1))
        false_positives = np.sum((predictions == 1) & (y_true == 0))
        false_negatives = np.sum((predictions == 0) & (y_true == 1))
        true_negatives = np.sum((predictions == 0) & (y_true == 0))
        
        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
        F1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        accuracy = (true_positives + true_negatives) / len(y_true)
        
        metrics = {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'F1': F1,
            'true_positives': int(true_positives),
            'false_positives': int(false_positives),
            'true_negatives': int(true_negatives),
            'false_negatives': int(false_negatives),
            'n_samples': len(df)
        }
        
        return metrics
    
    def save_model(self, filepath: str):
        """
        Save trained model to file.
        
        Args:
            filepath: Path to save model
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before saving")
        
        model_data = {
            'mean_values': self.mean_values,
            'covariance_matrix': self.covariance_matrix,
            'threshold': self.threshold,
            'normalization_mean': self.normalization_mean,
            'normalization_std': self.normalization_std,
            'encoders': self.encoders,
            'training_columns': self.training_columns,
            'feature_columns': self.feature_columns,
            'metrics': self.metrics,
            'is_trained': self.is_trained
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath: str):
        """
        Load trained model from file.
        
        Args:
            filepath: Path to load model from
        """
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        self.mean_values = model_data['mean_values']
        self.covariance_matrix = model_data['covariance_matrix']
        self.threshold = model_data['threshold']
        self.normalization_mean = model_data['normalization_mean']
        self.normalization_std = model_data['normalization_std']
        self.encoders = model_data.get('encoders', None)  # Backward compatibility
        self.training_columns = model_data.get('training_columns', None)  # Backward compatibility
        self.feature_columns = model_data['feature_columns']
        self.metrics = model_data['metrics']
        self.is_trained = model_data['is_trained']
        
        print(f"Model loaded from {filepath}")
        print(f"Model metrics: F1={self.metrics.get('F1', 'N/A'):.4f}, "
              f"Precision={self.metrics.get('precision', 'N/A'):.4f}, "
              f"Recall={self.metrics.get('recall', 'N/A'):.4f}")
    
    def get_model_info(self) -> Dict:
        """
        Get information about the trained model.
        
        Returns:
            Dictionary with model information
        """
        return {
            'is_trained': self.is_trained,
            'n_features': len(self.feature_columns),
            'feature_columns': self.feature_columns,
            'threshold': float(self.threshold) if self.threshold is not None else None,
            'metrics': self.metrics
        }

