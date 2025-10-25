import { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import TransactionList from '../components/dashboard/TransactionList';
import Card from '../components/common/Card';
import FilterDropdown from '../components/common/FilterDropdown';
import RangeFilterDropdown from '../components/common/RangeFilterDropdown';

const Transactions = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedMerchants, setSelectedMerchants] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedRiskLevels, setSelectedRiskLevels] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10); // For Load More
  const [searchTerm, setSearchTerm] = useState('');
  const [allTransactions, setAllTransactions] = useState([]);
  const [totalFilteredCount, setTotalFilteredCount] = useState(0);
  
  // Range filters
  const [timeRange, setTimeRange] = useState([0, 24]); // hours
  const [amountRange, setAmountRange] = useState([0, 5000]); // dollars
  
  // Generate dynamic filter options from actual transactions
  const merchantOptions = useMemo(() => {
    const merchantCounts = {};
    allTransactions.forEach(t => {
      const merchant = t.merchant;
      merchantCounts[merchant] = (merchantCounts[merchant] || 0) + 1;
    });
    return Object.entries(merchantCounts)
      .map(([merchant, count]) => ({
        label: merchant,
        value: merchant.toLowerCase().replace(/[^a-z0-9]/g, ''),
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [allTransactions]);

  const categoryOptions = useMemo(() => {
    const categoryCounts = {};
    allTransactions.forEach(t => {
      const category = t.category;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    return Object.entries(categoryCounts)
      .map(([category, count]) => ({
        label: category,
        value: category.toLowerCase().replace(/[^a-z0-9]/g, ''),
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [allTransactions]);

  const locationOptions = useMemo(() => {
    const locationCounts = {};
    allTransactions.forEach(t => {
      // Extract state from location (e.g., "Bakersfield, CA" -> "CA")
      const parts = t.location.split(',');
      const state = parts[parts.length - 1].trim();
      locationCounts[state] = (locationCounts[state] || 0) + 1;
    });
    return Object.entries(locationCounts)
      .map(([location, count]) => ({
        label: location,
        value: location,
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [allTransactions]);

  const riskLevelOptions = useMemo(() => {
    const lowCount = allTransactions.filter(t => t.riskScore <= 30).length;
    const mediumCount = allTransactions.filter(t => t.riskScore > 30 && t.riskScore <= 70).length;
    const highCount = allTransactions.filter(t => t.riskScore > 70).length;
    
    return [
      { label: 'Low Risk (0-30%)', value: 'low', count: lowCount },
      { label: 'Medium Risk (31-70%)', value: 'medium', count: mediumCount },
      { label: 'High Risk (71-100%)', value: 'high', count: highCount },
    ];
  }, [allTransactions]);

  const statusOptions = useMemo(() => {
    const acceptedCount = allTransactions.filter(t => t.status === 'completed').length;
    const blockedCount = allTransactions.filter(t => t.status === 'blocked').length;
    
    return [
      { label: 'Accepted', value: 'accepted', count: acceptedCount },
      { label: 'Blocked', value: 'blocked', count: blockedCount },
    ];
  }, [allTransactions]);

  const hasActiveFilters = selectedMerchants.length > 0 || 
                          selectedCategories.length > 0 || 
                          selectedLocations.length > 0 || 
                          selectedRiskLevels.length > 0 ||
                          selectedStatuses.length > 0 ||
                          timeRange[0] !== 0 || timeRange[1] !== 24 ||
                          amountRange[0] !== 0 || amountRange[1] !== 5000 ||
                          searchTerm.trim() !== '';

  const clearAllFilters = () => {
    setSelectedMerchants([]);
    setSelectedCategories([]);
    setSelectedLocations([]);
    setSelectedRiskLevels([]);
    setSelectedStatuses([]);
    setTimeRange([0, 24]);
    setAmountRange([0, 5000]);
    setFilterStatus('all');
    setSearchTerm('');
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  const handleTransactionsLoaded = (transactions) => {
    setAllTransactions(transactions);
  };

  const stats = [
    { label: 'Total', value: '12,456', color: 'bg-primary-100 text-primary-600', ringColor: 'ring-blue-500' },
    { label: 'Accepted', value: '12,069', color: 'bg-green-100 text-green-600', ringColor: 'ring-green-500' },
    { label: 'Blocked', value: '387', color: 'bg-red-100 text-red-600', ringColor: 'ring-red-500' },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-scroll overflow-x-hidden">
          <div className="p-6 space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent">Transactions</h1>
              <p className="text-gray-600">View and manage all transaction records</p>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {stats.map((stat, index) => {
                const isActive = (filterStatus === 'all' && stat.label === 'Total') ||
                                (filterStatus === 'accepted' && stat.label === 'Accepted') ||
                                (filterStatus === 'blocked' && stat.label === 'Blocked');
                
                return (
                  <Card 
                    key={index}
                    hover
                    onClick={() => {
                      // Toggle behavior: if already active, deselect to 'all'
                      if (isActive) {
                        setFilterStatus('all');
                      } else {
                        if (stat.label === 'Total') setFilterStatus('all');
                        else if (stat.label === 'Accepted') setFilterStatus('accepted');
                        else if (stat.label === 'Blocked') setFilterStatus('blocked');
                      }
                    }}
                    className={`cursor-pointer transition-all ${isActive ? `ring-2 ${stat.ringColor} shadow-lg` : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center text-2xl font-bold`}>
                        {stat.value.charAt(0)}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Search Bar */}
            <Card>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by ID, merchant, customer, amount, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-white/80"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </Card>

            {/* Advanced Filters */}
            <Card className="relative z-50">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
                    {hasActiveFilters && (
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                        {selectedMerchants.length + selectedCategories.length + selectedLocations.length + selectedRiskLevels.length + selectedStatuses.length + 
                         (timeRange[0] !== 0 || timeRange[1] !== 24 ? 1 : 0) + 
                         (amountRange[0] !== 0 || amountRange[1] !== 5000 ? 1 : 0)} active
                      </span>
                    )}
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <FilterDropdown
                    label="Merchant"
                    options={merchantOptions}
                    selected={selectedMerchants}
                    onChange={setSelectedMerchants}
                  />
                  
                  <FilterDropdown
                    label="Category"
                    options={categoryOptions}
                    selected={selectedCategories}
                    onChange={setSelectedCategories}
                  />
                  
                  <FilterDropdown
                    label="Location"
                    options={locationOptions}
                    selected={selectedLocations}
                    onChange={setSelectedLocations}
                  />
                  
                  <FilterDropdown
                    label="Status"
                    options={statusOptions}
                    selected={selectedStatuses}
                    onChange={setSelectedStatuses}
                  />
                  
                  <RangeFilterDropdown
                    label="Time"
                    min={0}
                    max={24}
                    step={1}
                    value={timeRange}
                    onChange={setTimeRange}
                    formatValue={(val) => `${val}h`}
                  />
                  
                  <RangeFilterDropdown
                    label="Amount"
                    min={0}
                    max={5000}
                    step={10}
                    value={amountRange}
                    onChange={setAmountRange}
                    formatValue={(val) => `$${val}`}
                  />
                  
                  <FilterDropdown
                    label="Risk Level"
                    options={riskLevelOptions}
                    selected={selectedRiskLevels}
                    onChange={setSelectedRiskLevels}
                  />
                </div>

                {/* Active Filter Pills */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                    {/* Time Range */}
                    {(timeRange[0] !== 0 || timeRange[1] !== 24) && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-50 text-cyan-700 text-sm rounded-full border border-cyan-200">
                        <span className="font-medium">Time: {timeRange[0]}h - {timeRange[1]}h</span>
                        <button
                          onClick={() => setTimeRange([0, 24])}
                          className="hover:text-cyan-900"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {/* Amount Range */}
                    {(amountRange[0] !== 0 || amountRange[1] !== 5000) && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-sm rounded-full border border-emerald-200">
                        <span className="font-medium">Amount: ${amountRange[0]} - ${amountRange[1]}</span>
                        <button
                          onClick={() => setAmountRange([0, 5000])}
                          className="hover:text-emerald-900"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {selectedMerchants.map(merchant => {
                      const option = merchantOptions.find(o => o.value === merchant);
                      return (
                        <span key={merchant} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200">
                          <span className="font-medium">{option?.label}</span>
                          <button
                            onClick={() => setSelectedMerchants(selectedMerchants.filter(m => m !== merchant))}
                            className="hover:text-blue-900"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                    {selectedCategories.map(category => {
                      const option = categoryOptions.find(o => o.value === category);
                      return (
                        <span key={category} className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full border border-purple-200">
                          <span className="font-medium">{option?.label}</span>
                          <button
                            onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== category))}
                            className="hover:text-purple-900"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                    {selectedLocations.map(location => {
                      const option = locationOptions.find(o => o.value === location);
                      return (
                        <span key={location} className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full border border-green-200">
                          <span className="font-medium">{option?.label}</span>
                          <button
                            onClick={() => setSelectedLocations(selectedLocations.filter(l => l !== location))}
                            className="hover:text-green-900"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                    {selectedRiskLevels.map(risk => {
                      const option = riskLevelOptions.find(o => o.value === risk);
                      return (
                        <span key={risk} className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 text-sm rounded-full border border-orange-200">
                          <span className="font-medium">{option?.label}</span>
                          <button
                            onClick={() => setSelectedRiskLevels(selectedRiskLevels.filter(r => r !== risk))}
                            className="hover:text-orange-900"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                    {selectedStatuses.map(status => {
                      const option = statusOptions.find(o => o.value === status);
                      return (
                        <span key={status} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full border border-gray-300">
                          <span className="font-medium">{option?.label}</span>
                          <button
                            onClick={() => setSelectedStatuses(selectedStatuses.filter(s => s !== status))}
                            className="hover:text-gray-900"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            {/* Transaction List */}
            <TransactionList 
              filter={filterStatus} 
              maxRows={visibleCount}
              showExport={true}
              showViewMore={true}
              searchTerm={searchTerm}
              totalFilteredCount={(count) => setTotalFilteredCount(count)}
              onTransactionsLoaded={handleTransactionsLoaded}
              onLoadMore={handleLoadMore}
              hasMore={totalFilteredCount > visibleCount}
              remaining={totalFilteredCount - visibleCount}
              // Pass all filters to TransactionList
              filterMerchants={selectedMerchants}
              filterCategories={selectedCategories}
              filterLocations={selectedLocations}
              filterRiskLevels={selectedRiskLevels}
              filterStatuses={selectedStatuses}
              filterTimeRange={timeRange}
              filterAmountRange={amountRange}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Transactions;

