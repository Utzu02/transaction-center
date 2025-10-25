# POS Fraud Detection System - Python Implementation

This is a complete Python implementation of the MATLAB anomaly detection code, specifically designed for Point of Sale (POS) fraud detection in real-time streaming environments.

## Overview

This system uses **Gaussian Anomaly Detection** (multivariate Gaussian distribution) to identify fraudulent transactions. It's optimized for the ESTEEC Olympics Hackathon challenge with the following features:

- ✅ Real-time fraud detection (< 30 seconds processing time)
- ✅ SSE (Server-Sent Events) streaming support
- ✅ Advanced feature engineering for POS data
- ✅ Comprehensive analytics dashboard
- ✅ Configurable training sample size
- ✅ Model persistence (save/load)

## Architecture

### Core Components

1. **anomaly_detection.py** - Core Gaussian anomaly detection algorithms
   - `estimate_gaussian()` - Estimate mean and covariance matrix
   - `multivariate_gaussian()` - Calculate probabilities
   - `optimal_threshold()` - Find optimal threshold using F1 score
   - `identify_outliers()` - Complete outlier detection pipeline

2. **feature_engineering.py** - Feature extraction and preprocessing
   - Distance calculations (customer to merchant)
   - Temporal features (hour, day of week, night/weekend flags)
   - Amount transformations (log scaling)
   - Categorical encoding
   - Age and demographic features

3. **fraud_detector.py** - Main detector class
   - Training with configurable sample size
   - Real-time prediction
   - Model evaluation
   - Model persistence

4. **streaming.py** - Real-time streaming handler
   - SSE connection management
   - Event processing with timeout handling
   - Automatic reporting to server
   - Performance statistics

5. **dashboard.py** - Analytics and visualization
   - Fraud pattern analysis
   - Age segment analysis
   - Temporal trends
   - Visual dashboards

## Installation

```bash
# Install dependencies
pip install -r requirements.txt
```

## Quick Start

### 1. Train the Model

```bash
python example_usage.py train --csv your_data.csv --n-samples 10000
```

This will:
- Load your CSV data
- Split into train/validation/test sets
- Train the Gaussian anomaly detector
- Evaluate on test set
- Save the model to `fraud_detector_model.pkl`

### 2. Make Predictions

```bash
python example_usage.py predict --csv new_transactions.csv --model fraud_detector_model.pkl
```

This will:
- Load the trained model
- Predict on new transactions
- Save predictions to `new_transactions_predictions.csv`

### 3. Real-Time Streaming Detection

```bash
python example_usage.py stream --stream-url YOUR_SSE_URL --report-url YOUR_REPORT_URL --model fraud_detector_model.pkl
```

This will:
- Connect to the SSE stream
- Process transactions in real-time
- Report fraud detections back to server
- Display statistics

## Python API Usage

### Training

```python
from fraud_detector import FraudDetector
import pandas as pd

# Load data
df = pd.read_csv('transactions.csv')

# Initialize detector
detector = FraudDetector()

# Train (limit to 5000 samples for faster training)
metrics = detector.train(df, n_samples=5000)

# Save model
detector.save_model('my_model.pkl')
```

### Prediction

```python
from fraud_detector import FraudDetector
import pandas as pd

# Load model
detector = FraudDetector()
detector.load_model('my_model.pkl')

# Load new data
df_new = pd.read_csv('new_transactions.csv')

# Predict
predictions, probabilities, df_processed = detector.predict(df_new)

# Single transaction prediction (for real-time)
transaction = {
    'trans_date': '2024-01-15',
    'trans_time': '14:30:00',
    'amt': 250.00,
    'lat': 40.7128,
    'long': -74.0060,
    'merch_lat': 40.7580,
    'merch_long': -73.9855,
    'category': 'grocery_pos',
    'gender': 'M',
    # ... other fields
}

prediction, probability, details = detector.predict_single(transaction)
print(f"Fraud: {prediction}, Probability: {probability}")
```

### Analytics Dashboard

```python
from dashboard import FraudAnalyticsDashboard
import pandas as pd

# Load data with predictions
df = pd.read_csv('transactions_with_predictions.csv')

# Create dashboard
dashboard = FraudAnalyticsDashboard(df, predictions=df['predicted_fraud'].values)

# Get insights
patterns = dashboard.get_fraud_patterns(time_window_hours=1, top_n=5)
print("Top 5 fraud patterns in last hour:")
for pattern in patterns:
    print(f"  - {pattern['pattern']}: {pattern['count']} occurrences")

# Generate report
report = dashboard.generate_report()
print(report)

# Create visualizations
dashboard.plot_fraud_distribution('fraud_dashboard.png')
```

## CSV Data Format

Your CSV should contain these columns:

**Required:**
- `trans_date` - Transaction date
- `trans_time` - Transaction time  
- `amt` - Transaction amount
- `lat`, `long` - Customer location
- `merch_lat`, `merch_long` - Merchant location
- `is_fraud` - Fraud label (0/1) for training data

**Optional (but recommended):**
- `transaction_id` - Unique transaction ID
- `category` - Transaction category
- `gender` - Customer gender
- `dob` - Date of birth
- `city_pop` - City population
- `unix_time` - Unix timestamp
- Other demographic fields

## Features Extracted

The system automatically extracts these features:

1. **Amount Features**
   - Original amount
   - Log-transformed amount

2. **Spatial Features**
   - Distance between customer and merchant (Haversine)
   - Latitude/longitude

3. **Temporal Features**
   - Hour of day
   - Day of week
   - Is night (10PM-5AM)
   - Is weekend

4. **Demographic Features**
   - Gender (encoded)
   - Age (calculated from DOB)
   - City population (log-transformed)

5. **Behavioral Features** (if sequential data)
   - Transaction count per customer
   - Time since last transaction
   - Deviation from user's average amount

## Algorithm Details

### Gaussian Anomaly Detection

The system models normal (non-fraudulent) transactions using a multivariate Gaussian distribution:

1. **Training Phase:**
   - Extract features from training data
   - Estimate mean vector μ and covariance matrix Σ using only normal transactions
   - Find optimal threshold ε by maximizing F1 score on validation set

2. **Prediction Phase:**
   - Calculate probability p(x) for new transaction using: p(x) = (1/√((2π)^n |Σ|)) * exp(-0.5 * (x-μ)^T Σ^(-1) (x-μ))
   - Flag as fraud if p(x) < ε

3. **Advantages:**
   - Fast prediction (< 1ms per transaction)
   - Works well with imbalanced data
   - Interpretable (probability-based)
   - No deep learning required

## Performance Optimization

For real-time streaming (30-second requirement):

1. **Feature Engineering:** Pre-computed where possible
2. **Normalization:** Stored parameters from training
3. **Matrix Operations:** Cached inverse and determinant
4. **Single Prediction:** Optimized path for individual transactions

Typical performance:
- Training: ~1-5 seconds for 10K samples
- Prediction: ~0.1-1ms per transaction
- Well within 30-second timeout

## Business Questions Answered

The dashboard provides answers to:

1. **Top 5 most common fraud patterns in the last hour**
   ```python
   patterns = dashboard.get_fraud_patterns(time_window_hours=1, top_n=5)
   ```

2. **Fraud alerts in the last 2 hours**
   ```python
   alerts = dashboard.get_fraud_alerts(time_window_hours=2)
   ```

3. **Age segment most exposed to fraud**
   ```python
   age_fraud = dashboard.get_fraud_by_age_segment()
   most_exposed = max(age_fraud.items(), key=lambda x: x[1])
   ```

## MATLAB to Python Conversion

All MATLAB functions have been faithfully converted:

| MATLAB Function | Python Equivalent | Notes |
|----------------|-------------------|-------|
| `estimate_gaussian.m` | `estimate_gaussian()` | Added n_samples parameter |
| `multivariate_gaussian.m` | `multivariate_gaussian()` | Uses NumPy broadcasting |
| `optimal_threshold.m` | `optimal_threshold()` | Vectorized operations |
| `identify_outliers.m` | `identify_outliers()` | Returns additional metrics |
| `metrics.m` | `metrics()` | Added zero-division handling |
| `check_predictions.m` | `check_predictions()` | NumPy boolean indexing |

## Project Structure

```
pythonsolve/
├── anomaly_detection.py      # Core algorithms (converted from MATLAB)
├── feature_engineering.py    # Feature extraction for POS data
├── fraud_detector.py         # Main detector class
├── streaming.py              # Real-time streaming handler
├── dashboard.py              # Analytics and visualization
├── example_usage.py          # Example scripts and CLI
├── requirements.txt          # Python dependencies
└── README.md                 # This file
```

## Example Workflow

```bash
# 1. Train on historical data (use 10000 samples)
python example_usage.py train --csv historical_transactions.csv --n-samples 10000

# 2. Evaluate on test data
python example_usage.py predict --csv test_transactions.csv

# 3. View analytics
python dashboard.py test_transactions_predictions.csv

# 4. Deploy for real-time detection
python example_usage.py stream --stream-url https://your-sse-endpoint --report-url https://your-report-endpoint
```

## Tips for Hackathon

1. **Training Speed:** Use `--n-samples` to limit training data for faster iteration
2. **Feature Selection:** Modify `get_feature_columns()` in `feature_engineering.py`
3. **Threshold Tuning:** The optimal threshold is found automatically via F1 score
4. **Real-time Performance:** System is optimized for < 30 second processing
5. **Monitoring:** Use `get_stats()` on StreamingHandler to track performance

## Troubleshooting

**Issue:** Singular covariance matrix
- **Solution:** Reduce number of features or increase training samples

**Issue:** Low recall (missing frauds)
- **Solution:** The threshold is auto-optimized, but you can adjust by modifying `optimal_threshold()`

**Issue:** High false positives
- **Solution:** Train on more normal transactions, or adjust F1 optimization

**Issue:** Slow predictions
- **Solution:** Reduce number of features in `get_feature_columns()`

## License

Based on MATLAB code from numerical methods course. Python implementation for ESTEEC Olympics Hackathon.

## Contact

For questions or issues, refer to the original MATLAB repository or hackathon mentors.

---

**Good luck at the hackathon! 🚀**

