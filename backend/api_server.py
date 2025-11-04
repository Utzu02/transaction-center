#!/usr/bin/env python3
"""
Flask API Server for Fraud Detection Frontend
Provides REST endpoints for transaction data and analytics
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import importlib
from datetime import datetime, timedelta
import json

from config import config
from routes.notification_routes import notification_bp

app = Flask(__name__)
# Restrict CORS to configured origins (supports multiple comma-delimited values)
CORS(app, origins=config.CORS_ORIGINS, supports_credentials=True)

# Register notification routes so the frontend can access the full API surface.
app.register_blueprint(notification_bp)

# Global variables
detector = None
transactions_df = None
MODEL_PATH = "fraud_detector_model.pkl"

# Load model on startup
def load_model():
    global detector
    try:
        # Attempt to lazily import the heavy FraudDetector class. If the
        # environment doesn't provide heavy ML libraries (pandas, scikit-learn),
        # skip loading the model for the lightweight Vercel deployment.
        try:
            fd_module = importlib.import_module('fraud_detector')
            FraudDetector = getattr(fd_module, 'FraudDetector')
            detector = FraudDetector()
            # If the model file or heavy libs are missing, this will raise and we'll continue.
            detector.load_model(MODEL_PATH)
            print(f"✅ Model loaded: {MODEL_PATH}")
            return True
        except Exception as inner_e:
            detector = None
            print(f"ℹ️ Skipping model load (light deployment): {inner_e}")
            return False
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        detector = None
        return False

# Load sample transactions (replace with your data source)
def load_transactions():
    global transactions_df
    try:
        # For lightweight deployment, don't require pandas. Create an empty
        # placeholder list for transactions. In full deployments you can
        # replace this with DB/CSV loading using pandas.
        transactions_df = []
        print("✅ Transactions placeholder ready")
        return True
    except Exception as e:
        print(f"❌ Error loading transactions: {e}")
        return False

# ==================== HEALTH & INFO ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'model_loaded': detector is not None
    })

@app.route('/api/model/info', methods=['GET'])
def model_info():
    """Get model information"""
    if detector is None:
        return jsonify({'error': 'Model not loaded'}), 503
    
    return jsonify({
        'loaded': True,
        'metrics': detector.metrics,
        'threshold': float(detector.threshold) if detector.threshold else None
    })

# ==================== TRANSACTIONS ====================

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get all transactions with optional filters"""
    # Parse query parameters
    status = request.args.get('status', 'all')
    limit = int(request.args.get('limit', 100))
    offset = int(request.args.get('offset', 0))
    
    # Return lightweight mock data without heavy numpy/pandas dependencies
    categories = ['grocery_pos', 'gas_transport', 'shopping_net']
    mock_transactions = []
    for i in range(limit):
        mock_transactions.append({
            'id': f'txn-{i}',
            'customer': f'Customer {i}',
            'merchant': f'Merchant {i % 10}',
            'amount': f'${random.uniform(10, 500):.2f}',
            'status': 'completed' if i % 5 != 0 else 'blocked',
            'riskScore': int(random.uniform(0, 100)),
            'date': (datetime.now() - timedelta(hours=i)).isoformat(),
            'category': random.choice(categories),
            'location': f'City {i % 20}, ST'
        })
    
    # Filter by status
    if status != 'all':
        mock_transactions = [t for t in mock_transactions if t['status'] == status]
    
    return jsonify({
        'transactions': mock_transactions[offset:offset+limit],
        'total': len(mock_transactions),
        'limit': limit,
        'offset': offset
    })

@app.route('/api/transactions/<transaction_id>', methods=['GET'])
def get_transaction(transaction_id):
    """Get a single transaction by ID"""
    # TODO: Fetch from your database
    return jsonify({
        'id': transaction_id,
        'customer': 'John Doe',
        'merchant': 'Acme Corp',
        'amount': '$125.50',
        'status': 'completed',
        'riskScore': 45,
        'date': datetime.now().isoformat()
    })

@app.route('/api/transactions/recent', methods=['GET'])
def get_recent_transactions():
    """Get recent transactions"""
    limit = int(request.args.get('limit', 10))
    return get_transactions()

# ==================== ANALYTICS ====================

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Get analytics summary"""
    return jsonify({
        'total_transactions': 12456,
        'fraud_detected': 387,
        'fraud_rate': 3.1,
        'avg_amount': 125.50,
        'total_amount': 1550000
    })

@app.route('/api/analytics/fraud-stats', methods=['GET'])
def get_fraud_stats():
    """Get fraud statistics"""
    return jsonify({
        'total_fraud': 387,
        'fraud_rate': 3.1,
        'false_positives': 12,
        'false_negatives': 5,
        'precision': 96.9,
        'recall': 98.7,
        'f1_score': 97.8
    })

@app.route('/api/analytics/fraud-patterns', methods=['GET'])
def get_fraud_patterns():
    """Get fraud patterns"""
    hours = int(request.args.get('hours', 1))
    top_n = int(request.args.get('top_n', 5))
    
    # TODO: Calculate from your data
    patterns = [
        {'pattern': 'High-Value Transaction', 'count': 45},
        {'pattern': 'Geographical Anomaly', 'count': 32},
        {'pattern': 'Unusual Time', 'count': 28},
        {'pattern': 'Online Purchase Risk', 'count': 21},
        {'pattern': 'Micro-Transaction Pattern', 'count': 15}
    ]
    
    return jsonify({'patterns': patterns[:top_n]})

@app.route('/api/analytics/age-segments', methods=['GET'])
def get_age_segments():
    """Get age segment analysis"""
    return jsonify({
        'segments': [
            {'segment': '18-24', 'fraud_count': 45, 'total': 1200},
            {'segment': '25-34', 'fraud_count': 87, 'total': 3500},
            {'segment': '35-44', 'fraud_count': 112, 'total': 4200},
            {'segment': '45-54', 'fraud_count': 78, 'total': 2800},
            {'segment': '55-64', 'fraud_count': 42, 'total': 1500},
            {'segment': '65+', 'fraud_count': 23, 'total': 800}
        ]
    })

@app.route('/api/analytics/alerts', methods=['GET'])
def get_alerts():
    """Get recent fraud alerts"""
    hours = int(request.args.get('hours', 2))
    
    return jsonify({
        'alerts': [
            {
                'id': 'alert-1',
                'title': 'Suspicious Transaction Detected',
                'description': 'Multiple failed payment attempts',
                'severity': 'high',
                'time': '2 minutes ago',
                'transactionId': 'TXN-001238',
                'amount': '$2,500.00'
            }
        ]
    })

@app.route('/api/analytics/trends', methods=['GET'])
def get_trends():
    """Get transaction trends"""
    return jsonify({
        'daily': [
            {'date': '2024-01-01', 'transactions': 1234, 'fraud': 45},
            {'date': '2024-01-02', 'transactions': 1456, 'fraud': 52},
            # ... more data
        ]
    })

# ==================== DASHBOARD ====================

@app.route('/api/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    """Get dashboard summary"""
    return jsonify({
        'total_transactions': 12456,
        'fraud_detected': 387,
        'detection_rate': 3.1,
        'avg_response_time': 0.125,
        'recent_transactions': []  # Add recent transactions here
    })

@app.route('/api/dashboard/live-stats', methods=['GET'])
def get_live_stats():
    """Get live statistics"""
    return jsonify({
        'processed': 12456,
        'fraudDetected': 387,
        'reported': 387,
        'avgResponseTime': 0.125,
        'detectionRate': 3.1
    })

# ==================== FRAUD DETECTION ====================

@app.route('/api/predict', methods=['POST'])
def predict_fraud():
    """Predict fraud for a new transaction"""
    # In this lightweight Vercel deployment we return a mock prediction if the
    # full ML model couldn't be loaded. This keeps the API usable for the UI.
    try:
        transaction = request.json or {}
        if detector is None:
            # Simple heuristic: treat amounts > 1000 as higher risk (mock)
            try:
                amount_str = str(transaction.get('amount', '')).replace('$', '')
                amount = float(amount_str) if amount_str else 0.0
            except Exception:
                amount = 0.0
            prob = 0.05 if amount < 1000 else 0.55
            is_fraud = prob > 0.5
            return jsonify({'is_fraud': bool(is_fraud), 'probability': float(prob), 'risk_score': int(100 * prob)})
        # If detector is available (rare in lightweight build), attempt prediction
        df = None
        try:
            import pandas as pd
            df = pd.DataFrame([transaction])
        except Exception:
            df = None
        if df is None:
            # fallback
            return jsonify({'error': 'Prediction not available in this lightweight deployment'}), 503
        predictions, probabilities, _ = detector.predict(df)
        return jsonify({'is_fraud': bool(predictions[0]), 'probability': float(probabilities[0]), 'risk_score': int(100 * (1 - probabilities[0]))})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/flag', methods=['POST'])
def flag_transaction():
    """Flag a transaction"""
    data = request.json
    trans_num = data.get('trans_num')
    flag_value = data.get('flag_value')
    
    # TODO: Store the flag in your database
    
    return jsonify({
        'success': True,
        'trans_num': trans_num,
        'flag_value': flag_value
    })

# ==================== MAIN ====================

if __name__ == '__main__':
    print("="*80)
    print(" "*20 + "FRAUD DETECTION API SERVER")
    print("="*80)
    print()
    
    # Load model
    if not load_model():
        print("⚠️  Warning: Model not loaded, prediction endpoints will not work")
    
    # Load transactions
    load_transactions()
    
    print()
    print("🚀 Starting server...")
    print("   API will be available at: http://localhost:5000")
    print("   Frontend should use: VITE_API_BASE_URL=http://localhost:5000")
    print()
    
    # Run server
    app.run(host='0.0.0.0', port=5000, debug=True)
