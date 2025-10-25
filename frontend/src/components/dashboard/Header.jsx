import { User } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

const Header = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-end gap-4">
          {/* Notifications */}
          <NotificationDropdown />
          
          {/* User Menu */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">Admin User</div>
              <div className="text-xs text-gray-500">admin@company.com</div>
            </div>
            <button className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
