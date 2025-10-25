import { 
  LayoutDashboard, 
  CreditCard, 
  AlertTriangle, 
  BarChart3, 
  Shield,
  ArrowLeft
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState('dashboard');

  // Update active item based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/dashboard') setActiveItem('dashboard');
    else if (path === '/transactions') setActiveItem('transactions');
    else if (path === '/alerts') setActiveItem('alerts');
    else if (path === '/analytics') setActiveItem('analytics');
  }, [location]);
  
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null },
    { id: 'transactions', icon: CreditCard, label: 'Transactions', badge: null },
    { id: 'alerts', icon: AlertTriangle, label: 'Alerts', badge: '12' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', badge: null },
  ];

  return (
    <aside className="bg-white border-r border-gray-200 w-64 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 mb-4 w-full hover:opacity-80 transition-opacity"
        >
          <div className="bg-primary-600 p-2 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-xl font-bold text-gray-900">FraudDetect</h1>
            <p className="text-xs text-gray-500">Transaction Center</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  setActiveItem(item.id);
                  navigate(`/${item.id === 'dashboard' ? 'dashboard' : item.id}`);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeItem === item.id
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="bg-danger-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

