import { Eye, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';

const TransactionList = ({ transactions = [], filter = 'all' }) => {
  const navigate = useNavigate();
  
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
  
  // Apply filter
  if (filter === 'accepted') {
    data = data.filter(t => t.status === 'completed');
  } else if (filter === 'blocked') {
    data = data.filter(t => t.status === 'blocked');
  }
  // If filter === 'all', show all data

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

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
        <Button variant="ghost" size="sm">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Merchant</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Category</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Location</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Risk</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((transaction, index) => {
              const statusInfo = getStatusBadge(transaction.status);
              return (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <span className="text-sm font-semibold text-gray-900">{transaction.customer}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-900">{transaction.merchant}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-semibold text-gray-900">{transaction.amount}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600">{transaction.category}</span>
                  </td>
                  <td className="py-4 px-4">
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
    </Card>
  );
};

export default TransactionList;

