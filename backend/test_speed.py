#!/usr/bin/env python3
"""
Quick performance test for transaction processing
"""
import requests
import time
import json

# Test transaction data
test_transaction = {
    "trans_num": f"TEST_{int(time.time() * 1000)}",
    "amt": 123.45,
    "merchant": "Test Merchant",
    "category": "test",
    "trans_date": "2025-10-26",
    "trans_time": "10:00:00",
    "unix_time": int(time.time()),
    "first": "Test",
    "last": "User",
    "cc_num": "1234567890123456",
    "lat": 40.7128,
    "long": -74.0060,
    "merch_lat": 40.7580,
    "merch_long": -73.9855
}

print("🚀 Testing transaction processing speed...")
print("=" * 60)

# Test 10 transactions and measure time
times = []
for i in range(10):
    test_transaction['trans_num'] = f"TEST_{int(time.time() * 1000000)}_{i}"
    
    start = time.time()
    response = requests.post(
        'http://localhost:5050/api/transactions/process',
        json=test_transaction,
        headers={'Content-Type': 'application/json'}
    )
    end = time.time()
    
    elapsed = (end - start) * 1000  # Convert to ms
    times.append(elapsed)
    
    status = "✅" if response.status_code in [200, 201] else "❌"
    print(f"{status} Transaction {i+1}: {elapsed:.2f}ms - Status: {response.status_code}")

print("=" * 60)
print(f"Average time: {sum(times)/len(times):.2f}ms")
print(f"Min time: {min(times):.2f}ms")
print(f"Max time: {max(times):.2f}ms")
print(f"Total time: {sum(times):.2f}ms for {len(times)} transactions")
print(f"Throughput: {len(times)/(sum(times)/1000):.2f} transactions/second")

