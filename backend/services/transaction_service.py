"""
Transaction Service
Handles all transaction-related business logic
"""

from datetime import datetime
from utils.database import get_db
from utils.validators import validate_transaction
from services.notification_service import NotificationService

class TransactionService:
    """Service class for transaction operations"""
    
    @staticmethod
    def add_transaction(transaction_data):
        """
        Add a new transaction to the database
        
        Args:
            transaction_data (dict): Transaction data
            
        Returns:
            dict: Result with success status and transaction ID or error
        """
        # Validate transaction data
        is_valid, error = validate_transaction(transaction_data)
        if not is_valid:
            return {'success': False, 'error': error}
        
        db = get_db()
        
        # Check if transaction already exists
        existing = db.transactions.find_one({'trans_num': transaction_data['trans_num']})
        if existing:
            return {'success': False, 'error': 'Transaction already exists'}
        
        # Prepare transaction document with all fields
        transaction = {
            # Core transaction fields (required)
            'trans_num': transaction_data['trans_num'],
            'amt': float(transaction_data['amt']),
            'merchant': transaction_data['merchant'],
            
            # Transaction details
            'category': transaction_data.get('category'),
            'status': transaction_data.get('status', 'completed'),
            'is_fraud': bool(transaction_data.get('is_fraud', False)),
            'risk_score': transaction_data.get('risk_score', 0),
            
            # Date/Time information
            'trans_date': transaction_data.get('trans_date'),
            'trans_time': transaction_data.get('trans_time'),
            'unix_time': int(transaction_data['unix_time']) if transaction_data.get('unix_time') else None,
            'date': transaction_data.get('date'),  # Combined date field (legacy)
            
            # Customer personal information
            'ssn': transaction_data.get('ssn'),
            'cc_num': transaction_data.get('cc_num'),
            'acct_num': transaction_data.get('acct_num'),
            'first': transaction_data.get('first'),
            'last': transaction_data.get('last'),
            'gender': transaction_data.get('gender'),
            'dob': transaction_data.get('dob'),
            'job': transaction_data.get('job'),
            
            # Customer address/location
            'street': transaction_data.get('street'),
            'city': transaction_data.get('city'),
            'state': transaction_data.get('state'),
            'zip': transaction_data.get('zip'),
            'lat': float(transaction_data['lat']) if transaction_data.get('lat') is not None else None,
            'long': float(transaction_data['long']) if transaction_data.get('long') is not None else None,
            'city_pop': int(transaction_data['city_pop']) if transaction_data.get('city_pop') else None,
            
            # Merchant location
            'merch_lat': float(transaction_data['merch_lat']) if transaction_data.get('merch_lat') is not None else None,
            'merch_long': float(transaction_data['merch_long']) if transaction_data.get('merch_long') is not None else None,
            
            # Legacy/computed fields
            'customer': transaction_data.get('customer'),  # Full name if provided
            'location': transaction_data.get('location'),  # Formatted location string
            
            # System timestamps
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Insert transaction
        try:
            result = db.transactions.insert_one(transaction)
            transaction_id = str(result.inserted_id)
            trans_num = transaction_data['trans_num']
            
            # Create notification if fraud detected
            if transaction.get('is_fraud'):
                fraud_probability = transaction_data.get('fraud_probability', 0)
                confidence = transaction_data.get('confidence', 0)
                
                # Determine severity based on probability and confidence
                if confidence >= 0.7:
                    severity = 'high'
                elif confidence >= 0.4:
                    severity = 'medium'
                else:
                    severity = 'low'
                
                notification_data = {
                    'title': f'🚨 Fraud Alert - ${transaction["amt"]:.2f}',
                    'message': f'Suspicious transaction detected at {transaction["merchant"]}. Amount: ${transaction["amt"]:.2f}. Category: {transaction.get("category", "N/A")}. Confidence: {confidence:.1%}',
                    'text': f'Fraud detected: {transaction["merchant"]} - ${transaction["amt"]:.2f}',
                    'type': severity,
                    'transaction_id': trans_num,
                    'amount': transaction['amt'],
                    'merchant': transaction['merchant'],
                    'category': transaction.get('category'),
                    'fraud_probability': fraud_probability,
                    'confidence': confidence
                }
                
                # Add notification to database
                NotificationService.add_notification(notification_data)
                print(f"✅ Created fraud notification for transaction {trans_num}")
            
            return {
                'success': True,
                'transaction_id': transaction_id,
                'trans_num': trans_num,
                'fraud_detected': transaction.get('is_fraud', False)
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_all_transactions(filters=None, limit=100, skip=0, sort_by='created_at', sort_order=-1):
        """
        Get all transactions from the database
        
        Args:
            filters (dict): MongoDB query filters
            limit (int): Maximum number of transactions to return
            skip (int): Number of transactions to skip
            sort_by (str): Field to sort by
            sort_order (int): 1 for ascending, -1 for descending
            
        Returns:
            dict: Result with transactions list and count
        """
        db = get_db()
        
        try:
            # Build query
            query = filters or {}
            
            # Get total count
            total_count = db.transactions.count_documents(query)
            
            # Get transactions
            cursor = db.transactions.find(query).sort(sort_by, sort_order).skip(skip).limit(limit)
            
            # Convert to list and format
            transactions = []
            for tx in cursor:
                tx['_id'] = str(tx['_id'])
                tx['id'] = tx['trans_num']  # Use trans_num as ID for frontend
                
                # Format dates
                if 'created_at' in tx:
                    tx['created_at'] = tx['created_at'].isoformat()
                if 'updated_at' in tx:
                    tx['updated_at'] = tx['updated_at'].isoformat()
                
                transactions.append(tx)
            
            return {
                'success': True,
                'transactions': transactions,
                'total': total_count,
                'limit': limit,
                'skip': skip
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_transaction_by_id(trans_num):
        """
        Get a single transaction by transaction number
        
        Args:
            trans_num (str): Transaction number
            
        Returns:
            dict: Result with transaction data or error
        """
        db = get_db()
        
        try:
            transaction = db.transactions.find_one({'trans_num': trans_num})
            
            if not transaction:
                return {'success': False, 'error': 'Transaction not found'}
            
            # Format transaction
            transaction['_id'] = str(transaction['_id'])
            transaction['id'] = transaction['trans_num']
            
            if 'created_at' in transaction:
                transaction['created_at'] = transaction['created_at'].isoformat()
            if 'updated_at' in transaction:
                transaction['updated_at'] = transaction['updated_at'].isoformat()
            
            return {'success': True, 'transaction': transaction}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_transaction_stats():
        """
        Get transaction statistics
        
        Returns:
            dict: Statistics about transactions
        """
        db = get_db()
        
        try:
            total = db.transactions.count_documents({})
            fraud = db.transactions.count_documents({'is_fraud': True})
            completed = db.transactions.count_documents({'status': 'completed'})
            blocked = db.transactions.count_documents({'status': 'blocked'})
            
            # Get amount statistics
            pipeline = [
                {
                    '$group': {
                        '_id': None,
                        'total_amount': {'$sum': '$amt'},
                        'avg_amount': {'$avg': '$amt'},
                        'max_amount': {'$max': '$amt'},
                        'min_amount': {'$min': '$amt'}
                    }
                }
            ]
            
            amount_stats = list(db.transactions.aggregate(pipeline))
            
            return {
                'success': True,
                'stats': {
                    'total_transactions': total,
                    'fraud_detected': fraud,
                    'completed': completed,
                    'blocked': blocked,
                    'fraud_rate': (fraud / total * 100) if total > 0 else 0,
                    'amount_stats': amount_stats[0] if amount_stats else {}
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def update_transaction(trans_num, update_data):
        """
        Update a transaction
        
        Args:
            trans_num (str): Transaction number
            update_data (dict): Data to update
            
        Returns:
            dict: Result with success status
        """
        db = get_db()
        
        try:
            update_data['updated_at'] = datetime.utcnow()
            
            result = db.transactions.update_one(
                {'trans_num': trans_num},
                {'$set': update_data}
            )
            
            if result.matched_count == 0:
                return {'success': False, 'error': 'Transaction not found'}
            
            return {'success': True, 'modified': result.modified_count}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def delete_transaction(trans_num):
        """
        Delete a transaction
        
        Args:
            trans_num (str): Transaction number
            
        Returns:
            dict: Result with success status
        """
        db = get_db()
        
        try:
            result = db.transactions.delete_one({'trans_num': trans_num})
            
            if result.deleted_count == 0:
                return {'success': False, 'error': 'Transaction not found'}
            
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}

