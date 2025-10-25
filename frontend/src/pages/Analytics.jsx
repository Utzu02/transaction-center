import { Activity, DollarSign, Users, CreditCard } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import Card from '../components/common/Card';
import { BarChart, Bar, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Analytics = () => {
  const monthlyData = [
    { month: 'Jan', transactions: 4000, fraud: 240, revenue: 45000 },
    { month: 'Feb', transactions: 3000, fraud: 139, revenue: 38000 },
    { month: 'Mar', transactions: 2000, fraud: 98, revenue: 28000 },
    { month: 'Apr', transactions: 2780, fraud: 390, revenue: 35000 },
    { month: 'May', transactions: 1890, fraud: 480, revenue: 25000 },
    { month: 'Jun', transactions: 2390, fraud: 380, revenue: 32000 },
  ];

  const riskDistribution = [
    { risk: 'Low', count: 8500 },
    { risk: 'Medium', count: 2800 },
    { risk: 'High', count: 1200 },
  ];

  const metrics = [
    {
      title: 'Average Transaction Value',
      value: '€342.50',
      icon: DollarSign,
      color: 'primary'
    },
    {
      title: 'Active Users',
      value: '24,567',
      icon: Users,
      color: 'success'
    },
    {
      title: 'Transaction Volume',
      value: '156K',
      icon: CreditCard,
      color: 'warning'
    },
    {
      title: 'System Uptime',
      value: '99.9%',
      icon: Activity,
      color: 'success'
    },
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
              <p className="text-gray-600">Comprehensive insights and performance metrics</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((metric, index) => (
                <Card key={index}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{metric.title}</p>
                      <h3 className="text-3xl font-bold text-gray-900">{metric.value}</h3>
                    </div>
                    <div className={`p-3 rounded-lg bg-${metric.color}-50 text-${metric.color}-600`}>
                      <metric.icon className="w-6 h-6" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Transaction Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorTrans" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip />
                    <Area type="monotone" dataKey="transactions" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorTrans)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Risk Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={riskDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" stroke="#888" />
                    <YAxis dataKey="risk" type="category" stroke="#888" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0ea5e9">
                      {riskDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.risk === 'High' ? '#ef4444' : entry.risk === 'Medium' ? '#f59e0b' : '#22c55e'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Analytics;

