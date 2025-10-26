"""
Transaction Service
Handles all transaction-related business logic
"""

from datetime import datetime
from utils.database import get_db
from utils.validators import validate_transaction
from services.notification_service import NotificationService
import threading

class TransactionService:
    """Service class for transaction operations"""
    
    @staticmethod
    def add_transaction(transaction_data, skip_validation=False, skip_duplicate_check=False):
        """
        Add a new transaction to the database (OPTIMIZED FOR SPEED)
        
        Args:
            transaction_data (dict): Transaction data
            skip_validation (bool): Skip validation for faster processing
            skip_duplicate_check (bool): Skip duplicate check for faster processing
            
        Returns:
            dict: Result with success status and transaction ID or error
        """
        # Fast validation (optional - skip for maximum speed)
        if not skip_validation:
            is_valid, error = validate_transaction(transaction_data)
            if not is_valid:
                return {'success': False, 'error': error}
        
        db = get_db()
        
        # Skip duplicate check for maximum speed (optional)
        # Note: MongoDB will raise duplicate key error if trans_num already exists due to unique index
        if not skip_duplicate_check:
            existing = db.transactions.find_one({'trans_num': transaction_data['trans_num']})
            if existing:
                return {'success': False, 'error': 'Transaction already exists'}
        
        # Prepare transaction document with all fields (optimized)
        is_fraud = bool(transaction_data.get('is_fraud', False))
        
        # Determine status based on fraud detection
        # Convert 'unknown' status to 'blocked' (treat as suspicious)
        # Otherwise, set to 'blocked' if fraud, 'accepted' if not
        if 'status' in transaction_data:
            status = transaction_data['status']
            # Convert unknown to blocked
            if status == 'unknown':
                status = 'blocked'
                is_fraud = True  # Treat unknown as fraud
        else:
            status = 'blocked' if is_fraud else 'accepted'
        
        # OPTIMIZED: Build transaction document efficiently
        transaction = {
            # Core fields (always present)
            'trans_num': transaction_data['trans_num'],
            'amt': float(transaction_data['amt']),
            'merchant': transaction_data['merchant'],
            'status': status,
            'is_fraud': is_fraud,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Add optional fields directly (avoid repeated .get() calls)
        optional_fields = [
            'category', 'risk_score', 'trans_date', 'trans_time', 'unix_time', 'date',
            'ssn', 'cc_num', 'acct_num', 'first', 'last', 'gender', 'dob', 'job',
            'street', 'city', 'state', 'zip', 'lat', 'long', 'city_pop',
            'merch_lat', 'merch_long', 'customer', 'location',
            'fraud_probability', 'confidence', 'pattern', 'distance', 'processing_time'
        ]
        
        # Bulk update with all available fields (faster than individual checks)
        transaction.update({
            k: transaction_data[k] 
            for k in optional_fields 
            if k in transaction_data and transaction_data[k] is not None
        })
        
        # Convert numeric fields if present (optimized)
        if 'unix_time' in transaction and transaction['unix_time']:
            transaction['unix_time'] = int(transaction['unix_time'])
        if 'city_pop' in transaction and transaction['city_pop']:
            transaction['city_pop'] = int(transaction['city_pop'])
        
        # Convert coordinate fields (only if present)
        for coord_field in ['lat', 'long', 'merch_lat', 'merch_long']:
            if coord_field in transaction and transaction[coord_field] is not None:
                transaction[coord_field] = float(transaction[coord_field])
        
        # Insert transaction (optimized - single operation)
        try:
            result = db.transactions.insert_one(transaction)
            transaction_id = str(result.inserted_id)
            trans_num = transaction_data['trans_num']
            
            # Create notification in separate thread (completely async - doesn't block at all!)
            if transaction.get('is_fraud') or status == 'blocked' or status == 'unknown':
                def create_notification_async():
                    try:
                        fraud_probability = transaction_data.get('fraud_probability', 0)
                        confidence = transaction_data.get('confidence', 0)
                        pattern = transaction_data.get('pattern', 'Unknown pattern')
                        
                        # Quick severity determination
                        severity = 'high' if (confidence >= 0.7 or fraud_probability >= 0.7) else 'medium' if (confidence >= 0.4 or fraud_probability >= 0.4) else 'low'
                        severity_emoji = '🔴' if severity == 'high' else '🟡' if severity == 'medium' else '🟢'
                        
                        # Create optimized notification (minimal data)
                        notification_data = {
                            'title': f'🚨 Fraud Alert - ${transaction["amt"]:.2f}',
                            'message': f'{severity_emoji} Suspicious transaction BLOCKED at {transaction["merchant"]}. Amount: ${transaction["amt"]:.2f}. Pattern: {pattern}.',
                            'text': f'Fraud: {transaction["merchant"]} - ${transaction["amt"]:.2f}',
                            'type': severity,
                            'transaction_id': trans_num,
                            'amount': transaction['amt'],
                            'merchant': transaction['merchant'],
                            'category': transaction.get('category'),
                            'fraud_probability': fraud_probability,
                            'confidence': confidence,
                            'pattern': pattern,
                            'status': 'blocked'
                        }
                        
                        # Add notification
                        NotificationService.add_notification(notification_data)
                    except Exception as notif_error:
                        # Don't fail if notification fails
                        print(f"⚠️ Notification creation failed (async): {notif_error}")
                
                # Start notification creation in background thread (non-blocking)
                thread = threading.Thread(target=create_notification_async, daemon=True)
                thread.start()
            
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
                
                # Ensure both isFraud and is_fraud exist for frontend consistency
                if 'is_fraud' in tx:
                    tx['isFraud'] = tx['is_fraud']
                elif 'isFraud' in tx:
                    tx['is_fraud'] = tx['isFraud']
                
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
            
            # Ensure both isFraud and is_fraud exist for frontend consistency
            if 'is_fraud' in transaction:
                transaction['isFraud'] = transaction['is_fraud']
            elif 'isFraud' in transaction:
                transaction['is_fraud'] = transaction['isFraud']
            
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
    
    @staticmethod
    def delete_all_transactions():
        """
        Delete all transactions from the database
        
        Returns:
            dict: Result with success status and count of deleted transactions
        """
        db = get_db()
        
        try:
            result = db.transactions.delete_many({})
            deleted_count = result.deleted_count
            
            print(f"🗑️ Deleted {deleted_count} transactions from database")
            
            return {
                'success': True,
                'deleted_count': deleted_count,
                'message': f'Successfully deleted {deleted_count} transactions'
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

