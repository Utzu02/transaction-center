import { useState } from 'react';
import { Search } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import TransactionList from '../components/dashboard/TransactionList';
import Card from '../components/common/Card';

const Transactions = () => {
  const [filterStatus, setFilterStatus] = useState('all');

  const stats = [
    { label: 'Total', value: '12,456', color: 'bg-primary-100 text-primary-600' },
    { label: 'Accepted', value: '12,069', color: 'bg-success-100 text-success-600' },
    { label: 'Blocked', value: '387', color: 'bg-danger-100 text-danger-600' },
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
                    className={`cursor-pointer transition-all ${isActive ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
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
                  placeholder="Search by ID, merchant, or amount..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-white/80"
                />
              </div>
            </Card>

            {/* Transaction List */}
            <TransactionList filter={filterStatus} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Transactions;

