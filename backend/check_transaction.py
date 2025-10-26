#!/usr/bin/env python3
"""
Quick script to check a transaction from the database
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pymongo import MongoClient

# Connect directly to MongoDB
client = MongoClient('mongodb://root:password@localhost:27017/?authSource=admin')
db = client['fraud_detection']

# Get one transaction
trans = db.transactions.find_one()

if trans:
    print("Sample transaction from DB:")
    print("-" * 60)
    for key, value in trans.items():
        if key != '_id':
            print(f"{key}: {value}")
else:
    print("No transactions found in database")

