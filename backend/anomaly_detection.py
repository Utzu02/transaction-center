"""
Core anomaly detection functions for fraud detection.
Converted from MATLAB to Python.
"""

import numpy as np
from typing import Tuple, Optional


def estimate_gaussian(X: np.ndarray, n_samples: Optional[int] = None) -> Tuple[np.ndarray, np.ndarray]:
    """
    Estimate mean and covariance matrix for the Gaussian distribution.
    
    Args:
        X: Input data matrix (m x n) where m is number of samples, n is number of features
        n_samples: Optional limit on number of samples to use for estimation
        
    Returns:
        mean_values: Mean vector (1 x n)
        variances: Covariance matrix (n x n)
    """
    if n_samples is not None and n_samples < len(X):
        X = X[:n_samples]
    
    # Calculate mean
    mean_values = np.mean(X, axis=0)
    
    # Calculate covariance matrix
    variances = np.cov(X, rowvar=False)
    
    return mean_values, variances


def gaussian_distribution(X: np.ndarray, mean_value: np.ndarray, variance: np.ndarray) -> float:
    """
    Calculate probability for a single point using multivariate Gaussian distribution.
    
    Args:
        X: Single data point (1 x n)
        mean_value: Mean vector (1 x n)
        variance: Covariance matrix (n x n)
        
    Returns:
        probability: Probability value
    """
    n = len(mean_value)
    
    # Difference from mean
    difference = X - mean_value
    
    # Add regularization to avoid singular matrix
    regularization = 1e-6 * np.eye(n)
    variance_reg = variance + regularization
    
    # Inverse of covariance matrix
    inverse_variance = np.linalg.inv(variance_reg)
    
    # Exponent
    exponent = -0.5 * (difference @ inverse_variance @ difference.T)
    
    # Determinant
    determinant = np.linalg.det(variance)
    
    # Probability
    probability = (1 / np.sqrt((2 * np.pi)**n * determinant)) * np.exp(exponent)
    
    return float(probability)


def multivariate_gaussian(X: np.ndarray, mean_values: np.ndarray, variances: np.ndarray) -> np.ndarray:
    """
    Calculate probabilities for multiple points using multivariate Gaussian distribution.
    
    Args:
        X: Input data matrix (m x n)
        mean_values: Mean vector (1 x n)
        variances: Covariance matrix (n x n)
        
    Returns:
        probabilities: Array of probability values (m x 1)
    """
    m, n = X.shape
    
    # Difference from mean
    difference = X - mean_values
    
    # Add regularization to avoid singular matrix
    regularization = 1e-6 * np.eye(n)
    variances_reg = variances + regularization
    
    # Inverse of covariance matrix
    inverse_variance = np.linalg.inv(variances_reg)
    
    # Determinant
    determinant = np.linalg.det(variances)
    
    # Exponent for each sample
    exponent = -0.5 * np.sum((difference @ inverse_variance) * difference, axis=1)
    
    # Probabilities
    probabilities = (1 / np.sqrt((2 * np.pi)**n * determinant)) * np.exp(exponent)
    
    return probabilities


def check_predictions(predictions: np.ndarray, truths: np.ndarray) -> Tuple[int, int, int]:
    """
    Calculate confusion matrix metrics.
    
    Args:
        predictions: Predicted labels (0 or 1)
        truths: True labels (0 or 1)
        
    Returns:
        false_positives: Number of false positives
        false_negatives: Number of false negatives
        true_positives: Number of true positives
    """
    # False positives
    false_positives = np.sum((predictions == 1) & (truths == 0))
    
    # False negatives
    false_negatives = np.sum((predictions == 0) & (truths == 1))
    
    # True positives
    true_positives = np.sum((predictions == 1) & (truths == 1))
    
    return int(false_positives), int(false_negatives), int(true_positives)


def metrics(true_positives: int, false_positives: int, false_negatives: int) -> Tuple[float, float, float]:
    """
    Calculate precision, recall, and F1 score.
    
    Args:
        true_positives: Number of true positives
        false_positives: Number of false positives
        false_negatives: Number of false negatives
        
    Returns:
        precision: Precision score
        recall: Recall score
        F1: F1 score
    """
    # Precision
    if true_positives + false_positives == 0:
        precision = 0.0
    else:
        precision = true_positives / (true_positives + false_positives)
    
    # Recall
    if true_positives + false_negatives == 0:
        recall = 0.0
    else:
        recall = true_positives / (true_positives + false_negatives)
    
    # F1 score
    if precision + recall == 0:
        F1 = 0.0
    else:
        F1 = 2 * (precision * recall) / (precision + recall)
    
    return precision, recall, F1


def optimal_threshold(truths: np.ndarray, probabilities: np.ndarray) -> Tuple[float, float, float, float]:
    """
    Find optimal threshold using F1 score.
    
    Args:
        truths: True labels (0 or 1)
        probabilities: Probability values from Gaussian model
        
    Returns:
        best_epsilon: Optimal threshold
        best_F1: Best F1 score
        associated_precision: Precision at best threshold
        associated_recall: Recall at best threshold
    """
    best_epsilon = 0.0
    best_F1 = 0.0
    associated_precision = 0.0
    associated_recall = 0.0
    
    stepsize = (np.max(probabilities) - np.min(probabilities)) / 1000
    epsilons = np.arange(np.min(probabilities), np.max(probabilities), stepsize)
    
    for epsilon in epsilons:
        predictions = (probabilities < epsilon).astype(int)
        false_positives, false_negatives, true_positives = check_predictions(predictions, truths)
        precision, recall, F1 = metrics(true_positives, false_positives, false_negatives)
        
        if F1 > best_F1:
            best_F1 = F1
            best_epsilon = epsilon
            associated_precision = precision
            associated_recall = recall
    
    return best_epsilon, best_F1, associated_precision, associated_recall


def identify_outliers(X: np.ndarray, yval: np.ndarray, n_samples: Optional[int] = None) -> Tuple[np.ndarray, float, dict]:
    """
    Identify outliers using Gaussian anomaly detection.
    
    Args:
        X: Input data matrix (m x n)
        yval: Validation labels (0 or 1) for finding optimal threshold
        n_samples: Optional limit on number of samples to use for training
        
    Returns:
        outlier_indices: Indices of detected outliers
        epsilon: Optimal threshold
        metrics_dict: Dictionary with precision, recall, and F1 score
    """
    # Estimate Gaussian parameters
    mean_values, covariance_matrix = estimate_gaussian(X, n_samples)
    
    # Calculate probabilities
    probabilities = multivariate_gaussian(X, mean_values, covariance_matrix)
    
    # Find optimal threshold using F1 score
    epsilon, F1, precision, recall = optimal_threshold(yval, probabilities)
    
    # Identify outliers
    outlier_indices = np.where(probabilities < epsilon)[0]
    
    metrics_dict = {
        'F1': F1,
        'precision': precision,
        'recall': recall,
        'threshold': epsilon
    }
    
    return outlier_indices, epsilon, metrics_dict

