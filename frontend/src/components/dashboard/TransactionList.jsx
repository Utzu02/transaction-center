import { useState } from 'react';
import { Eye, Download, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';

const TransactionList = ({ transactions = [], filter = 'all', showExport = true, showViewMore = true, maxRows = null }) => {
  const navigate = useNavigate();
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  
  // Mock data based on real CSV structure
  const mockTransactions = [
    {
      id: '31eaddf9-ab07-4d43-80b9-71e85175933b',
      merchant: 'Cummings LLC',
      amount: '$92.40',
      status: 'completed',
      riskScore: 15,
      date: '2025-08-26 00:00:00',
      method: 'Visa ****5776',
      category: 'Gas & Transport',
      customer: 'Matthew Moore',
      location: 'Bakersfield, CA'
    },
    {
      id: 'fd865a12-3742-4abb-9498-9b194933adf4',
      merchant: 'Reilly, Heaney and Cole',
      amount: '$31.24',
      status: 'completed',
      riskScore: 8,
      date: '2025-08-26 00:00:01',
      method: 'Discover ****2791',
      category: 'Gas & Transport',
      customer: 'Samantha Wiley',
      location: 'La Mesa, CA'
    },
    {
      id: 'c9751536-f967-4383-b260-3f2c96942925',
      merchant: 'Bernhard Inc',
      amount: '$88.99',
      status: 'blocked',
      riskScore: 92,
      date: '2025-08-26 00:00:02',
      method: 'Diners ****8204',
      category: 'Gas & Transport',
      customer: 'Karen Soto',
      location: 'Atlanta, GA'
    },
    {
      id: 'f0a39e25-002f-4404-a378-4d8f5e04d9a5',
      merchant: 'Schaefer, McGlynn and Bosco',
      amount: '$60.10',
      status: 'completed',
      riskScore: 22,
      date: '2025-08-26 00:00:03',
      method: 'Amex ****2808',
      category: 'Gas & Transport',
      customer: 'Susan Terry',
      location: 'Mansfield, OH'
    },
    {
      id: '94809e66-f5a6-4be0-8bc8-7b5ea8a4974d',
      merchant: 'Mraz-Herzog',
      amount: '$3.63',
      status: 'completed',
      riskScore: 5,
      date: '2025-08-26 00:00:04',
      method: 'Mastercard ****0544',
      category: 'Gas & Transport',
      customer: 'Judith Johnson',
      location: 'Gambier, OH'
    },
    {
      id: '44a218f7-4c54-4b40-a75b-79806c50e605',
      merchant: 'Tillman, Dickinson and Labadie',
      amount: '$62.91',
      status: 'completed',
      riskScore: 18,
      date: '2025-08-26 00:00:08',
      method: 'Visa ****8498',
      category: 'Gas & Transport',
      customer: 'Christopher Porter',
      location: 'Delevan, NY'
    },
    {
      id: 'd458eb54-6798-4efb-9bdb-0e9230d74b84',
      merchant: 'Heller-Langosh',
      amount: '$192.45',
      status: 'blocked',
      riskScore: 88,
      date: '2025-08-26 00:00:09',
      method: 'Amex ****8921',
      category: 'Gas & Transport',
      customer: 'Denise Orozco',
      location: 'Ramer, TN'
    }
  ];

  // Use provided transactions or mock data
  let data = transactions.length > 0 ? transactions : mockTransactions;
  
  // Apply main filter (from props)
  if (filter === 'accepted') {
    data = data.filter(t => t.status === 'completed');
  } else if (filter === 'blocked') {
    data = data.filter(t => t.status === 'blocked');
  }

  // Limit rows for display
  const displayData = maxRows ? data.slice(0, maxRows) : data;

  // Check if all displayed transactions are selected
  const allSelected = displayData.length > 0 && displayData.every(t => selectedTransactions.has(t.id));
  const someSelected = displayData.some(t => selectedTransactions.has(t.id)) && !allSelected;

  const getStatusBadge = (status) => {
    const statusMap = {
      completed: { variant: 'success', label: 'Accepted' },
      blocked: { variant: 'danger', label: 'Blocked' },
    };
    return statusMap[status] || { variant: 'info', label: 'Unknown' };
  };

  const getRiskColor = (score) => {
    if (score >= 70) return 'text-danger-600 bg-danger-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-success-600 bg-success-50';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    
    // If less than 60 seconds ago
    if (diffSec < 60) return `${diffSec}s ago`;
    // If less than 60 minutes ago
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    // If less than 24 hours ago
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    
    // Otherwise show date and time
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateForCSV = (dateString) => {
    if (!dateString) return new Date().toLocaleString('en-US');
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const toggleTransaction = (id) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const toggleAllTransactions = () => {
    if (allSelected || someSelected) {
      // Deselect all (both when all selected or some selected for intuitive behavior)
      const newSelected = new Set(selectedTransactions);
      displayData.forEach(t => newSelected.delete(t.id));
      setSelectedTransactions(newSelected);
    } else {
      // Select all displayed (only when none are selected)
      const newSelected = new Set(selectedTransactions);
      displayData.forEach(t => newSelected.add(t.id));
      setSelectedTransactions(newSelected);
    }
  };

  const handleExportCSV = () => {
    // Use only selected transactions
    const exportData = data.filter(t => selectedTransactions.has(t.id));

    if (exportData.length === 0) {
      alert('Please select at least one transaction to export');
      return;
    }

    // CSV headers
    const headers = ['Date/Time', 'Customer', 'Merchant', 'Amount', 'Category', 'Location', 'Risk Score', 'Status'];
    
    // CSV rows with properly formatted dates
    const rows = exportData.map(t => [
      formatDateForCSV(t.date),
      t.customer,
      t.merchant,
      t.amount,
      t.category,
      t.location,
      t.riskScore,
      getStatusBadge(t.status).label
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${filter}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
          <p className="text-sm text-gray-600 mt-1">
            {selectedTransactions.size > 0 ? (
              <>
                {selectedTransactions.size} transaction{selectedTransactions.size !== 1 ? 's' : ''} selected
              </>
            ) : (
              <>No transactions selected</>
            )}
          </p>
        </div>
        {showExport && (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleExportCSV}
            disabled={selectedTransactions.size === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV ({selectedTransactions.size})
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {showExport && (
                <th className="w-12 py-3 px-4">
                  <div className="relative group">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={input => {
                        if (input) input.indeterminate = someSelected;
                      }}
                      onChange={toggleAllTransactions}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                      title={allSelected ? "Click to deselect all" : someSelected ? "Click to deselect all" : "Click to select all"}
                    />
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg">
                        {allSelected ? "Deselect all" : someSelected ? `Deselect all (${selectedTransactions.size} selected)` : `Select all (${displayData.length})`}
                      </div>
                    </div>
                  </div>
                </th>
              )}
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 whitespace-nowrap">Date/Time</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 whitespace-nowrap">Customer</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 whitespace-nowrap">Merchant</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 whitespace-nowrap">Amount</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 whitespace-nowrap">Category</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 whitespace-nowrap">Location</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 whitespace-nowrap">Risk</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 whitespace-nowrap">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((transaction) => {
              const statusInfo = getStatusBadge(transaction.status);
              return (
                <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  {showExport && (
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.has(transaction.id)}
                        onChange={() => toggleTransaction(transaction.id)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="text-xs text-gray-500">{formatDateTime(transaction.date)}</span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap overflow-hidden text-ellipsis">
                    <span className="text-sm font-semibold text-gray-900">{transaction.customer}</span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap overflow-hidden text-ellipsis">
                    <span className="text-sm text-gray-900">{transaction.merchant}</span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">{transaction.amount}</span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{transaction.category}</span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap overflow-hidden text-ellipsis">
                    <span className="text-sm text-gray-600">{transaction.location}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor(transaction.riskScore)}`}>
                      {transaction.riskScore}%
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={statusInfo.variant}>
                      {statusInfo.label}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <button 
                      onClick={() => navigate(`/transaction/${transaction.id}`)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showViewMore && maxRows && data.length > maxRows && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/transactions')}
            className="w-full"
          >
            View All Transactions ({data.length})
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </Card>
  );
};

export default TransactionList;
