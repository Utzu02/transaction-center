#!/usr/bin/env python3
"""
Test fraud detection via API
"""
import requests
import json
import time

# Test transaction with fraud indicators
fraud_transaction = {
    "trans_num": f"FRAUD_TEST_{int(time.time() * 1000)}",
    "amt": 1500.00,  # High amount
    "merchant": "fraud_Suspicious_Shop",
    "category": "shopping_net",  # Risky category
    "trans_date": "2025-10-26",
    "trans_time": "02:30:00",  # Late night
    "unix_time": int(time.time()),
    "first": "John",
    "last": "Doe",
    "cc_num": "1234567890123456",
    "lat": 40.7128,
    "long": -74.0060,
    "merch_lat": 45.0,  # Far from customer
    "merch_long": -100.0,
    "city_pop": 100000,
    "ssn": "123456789",
    "acct_num": "ACC123",
    "gender": "M",
    "dob": "1990-01-01",
    "job": "Engineer",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001"
}

# Legitimate transaction
legit_transaction = {
    "trans_num": f"LEGIT_TEST_{int(time.time() * 1000)}",
    "amt": 25.50,  # Small amount
    "merchant": "Local_Coffee_Shop",
    "category": "food_dining",  # Normal category
    "trans_date": "2025-10-26",
    "trans_time": "10:30:00",  # Normal time
    "unix_time": int(time.time()),
    "first": "Jane",
    "last": "Smith",
    "cc_num": "9876543210987654",
    "lat": 40.7580,
    "long": -73.9855,
    "merch_lat": 40.7600,  # Close to customer
    "merch_long": -73.9800,
    "city_pop": 500000,
    "ssn": "987654321",
    "acct_num": "ACC456",
    "gender": "F",
    "dob": "1995-05-15",
    "job": "Teacher",
    "street": "456 Park Ave",
    "city": "New York",
    "state": "NY",
    "zip": "10002"
}

print("🧪 Testing Fraud Detection API")
print("=" * 70)

# Test fraud transaction
print("\n1️⃣ Testing FRAUD transaction (high amount, suspicious)...")
response = requests.post(
    'http://localhost:5050/api/transactions/process',
    json=fraud_transaction,
    headers={'Content-Type': 'application/json'}
)
print(f"   Status: {response.status_code}")
if response.ok:
    result = response.json()
    print(f"   ✅ Transaction saved: {result.get('trans_num')}")
    print(f"   🎯 Fraud detected: {result.get('fraud_detected', False)}")
else:
    print(f"   ❌ Error: {response.text}")

# Test legitimate transaction
print("\n2️⃣ Testing LEGITIMATE transaction (small amount, normal)...")
response = requests.post(
    'http://localhost:5050/api/transactions/process',
    json=legit_transaction,
    headers={'Content-Type': 'application/json'}
)
print(f"   Status: {response.status_code}")
if response.ok:
    result = response.json()
    print(f"   ✅ Transaction saved: {result.get('trans_num')}")
    print(f"   🎯 Fraud detected: {result.get('fraud_detected', False)}")
else:
    print(f"   ❌ Error: {response.text}")

print("\n" + "=" * 70)
print("✅ Test complete! Check database for results.")

