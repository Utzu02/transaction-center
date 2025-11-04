import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Calendar, CreditCard, MapPin, User, Shield, RefreshCw } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { useToast } from '../components/common/ToastContainer';
import apiService from '../services/api';
import { formatCurrency } from '../utils/formatters';

const TransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [transaction, setTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch transaction from backend
  useEffect(() => {
    const fetchTransaction = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.getTransaction(id);
        
        if (response.success && response.transaction) {
          const tx = response.transaction;
          // Transform backend data to frontend format
          setTransaction({
            id: tx.trans_num || tx.id,
            merchant: tx.merchant || 'Unknown',
            merchantCategory: tx.category || 'Unknown',
            amount: tx.amt !== undefined && tx.amt !== null ? formatCurrency(tx.amt) : formatCurrency(tx.amount),
            status: tx.status || 'accepted',
            riskScore: tx.risk_score || 0,
            date: tx.trans_date && tx.trans_time ? `${tx.trans_date} ${tx.trans_time}` : tx.created_at,
            transNum: tx.trans_num || tx.id,
            
            // Card details
            cardNumber: tx.cc_num || '',
            cardLast4: tx.cc_num ? tx.cc_num.slice(-4) : '',
            cardType: 'Card',
            
            // Customer details
            customerName: tx.first && tx.last ? `${tx.first} ${tx.last}` : (tx.customer || 'Unknown'),
            customerGender: tx.gender === 'M' ? 'Male' : tx.gender === 'F' ? 'Female' : 'Unknown',
            customerJob: tx.job || 'Unknown',
            customerDob: tx.dob || 'Unknown',
            customerEmail: '', // Not in database
            
            // Location details
            street: tx.street || '',
            city: tx.city || '',
            state: tx.state || '',
            zip: tx.zip || '',
            country: 'United States',
            lat: tx.lat || '',
            long: tx.long || '',
            cityPop: tx.city_pop ? tx.city_pop.toLocaleString() : '',
            
            // Merchant location
            merchLat: tx.merch_lat || '',
            merchLong: tx.merch_long || '',
            
            // Additional details
            category: tx.category || 'Unknown',
            profile: '', // Not in database
            unixTime: tx.unix_time || '',
            processingTime: '', // Not in database
            currency: 'USD',
            fee: '', // Not in database
            netAmount: '', // Not in database
          });
        } else {
          toast.showError('Transaction not found', 3000);
          navigate('/transactions');
        }
      } catch (error) {
        console.error('Error fetching transaction:', error);
        toast.showError('Failed to load transaction details', 5000);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchTransaction();
    }
  }, [id, navigate, toast]);

  if (!transaction && !isLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto flex items-center justify-center h-full">
              <div className="text-center">
                <XCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
                <p className="text-gray-600">Transaction not found</p>
                <Button onClick={() => navigate('/transactions')} className="mt-4">
                  Back to Transactions
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const displayTransaction = transaction;
  
  const getStatusInfo = (status) => {
    if (status === 'completed' || status === 'accepted') {
      return {
        icon: CheckCircle,
        color: 'text-success-600',
        bg: 'bg-success-100',
        label: 'Accepted',
        variant: 'success'
      };
    }
    return {
      icon: XCircle,
      color: 'text-danger-600',
      bg: 'bg-danger-100',
      label: 'Blocked',
      variant: 'danger'
    };
  };

  const statusInfo = getStatusInfo(transaction.status);
  const StatusIcon = statusInfo.icon;

  const getRiskColor = (score) => {
    if (score >= 70) return { color: 'text-danger-600', bg: 'bg-danger-50', label: 'High Risk' };
    if (score >= 40) return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Medium Risk' };
    return { color: 'text-success-600', bg: 'bg-success-50', label: 'Low Risk' };
  };

  const riskInfo = getRiskColor(transaction.riskScore);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-cyan-50 to-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/transactions')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <p>Back to Transactions</p>
            </Button>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">Transaction Details</h1>
                <p className="text-gray-600">ID: {transaction.id}</p>
              </div>
              <div className="flex gap-3">
                <Badge variant={statusInfo.variant} className="text-lg px-4 py-2">
                  {statusInfo.label}
                </Badge>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${riskInfo.bg}`}>
                  <Shield className={`w-5 h-5 ${riskInfo.color}`} />
                  <span className={`font-semibold ${riskInfo.color}`}>
                    {riskInfo.label} ({transaction.riskScore}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Main Info Cards */}
            <div className="grid lg:grid-cols-3 gap-6">
              <Card>
                <div className={`p-3 rounded-lg ${statusInfo.bg} inline-flex mb-3`}>
                  <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Status</h3>
                <p className="text-2xl font-bold text-gray-900">{statusInfo.label}</p>
                <p className="text-sm text-gray-500 mt-2">{transaction.date}</p>
              </Card>

              <Card>
                <div className="p-3 rounded-lg bg-primary-100 inline-flex mb-3">
                  <CreditCard className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Amount</h3>
                <p className="text-2xl font-bold text-gray-900">{transaction.amount}</p>
                <p className="text-sm text-gray-500 mt-2">Fee: {transaction.fee}</p>
              </Card>

              <Card>
                <div className="p-3 rounded-lg bg-purple-100 inline-flex mb-3">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Merchant</h3>
                <p className="text-2xl font-bold text-gray-900">{transaction.merchant}</p>
                <p className="text-sm text-gray-500 mt-2">{transaction.merchantCategory}</p>
              </Card>
            </div>

            {/* Detailed Information */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Payment Information */}
              <Card>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Information
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-semibold text-gray-900">{transaction.method}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Card Type</span>
                    <span className="font-semibold text-gray-900">{transaction.cardType}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Card Number</span>
                    <span className="font-semibold text-gray-900 font-mono">**** **** **** {transaction.cardLast4}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Transaction Number</span>
                    <span className="font-semibold text-gray-900 font-mono text-xs">{transaction.transNum}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Processing Time</span>
                    <span className="font-semibold text-gray-900">{transaction.processingTime}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Currency</span>
                    <span className="font-semibold text-gray-900">{transaction.currency}</span>
                  </div>
                </div>
              </Card>

              {/* Customer Information */}
              <Card>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Name</span>
                    <span className="font-semibold text-gray-900">{transaction.customerName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Gender</span>
                    <span className="font-semibold text-gray-900">{transaction.customerGender}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Date of Birth</span>
                    <span className="font-semibold text-gray-900">{transaction.customerDob}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Occupation</span>
                    <span className="font-semibold text-gray-900">{transaction.customerJob}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Street</span>
                    <span className="font-semibold text-gray-900 text-sm">{transaction.street}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Country</span>
                    <span className="font-semibold text-gray-900">{transaction.country}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">City, State</span>
                    <span className="font-semibold text-gray-900">{transaction.city}, {transaction.state}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">ZIP Code</span>
                    <span className="font-semibold text-gray-900">{transaction.zip}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">City Population</span>
                    <span className="font-semibold text-gray-900">{transaction.cityPop}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Coordinates</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-1 font-mono text-xs">
                      <MapPin className="w-4 h-4" />
                      {transaction.lat}, {transaction.long}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Transaction Timeline */}
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Transaction Timeline
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success-600" />
                    </div>
                    <div className="w-0.5 h-16 bg-gray-200"></div>
                  </div>
                  <div className="flex-1 pb-8">
                    <h3 className="font-semibold text-gray-900">Transaction Initiated</h3>
                    <p className="text-sm text-gray-600">Customer initiated payment</p>
                    <p className="text-xs text-gray-500 mt-1">{transaction.date}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="w-0.5 h-16 bg-gray-200"></div>
                  </div>
                  <div className="flex-1 pb-8">
                    <h3 className="font-semibold text-gray-900">Fraud Check Completed</h3>
                    <p className="text-sm text-gray-600">Risk score: {transaction.riskScore}% - {riskInfo.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{transaction.date}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full ${statusInfo.bg} flex items-center justify-center`}>
                      <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Transaction {statusInfo.label}</h3>
                    <p className="text-sm text-gray-600">Payment processed successfully</p>
                    <p className="text-xs text-gray-500 mt-1">{transaction.date}</p>
                  </div>
                </div>
              </div>
            </Card>

          </div>
        </main>
      </div>
    </div>
  );
};

export default TransactionDetail;

