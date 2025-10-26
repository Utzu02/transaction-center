import { 
  LayoutDashboard, 
  CreditCard, 
  AlertTriangle, 
  BarChart3, 
  Shield,
  Settings
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications();

  // Derive active item directly from location - no state needed
  const getActiveItem = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'dashboard';
    if (path === '/transactions' || path.startsWith('/transaction/')) return 'transactions';
    if (path === '/alerts') return 'alerts';
    if (path === '/analytics') return 'analytics';
    if (path === '/settings') return 'settings';
    return 'dashboard';
  };

  const activeItem = getActiveItem();
  
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null },
    { id: 'transactions', icon: CreditCard, label: 'Transactions', badge: null },
    { id: 'alerts', icon: AlertTriangle, label: 'Alerts', badge: unreadCount > 0 ? unreadCount.toString() : null },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', badge: null },
    { id: 'settings', icon: Settings, label: 'Settings', badge: null },
  ];

  return (
    <aside className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-white/10 w-64 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity group"
        >
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/60 transition-all">
            <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <h1 className="text-xl font-display font-bold text-white">Fraud Detect</h1>
            <p className="text-xs text-gray-400">SIEM Platform</p>
          </div>
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  navigate(`/${item.id === 'dashboard' ? 'dashboard' : item.id}`);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeItem === item.id
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-lg'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-lg">
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Bottom gradient */}
      <div className="p-4 border-t border-white/10">
        <p className="text-center text-xs text-gray-500">
          Powered by Rafallos
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;

