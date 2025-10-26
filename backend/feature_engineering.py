"""
Feature engineering for POS fraud detection.
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Optional, Dict
from sklearn.preprocessing import LabelEncoder


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two coordinates using Haversine formula.
    
    Args:
        lat1, lon1: First coordinate
        lat2, lon2: Second coordinate
        
    Returns:
        Distance in kilometers
    """
    R = 6371  # Earth radius in km
    
    lat1_rad = np.radians(lat1)
    lat2_rad = np.radians(lat2)
    delta_lat = np.radians(lat2 - lat1)
    delta_lon = np.radians(lon2 - lon1)
    
    a = np.sin(delta_lat/2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(delta_lon/2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
    
    distance = R * c
    return distance


def encode_categorical_features(df: pd.DataFrame, encoders: Optional[Dict] = None) -> tuple:
    """
    Convert all string/categorical columns to numeric using label encoding.
    
    Args:
        df: DataFrame with features
        encoders: Dictionary of pre-fitted encoders (for prediction)
        
    Returns:
        df_encoded: DataFrame with all numeric features
        encoders: Dictionary of encoders for reuse
    """
    df_encoded = df.copy()
    
    if encoders is None:
        encoders = {}
        is_training = True
    else:
        is_training = False
    
    # Find all object/string columns
    string_columns = df_encoded.select_dtypes(include=['object']).columns
    
    for col in string_columns:
        # Skip columns we don't want to encode
        # These are IDs or unique identifiers that don't help with prediction
        skip_columns = ['transaction_id', 'trans_num', 'ssn', 'cc_num', 'acct_num', 
                       'first', 'last', 'street', 'merchant']
        if col in skip_columns:
            # Remove ID columns, they're not useful for prediction
            df_encoded = df_encoded.drop(columns=[col], errors='ignore')
            continue
        
        if is_training:
            # Create and fit encoder
            le = LabelEncoder()
            # Handle missing values
            df_encoded[col] = df_encoded[col].fillna('MISSING').astype(str)
            
            # Ensure 'MISSING' and 'UNKNOWN' are in classes for future predictions
            unique_values = list(df_encoded[col].unique())
            if 'MISSING' not in unique_values:
                unique_values.append('MISSING')
            if 'UNKNOWN' not in unique_values:
                unique_values.append('UNKNOWN')
            
            # Fit encoder with all possible values
            le.fit(unique_values)
            df_encoded[col] = le.transform(df_encoded[col])
            encoders[col] = le
        else:
            # Use existing encoder
            if col in encoders:
                df_encoded[col] = df_encoded[col].fillna('MISSING').astype(str)
                # Handle unseen categories by mapping them to 'UNKNOWN'
                known_values = set(encoders[col].classes_)
                df_encoded[col] = df_encoded[col].apply(
                    lambda x: x if x in known_values else 'UNKNOWN'
                )
                df_encoded[col] = encoders[col].transform(df_encoded[col])
            else:
                # Drop unknown columns
                df_encoded = df_encoded.drop(columns=[col], errors='ignore')
    
    return df_encoded, encoders


def extract_features(df: pd.DataFrame, n_samples: Optional[int] = None, encoders: Optional[Dict] = None) -> tuple:
    """
    Extract relevant features from POS transaction data for fraud detection.
    ALL FEATURES ARE CONVERTED TO NUMERIC.
    
    Args:
        df: DataFrame with transaction data
        n_samples: Optional limit on number of samples to process
        encoders: Pre-fitted encoders for prediction (None for training)
        
    Returns:
        df_features: DataFrame with all numeric engineered features
        encoders: Dictionary of encoders for categorical features
    """
    if n_samples is not None and n_samples < len(df):
        df = df.head(n_samples).copy()
    else:
        df = df.copy()
    
    # Ensure required columns exist
    required_cols = ['trans_date', 'trans_time', 'amt', 'lat', 'long', 'merch_lat', 'merch_long']
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")
    
    # Parse datetime
    if 'unix_time' not in df.columns:
        try:
            df['unix_time'] = pd.to_datetime(df['trans_date'] + ' ' + df['trans_time']).astype(np.int64) // 10**9
        except:
            df['unix_time'] = pd.to_datetime(df['trans_date']).astype(np.int64) // 10**9
    
    # Transaction amount features
    df['amt_log'] = df['amt']  # Log transform to handle skewness
    
    # Distance between customer and merchant
    df['distance'] = df.apply(
        lambda row: calculate_distance(row['lat'], row['long'], row['merch_lat'], row['merch_long']),
        axis=1
    )
    
    # Time features
    try:
        df['hour'] = pd.to_datetime(df['trans_time'], format='%H:%M:%S').dt.hour
    except:
        df['hour'] = 12  # Default to noon if parsing fails
    
    df['day_of_week'] = pd.to_datetime(df['trans_date']).dt.dayofweek
    
    # Night transactions (higher fraud risk)
    df['is_night'] = ((df['hour'] >= 22) | (df['hour'] <= 5)).astype(int)
    
    # Weekend transactions
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    
    # Age calculation (if dob is available)
    if 'dob' in df.columns:
        try:
            df['age'] = (pd.to_datetime(df['trans_date']) - pd.to_datetime(df['dob'])).dt.days / 365.25
        except:
            df['age'] = 35.0  # Default age if parsing fails
    
    # City population (log transform + cap outliers)
    if 'city_pop' in df.columns:
        # Cap extreme values to 99th percentile to avoid outliers
        cap_value = np.percentile(df['city_pop'], 99)
        df['city_pop_capped'] = np.minimum(df['city_pop'], cap_value)
        df['city_pop_log'] = np.log1p(df['city_pop_capped'])
    
    # Encode ALL categorical/string features to numeric
    df, encoders = encode_categorical_features(df, encoders)
    
    return df, encoders


def get_feature_columns() -> List[str]:
    """
    Get list of numerical features to use for anomaly detection.
    
    Returns:
        List of feature column names
    """
    base_features = [
        'amt',
        'amt_log',
        'distance',
        'hour',
        'day_of_week',
        'is_night',
        'is_weekend',
    ]
    
    optional_features = [
        'gender_encoded',
        'age',
        'city_pop_log',
        'lat',
        'long',
        'merch_lat',
        'merch_long',
    ]
    
    return base_features + optional_features


def prepare_features_for_model(df: pd.DataFrame, feature_columns: Optional[List[str]] = None) -> np.ndarray:
    """
    Prepare feature matrix for anomaly detection model.
    ALL FEATURES ARE NUMERIC (strings already encoded).
    
    Args:
        df: DataFrame with engineered features
        feature_columns: List of columns to use (if None, use safe aggregated features)
        
    Returns:
        Numpy array with features (m x n)
    """
    # CRITICAL: Exclude overly specific features that cause overfitting
    # These features are either IDs or have too many unique values
    exclude_cols = [
        # IDs and target
        'is_fraud', 'cc_num', 'acct_num', 'ssn', 'unix_time', 'zip',
        # Overly specific categorical (too many classes → overfitting)
        'city', 'job', 'dob', 'trans_time', 'trans_date',
        # Overly specific coordinates (almost unique → overfitting)
        'lat', 'long', 'merch_lat', 'merch_long',
        # Raw values (use log versions instead)
        'city_pop', 'city_pop_capped', 'amt',
    ]
    
    if feature_columns is None:
        # Use SAFE aggregated numeric columns (not overly specific)
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        available_features = [col for col in numeric_cols if col not in exclude_cols]
    else:
        # Use specified columns, but still exclude dangerous ones
        available_features = [col for col in feature_columns if col in df.columns and col not in exclude_cols]
    
    if len(available_features) == 0:
        raise ValueError("No numeric features found in dataframe")
    
    # Get feature matrix
    X = df[available_features].values
    
    # Handle NaN values (replace with column mean)
    col_mean = np.nanmean(X, axis=0)
    inds = np.where(np.isnan(X))
    if len(inds[0]) > 0:
        X[inds] = np.take(col_mean, inds[1])
    
    return X


def add_temporal_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add temporal aggregation features (requires sorted by time).
    
    Args:
        df: DataFrame sorted by transaction time
        
    Returns:
        DataFrame with additional temporal features
    """
    df = df.copy()
    
    # Sort by customer and time if ssn/acct_num available
    if 'ssn' in df.columns:
        df = df.sort_values(['ssn', 'unix_time'])
        
        # Transaction frequency features (per customer)
        df['trans_count'] = df.groupby('ssn').cumcount() + 1
        
        # Time since last transaction (in hours)
        df['time_diff'] = df.groupby('ssn')['unix_time'].diff() / 3600
        df['time_diff'] = df['time_diff'].fillna(0)
        
        # Amount deviation from user's average
        df['user_avg_amt'] = df.groupby('ssn')['amt'].transform(lambda x: x.expanding().mean())
        df['amt_deviation'] = df['amt'] - df['user_avg_amt']
    
    return df


def normalize_features(X: np.ndarray) -> tuple:
    """
    Normalize features using z-score normalization.
    
    Args:
        X: Feature matrix
        
    Returns:
        Normalized feature matrix, mean, std
    """
    mean = np.mean(X, axis=0)
    std = np.std(X, axis=0)
    
    # Avoid division by zero
    std[std == 0] = 1
    
    X_normalized = (X - mean) / std
    
    return X_normalized, mean, std

