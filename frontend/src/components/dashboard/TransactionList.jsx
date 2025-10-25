import { useState, useEffect, useMemo } from 'react';
import { Eye, Download, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';

const TransactionList = ({ 
  transactions = [], 
  filter = 'all', 
  showExport = true, 
  showViewMore = true, 
  maxRows = null,
  totalFilteredCount = null,
  onTransactionsLoaded = null,
  onLoadMore = null,
  hasMore = false,
  remaining = 0,
  searchTerm = '',
  // Advanced filters
  filterMerchants = [],
  filterCategories = [],
  filterLocations = [],
  filterRiskLevels = [],
  filterStatuses = [],
  filterTimeRange = [0, 24],
  filterAmountRange = [0, 5000]
}) => {
  const navigate = useNavigate();
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  
  // Notify parent of all transactions for dynamic filter generation (only once on mount)
  useEffect(() => {
    const data = transactions.length > 0 ? transactions : mockTransactions;
    if (onTransactionsLoaded && data.length > 0) {
      onTransactionsLoaded(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run only once on mount
  
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
    },
    {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      merchant: 'Walmart Supercenter',
      amount: '$145.67',
      status: 'completed',
      riskScore: 12,
      date: '2025-08-26 00:00:10',
      method: 'Visa ****2345',
      category: 'Grocery',
      customer: 'Emily Rodriguez',
      location: 'Houston, TX'
    },
    {
      id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      merchant: 'Amazon.com',
      amount: '$299.99',
      status: 'completed',
      riskScore: 25,
      date: '2025-08-26 00:00:12',
      method: 'Mastercard ****6789',
      category: 'Shopping',
      customer: 'Michael Chen',
      location: 'Seattle, WA'
    },
    {
      id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
      merchant: 'Target Store',
      amount: '$78.23',
      status: 'completed',
      riskScore: 9,
      date: '2025-08-26 00:00:15',
      method: 'Amex ****4567',
      category: 'Shopping',
      customer: 'Sarah Johnson',
      location: 'Chicago, IL'
    },
    {
      id: 'd4e5f6a7-b8c9-0123-def1-234567890123',
      merchant: 'Suspicious Online Store',
      amount: '$987.50',
      status: 'blocked',
      riskScore: 95,
      date: '2025-08-26 00:00:18',
      method: 'Visa ****8888',
      category: 'Shopping',
      customer: 'John Smith',
      location: 'Miami, FL'
    },
    {
      id: 'e5f6a7b8-c9d0-1234-ef12-345678901234',
      merchant: 'Starbucks Coffee',
      amount: '$5.75',
      status: 'completed',
      riskScore: 3,
      date: '2025-08-26 00:00:20',
      method: 'Discover ****3456',
      category: 'Dining',
      customer: 'Lisa Anderson',
      location: 'Portland, OR'
    },
    {
      id: 'f6a7b8c9-d0e1-2345-f123-456789012345',
      merchant: 'Shell Gas Station',
      amount: '$55.00',
      status: 'completed',
      riskScore: 14,
      date: '2025-08-26 00:00:22',
      method: 'Visa ****7890',
      category: 'Gas & Transport',
      customer: 'David Williams',
      location: 'Phoenix, AZ'
    },
    {
      id: 'a7b8c9d0-e1f2-3456-1234-567890123456',
      merchant: 'Best Buy Electronics',
      amount: '$1,234.99',
      status: 'blocked',
      riskScore: 87,
      date: '2025-08-26 00:00:25',
      method: 'Mastercard ****9999',
      category: 'Shopping',
      customer: 'Robert Garcia',
      location: 'Las Vegas, NV'
    },
    {
      id: 'b8c9d0e1-f2a3-4567-2345-678901234567',
      merchant: 'CVS Pharmacy',
      amount: '$42.15',
      status: 'completed',
      riskScore: 11,
      date: '2025-08-26 00:00:28',
      method: 'Amex ****1234',
      category: 'Healthcare',
      customer: 'Jennifer Martinez',
      location: 'Boston, MA'
    },
    {
      id: 'c9d0e1f2-a3b4-5678-3456-789012345678',
      merchant: 'Uber Ride',
      amount: '$23.50',
      status: 'completed',
      riskScore: 16,
      date: '2025-08-26 00:00:30',
      method: 'Visa ****5555',
      category: 'Gas & Transport',
      customer: 'Thomas Brown',
      location: 'San Francisco, CA'
    },
    {
      id: 'd0e1f2a3-b4c5-6789-4567-890123456789',
      merchant: 'Netflix Subscription',
      amount: '$15.99',
      status: 'completed',
      riskScore: 4,
      date: '2025-08-26 00:00:32',
      method: 'Mastercard ****6666',
      category: 'Entertainment',
      customer: 'Jessica Taylor',
      location: 'Austin, TX'
    },
    {
      id: 'e1f2a3b4-c5d6-7890-5678-901234567890',
      merchant: 'Unknown Foreign Merchant',
      amount: '$2,500.00',
      status: 'blocked',
      riskScore: 98,
      date: '2025-08-26 00:00:35',
      method: 'Visa ****0000',
      category: 'Shopping',
      customer: 'Mark Wilson',
      location: 'New York, NY'
    },
    {
      id: 'f2a3b4c5-d6e7-8901-6789-012345678901',
      merchant: 'Whole Foods Market',
      amount: '$87.40',
      status: 'completed',
      riskScore: 13,
      date: '2025-08-26 00:00:38',
      method: 'Discover ****7777',
      category: 'Grocery',
      customer: 'Amanda Davis',
      location: 'Denver, CO'
    },
    {
      id: 'a3b4c5d6-e7f8-9012-7890-123456789012',
      merchant: 'AMC Theaters',
      amount: '$34.50',
      status: 'completed',
      riskScore: 7,
      date: '2025-08-26 00:00:40',
      method: 'Amex ****2222',
      category: 'Entertainment',
      customer: 'Christopher Lee',
      location: 'Dallas, TX'
    }
  ];

  // Use provided transactions or mock data - memoize to prevent recalculation
  const baseData = useMemo(() => {
    return transactions.length > 0 ? transactions : mockTransactions;
  }, [transactions]);

  // Apply all filters using useMemo
  const filteredData = useMemo(() => {
    let data = [...baseData];
    
    // Apply search filter first
    if (searchTerm && searchTerm.trim() !== '') {
      const search = searchTerm.toLowerCase();
      data = data.filter(t => {
        return (
          t.id.toLowerCase().includes(search) ||
          t.merchant.toLowerCase().includes(search) ||
          t.customer.toLowerCase().includes(search) ||
          t.amount.toLowerCase().includes(search) ||
          t.location.toLowerCase().includes(search) ||
          t.category.toLowerCase().includes(search)
        );
      });
    }
    
    // Apply main filter (from props)
    if (filter === 'accepted') {
      data = data.filter(t => t.status === 'completed');
    } else if (filter === 'blocked') {
      data = data.filter(t => t.status === 'blocked');
    }

    // Apply advanced filters
    if (filterMerchants.length > 0) {
      data = data.filter(t => {
        const merchantName = t.merchant;
        // Compare with the actual merchant name, filterMerchants contains sanitized values
        return filterMerchants.some(m => {
          const sanitized = merchantName.toLowerCase().replace(/[^a-z0-9]/g, '');
          return sanitized === m || merchantName === m;
        });
      });
    }

    if (filterCategories.length > 0) {
      data = data.filter(t => {
        const category = t.category;
        // Compare with the actual category name, filterCategories contains sanitized values
        return filterCategories.some(c => {
          const sanitized = category.toLowerCase().replace(/[^a-z0-9]/g, '');
          return sanitized === c || category === c;
        });
      });
    }

    if (filterLocations.length > 0) {
      data = data.filter(t => {
        const location = t.location;
        return filterLocations.some(loc => location.includes(loc));
      });
    }

    if (filterRiskLevels.length > 0) {
      data = data.filter(t => {
        const risk = t.riskScore;
        return filterRiskLevels.some(level => {
          if (level === 'low') return risk >= 0 && risk <= 30;
          if (level === 'medium') return risk > 30 && risk <= 70;
          if (level === 'high') return risk > 70 && risk <= 100;
          return false;
        });
      });
    }

    if (filterStatuses.length > 0) {
      data = data.filter(t => {
        return filterStatuses.some(status => {
          if (status === 'accepted') return t.status === 'completed';
          if (status === 'blocked') return t.status === 'blocked';
          return false;
        });
      });
    }

    // Time range filter (hours ago)
    if (filterTimeRange[0] !== 0 || filterTimeRange[1] !== 24) {
      data = data.filter(t => {
        const now = new Date();
        const txDate = new Date(t.date);
        const hoursAgo = (now - txDate) / (1000 * 60 * 60);
        return hoursAgo >= filterTimeRange[0] && hoursAgo <= filterTimeRange[1];
      });
    }

    // Amount range filter
    if (filterAmountRange[0] !== 0 || filterAmountRange[1] !== 5000) {
      data = data.filter(t => {
        const amount = parseFloat(t.amount.replace('$', '').replace(',', ''));
        return amount >= filterAmountRange[0] && amount <= filterAmountRange[1];
      });
    }

    return data;
  }, [
    baseData,
    searchTerm,
    filter,
    filterMerchants,
    filterCategories,
    filterLocations,
    filterRiskLevels,
    filterStatuses,
    filterTimeRange,
    filterAmountRange
  ]);

  // Notify parent of total filtered count
  useEffect(() => {
    if (totalFilteredCount) {
      totalFilteredCount(filteredData.length);
    }
  }, [filteredData.length, totalFilteredCount]);

  // Limit rows for display
  const displayData = maxRows ? filteredData.slice(0, maxRows) : filteredData;

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
    const exportData = filteredData.filter(t => selectedTransactions.has(t.id));

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

      {/* Load More or View All button */}
      {showViewMore && (
        <>
          {onLoadMore && hasMore ? (
            // Load More button for Transactions page
            <div className="mt-6 flex justify-center">
              <button
                onClick={onLoadMore}
                className="group flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105 font-medium"
              >
                <span>Load More Transactions ({remaining} remaining)</span>
                <svg className="w-5 h-5 transition-transform group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          ) : maxRows && filteredData.length > maxRows ? (
            // View All button for Dashboard
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => navigate('/transactions')}
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105 font-medium"
              >
                <span>View All {filteredData.length} Transactions</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          ) : null}
        </>
      )}
    </Card>
  );
};

export default TransactionList;
