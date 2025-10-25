"""
Transaction Routes
Handles all transaction-related API endpoints
"""

from flask import Blueprint, request, jsonify
from services.transaction_service import TransactionService

transaction_bp = Blueprint('transactions', __name__, url_prefix='/api/transactions')

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

