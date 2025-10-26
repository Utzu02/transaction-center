#!/usr/bin/env python3
"""
Script to update transactions with 'unknown' status to 'blocked' status
"""

import sys
import os

# Add parent directory to path to import modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils.database import get_db

def update_unknown_transactions():
    """Update all transactions with status 'unknown' to 'blocked'"""
    db = get_db()
    
    # Find all transactions with unknown status
    unknown_transactions = db.transactions.find({'status': 'unknown'})
    unknown_count = db.transactions.count_documents({'status': 'unknown'})
    
    print(f"Found {unknown_count} transactions with status 'unknown'")
    
    if unknown_count == 0:
        print("No transactions to update.")
        return
    
    # Update all unknown transactions
    result = db.transactions.update_many(
        {'status': 'unknown'},
        {
            '$set': {
                'status': 'blocked',
                'is_fraud': True
            }
        }
    )
    
    print(f"✅ Updated {result.modified_count} transactions:")
    print(f"   - Changed status from 'unknown' to 'blocked'")
    print(f"   - Set is_fraud to True")
    
    # Also update risk_score if it's 0 or missing
    zero_risk_count = db.transactions.count_documents({
        'status': 'blocked',
        '$or': [
            {'risk_score': {'$exists': False}},
            {'risk_score': 0}
        ]
    })
    
    if zero_risk_count > 0:
        print(f"\nFound {zero_risk_count} blocked transactions with risk_score = 0")
        
        # Set default risk_score for blocked transactions
        result2 = db.transactions.update_many(
            {
                'status': 'blocked',
                '$or': [
                    {'risk_score': {'$exists': False}},
                    {'risk_score': 0}
                ]
            },
            {
                '$set': {
                    'risk_score': 75  # Default high risk score for blocked transactions
                }
            }
        )
        
        print(f"✅ Updated {result2.modified_count} transactions with default risk_score = 75")

if __name__ == '__main__':
    print("="*60)
    print("UPDATE UNKNOWN STATUS TRANSACTIONS")
    print("="*60)
    
    try:
        update_unknown_transactions()
        print("\n✅ Update completed successfully!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

