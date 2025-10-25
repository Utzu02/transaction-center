"""
Example usage of the fraud detection system.
"""

import pandas as pd
import numpy as np
from fraud_detector import FraudDetector
from streaming import StreamingHandler, run_stream_in_background
from utils import load_csv_data
import argparse
import sys


def train_and_evaluate_example(csv_path: str, n_samples: int = None):
    """
    Example: Train and evaluate the fraud detector.
    
    Args:
        csv_path: Path to CSV file with training data
        n_samples: Number of samples to use for training
    """
    print("="*60)
    print("FRAUD DETECTION - TRAINING AND EVALUATION")
    print("="*60)
    
    # Load data
    print(f"\nLoading data from {csv_path}...")
    df = load_csv_data(csv_path)
    print(f"Loaded {len(df)} transactions")
    
    # Display sample
    print("\nSample transaction:")
    print(df.head(1).T)
    
    # Check fraud distribution
    if 'is_fraud' in df.columns:
        fraud_count = df['is_fraud'].sum()
        print(f"\nFraud distribution: {fraud_count} fraud ({fraud_count/len(df)*100:.2f}%) out of {len(df)} transactions")
    
    # SHUFFLE data before splitting (important for non-random data!)
    print("\nShuffling data before split...")
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Split data
    train_size = int(0.7 * len(df))
    val_size = int(0.15 * len(df))
    
    df_train = df[:train_size]
    df_val = df[train_size:train_size+val_size]
    df_test = df[train_size+val_size:]
    
    # Show fraud distribution in each set
    print(f"\nFraud distribution after split:")
    print(f"  Train: {df_train['is_fraud'].sum()} / {len(df_train)} ({df_train['is_fraud'].mean()*100:.2f}%)")
    print(f"  Val:   {df_val['is_fraud'].sum()} / {len(df_val)} ({df_val['is_fraud'].mean()*100:.2f}%)")
    print(f"  Test:  {df_test['is_fraud'].sum()} / {len(df_test)} ({df_test['is_fraud'].mean()*100:.2f}%)")
    
    print(f"\nData split:")
    print(f"  Training: {len(df_train)} samples")
    print(f"  Validation: {len(df_val)} samples")
    print(f"  Test: {len(df_test)} samples")
    
    # Initialize detector
    detector = FraudDetector()
    
    # Train
    print("\n" + "="*60)
    print("TRAINING")
    print("="*60)
    metrics = detector.train(df_train, n_samples=n_samples)
    
    # Evaluate on test set
    print("\n" + "="*60)
    print("EVALUATION ON TEST SET")
    print("="*60)
    test_metrics = detector.evaluate(df_test)
    
    print(f"\nTest Results:")
    print(f"  Accuracy:  {test_metrics['accuracy']:.4f}")
    print(f"  Precision: {test_metrics['precision']:.4f}")
    print(f"  Recall:    {test_metrics['recall']:.4f}")
    print(f"  F1 Score:  {test_metrics['F1']:.4f}")
    print(f"\nConfusion Matrix:")
    print(f"  True Positives:  {test_metrics['true_positives']}")
    print(f"  False Positives: {test_metrics['false_positives']}")
    print(f"  True Negatives:  {test_metrics['true_negatives']}")
    print(f"  False Negatives: {test_metrics['false_negatives']}")
    
    # Save model
    model_path = 'fraud_detector_model.pkl'
    detector.save_model(model_path)
    
    return detector, test_metrics


def predict_example(csv_path: str, model_path: str = 'fraud_detector_model.pkl'):
    """
    Example: Load model and predict on new data.
    
    Args:
        csv_path: Path to CSV file with new transactions
        model_path: Path to saved model
    """
    print("="*60)
    print("FRAUD DETECTION - PREDICTION")
    print("="*60)
    
    # Load model
    print(f"\nLoading model from {model_path}...")
    detector = FraudDetector()
    detector.load_model(model_path)
    
    # Load data
    print(f"\nLoading data from {csv_path}...")
    df = load_csv_data(csv_path)
    print(f"Loaded {len(df)} transactions")
    
    # Predict
    print("\nMaking predictions...")
    predictions, probabilities, df_processed = detector.predict(df)
    
    # Display results
    fraud_count = predictions.sum()
    print(f"\nResults:")
    print(f"  Total transactions: {len(df)}")
    print(f"  Fraud detected: {fraud_count} ({fraud_count/len(df)*100:.2f}%)")
    
    # Show some fraud examples
    fraud_indices = np.where(predictions == 1)[0]
    if len(fraud_indices) > 0:
        print(f"\nSample fraud detections (showing up to 5):")
        for idx in fraud_indices[:5]:
            print(f"\n  Transaction {idx}:")
            print(f"    Probability: {probabilities[idx]:.6e}")
            print(f"    Amount: ${df.iloc[idx]['amt']:.2f}")
            if 'category' in df.columns:
                print(f"    Category: {df.iloc[idx]['category']}")
    
    # Add predictions to dataframe
    df['predicted_fraud'] = predictions
    df['fraud_probability'] = probabilities
    
    # Save results
    output_path = csv_path.replace('.csv', '_predictions.csv')
    df.to_csv(output_path, index=False)
    print(f"\nPredictions saved to {output_path}")
    
    return predictions, probabilities


def streaming_example(stream_url: str, report_url: str = None, model_path: str = 'fraud_detector_model.pkl'):
    """
    Example: Real-time fraud detection from streaming data.
    
    Args:
        stream_url: URL for SSE stream
        report_url: URL to report predictions to
        model_path: Path to saved model
    """
    print("="*60)
    print("FRAUD DETECTION - REAL-TIME STREAMING")
    print("="*60)
    
    # Load model
    print(f"\nLoading model from {model_path}...")
    detector = FraudDetector()
    detector.load_model(model_path)
    
    # Define callback function
    def fraud_detection_callback(event_data):
        """Process each streaming event."""
        prediction, probability, details = detector.predict_single(event_data)
        return details
    
    # Start streaming
    print("\nStarting real-time detection...")
    handler = StreamingHandler(stream_url, fraud_detection_callback, report_url)
    
    try:
        handler.start()
    except KeyboardInterrupt:
        print("\n\nStopping...")
        handler.stop()
    
    # Show statistics
    print("\n" + "="*60)
    print("STATISTICS")
    print("="*60)
    stats = handler.get_stats()
    print(f"\nTotal events processed: {stats['total_events']}")
    print(f"Fraud detected: {stats['fraud_detected']} ({stats['fraud_rate']*100:.2f}%)")
    print(f"Timeouts: {stats['timeouts']}")
    print(f"Errors: {stats['errors']}")
    print(f"Runtime: {stats['runtime_seconds']:.1f} seconds")
    print(f"Processing rate: {stats['events_per_second']:.2f} events/second")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='POS Fraud Detection System')
    parser.add_argument('mode', choices=['train', 'predict', 'stream'], 
                       help='Operation mode')
    parser.add_argument('--csv', type=str, help='Path to CSV file')
    parser.add_argument('--model', type=str, default='fraud_detector_model.pkl',
                       help='Path to model file')
    parser.add_argument('--n-samples', type=int, default=None,
                       help='Number of samples to use for training')
    parser.add_argument('--stream-url', type=str, help='SSE stream URL')
    parser.add_argument('--report-url', type=str, help='URL to report predictions')
    
    args = parser.parse_args()
    
    try:
        if args.mode == 'train':
            if not args.csv:
                print("Error: --csv required for training")
                sys.exit(1)
            train_and_evaluate_example(args.csv, args.n_samples)
            
        elif args.mode == 'predict':
            if not args.csv:
                print("Error: --csv required for prediction")
                sys.exit(1)
            predict_example(args.csv, args.model)
            
        elif args.mode == 'stream':
            if not args.stream_url:
                print("Error: --stream-url required for streaming")
                sys.exit(1)
            streaming_example(args.stream_url, args.report_url, args.model)
            
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

