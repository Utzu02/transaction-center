"""
Notification Routes
Handles all notification-related API endpoints
"""

from flask import Blueprint, request, jsonify
from services.notification_service import NotificationService

notification_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notification_bp.route('', methods=['GET'])
def get_notifications():
    """Get all notifications"""
    # Get query parameters
    limit = int(request.args.get('limit', 50))
    skip = int(request.args.get('skip', 0))
    include_read = request.args.get('include_read', 'true').lower() == 'true'
    
    # Get notification type filter
    notif_type = request.args.get('type')
    filters = {}
    if notif_type:
        filters['type'] = notif_type
    
    # Get notifications
    result = NotificationService.get_notifications(
        filters=filters,
        limit=limit,
        skip=skip,
        include_read=include_read
    )
    
    if not result['success']:
        return jsonify({'error': result['error']}), 500
    
    return jsonify(result), 200

@notification_bp.route('/<notification_id>', methods=['GET'])
def get_notification(notification_id):
    """Get a single notification by ID"""
    result = NotificationService.get_notification_by_id(notification_id)
    
    if not result['success']:
        return jsonify({'error': result['error']}), 404
    
    return jsonify(result['notification']), 200

@notification_bp.route('', methods=['POST'])
def add_notification():
    """Add a new notification"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    result = NotificationService.add_notification(data)
    
    if not result['success']:
        return jsonify({'error': result['error']}), 400
    
    return jsonify(result), 201

@notification_bp.route('/<notification_id>/read', methods=['PUT'])
def mark_notification_as_read(notification_id):
    """Mark a notification as read"""
    result = NotificationService.mark_as_read(notification_id)
    
    if not result['success']:
        return jsonify({'error': result['error']}), 404
    
    return jsonify(result), 200

@notification_bp.route('/<notification_id>', methods=['DELETE'])
def delete_notification(notification_id):
    """Delete a notification"""
    result = NotificationService.delete_notification(notification_id)
    
    if not result['success']:
        return jsonify({'error': result['error']}), 404
    
    return jsonify(result), 200

@notification_bp.route('/all', methods=['DELETE'])
@notification_bp.route('/delete-all', methods=['DELETE'])
def delete_all_notifications():
    """Delete all notifications"""
    result = NotificationService.delete_all_notifications()
    
    if not result['success']:
        return jsonify({'error': result['error']}), 500
    
    return jsonify(result), 200

@notification_bp.route('/mark-all-read', methods=['PUT'])
def mark_all_as_read():
    """Mark all notifications as read"""
    result = NotificationService.mark_all_as_read()
    
    if not result['success']:
        return jsonify({'error': result['error']}), 500
    
    return jsonify(result), 200

