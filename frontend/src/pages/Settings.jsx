import { useState } from 'react';
import { Save, Plus, DollarSign, User, MapPin, Calendar, CreditCard, Building, Bell, Send } from 'lucide-react';
import { useToast } from '../components/common/ToastContainer';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import LiveMonitorControl from '../components/dashboard/LiveMonitorControl';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import apiService from '../services/api';

const Settings = () => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingNotif, setIsSubmittingNotif] = useState(false);

  // Notification debugger state
  const [notifForm, setNotifForm] = useState({
    title: 'Suspicious Transaction Detected',
    message: 'Multiple failed payment attempts detected',
    type: 'high',
    transaction_id: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    // Required fields
    trans_num: '',
    amt: '',
    merchant: '',
    
    // Optional transaction details
    category: 'grocery_pos',
    status: 'completed',
    is_fraud: false,
    risk_score: 0,
    
    // Date/time
    trans_date: new Date().toISOString().split('T')[0],
    trans_time: new Date().toTimeString().split(' ')[0],
    unix_time: Math.floor(Date.now() / 1000),
    
    // Customer personal info
    ssn: '',
    cc_num: '',
    acct_num: '',
    first: '',
    last: '',
    gender: 'M',
    dob: '',
    job: '',
    
    // Customer location
    street: '',
    city: '',
    state: '',
    zip: '',
    lat: '',
    long: '',
    city_pop: '',
    
    // Merchant location
    merch_lat: '',
    merch_long: ''
  });

  const handleConfigChange = (config) => {
    toast.showSuccess('Configuration saved successfully!', 3000);
  };

  const handleNotifInputChange = (e) => {
    const { name, value } = e.target;
    setNotifForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNotifSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingNotif(true);

    try {
      const notificationData = {
        title: notifForm.title,
        message: notifForm.message || notifForm.title,
        text: notifForm.message || notifForm.title,
        type: notifForm.type,
        transaction_id: notifForm.transaction_id || null,
        timestamp: new Date().toISOString(),
        read: false
      };

      console.log('📢 Creating test notification:', notificationData);
      const response = await apiService.createNotification(notificationData);

      if (response.success) {
        toast.showSuccess(`✅ Notification created successfully!`, 3000);
        
        // Reset form
        setNotifForm({
          title: 'Suspicious Transaction Detected',
          message: 'Multiple failed payment attempts detected',
          type: 'high',
          transaction_id: ''
        });
      } else {
        toast.showError('Failed to create notification', 3000);
      }
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      toast.showError(`Failed to create notification: ${error.message}`, 5000);
    } finally {
      setIsSubmittingNotif(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generateTransNum = () => {
    const hash = Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    setFormData(prev => ({ ...prev, trans_num: hash }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare data for backend
      const transactionData = {
        // Required
        trans_num: formData.trans_num,
        amt: parseFloat(formData.amt),
        merchant: formData.merchant,
        
        // Optional - only include if not empty
        ...(formData.category && { category: formData.category }),
        ...(formData.status && { status: formData.status }),
        is_fraud: formData.is_fraud,
        ...(formData.risk_score && { risk_score: parseInt(formData.risk_score) }),
        
        // Dates
        ...(formData.trans_date && { trans_date: formData.trans_date }),
        ...(formData.trans_time && { trans_time: formData.trans_time }),
        ...(formData.unix_time && { unix_time: parseInt(formData.unix_time) }),
        
        // Personal
        ...(formData.ssn && { ssn: formData.ssn }),
        ...(formData.cc_num && { cc_num: formData.cc_num }),
        ...(formData.acct_num && { acct_num: formData.acct_num }),
        ...(formData.first && { first: formData.first }),
        ...(formData.last && { last: formData.last }),
        ...(formData.gender && { gender: formData.gender }),
        ...(formData.dob && { dob: formData.dob }),
        ...(formData.job && { job: formData.job }),
        
        // Location
        ...(formData.street && { street: formData.street }),
        ...(formData.city && { city: formData.city }),
        ...(formData.state && { state: formData.state }),
        ...(formData.zip && { zip: formData.zip }),
        ...(formData.lat && { lat: parseFloat(formData.lat) }),
        ...(formData.long && { long: parseFloat(formData.long) }),
        ...(formData.city_pop && { city_pop: parseInt(formData.city_pop) }),
        
        // Merchant
        ...(formData.merch_lat && { merch_lat: parseFloat(formData.merch_lat) }),
        ...(formData.merch_long && { merch_long: parseFloat(formData.merch_long) })
      };

      const response = await apiService.createTransaction(transactionData);

      if (response.success) {
        toast.showSuccess(`Transaction ${formData.trans_num} added successfully!`, 3000);
        
        // Reset form
        setFormData({
          trans_num: '',
          amt: '',
          merchant: '',
          category: 'grocery_pos',
          status: 'completed',
          is_fraud: false,
          risk_score: 0,
          trans_date: new Date().toISOString().split('T')[0],
          trans_time: new Date().toTimeString().split(' ')[0],
          unix_time: Math.floor(Date.now() / 1000),
          ssn: '', cc_num: '', acct_num: '', first: '', last: '', 
          gender: 'M', dob: '', job: '', street: '', city: '', 
          state: '', zip: '', lat: '', long: '', city_pop: '',
          merch_lat: '', merch_long: ''
        });
      } else {
        toast.showError(response.error || 'Failed to add transaction', 5000);
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.showError('Failed to add transaction. Please check the backend connection.', 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
              <p className="text-gray-600">Configure your system and manually add transactions</p>
            </div>

            {/* Live Monitor Control Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Live Data Stream Configuration</h2>
              <LiveMonitorControl onChange={handleConfigChange} />
            </div>

            {/* Notification Debugger Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="w-6 h-6 text-purple-600" />
                Notification Debugger
              </h2>
              
              <Card>
                <form onSubmit={handleNotifSubmit} className="space-y-6">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-800">
                      <strong>🧪 Test Notifications:</strong> Create test notifications to debug the alerts system.
                      These will appear in the Alerts page and notification dropdown.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={notifForm.title}
                        onChange={handleNotifInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Suspicious Transaction Detected"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Severity *
                      </label>
                      <select
                        name="type"
                        value={notifForm.type}
                        onChange={handleNotifInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="high">High (Active Alert)</option>
                        <option value="medium">Medium (Pending)</option>
                        <option value="low">Low (Info)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={notifForm.message}
                      onChange={handleNotifInputChange}
                      required
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Multiple failed payment attempts detected from the same IP address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transaction ID (Optional)
                    </label>
                    <input
                      type="text"
                      name="transaction_id"
                      value={notifForm.transaction_id}
                      onChange={handleNotifInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="TXN-001234 or leave empty"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setNotifForm({
                        title: 'Suspicious Transaction Detected',
                        message: 'Multiple failed payment attempts detected',
                        type: 'high',
                        transaction_id: ''
                      })}
                    >
                      Reset
                    </Button>
                    
                    <Button
                      type="submit"
                      disabled={isSubmittingNotif}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                    >
                      <Send className="w-4 h-4" />
                      {isSubmittingNotif ? 'Sending...' : 'Create Test Notification'}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>

            {/* Manual Transaction Entry */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                <Plus className="inline w-6 h-6 mr-2" />
                Add Transaction Manually
              </h2>
              
              <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Required Fields */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                      Transaction Details (Required)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Transaction Number *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            name="trans_num"
                            value={formData.trans_num}
                            onChange={handleInputChange}
                            required
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="abc123..."
                          />
                          <Button 
                            type="button" 
                            onClick={generateTransNum}
                            variant="outline"
                            size="sm"
                          >
                            Generate
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount ($) *
                        </label>
                        <input
                          type="number"
                          name="amt"
                          value={formData.amt}
                          onChange={handleInputChange}
                          required
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="125.50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Merchant *
                        </label>
                        <input
                          type="text"
                          name="merchant"
                          value={formData.merchant}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Store Name"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Transaction Status */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Building className="w-5 h-5 mr-2 text-purple-600" />
                      Status & Classification
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="grocery_pos">Grocery</option>
                          <option value="gas_transport">Gas & Transport</option>
                          <option value="shopping_net">Shopping</option>
                          <option value="entertainment">Entertainment</option>
                          <option value="food_dining">Food & Dining</option>
                          <option value="health_fitness">Health & Fitness</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="completed">Completed</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Risk Score (0-100)</label>
                        <input
                          type="number"
                          name="risk_score"
                          value={formData.risk_score}
                          onChange={handleInputChange}
                          min="0"
                          max="100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="flex items-center pt-6">
                        <input
                          type="checkbox"
                          name="is_fraud"
                          checked={formData.is_fraud}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label className="ml-2 text-sm font-medium text-gray-700">
                          Mark as Fraud
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Date/Time */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-green-600" />
                      Date & Time
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          name="trans_date"
                          value={formData.trans_date}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                        <input
                          type="time"
                          name="trans_time"
                          value={formData.trans_time}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unix Timestamp</label>
                        <input
                          type="number"
                          name="unix_time"
                          value={formData.unix_time}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-orange-600" />
                      Customer Information (Optional)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input
                          type="text"
                          name="first"
                          value={formData.first}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          name="last"
                          value={formData.last}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="M">Male</option>
                          <option value="F">Female</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          name="dob"
                          value={formData.dob}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job</label>
                        <input
                          type="text"
                          name="job"
                          value={formData.job}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CreditCard className="w-5 h-5 mr-2 text-pink-600" />
                      Payment Information (Optional)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SSN</label>
                        <input
                          type="text"
                          name="ssn"
                          value={formData.ssn}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="123456789"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Credit Card Number</label>
                        <input
                          type="text"
                          name="cc_num"
                          value={formData.cc_num}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="4616481889874315776"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                        <input
                          type="text"
                          name="acct_num"
                          value={formData.acct_num}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="ACC123456"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-red-600" />
                      Location (Optional)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                        <input
                          type="text"
                          name="street"
                          value={formData.street}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          maxLength="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="CA"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                        <input
                          type="text"
                          name="zip"
                          value={formData.zip}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="10001"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City Population</label>
                        <input
                          type="number"
                          name="city_pop"
                          value={formData.city_pop}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer Latitude</label>
                        <input
                          type="number"
                          name="lat"
                          value={formData.lat}
                          onChange={handleInputChange}
                          step="any"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="40.7128"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer Longitude</label>
                        <input
                          type="number"
                          name="long"
                          value={formData.long}
                          onChange={handleInputChange}
                          step="any"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="-74.0060"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Merchant Latitude</label>
                        <input
                          type="number"
                          name="merch_lat"
                          value={formData.merch_lat}
                          onChange={handleInputChange}
                          step="any"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="40.7580"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Merchant Longitude</label>
                        <input
                          type="number"
                          name="merch_long"
                          value={formData.merch_long}
                          onChange={handleInputChange}
                          step="any"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="-73.9855"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-4 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData({
                        trans_num: '', amt: '', merchant: '', category: 'grocery_pos',
                        status: 'completed', is_fraud: false, risk_score: 0,
                        trans_date: new Date().toISOString().split('T')[0],
                        trans_time: new Date().toTimeString().split(' ')[0],
                        unix_time: Math.floor(Date.now() / 1000),
                        ssn: '', cc_num: '', acct_num: '', first: '', last: '',
                        gender: 'M', dob: '', job: '', street: '', city: '',
                        state: '', zip: '', lat: '', long: '', city_pop: '',
                        merch_lat: '', merch_long: ''
                      })}
                    >
                      Clear Form
                    </Button>
                    
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {isSubmitting ? 'Adding...' : 'Add Transaction'}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
