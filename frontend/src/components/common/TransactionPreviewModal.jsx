import { X, MapPin, Calendar, Clock, DollarSign, CreditCard, User, Building, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import Badge from './Badge';

const TransactionPreviewModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  // Consistent fraud detection: check is_fraud, isFraud, OR status === 'blocked' or 'unknown'
  const isFraud = transaction.isFraud || transaction.is_fraud || transaction.status === 'blocked' || transaction.status === 'unknown';
  const amount = parseFloat(transaction.amount || transaction.amt || 0) || 0;
  const transNum = transaction.trans_num || transaction.id;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    if (typeof time === 'string' && time.includes(':')) return time;
    return new Date(time).toLocaleTimeString();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-scaleIn">
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${
          isFraud ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200' : 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isFraud ? 'bg-red-500' : 'bg-green-500'} shadow-lg`}>
              {isFraud ? (
                <AlertTriangle className="w-5 h-5 text-white" />
              ) : (
                <CheckCircle className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
              <p className="text-xs text-gray-600">ID: {transNum}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isFraud ? 'danger' : 'success'}>
              {isFraud ? 'FRAUDULENT' : 'LEGITIMATE'}
            </Badge>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Amount Section */}
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <DollarSign className="w-6 h-6" />
                <div>
                  <p className="text-xs opacity-90">Transaction Amount</p>
                  <p className="text-3xl font-bold">${amount.toFixed(2)}</p>
                </div>
              </div>
              {transaction.fraud_probability !== undefined && transaction.fraud_probability !== null && (
                <div className="text-right bg-white/20 rounded-lg p-2">
                  <p className="text-xs opacity-90">Fraud Risk</p>
                  <p className="text-xl font-bold">
                    {(parseFloat(transaction.fraud_probability) * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Merchant Information */}
            <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-3">
                <Building className="w-4 h-4 text-purple-600" />
                Merchant Information
              </h3>
              <div className="space-y-2">
                <InfoRow 
                  label="Merchant Name" 
                  value={transaction.merchant || 'Unknown'} 
                />
                <InfoRow 
                  label="Category" 
                  value={transaction.category || 'N/A'} 
                />
                <InfoRow 
                  label="Location" 
                  value={`${transaction.merch_lat || 'N/A'}, ${transaction.merch_long || 'N/A'}`}
                  icon={<MapPin className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-green-50 rounded-xl p-3 border border-green-200">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-green-600" />
                Customer Information
              </h3>
              <div className="space-y-2">
                <InfoRow 
                  label="Name" 
                  value={transaction.customer || `${transaction.first || ''} ${transaction.last || ''}`.trim() || 'Unknown'} 
                />
                <InfoRow 
                  label="Gender" 
                  value={transaction.gender || 'N/A'} 
                />
                <InfoRow 
                  label="Date of Birth" 
                  value={transaction.dob ? formatDate(transaction.dob) : 'N/A'} 
                />
                <InfoRow 
                  label="Job" 
                  value={transaction.job || 'N/A'} 
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-3 border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-red-600" />
              Location Details
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <InfoRow 
                label="Address" 
                value={transaction.street || 'N/A'} 
              />
              <InfoRow 
                label="City" 
                value={transaction.city || transaction.location || 'N/A'} 
              />
              <InfoRow 
                label="State" 
                value={transaction.state || 'N/A'} 
              />
              <InfoRow 
                label="ZIP Code" 
                value={transaction.zip || 'N/A'} 
              />
              <InfoRow 
                label="Customer Coordinates" 
                value={`${transaction.lat || 'N/A'}, ${transaction.long || 'N/A'}`} 
              />
              <InfoRow 
                label="City Population" 
                value={transaction.city_pop ? parseInt(transaction.city_pop).toLocaleString() : 'N/A'} 
              />
            </div>
          </div>

          {/* Transaction Metadata */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Date & Time */}
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-blue-600" />
                Date & Time
              </h3>
              <div className="space-y-2">
              <InfoRow 
                label="Transaction Date" 
                value={transaction.trans_date ? formatDate(transaction.trans_date) : formatDate(transaction.created_at)} 
                icon={<Calendar className="w-4 h-4" />}
              />
              <InfoRow 
                label="Transaction Time" 
                value={transaction.trans_time || formatTime(transaction.created_at)} 
                icon={<Clock className="w-4 h-4" />}
              />
              <InfoRow 
                label="Unix Timestamp" 
                value={transaction.unix_time || 'N/A'} 
              />
              </div>
            </div>

            {/* Card & Account Info */}
            <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-200">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                Card & Account
              </h3>
              <div className="space-y-2">
              <InfoRow 
                label="Card Number" 
                value={transaction.cc_num ? `****${transaction.cc_num.toString().slice(-4)}` : 'N/A'} 
                icon={<CreditCard className="w-4 h-4" />}
              />
              <InfoRow 
                label="Account Number" 
                value={transaction.acct_num || 'N/A'} 
              />
              <InfoRow 
                label="SSN" 
                value={transaction.ssn ? `***-**-${transaction.ssn.toString().slice(-4)}` : 'N/A'} 
              />
              </div>
            </div>
          </div>

          {/* Fraud Detection Info */}
          {isFraud && (
            <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-xl p-4 border-2 border-red-600 shadow-lg">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5" />
                Fraud Detection Analysis
              </h3>
              <div className="grid md:grid-cols-3 gap-3">
                {transaction.fraud_probability !== undefined && transaction.fraud_probability !== null && (
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Fraud Probability</p>
                    <p className="text-xl text-red-600 font-bold mt-0.5">{(parseFloat(transaction.fraud_probability) * 100).toFixed(2)}%</p>
                  </div>
                )}
                {transaction.confidence !== undefined && transaction.confidence !== null && (
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Confidence</p>
                    <p className="text-xl text-orange-600 font-bold mt-0.5">{(parseFloat(transaction.confidence) * 100).toFixed(1)}%</p>
                  </div>
                )}
                {transaction.pattern && (
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Pattern</p>
                    <p className="text-sm text-gray-900 font-bold mt-0.5">{transaction.pattern}</p>
                  </div>
                )}
                {transaction.riskScore !== undefined && transaction.riskScore !== null && (
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Risk Score</p>
                    <p className="text-xl text-red-600 font-bold mt-0.5">{String(transaction.riskScore)}</p>
                  </div>
                )}
                {transaction.processing_time !== undefined && transaction.processing_time !== null && (
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Processing</p>
                    <p className="text-sm text-gray-900 font-bold mt-0.5">{parseFloat(transaction.processing_time).toFixed(3)}s</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper component for info rows
const InfoRow = ({ label, value, icon }) => (
  <div className="flex items-start gap-1.5 p-1.5 rounded-lg hover:bg-white/50 transition-colors">
    {icon && <span className="text-gray-400 mt-0.5">{icon}</span>}
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-900 font-bold break-words mt-0.5">{value}</p>
    </div>
  </div>
);

export default TransactionPreviewModal;

