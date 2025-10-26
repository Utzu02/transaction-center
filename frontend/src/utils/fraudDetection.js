// Fraud Detection Logic - Real-time Analysis
// This module contains the fraud detection algorithms

/**
 * Calculate risk score for a transaction (0-100)
 */
export const calculateRiskScore = (transaction) => {
  let score = 0;
  const amt = parseFloat(transaction.amt || 0);
  const category = transaction.category || '';
  const merchant = transaction.merchant || '';
  
  // High amount transactions (weight: 30)
  if (amt > 500) score += 30;
  else if (amt > 200) score += 20;
  else if (amt > 100) score += 10;
  
  // Unusual hours (if unix_time available)
  if (transaction.unix_time) {
    const hour = new Date(transaction.unix_time * 1000).getHours();
    if (hour >= 0 && hour <= 5) score += 15; // Late night transactions
  }
  
  // Distance between customer and merchant (if coordinates available)
  if (transaction.lat && transaction.long && transaction.merch_lat && transaction.merch_long) {
    const distance = calculateDistance(
      transaction.lat, transaction.long,
      transaction.merch_lat, transaction.merch_long
    );
    if (distance > 500) score += 25; // Very far from home
    else if (distance > 200) score += 15;
    else if (distance > 100) score += 10;
  }
  
  // High-risk categories
  const highRiskCategories = ['gas_transport', 'shopping_net', 'misc_net'];
  if (highRiskCategories.some(cat => category.toLowerCase().includes(cat))) {
    score += 15;
  }
  
  // Multiple small transactions pattern (would need transaction history)
  // This is a simplified version
  if (amt < 10) score += 5;
  
  return Math.min(score, 100);
};

/**
 * Determine if transaction is fraudulent based on risk score
 */
export const isFraudulent = (transaction, threshold = 50) => {
  const riskScore = calculateRiskScore(transaction);
  return riskScore >= threshold;
};

/**
 * Classify fraud pattern type
 */
export const classifyFraudPattern = (transaction) => {
  const amt = parseFloat(transaction.amt || 0);
  const category = transaction.category || '';
  
  if (amt > 500) return 'High-Value Transaction';
  
  if (transaction.lat && transaction.long && transaction.merch_lat && transaction.merch_long) {
    const distance = calculateDistance(
      transaction.lat, transaction.long,
      transaction.merch_lat, transaction.merch_long
    );
    if (distance > 500) return 'Geographical Anomaly';
  }
  
  if (transaction.unix_time) {
    const hour = new Date(transaction.unix_time * 1000).getHours();
    if (hour >= 0 && hour <= 5) return 'Unusual Time';
  }
  
  if (category.toLowerCase().includes('net') || category.toLowerCase().includes('online')) {
    return 'Online Purchase Risk';
  }
  
  if (amt < 10) return 'Micro-Transaction Pattern';
  
  return 'Suspicious Behavior';
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dob) => {
  if (!dob) return null;
  
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Get age segment
 */
export const getAgeSegment = (dob) => {
  const age = calculateAge(dob);
  if (!age) return 'Unknown';
  
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  if (age < 65) return '55-64';
  return '65+';
};

/**
 * Format transaction for display
 */
export const formatTransaction = (transaction) => {
  // Use backend fraud detection if available, otherwise calculate locally
  // Consistent fraud detection: check is_fraud, isFraud, status === 'blocked' or 'unknown', OR calculate locally
  const isFraud = transaction.is_fraud !== undefined 
    ? transaction.is_fraud 
    : transaction.isFraud !== undefined 
    ? transaction.isFraud 
    : transaction.status === 'blocked' || transaction.status === 'unknown'
    ? true
    : isFraudulent(transaction);
  
  return {
    id: transaction.trans_num,
    customer: `${transaction.first} ${transaction.last}`,
    merchant: transaction.merchant,
    amount: parseFloat(transaction.amt),
    category: transaction.category,
    location: `${transaction.city}, ${transaction.state}`,
    timestamp: transaction.unix_time,
    riskScore: transaction.risk_score || calculateRiskScore(transaction),
    isFraud: isFraud,
    is_fraud: isFraud, // Add both for consistency
    pattern: transaction.pattern || classifyFraudPattern(transaction),
    ageSegment: getAgeSegment(transaction.dob),
    age: calculateAge(transaction.dob),
    distance: transaction.distance || (transaction.lat && transaction.merch_lat 
      ? calculateDistance(transaction.lat, transaction.long, transaction.merch_lat, transaction.merch_long)
      : null),
    raw: transaction
  };
};

/**
 * Get response time performance category
 */
export const getResponsePerformance = (responseTime) => {
  if (responseTime < 5) return 'excellent';
  if (responseTime < 15) return 'good';
  if (responseTime < 25) return 'acceptable';
  return 'poor';
};

