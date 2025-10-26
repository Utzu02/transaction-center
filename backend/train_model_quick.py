#!/usr/bin/env python3
"""
Quick script to train a fraud detection model
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from fraud_detector import FraudDetector

# Create synthetic training data
np.random.seed(42)
n_samples = 1000

# Generate features
from datetime import datetime, timedelta
categories = ['grocery_pos', 'gas_transport', 'misc_net', 'shopping_net', 'shopping_pos']
start_date = datetime(2023, 1, 1)

data = {
    'amt': np.random.exponential(scale=100, size=n_samples),
    'lat': np.random.uniform(25, 50, n_samples),
    'long': np.random.uniform(-125, -65, n_samples),
    'merch_lat': np.random.uniform(25, 50, n_samples),
    'merch_long': np.random.uniform(-125, -65, n_samples),
    'city_pop': np.random.randint(1000, 1000000, n_samples),
    'unix_time': np.random.randint(1600000000, 1700000000, n_samples),
    'category': np.random.choice(categories, n_samples),
    'trans_date': [(start_date + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(n_samples)],
    'trans_time': [f"{np.random.randint(0,24):02d}:{np.random.randint(0,60):02d}:{np.random.randint(0,60):02d}" for _ in range(n_samples)],
    'merchant': [f'merchant_{i%100}' for i in range(n_samples)],
    'is_fraud': np.random.binomial(1, 0.1, n_samples)  # 10% fraud
}

# Add more fraud indicators
for i in range(n_samples):
    if data['is_fraud'][i] == 1:
        # Make fraud more likely for high amounts
        if np.random.random() > 0.5:
            data['amt'][i] *= 5
        # Make fraud more likely for unusual distances
        if np.random.random() > 0.5:
            data['merch_lat'][i] += np.random.uniform(5, 15)
            data['merch_long'][i] += np.random.uniform(5, 15)

df = pd.DataFrame(data)

print("🔧 Training fraud detection model...")
print(f"   Training samples: {len(df)}")
print(f"   Fraud rate: {df['is_fraud'].mean():.1%}")

# Create and train detector
detector = FraudDetector()
result = detector.train(df)

# Save model
detector.save_model('fraud_detector_model.pkl')
print("✅ Model trained and saved successfully!")
print(f"   Threshold: {detector.threshold:.6e}")
if 'f1' in result:
    print(f"   F1 Score: {result['f1']:.4f}")
if 'precision' in result:
    print(f"   Precision: {result['precision']:.4f}")
if 'recall' in result:
    print(f"   Recall: {result['recall']:.4f}")

