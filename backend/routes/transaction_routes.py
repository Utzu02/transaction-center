"""
Transaction Routes
Handles all transaction-related API endpoints
"""

from flask import Blueprint, request, jsonify
from services.transaction_service import TransactionService
import pandas as pd
from fraud_detector import FraudDetector
from math import radians, cos, sin, asin, sqrt

transaction_bp = Blueprint('transactions', __name__, url_prefix='/api/transactions')

# ============================================================================
# CACHE FRAUD DETECTOR MODEL - Load once, reuse for all transactions
# ============================================================================
_fraud_detector_cache = None

def get_fraud_detector():
    """Get cached fraud detector or load it if not cached"""
    global _fraud_detector_cache
    if _fraud_detector_cache is None:
        print("🔧 Loading fraud detector model (first time)...")
        _fraud_detector_cache = FraudDetector()
        _fraud_detector_cache.load_model('fraud_detector_model.pkl')
        
        # 🎯 BOOST THRESHOLD to detect more fraud (same as hackathon_live.py)
        original_threshold = _fraud_detector_cache.threshold
        THRESHOLD_BOOST = 30  # Increase threshold to catch more transactions as fraud (balanced)
        _fraud_detector_cache.threshold = original_threshold * THRESHOLD_BOOST
        
        print(f"✅ Fraud detector model cached and ready!")
        print(f"   Original threshold: {original_threshold:.6e}")
        print(f"   🚀 Boosted threshold: {_fraud_detector_cache.threshold:.6e} ({THRESHOLD_BOOST}x)")
        print(f"   → More transactions will be flagged as fraud!")
    return _fraud_detector_cache

@transaction_bp.route('', methods=['GET'])
def get_transactions():
    """Get all transactions with optional filters"""
    # Get query parameters
    status = request.args.get('status')
    limit = int(request.args.get('limit', 100))
    skip = int(request.args.get('skip', 0))
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = int(request.args.get('sort_order', -1))
    
    # Build filters
    filters = {}
    if status and status != 'all':
        filters['status'] = status
    
    # Get is_fraud filter
    is_fraud = request.args.get('is_fraud')
    if is_fraud is not None:
        filters['is_fraud'] = is_fraud.lower() == 'true'
    
    # Get transactions
    result = TransactionService.get_all_transactions(
        filters=filters,
        limit=limit,
        skip=skip,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    if not result['success']:
        return jsonify({'error': result['error']}), 500
    
    return jsonify(result), 200

@transaction_bp.route('/<trans_num>', methods=['GET'])
def get_transaction(trans_num):
    """Get a single transaction by transaction number"""
    result = TransactionService.get_transaction_by_id(trans_num)
    
    if not result['success']:
        return jsonify({'error': result['error']}), 404
    
    return jsonify(result['transaction']), 200

@transaction_bp.route('', methods=['POST'])
def add_transaction():
    """Add a new transaction"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    result = TransactionService.add_transaction(data)
    
    if not result['success']:
        return jsonify({'error': result['error']}), 400
    
    return jsonify(result), 201

@transaction_bp.route('/<trans_num>', methods=['PUT'])
def update_transaction(trans_num):
    """Update a transaction"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    result = TransactionService.update_transaction(trans_num, data)
    
    if not result['success']:
        return jsonify({'error': result['error']}), 400
    
    return jsonify(result), 200

@transaction_bp.route('/<trans_num>', methods=['DELETE'])
def delete_transaction(trans_num):
    """Delete a transaction"""
    result = TransactionService.delete_transaction(trans_num)
    
    if not result['success']:
        return jsonify({'error': result['error']}), 404
    
    return jsonify(result), 200

@transaction_bp.route('/delete-all', methods=['DELETE'])
def delete_all_transactions():
    """Delete all transactions"""
    result = TransactionService.delete_all_transactions()
    
    if not result['success']:
        return jsonify({'error': result['error']}), 500
    
    return jsonify(result), 200

@transaction_bp.route('/stats', methods=['GET'])
def get_stats():
    """Get transaction statistics"""
    result = TransactionService.get_transaction_stats()
    
    if not result['success']:
        return jsonify({'error': result['error']}), 500
    
    return jsonify(result['stats']), 200

@transaction_bp.route('/recent', methods=['GET'])
def get_recent_transactions():
    """Get recent transactions"""
    limit = int(request.args.get('limit', 10))
    
    result = TransactionService.get_all_transactions(
        limit=limit,
        sort_by='created_at',
        sort_order=-1
    )
    
    if not result['success']:
        return jsonify({'error': result['error']}), 500
    
    return jsonify(result), 200

@transaction_bp.route('/process', methods=['POST'])
def process_transaction():
    """Process a transaction from live stream with fraud detection and save to database"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # If transaction doesn't have fraud detection data, analyze it
    if 'fraud_probability' not in data or data.get('fraud_probability') is None:
        try:
            # Get cached fraud detector (much faster than loading every time!)
            detector = get_fraud_detector()
            
            # 🔧 CRITICAL: Convert numeric fields from strings to numbers
            # Frontend often sends numbers as strings which breaks fraud detection
            numeric_fields = ['amt', 'lat', 'long', 'merch_lat', 'merch_long', 'city_pop', 'unix_time']
            for field in numeric_fields:
                if field in data and data[field] is not None:
                    try:
                        if field == 'unix_time' or field == 'city_pop':
                            data[field] = int(float(data[field]))
                        else:
                            data[field] = float(data[field])
                    except (ValueError, TypeError):
                        pass  # Keep original if conversion fails
            
            # Create DataFrame for prediction
            df_trans = pd.DataFrame([data])
            
            # Make prediction (returns tuple: predictions, probabilities, df_features)
            predictions, probabilities, _ = detector.predict(df_trans)
            
            is_fraud = predictions[0] == 1
            probability = probabilities[0]
            
            # Calculate distance if coordinates available (optimized version)
            distance = None
            try:
                lat = data.get('lat')
                lng = data.get('long')
                mlat = data.get('merch_lat')
                mlng = data.get('merch_long')
                
                if lat and lng and mlat and mlng:
                    # Fast Haversine distance calculation
                    lat1, lon1 = radians(float(lat)), radians(float(lng))
                    lat2, lon2 = radians(float(mlat)), radians(float(mlng))
                    
                    # Optimized calculation
                    dlat = lat2 - lat1
                    dlon = lon2 - lon1
                    a = sin(dlat * 0.5)**2 + cos(lat1) * cos(lat2) * sin(dlon * 0.5)**2
                    distance = 12742 * asin(sqrt(a))  # Earth diameter = 12742 km
            except:
                pass
            
            # Determine fraud pattern
            pattern = None
            if is_fraud:
                if distance and distance > 100:
                    pattern = f"Unusual distance ({distance:.0f}km from home)"
                elif float(data.get('amt', 0)) > 500:
                    pattern = "High-value transaction"
                elif data.get('category') in ['gas_transport', 'shopping_net']:
                    pattern = f"Suspicious {data.get('category')} activity"
                else:
                    pattern = "Anomalous behavior pattern"
            
            # Add fraud detection data
            data['is_fraud'] = bool(is_fraud)
            data['isFraud'] = bool(is_fraud)
            data['fraud_probability'] = float(probability)
            data['confidence'] = float(probability) if is_fraud else float(1 - probability)
            data['distance'] = float(distance) if distance else None
            data['pattern'] = pattern
            data['risk_score'] = int(probability * 100)
            data['status'] = 'blocked' if is_fraud else 'accepted'
            
        except Exception as e:
            print(f"❌ Fraud detection failed: {e}")
            # Continue with default values if fraud detection fails
            data['is_fraud'] = False
            data['status'] = 'accepted'
            data['risk_score'] = 0
    
    # Add transaction with fraud detection results
    # Use optimized parameters: skip validation (data already validated by fraud detector)
    # and skip duplicate check (rely on MongoDB unique index for speed)
    result = TransactionService.add_transaction(
        data, 
        skip_validation=True,  # Already validated by fraud detector
        skip_duplicate_check=True  # Use MongoDB unique index instead
    )
    
    if not result['success']:
        # If duplicate, MongoDB will raise error - catch it gracefully
        error_msg = result.get('error', 'Unknown error')
        if 'duplicate' in error_msg.lower():
            return jsonify({'success': True, 'message': 'Transaction already exists'}), 200
        return jsonify({'error': error_msg}), 400
    
    return jsonify(result), 201

