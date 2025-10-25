import { useState, useEffect, useMemo } from 'react';
import { Eye, Download, ArrowUpRight } from 'lucide-react';
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
    if (onTransactionsLoaded && transactions.length > 0) {
      onTransactionsLoaded(transactions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]); // Update when transactions change
  
  // Use provided transactions - memoize to prevent recalculation
  const baseData = useMemo(() => {
    return transactions;
  }, [transactions]);

  // Apply all filters using useMemo
  const filteredData = useMemo(() => {
    let data = [...baseData];
    
    // Apply search filter first
    if (searchTerm && searchTerm.trim() !== '') {
      const search = searchTerm.toLowerCase();
      data = data.filter(t => {
        return (
          (t.id && String(t.id).toLowerCase().includes(search)) ||
          (t.merchant && String(t.merchant).toLowerCase().includes(search)) ||
          (t.customer && String(t.customer).toLowerCase().includes(search)) ||
          (t.amount && String(t.amount).toLowerCase().includes(search)) ||
          (t.location && String(t.location).toLowerCase().includes(search)) ||
          (t.category && String(t.category).toLowerCase().includes(search))
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
                <p>Load More Transactions ({remaining} remaining)</p>
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
                <p>View All {filteredData.length} Transactions</p>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </button>
            </div>
          ) : null}
        </>
      )}
    </Card>
  );
};

export default TransactionList;
