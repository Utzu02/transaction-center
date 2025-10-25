"""
Validation utilities for request data
"""

from datetime import datetime
from bson import ObjectId

def validate_transaction(data):
    """
    Validate transaction data
    
    Args:
        data (dict): Transaction data
        
    Returns:
        tuple: (is_valid, error_message)
    """
    required_fields = ['trans_num', 'amt', 'merchant']
    
    # Check required fields
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    # Validate amount
    try:
        amt = float(data['amt'])
        if amt < 0:
            return False, "Amount must be positive"
    except (ValueError, TypeError):
        return False, "Invalid amount format"
    
    # Validate trans_num
    if not isinstance(data['trans_num'], str) or len(data['trans_num']) == 0:
        return False, "Invalid transaction number"
    
    # Validate numeric fields if provided
    numeric_fields = ['lat', 'long', 'city_pop', 'unix_time', 'merch_lat', 'merch_long']
    for field in numeric_fields:
        if field in data and data[field] is not None:
            try:
                float(data[field])
            except (ValueError, TypeError):
                return False, f"Invalid {field} format: must be numeric"
    
    # Validate is_fraud field if provided
    if 'is_fraud' in data and not isinstance(data['is_fraud'], (bool, int)):
        return False, "is_fraud must be boolean or integer (0/1)"
    
    return True, None

def validate_notification(data):
    """
    Validate notification data
    
    Args:
        data (dict): Notification data
        
    Returns:
        tuple: (is_valid, error_message)
    """
    # Check for either 'message' or 'text' field
    if 'message' not in data and 'text' not in data:
        return False, "Missing required field: message or text"
    
    # Ensure 'message' field exists (use 'text' if 'message' is not present)
    if 'message' not in data and 'text' in data:
        data['message'] = data['text']
    
    # Type is required
    if 'type' not in data:
        return False, "Missing required field: type"
    
    # Validate type (support both severity levels and notification types)
    valid_types = ['success', 'error', 'warning', 'info', 'high', 'medium', 'low']
    if data['type'] not in valid_types:
        return False, f"Invalid notification type. Must be one of: {', '.join(valid_types)}"
    
    # Validate message
    if not isinstance(data['message'], str) or len(data['message']) == 0:
        return False, "Message cannot be empty"
    
    # Validate transaction_id if provided (should reference a transaction)
    if 'transaction_id' in data and data['transaction_id'] is not None:
        if not isinstance(data['transaction_id'], str) or len(data['transaction_id']) == 0:
            return False, "Invalid transaction_id format"
    
    return True, None

def validate_object_id(id_str):
    """
    Validate MongoDB ObjectId
    
    Args:
        id_str (str): String representation of ObjectId
        
    Returns:
        tuple: (is_valid, object_id or error_message)
    """
    try:
        obj_id = ObjectId(id_str)
        return True, obj_id
    except Exception:
        return False, "Invalid ID format"

