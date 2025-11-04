"""
Database utility module
Handles MongoDB connection and provides database instance
"""

try:
    from pymongo import MongoClient
    from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
    _IMPORT_ERROR = None
except Exception as import_error:
    MongoClient = None
    ConnectionFailure = ServerSelectionTimeoutError = Exception  # type: ignore
    _IMPORT_ERROR = import_error

from config import config

class Database:
    """Database connection manager"""
    
    _client = None
    _db = None
    
    @classmethod
    def connect(cls):
        """Establish connection to MongoDB"""
        if MongoClient is None:
            raise RuntimeError(f"pymongo is not available: {_IMPORT_ERROR}")
        
        try:
            cls._client = MongoClient(
                config.MONGODB_URI,
                serverSelectionTimeoutMS=5000
            )
            
            # Test connection
            cls._client.admin.command('ping')
            
            # Get database
            cls._db = cls._client[config.MONGODB_DB_NAME]
            
            print(f"✅ Connected to MongoDB: {config.MONGODB_DB_NAME}")
            
            # Create indexes
            cls._create_indexes()
            
            return cls._db
            
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            raise
    
    @classmethod
    def _create_indexes(cls):
        """Create indexes for better query performance"""
        if cls._db is None:
            return
        
        # Transactions indexes
        cls._db.transactions.create_index("trans_num", unique=True)
        cls._db.transactions.create_index("created_at")
        cls._db.transactions.create_index("status")
        cls._db.transactions.create_index("is_fraud")
        cls._db.transactions.create_index("unix_time")
        cls._db.transactions.create_index("category")
        cls._db.transactions.create_index("merchant")
        # Geospatial indexes (separate indexes for lat and long)
        cls._db.transactions.create_index("lat")
        cls._db.transactions.create_index("long")
        
        # Notifications indexes
        cls._db.notifications.create_index("created_at")
        cls._db.notifications.create_index("timestamp")
        cls._db.notifications.create_index("read")
        cls._db.notifications.create_index("type")
        cls._db.notifications.create_index("transaction_id")  # For linking to transactions
        
        print("✅ Database indexes created")
    
    @classmethod
    def get_db(cls):
        """Get database instance"""
        if cls._db is None:
            cls.connect()
        return cls._db
    
    @classmethod
    def close(cls):
        """Close database connection"""
        if cls._client:
            cls._client.close()
            cls._client = None
            cls._db = None
            print("✅ MongoDB connection closed")

# Convenience function
def get_db():
    """Get database instance"""
    return Database.get_db()
