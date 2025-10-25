import { useState } from 'react';
import { Search } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import TransactionList from '../components/dashboard/TransactionList';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const Transactions = () => {
  const [filterStatus, setFilterStatus] = useState('all');

  const stats = [
    { label: 'Total', value: '12,456', color: 'bg-primary-100 text-primary-600' },
    { label: 'Accepted', value: '12,069', color: 'bg-success-100 text-success-600' },
    { label: 'Blocked', value: '387', color: 'bg-danger-100 text-danger-600' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Transactions</h1>
              <p className="text-gray-600">View and manage all transaction records</p>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {stats.map((stat, index) => (
                <Card 
                  key={index}
                  hover
                  onClick={() => {
                    if (stat.label === 'Total') setFilterStatus('all');
                    else if (stat.label === 'Accepted') setFilterStatus('accepted');
                    else if (stat.label === 'Blocked') setFilterStatus('blocked');
                  }}
                  className="cursor-pointer"
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
                  {(filterStatus === 'all' && stat.label === 'Total') ||
                   (filterStatus === 'accepted' && stat.label === 'Accepted') ||
                   (filterStatus === 'blocked' && stat.label === 'Blocked') ? (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <span className="text-xs font-semibold text-primary-600">Active Filter</span>
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>

            {/* Filters */}
            <Card>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[300px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by ID, merchant, or amount..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant={filterStatus === 'all' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filterStatus === 'accepted' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setFilterStatus('accepted')}
                  >
                    Accepted
                  </Button>
                  <Button
                    variant={filterStatus === 'blocked' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setFilterStatus('blocked')}
                  >
                    Blocked
                  </Button>
                </div>
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

