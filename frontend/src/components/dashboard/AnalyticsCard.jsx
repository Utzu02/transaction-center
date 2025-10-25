import { useState, useRef } from 'react';
import { Info } from 'lucide-react';
import Card from '../common/Card';

const AnalyticsCard = ({ title, value, icon: Icon, color = 'primary', tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState(null);
  const buttonRef = useRef(null);

  const colorClasses = {
    primary: 'bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600',
    success: 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-600',
    danger: 'bg-gradient-to-br from-red-100 to-rose-100 text-red-600',
    warning: 'bg-gradient-to-br from-yellow-100 to-orange-100 text-yellow-600',
  };

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const tooltipWidth = 256; // 16rem = 256px (w-64)
      const tooltipHeight = 100; // Approximate
      
      let top = rect.top + rect.height / 2;
      let left = rect.right + 12;
      let position = 'right';
      
      // Check if tooltip would go off-screen to the right
      if (left + tooltipWidth > viewportWidth - 20) {
        // Position above instead
        top = rect.top - 8;
        left = rect.left + rect.width / 2;
        position = 'top';
      }
      
      // Check if still going off top
      if (position === 'top' && top - tooltipHeight < 20) {
        // Position below instead
        top = rect.bottom + 8;
        position = 'bottom';
      }
      
      setTooltipPosition({ top, left, position });
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm text-gray-600">{title}</p>
            {tooltip && (
              <>
                <button
                  ref={buttonRef}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="More information"
                >
                  <Info className="w-4 h-4" />
                </button>
                {showTooltip && tooltipPosition && (
                  <div 
                    className={`fixed z-[9999] w-64 p-3 bg-gray-900 text-white text-xs leading-relaxed rounded-lg shadow-2xl border border-gray-700 pointer-events-none transition-opacity duration-150 ${
                      tooltipPosition.position === 'right' ? '-translate-y-1/2' :
                      tooltipPosition.position === 'top' ? '-translate-x-1/2 -translate-y-full' :
                      '-translate-x-1/2'
                    }`}
                    style={{
                      top: `${tooltipPosition.top}px`,
                      left: `${tooltipPosition.left}px`,
                    }}
                  >
                    {tooltip}
                    {/* Arrow - positioned based on tooltip position */}
                    {tooltipPosition.position === 'right' && (
                      <div className="absolute right-full top-1/2 -translate-y-1/2 mr-px">
                        <div className="border-8 border-transparent border-r-gray-900"></div>
                      </div>
                    )}
                    {tooltipPosition.position === 'top' && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="border-8 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                    {tooltipPosition.position === 'bottom' && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-px">
                        <div className="border-8 border-transparent border-b-gray-900"></div>
                      </div>
                    )}
                  </div>
                )}
              </>
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
