import { useState } from 'react';
import { Info } from 'lucide-react';
import Card from '../common/Card';

const AnalyticsCard = ({ title, value, icon: Icon, color = 'primary', tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    danger: 'bg-danger-50 text-danger-600',
    warning: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm text-gray-600">{title}</p>
            {tooltip && (
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="More information"
                >
                  <Info className="w-4 h-4" />
                </button>
                {showTooltip && (
                  <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-2xl animate-fade-in border border-gray-700">
                    {tooltip}
                  </div>
                )}
              </div>
            )}
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {/* Decorative gradient */}
      <div className={`absolute -bottom-6 -right-6 w-32 h-32 rounded-full opacity-10 ${colorClasses[color]}`}></div>
    </Card>
  );
};

export default AnalyticsCard;
