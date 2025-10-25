from fileinput import filename

import numpy as np
from scipy.linalg import inv, det
import json
from data_processing import split_csv_to_np_arrays

def estimate_gaussian(X):
	"""
	Estimate mean and covariance matrix from training data

	Parameters:
	-----------
	X : numpy.ndarray
		Training data matrix (n_samples, n_features)

	Returns:
	--------
	mean_values : numpy.ndarray
		Mean vector (n_features,)
	covariance_matrix : numpy.ndarray
		Covariance matrix (n_features, n_features)
	"""
	mean_values = np.mean(X, axis=0)
	covariance_matrix = np.cov(X, rowvar=False)

	return mean_values, covariance_matrix


def multivariate_gaussian(X, mean_values, covariance_matrix):
	"""
	Calculate multivariate Gaussian probability for each sample

	Parameters:
	-----------
	X : numpy.ndarray
		Data matrix (n_samples, n_features)
	mean_values : numpy.ndarray
		Mean vector (n_features,)
	covariance_matrix : numpy.ndarray
		Covariance matrix (n_features, n_features)

	Returns:
	--------
	probabilities : numpy.ndarray
		Probability for each sample (n_samples,)
	"""
	n_samples, n_features = X.shape

	# Calculate difference from mean
	difference = X - mean_values

	# Calculate inverse and determinant
	inverse_covariance = inv(covariance_matrix)
	determinant = det(covariance_matrix)

	# Calculate exponent: -0.5 * (X-μ)ᵀ Σ⁻¹ (X-μ)
	exponent = -0.5 * np.sum((difference @ inverse_covariance) * difference, axis=1)

	# Calculate probability
	normalizer = 1.0 / np.sqrt((2 * np.pi) ** n_features * determinant)
	probabilities = normalizer * np.exp(exponent)

	return probabilities


def check_predictions(predictions, truths):
	"""
	Calculate confusion matrix elements

	Parameters:
	-----------
	predictions : numpy.ndarray
		Binary predictions (0 or 1)
	truths : numpy.ndarray
		Ground truth labels (0 or 1)

	Returns:
	--------
	false_positives : int
	false_negatives : int
	true_positives : int
	"""
	false_positives = np.sum((predictions == 1) & (truths == 0))
	false_negatives = np.sum((predictions == 0) & (truths == 1))
	true_positives = np.sum((predictions == 1) & (truths == 1))

	return false_positives, false_negatives, true_positives


def metrics(true_positives, false_positives, false_negatives):
	"""
	Calculate precision, recall, and F1 score

	Parameters:
	-----------
	true_positives : int
	false_positives : int
	false_negatives : int

	Returns:
	--------
	precision : float
	recall : float
	F1 : float
	"""
	# Avoid division by zero
	if true_positives + false_positives == 0:
		precision = 0.0
	else:
		precision = true_positives / (true_positives + false_positives)

	if true_positives + false_negatives == 0:
		recall = 0.0
	else:
		recall = true_positives / (true_positives + false_negatives)

	if precision + recall == 0:
		F1 = 0.0
	else:
		F1 = 2 * (precision * recall) / (precision + recall)

	return precision, recall, F1


def optimal_threshold(truths, probabilities):
	"""
	Find optimal threshold that maximizes F1 score

	Parameters:
	-----------
	truths : numpy.ndarray
		Ground truth labels (0 or 1)
	probabilities : numpy.ndarray
		Predicted probabilities

	Returns:
	--------
	best_epsilon : float
		Optimal threshold value
	best_F1 : float
		Best F1 score achieved
	associated_precision : float
		Precision at best threshold
	associated_recall : float
		Recall at best threshold
	"""
	best_epsilon = 0
	best_F1 = 0
	associated_precision = 0
	associated_recall = 0

	# Create range of threshold values to test
	stepsize = (np.max(probabilities) - np.min(probabilities)) / 1000
	epsilons = np.arange(np.min(probabilities), np.max(probabilities), stepsize)

	for epsilon in epsilons:
		# Make predictions based on threshold
		predictions = (probabilities < epsilon).astype(int)

		# Calculate metrics
		fp, fn, tp = check_predictions(predictions, truths)

		if tp + fp + fn == 0:
			continue

		precision, recall, F1 = metrics(tp, fp, fn)

		# Update best values if F1 improved
		if F1 > best_F1:
			best_F1 = F1
			best_epsilon = epsilon
			associated_precision = precision
			associated_recall = recall

	return best_epsilon, best_F1, associated_precision, associated_recall


def identify_outliers(X, y_validation):
	"""
	Complete anomaly detection pipeline

	Parameters:
	-----------
	X : numpy.ndarray
		Training data matrix (n_samples, n_features)
	y_validation : numpy.ndarray
		Validation labels for threshold optimization

	Returns:
	--------
	outlier_indices : numpy.ndarray
		Indices of detected outliers
	probabilities : numpy.ndarray
		Probability for each sample
	epsilon : float
		Optimal threshold
	F1 : float
		F1 score on validation set
	"""
	# Estimate Gaussian parameters
	mean_values, covariance_matrix = estimate_gaussian(X)

	# Calculate probabilities
	probabilities = multivariate_gaussian(X, mean_values, covariance_matrix)

	# Find optimal threshold
	epsilon, F1, precision, recall = optimal_threshold(y_validation, probabilities)

	# Identify outliers
	outlier_indices = np.where(probabilities < epsilon)[0]

	print(f"Model Performance:")
	print(f"  F1 Score: {F1:.4f}")
	print(f"  Precision: {precision:.4f}")
	print(f"  Recall: {recall:.4f}")
	print(f"  Threshold: {epsilon:.6e}")
	print(f"  Detected {len(outlier_indices)} outliers out of {len(X)} samples")

	return outlier_indices, probabilities, epsilon, F1


class GaussianAnomalyDetector:
	"""
	Complete fraud detection system using Gaussian anomaly detection
	"""

	def __init__(self):
		self.mean = None
		self.covariance = None
		self.threshold = None
		self.cov_inv = None
		self.cov_det = None
		self.n_features = None
		self.F1 = None
		self.precision = None
		self.recall = None
		self.is_trained = False

	def fit(self, X_train, y_validation):
		"""
		Train the model on training data and optimize threshold

		Parameters:
		-----------
		X_train : numpy.ndarray
			Training data (legitimate transactions)
		y_validation : numpy.ndarray
			Validation labels for threshold optimization
		"""
		print("Training Gaussian Anomaly Detector...")

		# Estimate parameters
		self.mean, self.covariance = estimate_gaussian(X_train)
		self.n_features = X_train.shape[1]

		# Pre-compute for faster inference
		self.cov_inv = inv(self.covariance)
		self.cov_det = det(self.covariance)

		# Calculate probabilities
		probabilities = self.predict_probability(X_train)

		# Find optimal threshold
		self.threshold, self.F1, self.precision, self.recall = \
			optimal_threshold(y_validation, probabilities)

		self.is_trained = True

		print(f"\nTraining complete!")
		print(f"  F1 Score: {self.F1:.4f}")
		print(f"  Precision: {self.precision:.4f}")
		print(f"  Recall: {self.recall:.4f}")
		print(f"  Threshold: {self.threshold:.6e}")

	def predict_probability(self, X):
		"""
		Calculate probability for each sample

		Parameters:
		-----------
		X : numpy.ndarray
			Data matrix (n_samples, n_features) or (n_features,)

		Returns:
		--------
		probabilities : numpy.ndarray
			Probability for each sample
		"""
		if not self.is_trained:
			raise ValueError("Model must be trained before prediction. Call fit() first.")

		# Handle single sample
		if X.ndim == 1:
			X = X.reshape(1, -1)

		return multivariate_gaussian(X, self.mean, self.covariance)

	def predict_single(self, features):
		"""
		Fast prediction for single transaction (real-time)

		Parameters:
		-----------
		features : numpy.ndarray
			Feature vector for single transaction

		Returns:
		--------
		result : dict
			Prediction details
		"""
		prob = self.predict_probability(features)[0]
		is_fraud = prob < self.threshold
		threat_score = 100 * (1 - min(prob / self.threshold, 1.0))

		# Classify threat level
		if threat_score >= 90:
			threat_level = 'CRITICAL'
		elif threat_score >= 70:
			threat_level = 'HIGH'
		elif threat_score >= 50:
			threat_level = 'MEDIUM'
		elif threat_score >= 30:
			threat_level = 'LOW'
		else:
			threat_level = 'MINIMAL'

		return {
			'is_fraud': bool(is_fraud),
			'probability': float(prob),
			'threshold': float(self.threshold),
			'threat_score': float(threat_score),
			'threat_level': threat_level,
			'deviation': float(self.threshold - prob)
		}

	def save_model(self, filepath='fraud_model.json'):
		"""
		Save model parameters to JSON file

		Parameters:
		-----------
		filepath : str
			Path to save model
		"""
		if not self.is_trained:
			raise ValueError("Model must be trained before saving.")

		model_data = {
			'mean': self.mean.tolist(),
			'covariance': self.covariance.tolist(),
			'threshold': float(self.threshold),
			'F1': float(self.F1),
			'precision': float(self.precision),
			'recall': float(self.recall),
			'n_features': int(self.n_features)
		}

		with open(filepath, 'w') as f:
			json.dump(model_data, f, indent=2)

		print(f"Model saved to {filepath}")

	def load_model(self, filepath='fraud_model.json'):
		"""
		Load model parameters from JSON file

		Parameters:
		-----------
		filepath : str
			Path to model file
		"""
		with open(filepath, 'r') as f:
			model_data = json.load(f)

		self.mean = np.array(model_data['mean'])
		self.covariance = np.array(model_data['covariance'])
		self.threshold = model_data['threshold']
		self.F1 = model_data['F1']
		self.precision = model_data['precision']
		self.recall = model_data['recall']
		self.n_features = model_data['n_features']

		# Pre-compute for faster inference
		self.cov_inv = inv(self.covariance)
		self.cov_det = det(self.covariance)

		self.is_trained = True

		print(f"Model loaded from {filepath}")
		print(f"  F1 Score: {self.F1:.4f}")
		print(f"  Precision: {self.precision:.4f}")
		print(f"  Recall: {self.recall:.4f}")


# Example usage
if __name__ == "__main__":
	filename = './hackathon-labeled-train.csv'
	features = [1, 2]
	X_train, y_val, z_test = split_csv_to_np_arrays(filename, features)

	# Train
	detector = GaussianAnomalyDetector()
	detector.fit(X_train, y_val)

	# Save for production use
	detector.save_model('fraud_model.json')

