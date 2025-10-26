#!/usr/bin/env python3
"""
Test fraud detection to see what's wrong
"""
import pandas as pd
from fraud_detector import FraudDetector

# Load detector
print("Loading fraud detector...")
detector = FraudDetector()
detector.load_model('fraud_detector_model.pkl')
print(f"✅ Model loaded. Threshold: {detector.threshold}")

# Test transaction (should have fraud features)
test_trans = {
    'trans_num': 'TEST123',
    'amt': 1500.00,  # High amount
    'merchant': 'fraud_Test_Merchant',
    'category': 'shopping_net',
    'trans_date': '2025-10-26',
    'trans_time': '02:00:00',  # Late night
    'unix_time': 1729900000,
    'first': 'John',
    'last': 'Doe',
    'cc_num': '1234567890123456',
    'lat': 40.7128,
    'long': -74.0060,
    'merch_lat': 45.0,  # Very far
    'merch_long': -100.0,
    'city_pop': 100000
}

# Create DataFrame
df = pd.DataFrame([test_trans])

print("\n🔍 Testing fraud detection...")
print(f"Transaction: ${test_trans['amt']} at {test_trans['merchant']}")
print(f"Distance: Customer at ({test_trans['lat']}, {test_trans['long']}) vs Merchant at ({test_trans['merch_lat']}, {test_trans['merch_long']})")

try:
    # Predict
    predictions = detector.predict(df)
    probabilities = detector.predict_proba(df)
    
    print(f"\n✅ Prediction: {predictions[0]} (1=fraud, 0=legitimate)")
    print(f"   Probability: {probabilities[0]:.10e}")
    print(f"   Threshold: {detector.threshold:.10e}")
    print(f"   Is fraud? {predictions[0] == 1}")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()

