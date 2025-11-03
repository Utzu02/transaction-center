#!/usr/bin/env python3
"""
LIVE FRAUD DETECTION - Real-time processing and sending to frontend
Integrates trained fraud detector with live transaction stream.
NOW WITH ADAPTIVE THRESHOLD - mai fin și mai precis! 🎯
"""

import json
import requests
import urllib3
import threading
import time
from sseclient import SSEClient
from fraud_detector import FraudDetector
from adaptive_detector import AdaptiveFraudDetector, format_confidence
import pandas as pd
import numpy as np
from collections import deque
import sys
import os
from dotenv import load_dotenv

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv()

# ============================================================================
# CONFIGURATION - UPDATE THESE!
# ============================================================================
# Stream configuration (optional - if you have a stream)
STREAM_URL = os.getenv('STREAM_URL', 'https://95.217.75.14:8443/stream')
HACKATHON_API_KEY = os.getenv('HACKATHON_API_KEY', '')

# Backend configuration (where to send processed transactions)
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5050')
BACKEND_PROCESS_URL = f"{BACKEND_URL}/api/transactions/process"

MODEL_PATH = os.getenv('MODEL_PATH', 'fraud_detector_model.pkl')

# ============================================================================
# GLOBAL STATE
# ============================================================================
detector = None  # Will be AdaptiveFraudDetector
stats = {
    'total_processed': 0,
    'fraud_detected': 0,
    'legitimate': 0,
    'errors': 0,
    'timeouts': 0,
    'avg_processing_time': 0,
    'start_time': time.time(),
    'min_probability': float('inf'),
    'max_probability': 0,
    'sum_probability': 0
}
recent_transactions = deque(maxlen=100)
lock = threading.Lock()

# ============================================================================
# ADAPTIVE CONFIGURATION
# ============================================================================
# 🎯 TARGET FRAUD RATE - Ajustează asta pentru mai multe/puține detecții!
# 0.10 = 10% fraud (mai puțin)
# 0.15 = 15% fraud (balanced)
# 0.25 = 25% fraud (mai mult) ← PENTRU MAI MULT FRAUD
# 0.35 = 35% fraud (foarte mult)
TARGET_FRAUD_RATE = 0.22  # ← CRESCUT pentru mai mult fraud detectat!

# Minim confidence pentru a flaga (0-1)
# 0.0 = TOATE tranzacțiile (maxim fraud detectat)
# 0.15 = aproape toate (foarte mult fraud detectat) ← SETAT
# 0.3 = și tranzacții incerte (mai mult fraud detectat)
# 0.5 = doar tranzacții confident (mai puțin fraud, dar mai precis)
MIN_CONFIDENCE = 0.55  # ← Acceptă tranzacții cu confidence >= 0.15

# ============================================================================
# SETUP
# ============================================================================
stream_headers = {"X-API-Key": HACKATHON_API_KEY} if HACKATHON_API_KEY else {}
backend_headers = {"Content-Type": "application/json"}

def load_fraud_detector():
    """Load the trained fraud detection model with ADAPTIVE threshold."""
    global detector
    try:
        print("🔧 Loading fraud detection model...")
        base_detector = FraudDetector()
        base_detector.load_model(MODEL_PATH)
        
        # 🎯 BOOST THRESHOLD pentru mai mult fraud detectat!
        # Threshold mai MARE → Mai multe probabilități sunt sub el → Mai mult FRAUD
        original_threshold = base_detector.threshold
        THRESHOLD_BOOST = 10  # ← CREȘTE asta pentru MAI MULT fraud (10x, 50x, 100x)
        
        base_detector.threshold = original_threshold * THRESHOLD_BOOST
        
        print(f"   Original threshold: {original_threshold:.6e}")
        print(f"   🚀 BOOSTED threshold: {base_detector.threshold:.6e} ({THRESHOLD_BOOST}x)")
        print(f"   → Tranzacțiile care erau la limită acum devin FRAUD!")
        
        # 🎯 WRAP cu AdaptiveFraudDetector pentru auto-calibrare!
        detector = AdaptiveFraudDetector(
            base_detector=base_detector,
            calibration_size=50,  # Calibrează după primele 50 tranzacții
            target_fraud_rate=TARGET_FRAUD_RATE
        )
        
        print("✅ Model loaded successfully!")
        print(f"   Features: {base_detector.metrics.get('n_features', 'N/A')}")
        print(f"   Training F1: {base_detector.metrics.get('F1', 0):.4f}")
        print(f"   🎯 TARGET fraud rate: {TARGET_FRAUD_RATE*100:.0f}% (auto-adjusted)")
        print(f"   🔒 MIN confidence: {MIN_CONFIDENCE:.1f} (higher = more precise)")
        print()
        print("📊 System will CALIBRATE automatically after 50 transactions!")
        print("   Threshold will adjust to achieve target fraud rate.")
        print()
        return True
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        print(f"   Make sure '{MODEL_PATH}' exists!")
        return False

def send_to_backend(transaction_data):
    """
    Send processed transaction to backend API
    
    Args:
        transaction_data: Dictionary with transaction data and fraud detection results
        
    Returns:
        Response from the backend or None on error
    """
    try:
        response = requests.post(
            BACKEND_PROCESS_URL, 
            headers=backend_headers, 
            json=transaction_data, 
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        print(f"⏱️  Timeout while sending to backend")
        with lock:
            stats['timeouts'] += 1
        return None
    except requests.exceptions.RequestException as e:
        print(f"❌ Error sending to backend: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing backend response: {e}")
        return None

def process_transaction(transaction):
    """
    Process and flag a single transaction using fraud detection model.
    """
    start_time = time.time()
    trans_num = transaction.get('trans_num', 'unknown')
    
    try:
        # Extract all available fields
        trans_data = {
            'ssn': transaction.get('ssn'),
            'cc_num': transaction.get('cc_num'),
            'first': transaction.get('first'),
            'last': transaction.get('last'),
            'gender': transaction.get('gender'),
            'street': transaction.get('street'),
            'city': transaction.get('city'),
            'state': transaction.get('state'),
            'zip': transaction.get('zip'),
            'lat': float(transaction.get('lat', 0)),
            'long': float(transaction.get('long', 0)),
            'city_pop': int(transaction.get('city_pop', 0)),
            'job': transaction.get('job'),
            'dob': transaction.get('dob'),
            'acct_num': transaction.get('acct_num'),
            'trans_num': trans_num,
            'trans_date': transaction.get('trans_date'),
            'trans_time': transaction.get('trans_time'),
            'unix_time': int(transaction.get('unix_time', 0)),
            'category': transaction.get('category'),
            'amt': float(transaction.get('amt', 0)),
            'merchant': transaction.get('merchant'),
            'merch_lat': float(transaction.get('merch_lat', 0)),
            'merch_long': float(transaction.get('merch_long', 0))
        }
        
        # Create DataFrame for prediction
        df_trans = pd.DataFrame([trans_data])
        
        # Make prediction with confidence using ADAPTIVE detector
        predictions, probabilities, confidences, fraud_rate = detector.predict_with_confidence(df_trans)
        
        prediction = predictions[0]
        probability = probabilities[0]
        confidence = confidences[0]
        
        # 🎯 Decision: Flag only if confident enough!
        should_flag_it = detector.should_flag(probability, confidence, min_confidence=MIN_CONFIDENCE)
        is_fraud = 1 if should_flag_it else 0
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Calculate distance between customer and merchant (if coordinates available)
        from math import radians, cos, sin, asin, sqrt
        distance = None
        if trans_data['lat'] and trans_data['long'] and trans_data['merch_lat'] and trans_data['merch_long']:
            try:
                # Haversine formula for distance in km
                lat1, lon1 = radians(trans_data['lat']), radians(trans_data['long'])
                lat2, lon2 = radians(trans_data['merch_lat']), radians(trans_data['merch_long'])
                dlat = lat2 - lat1
                dlon = lon2 - lon1
                a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                c = 2 * asin(sqrt(a))
                distance = 6371 * c  # Earth radius in km
            except:
                pass
        
        # Determine fraud pattern based on category and conditions
        pattern = None
        if is_fraud:
            if distance and distance > 100:
                pattern = f"Unusual distance ({distance:.0f}km from home)"
            elif trans_data['amt'] > 500:
                pattern = "High-value transaction"
            elif trans_data['category'] in ['gas_transport', 'shopping_net']:
                pattern = f"Suspicious {trans_data['category']} activity"
            else:
                pattern = "Anomalous behavior pattern"
        
        # Prepare data to send to backend
        backend_data = {
            **trans_data,  # Include all transaction fields
            'is_fraud': bool(is_fraud),
            'isFraud': bool(is_fraud),  # Add both for frontend consistency
            'fraud_probability': float(probability),
            'confidence': float(confidence),
            'processing_time': float(processing_time),
            'distance': float(distance) if distance else None,
            'pattern': pattern,
            # Risk score based on fraud probability (0-100 scale)
            # For fraud: use confidence (how sure we are) * 100
            # For non-fraud: use probability (how close to fraud threshold) * 100
            'risk_score': int(confidence * 100) if is_fraud else int(probability * 100),
            'status': 'blocked' if is_fraud else 'accepted'  # Match backend status values
        }
        
        # Send to backend
        result = send_to_backend(backend_data)
        
        # Update statistics
        with lock:
            stats['total_processed'] += 1
            if is_fraud == 1:
                stats['fraud_detected'] += 1
            else:
                stats['legitimate'] += 1
            
            # Update average processing time
            n = stats['total_processed']
            stats['avg_processing_time'] = (stats['avg_processing_time'] * (n-1) + processing_time) / n
            
            # Track probability distribution
            stats['min_probability'] = min(stats['min_probability'], probability)
            stats['max_probability'] = max(stats['max_probability'], probability)
            stats['sum_probability'] += probability
            
            # Store recent transaction
            recent_transactions.append({
                'trans_num': trans_num,
                'amount': trans_data['amt'],
                'category': trans_data['category'],
                'prediction': is_fraud,
                'probability': probability,
                'processing_time': processing_time,
                'result': result
            })
        
        # Log output
        fraud_emoji = "🚨 FRAUD" if is_fraud == 1 else "✅ OK"
        prob_vs_threshold = "BELOW" if probability < detector.adaptive_threshold else "ABOVE"
        confidence_str = format_confidence(confidence)
        
        print(f"\n[{stats['total_processed']}] {fraud_emoji}")
        print(f"  Trans: {trans_num}")
        print(f"  Amount: ${trans_data['amt']:.2f} | Category: {trans_data['category']}")
        print(f"  Merchant: {trans_data['merchant']}")
        print(f"  Probability: {probability:.6e} ({prob_vs_threshold} threshold)")
        print(f"  Confidence:  {confidence_str}")
        print(f"  Threshold:   {detector.adaptive_threshold:.6e}")
        if detector.is_calibrated:
            print(f"  Fraud rate:  {fraud_rate:.1%} (target: {TARGET_FRAUD_RATE:.0%})")
        print(f"  Processing: {processing_time:.3f}s | Flag result: {result}")
        
        # Warning if too slow
        if processing_time > 25:
            print(f"  ⚠️  WARNING: Processing took {processing_time:.1f}s (close to 30s limit!)")
        
        print("-" * 80)
        
    except Exception as e:
        print(f"❌ Error processing transaction {trans_num}: {e}")
        import traceback
        traceback.print_exc()
        with lock:
            stats['errors'] += 1

def print_statistics():
    """Print current statistics with ADAPTIVE info."""
    with lock:
        runtime = time.time() - stats['start_time']
        rate = stats['total_processed'] / runtime if runtime > 0 else 0
        avg_prob = stats['sum_probability'] / max(1, stats['total_processed'])
        
        # Get adaptive statistics
        adaptive_stats = detector.get_statistics()
        
        print("\n" + "="*80)
        print("📊 STATISTICS (ADAPTIVE MODE)")
        print("="*80)
        print(f"  Total processed:    {stats['total_processed']:,}")
        print(f"  Fraud detected:     {stats['fraud_detected']:,} ({stats['fraud_detected']/max(1,stats['total_processed'])*100:.1f}%)")
        print(f"  Legitimate:         {stats['legitimate']:,}")
        print(f"  Errors:             {stats['errors']}")
        print(f"  Timeouts:           {stats['timeouts']}")
        print(f"  Avg processing:     {stats['avg_processing_time']:.3f}s")
        print(f"  Runtime:            {runtime:.1f}s")
        print(f"  Processing rate:    {rate:.2f} trans/sec")
        print()
        print(f"  🎯 ADAPTIVE THRESHOLD:")
        print(f"     Original:  {adaptive_stats['original_threshold']:.6e}")
        print(f"     Current:   {adaptive_stats['adaptive_threshold']:.6e} ({adaptive_stats['threshold_multiplier']:.1f}x)")
        print(f"     Target fraud rate: {TARGET_FRAUD_RATE:.0%}")
        print(f"     Actual fraud rate: {adaptive_stats['fraud_rate']:.1%}")
        print(f"     Calibrated: {'✅ YES' if adaptive_stats['is_calibrated'] else '❌ NO (need more data)'}")
        print()
        print(f"  📈 Probability Distribution:")
        print(f"     Min:       {stats['min_probability']:.6e}")
        print(f"     Average:   {avg_prob:.6e}")
        print(f"     Max:       {stats['max_probability']:.6e}")
        
        # Adaptive recommendations
        fraud_rate_actual = stats['fraud_detected']/max(1,stats['total_processed'])
        if abs(fraud_rate_actual - TARGET_FRAUD_RATE) > 0.1 and adaptive_stats['is_calibrated']:
            print(f"\n  💡 RECOMMENDATION:")
            if fraud_rate_actual > TARGET_FRAUD_RATE + 0.1:
                print(f"     Fraud rate ({fraud_rate_actual:.0%}) is above target ({TARGET_FRAUD_RATE:.0%})")
                print(f"     → Increase MIN_CONFIDENCE to {MIN_CONFIDENCE + 0.1:.1f} for more precision")
                print(f"     → Or decrease TARGET_FRAUD_RATE to {TARGET_FRAUD_RATE - 0.05:.2f}")
            else:
                print(f"     Fraud rate ({fraud_rate_actual:.0%}) is below target ({TARGET_FRAUD_RATE:.0%})")
                print(f"     → Decrease MIN_CONFIDENCE to {max(0.1, MIN_CONFIDENCE - 0.1):.1f} for more detections")
                print(f"     → Or increase TARGET_FRAUD_RATE to {TARGET_FRAUD_RATE + 0.05:.2f}")
        
        print("="*80 + "\n")

def statistics_thread():
    """Thread that prints statistics every 60 seconds."""
    while True:
        time.sleep(60)
        print_statistics()

def main():
    """Main entry point."""
    print("="*80)
    print(" "*20 + "LIVE FRAUD DETECTION")
    print("="*80)
    print()
    
    # Load model
    if not load_fraud_detector():
        print("❌ Cannot continue without model!")
        sys.exit(1)
    
    print()
    print("🌐 Configuration:")
    print(f"  Stream URL:  {STREAM_URL}")
    print(f"  Backend URL: {BACKEND_PROCESS_URL}")
    print(f"  Model:       {MODEL_PATH}")
    if HACKATHON_API_KEY:
        print(f"  Stream API Key: {HACKATHON_API_KEY[:8]}...")
    print()
    
    # Start statistics thread
    stat_thread = threading.Thread(target=statistics_thread, daemon=True)
    stat_thread.start()
    
    # Connect to stream
    try:
        print("🔌 Connecting to stream...")
        response = requests.get(STREAM_URL, headers=stream_headers, stream=True, verify=False)
        response.raise_for_status()
        client = SSEClient(response)
        print("✅ Connected to stream! Waiting for transactions...\n")
        print("-" * 80)
        
        # Process incoming events
        for event in client.events():
            try:
                if event.data:
                    transaction = json.loads(event.data)
                    
                    # Process transaction in a separate thread
                    thread = threading.Thread(target=process_transaction, args=(transaction,))
                    thread.start()
                    
            except json.JSONDecodeError as e:
                print(f"❌ Error parsing transaction: {e}")
            except Exception as e:
                print(f"❌ Error handling event: {e}")
                
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")
    except KeyboardInterrupt:
        print("\n\n🛑 Stopped by user.")
        print_statistics()
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print("\n👋 Shutting down...")
        print_statistics()

if __name__ == '__main__':
    main()

