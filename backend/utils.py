"""
Utility functions for data loading and preprocessing.
"""

import pandas as pd
import numpy as np
from typing import Tuple, Optional


def load_csv_data(filepath: str, n_samples: Optional[int] = None) -> pd.DataFrame:
    """
    Load transaction data from CSV file.
    
    Args:
        filepath: Path to CSV file
        n_samples: Optional limit on number of rows to load
        
    Returns:
        DataFrame with transaction data
    """
    # Try comma separator first, then pipe, then whitespace if it fails
    try:
        if n_samples is not None:
            df = pd.read_csv(filepath, nrows=n_samples)
        else:
            df = pd.read_csv(filepath)
    except:
        # Try with pipe separator
        try:
            if n_samples is not None:
                df = pd.read_csv(filepath, sep='|', nrows=n_samples)
            else:
                df = pd.read_csv(filepath, sep='|')
        except:
            # Try with whitespace separator
            if n_samples is not None:
                df = pd.read_csv(filepath, sep=r'\s+', engine='python', nrows=n_samples)
            else:
                df = pd.read_csv(filepath, sep=r'\s+', engine='python')
    
    return df


def split_train_val_test(df: pd.DataFrame, 
                         train_ratio: float = 0.7,
                         val_ratio: float = 0.15,
                         test_ratio: float = 0.15,
                         shuffle: bool = False,
                         random_state: int = 42) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Split data into train, validation, and test sets.
    
    Args:
        df: Input DataFrame
        train_ratio: Ratio for training set
        val_ratio: Ratio for validation set
        test_ratio: Ratio for test set
        shuffle: Whether to shuffle data before splitting
        random_state: Random seed for shuffling
        
    Returns:
        train_df, val_df, test_df
    """
    assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-6, "Ratios must sum to 1"
    
    if shuffle:
        df = df.sample(frac=1, random_state=random_state).reset_index(drop=True)
    
    n = len(df)
    train_end = int(n * train_ratio)
    val_end = train_end + int(n * val_ratio)
    
    train_df = df[:train_end]
    val_df = df[train_end:val_end]
    test_df = df[val_end:]
    
    return train_df, val_df, test_df


def balance_dataset(df: pd.DataFrame, 
                   target_column: str = 'is_fraud',
                   method: str = 'undersample',
                   ratio: float = 1.0,
                   random_state: int = 42) -> pd.DataFrame:
    """
    Balance dataset by under/over sampling.
    
    Args:
        df: Input DataFrame
        target_column: Name of target column
        method: 'undersample' or 'oversample'
        ratio: Ratio of minority to majority class (1.0 = balanced)
        random_state: Random seed
        
    Returns:
        Balanced DataFrame
    """
    majority = df[df[target_column] == 0]
    minority = df[df[target_column] == 1]
    
    n_minority = len(minority)
    n_majority = len(majority)
    
    if method == 'undersample':
        # Reduce majority class
        n_majority_target = int(n_minority / ratio)
        majority_sampled = majority.sample(n=min(n_majority_target, n_majority), 
                                          random_state=random_state)
        balanced = pd.concat([majority_sampled, minority])
        
    elif method == 'oversample':
        # Increase minority class
        n_minority_target = int(n_majority * ratio)
        if n_minority_target > n_minority:
            minority_sampled = minority.sample(n=n_minority_target, 
                                              replace=True, 
                                              random_state=random_state)
        else:
            minority_sampled = minority
        balanced = pd.concat([majority, minority_sampled])
    else:
        raise ValueError(f"Unknown method: {method}")
    
    return balanced.sample(frac=1, random_state=random_state).reset_index(drop=True)


def check_data_quality(df: pd.DataFrame, required_columns: list = None) -> dict:
    """
    Check data quality and return report.
    
    Args:
        df: Input DataFrame
        required_columns: List of required column names
        
    Returns:
        Dictionary with quality metrics
    """
    report = {
        'n_rows': len(df),
        'n_columns': len(df.columns),
        'missing_values': {},
        'duplicate_rows': df.duplicated().sum(),
        'column_types': {},
        'missing_required_columns': []
    }
    
    # Check missing values
    for col in df.columns:
        n_missing = df[col].isna().sum()
        if n_missing > 0:
            report['missing_values'][col] = {
                'count': int(n_missing),
                'percentage': float(n_missing / len(df) * 100)
            }
    
    # Check column types
    for col in df.columns:
        report['column_types'][col] = str(df[col].dtype)
    
    # Check required columns
    if required_columns:
        for col in required_columns:
            if col not in df.columns:
                report['missing_required_columns'].append(col)
    
    return report


def print_data_summary(df: pd.DataFrame):
    """
    Print a summary of the DataFrame.
    
    Args:
        df: Input DataFrame
    """
    print("="*70)
    print("DATA SUMMARY")
    print("="*70)
    print(f"\nShape: {df.shape[0]} rows × {df.shape[1]} columns")
    
    print(f"\nColumns:")
    for col in df.columns:
        dtype = df[col].dtype
        n_missing = df[col].isna().sum()
        missing_pct = n_missing / len(df) * 100
        print(f"  {col:25s} {str(dtype):15s} {n_missing:6d} missing ({missing_pct:5.2f}%)")
    
    if 'is_fraud' in df.columns:
        print(f"\nFraud Distribution:")
        fraud_counts = df['is_fraud'].value_counts()
        total = len(df)
        print(f"  Normal: {fraud_counts.get(0, 0):6d} ({fraud_counts.get(0, 0)/total*100:5.2f}%)")
        print(f"  Fraud:  {fraud_counts.get(1, 0):6d} ({fraud_counts.get(1, 0)/total*100:5.2f}%)")
    
    if 'amt' in df.columns:
        print(f"\nAmount Statistics:")
        print(f"  Mean:   ${df['amt'].mean():10.2f}")
        print(f"  Median: ${df['amt'].median():10.2f}")
        print(f"  Std:    ${df['amt'].std():10.2f}")
        print(f"  Min:    ${df['amt'].min():10.2f}")
        print(f"  Max:    ${df['amt'].max():10.2f}")
    
    print("\n" + "="*70)


def save_predictions(df: pd.DataFrame, 
                    predictions: np.ndarray, 
                    probabilities: np.ndarray,
                    output_path: str):
    """
    Save predictions to CSV file.
    
    Args:
        df: Original DataFrame
        predictions: Binary predictions
        probabilities: Probability values
        output_path: Path to save CSV
    """
    df_out = df.copy()
    df_out['predicted_fraud'] = predictions
    df_out['fraud_probability'] = probabilities
    
    df_out.to_csv(output_path, index=False)
    print(f"Predictions saved to {output_path}")


def create_sample_data(n_samples: int = 1000, fraud_rate: float = 0.05) -> pd.DataFrame:
    """
    Create synthetic sample data for testing.
    
    Args:
        n_samples: Number of samples to generate
        fraud_rate: Proportion of fraudulent transactions
        
    Returns:
        DataFrame with synthetic transaction data
    """
    np.random.seed(42)
    
    n_fraud = int(n_samples * fraud_rate)
    n_normal = n_samples - n_fraud
    
    # Generate normal transactions
    normal_data = {
        'transaction_id': [f'TXN{i:06d}' for i in range(n_normal)],
        'trans_date': ['2024-01-15'] * n_normal,
        'trans_time': [f'{np.random.randint(6, 22):02d}:{np.random.randint(0, 60):02d}:00' 
                       for _ in range(n_normal)],
        'amt': np.random.lognormal(3, 1, n_normal),
        'lat': np.random.normal(40.7128, 0.5, n_normal),
        'long': np.random.normal(-74.0060, 0.5, n_normal),
        'merch_lat': np.random.normal(40.7128, 0.3, n_normal),
        'merch_long': np.random.normal(-74.0060, 0.3, n_normal),
        'category': np.random.choice(['grocery_pos', 'gas_transport', 'shopping_net'], n_normal),
        'gender': np.random.choice(['M', 'F'], n_normal),
        'city_pop': np.random.randint(10000, 1000000, n_normal),
        'is_fraud': [0] * n_normal
    }
    
    # Generate fraudulent transactions (different patterns)
    fraud_data = {
        'transaction_id': [f'TXN{i+n_normal:06d}' for i in range(n_fraud)],
        'trans_date': ['2024-01-15'] * n_fraud,
        'trans_time': [f'{np.random.randint(22, 24):02d}:{np.random.randint(0, 60):02d}:00' 
                       for _ in range(n_fraud)],
        'amt': np.random.lognormal(5, 1.5, n_fraud),  # Higher amounts
        'lat': np.random.normal(40.7128, 0.5, n_fraud),
        'long': np.random.normal(-74.0060, 0.5, n_fraud),
        'merch_lat': np.random.normal(40.7128, 2, n_fraud),  # Further away
        'merch_long': np.random.normal(-74.0060, 2, n_fraud),
        'category': np.random.choice(['shopping_net', 'misc_net'], n_fraud),
        'gender': np.random.choice(['M', 'F'], n_fraud),
        'city_pop': np.random.randint(10000, 1000000, n_fraud),
        'is_fraud': [1] * n_fraud
    }
    
    df_normal = pd.DataFrame(normal_data)
    df_fraud = pd.DataFrame(fraud_data)
    
    df = pd.concat([df_normal, df_fraud], ignore_index=True)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    return df


if __name__ == '__main__':
    # Create sample data
    print("Creating sample data...")
    df = create_sample_data(n_samples=1000, fraud_rate=0.05)
    
    # Print summary
    print_data_summary(df)
    
    # Save sample data
    df.to_csv('sample_transactions.csv', index=False)
    print("\nSample data saved to sample_transactions.csv")

