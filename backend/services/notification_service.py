"""
Notification Service
Handles all notification-related business logic
"""

import uuid
from datetime import datetime
from bson import ObjectId
from utils.database import get_db
from utils.validators import validate_notification, validate_object_id

# Lightweight fallback notifications used when the database is unavailable
FALLBACK_NOTIFICATIONS = [
    {
        'id': 'fallback-1',
        '_id': 'fallback-1',
        'title': 'Notification service in demo mode',
        'message': 'Backend database is not connected. Showing sample notifications.',
        'text': 'Backend database is not connected. Showing sample notifications.',
        'type': 'info',
        'read': False,
        'timestamp': datetime.utcnow().isoformat(),
        'created_at': datetime.utcnow().isoformat()
    },
    {
        'id': 'fallback-2',
        '_id': 'fallback-2',
        'title': 'Connect MongoDB for live alerts',
        'message': 'To enable real notifications, configure MONGODB_URI on the backend.',
        'text': 'To enable real notifications, configure MONGODB_URI on the backend.',
        'type': 'warning',
        'read': False,
        'timestamp': datetime.utcnow().isoformat(),
        'created_at': datetime.utcnow().isoformat()
    }
]

# Temporary in-memory notification store used when MongoDB is unavailable
IN_MEMORY_NOTIFICATIONS = []

class NotificationService:
    """Service class for notification operations"""
    
    @staticmethod
    def _safe_get_db():
        """
        Attempt to get a database connection, returning a structured error if it fails.
        Useful for serverless environments where MongoDB might be unavailable.
        """
        try:
            return get_db(), None
        except Exception as exc:
            return None, {
                'success': False,
                'error': f'Database connection error: {exc}',
                'code': 'database_unavailable'
            }
    
    @staticmethod
    def add_notification(notification_data):
        """
        Add a new notification to the database
        
        Args:
            notification_data (dict): Notification data
                - message (str): Notification message
                - type (str): Type of notification (success, error, warning, info)
                - title (str, optional): Notification title
                - transaction_id (str, optional): Associated transaction ID
                
        Returns:
            dict: Result with success status and notification ID or error
        """
        # Validate notification data
        is_valid, error = validate_notification(notification_data)
        if not is_valid:
            return {'success': False, 'error': error}
        
        db, error = NotificationService._safe_get_db()
        if error:
            # Store notification in transient memory for demo deployments
            fallback_id = f"fallback-{uuid.uuid4().hex}"
            timestamp = datetime.utcnow().isoformat()
            notification = {
                'id': fallback_id,
                '_id': fallback_id,
                'message': notification_data.get('message') or notification_data.get('text'),
                'text': notification_data.get('text') or notification_data.get('message'),
                'type': notification_data['type'],
                'title': notification_data.get('title'),
                'transaction_id': notification_data.get('transaction_id'),
                'read': False,
                'timestamp': timestamp,
                'created_at': timestamp,
                'fallback': True
            }
            IN_MEMORY_NOTIFICATIONS.insert(0, notification)
            return {
                'success': True,
                'notification_id': fallback_id,
                'fallback': True,
                'warning': error['error']
            }
        
        # Prepare notification document
        notification = {
            'message': notification_data.get('message') or notification_data.get('text'),
            'text': notification_data.get('text') or notification_data.get('message'),
            'type': notification_data['type'],  # success, error, warning, info, high, medium, low
            'title': notification_data.get('title'),
            'transaction_id': notification_data.get('transaction_id'),  # Reference to transaction trans_num
            'read': False,
            'timestamp': datetime.utcnow(),  # For frontend compatibility
            'created_at': datetime.utcnow()
        }
        
        # Insert notification
        try:
            result = db.notifications.insert_one(notification)
            return {
                'success': True,
                'notification_id': str(result.inserted_id)
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_notifications(filters=None, limit=50, skip=0, include_read=True):
        """
        Get notifications from the database
        
        Args:
            filters (dict): MongoDB query filters
            limit (int): Maximum number of notifications to return
            skip (int): Number of notifications to skip
            include_read (bool): Include read notifications
            
        Returns:
            dict: Result with notifications list and count
        """
        db, error = NotificationService._safe_get_db()
        if error:
            # Serve fallback notifications so the UI keeps working in demo deployments
            notifications = []
            for source in (FALLBACK_NOTIFICATIONS + IN_MEMORY_NOTIFICATIONS):
                # Refresh timestamps so they look recent to the UI
                refreshed_time = datetime.utcnow().isoformat()
                notifications.append({
                    **source,
                    'timestamp': refreshed_time,
                    'created_at': refreshed_time
                })
            # Apply pagination to the fallback set
            paginated = notifications[skip:skip + limit]
            unread_count = len([n for n in paginated if not n.get('read', False)])
            
            return {
                'success': True,
                'notifications': paginated,
                'total': len(notifications),
                'unread': unread_count,
                'limit': limit,
                'skip': skip,
                'fallback': True,
                'warning': error['error']
            }
        
        try:
            # Build query
            query = filters or {}
            if not include_read:
                query['read'] = False
            
            # Get total count
            total_count = db.notifications.count_documents(query)
            unread_count = db.notifications.count_documents({'read': False})
            
            # Get notifications (sorted by creation date, newest first)
            cursor = db.notifications.find(query).sort('created_at', -1).skip(skip).limit(limit)
            
            # Convert to list and format
            notifications = []
            for notif in cursor:
                notif['_id'] = str(notif['_id'])
                notif['id'] = notif['_id']
                
                # Format date
                if 'created_at' in notif:
                    notif['created_at'] = notif['created_at'].isoformat()
                    # Add timestamp for frontend
                    notif['timestamp'] = notif['created_at']
                
                notifications.append(notif)
            
            return {
                'success': True,
                'notifications': notifications,
                'total': total_count,
                'unread': unread_count,
                'limit': limit,
                'skip': skip
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_notification_by_id(notification_id):
        """
        Get a single notification by ID
        
        Args:
            notification_id (str): Notification ID
            
        Returns:
            dict: Result with notification data or error
        """
        # Allow fallback notifications without a MongoDB ObjectId
        if notification_id.startswith('fallback-'):
            fallback = next((n for n in (IN_MEMORY_NOTIFICATIONS + FALLBACK_NOTIFICATIONS) if n['id'] == notification_id or n.get('_id') == notification_id), None)
            if fallback:
                refreshed_time = datetime.utcnow().isoformat()
                notification = {
                    **fallback,
                    'timestamp': refreshed_time,
                    'created_at': refreshed_time
                }
                return {'success': True, 'notification': notification, 'fallback': True}
        
        # Validate ID
        is_valid, obj_id = validate_object_id(notification_id)
        if not is_valid:
            return {'success': False, 'error': obj_id}
        
        db, error = NotificationService._safe_get_db()
        if error:
            fallback = next((n for n in (IN_MEMORY_NOTIFICATIONS + FALLBACK_NOTIFICATIONS) if n['id'] == notification_id or n['_id'] == notification_id), None)
            if fallback:
                refreshed_time = datetime.utcnow().isoformat()
                notification = {
                    **fallback,
                    'timestamp': refreshed_time,
                    'created_at': refreshed_time
                }
                return {'success': True, 'notification': notification, 'fallback': True}
            return error
        
        try:
            notification = db.notifications.find_one({'_id': obj_id})
            
            if not notification:
                return {'success': False, 'error': 'Notification not found'}
            
            # Format notification
            notification['_id'] = str(notification['_id'])
            notification['id'] = notification['_id']
            
            if 'created_at' in notification:
                notification['created_at'] = notification['created_at'].isoformat()
                notification['timestamp'] = notification['created_at']
            
            return {'success': True, 'notification': notification}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def mark_as_read(notification_id):
        """
        Mark a notification as read
        
        Args:
            notification_id (str): Notification ID
            
        Returns:
            dict: Result with success status
        """
        # Validate ID
        is_valid, obj_id = validate_object_id(notification_id)
        if not is_valid:
            return {'success': False, 'error': obj_id}
        
        db, error = NotificationService._safe_get_db()
        if error:
            updated = False
            for notif in IN_MEMORY_NOTIFICATIONS:
                if notif['id'] == notification_id or notif['_id'] == notification_id:
                    notif['read'] = True
                    notif['timestamp'] = datetime.utcnow().isoformat()
                    updated = True
                    break
            if not updated:
                # Treat static fallback notifications as read to avoid UI errors
                if any(n['id'] == notification_id or n.get('_id') == notification_id for n in FALLBACK_NOTIFICATIONS):
                    updated = True
            if updated:
                return {'success': True, 'fallback': True}
            return error
        
        try:
            result = db.notifications.update_one(
                {'_id': obj_id},
                {'$set': {'read': True}}
            )
            
            if result.matched_count == 0:
                return {'success': False, 'error': 'Notification not found'}
            
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def delete_notification(notification_id):
        """
        Delete a notification
        
        Args:
            notification_id (str): Notification ID
            
        Returns:
            dict: Result with success status
        """
        # Validate ID
        is_valid, obj_id = validate_object_id(notification_id)
        if not is_valid:
            return {'success': False, 'error': obj_id}
        
        db, error = NotificationService._safe_get_db()
        if error:
            initial_len = len(IN_MEMORY_NOTIFICATIONS)
            IN_MEMORY_NOTIFICATIONS[:] = [
                notif for notif in IN_MEMORY_NOTIFICATIONS
                if not (notif['id'] == notification_id or notif['_id'] == notification_id)
            ]
            if len(IN_MEMORY_NOTIFICATIONS) < initial_len:
                return {'success': True, 'fallback': True}
            if any(n['id'] == notification_id or n.get('_id') == notification_id for n in FALLBACK_NOTIFICATIONS):
                return {'success': True, 'fallback': True}
            return error
        
        try:
            result = db.notifications.delete_one({'_id': obj_id})
            
            if result.deleted_count == 0:
                return {'success': False, 'error': 'Notification not found'}
            
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def delete_all_notifications():
        """
        Delete all notifications
        
        Returns:
            dict: Result with success status and count of deleted notifications
        """
        db, error = NotificationService._safe_get_db()
        if error:
            count = len(IN_MEMORY_NOTIFICATIONS)
            IN_MEMORY_NOTIFICATIONS.clear()
            return {'success': True, 'deleted_count': count, 'fallback': True}
        
        try:
            result = db.notifications.delete_many({})
            return {
                'success': True,
                'deleted_count': result.deleted_count
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def mark_all_as_read():
        """
        Mark all notifications as read
        
        Returns:
            dict: Result with success status and count of modified notifications
        """
        db, error = NotificationService._safe_get_db()
        if error:
            for notif in IN_MEMORY_NOTIFICATIONS:
                notif['read'] = True
                notif['timestamp'] = datetime.utcnow().isoformat()
            for notif in FALLBACK_NOTIFICATIONS:
                notif['read'] = True
                notif['timestamp'] = datetime.utcnow().isoformat()
                notif['created_at'] = notif.get('created_at') or notif['timestamp']
            return {'success': True, 'fallback': True}
        
        try:
            result = db.notifications.update_many(
                {'read': False},
                {'$set': {'read': True}}
            )
            return {
                'success': True,
                'modified_count': result.modified_count
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
