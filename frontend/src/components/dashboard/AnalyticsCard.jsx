import { Info } from 'lucide-react';
import Card from '../common/Card';

const AnalyticsCard = ({ title, value, icon: Icon, color = 'primary', tooltip }) => {
  const colorClasses = {
    primary: 'bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600',
    success: 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-600',
    danger: 'bg-gradient-to-br from-red-100 to-rose-100 text-red-600',
    warning: 'bg-gradient-to-br from-yellow-100 to-orange-100 text-yellow-600',
  };

  return (
    <Card className="relative overflow-visible">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm text-gray-600">{title}</p>
            {tooltip && (
              <div className="group relative inline-flex">
                <button
                  type="button"
                  className="text-gray-400 hover:text-blue-600 transition-all duration-300 cursor-pointer hover:scale-110"
                  aria-label="More information"
                >
                  <Info className="w-4 h-4" />
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out transform group-hover:-translate-y-1 w-72 p-4 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 text-white text-sm font-medium leading-relaxed rounded-xl shadow-2xl border-2 border-blue-400/30 z-[100] pointer-events-none whitespace-normal backdrop-blur-sm">
                  <div className="relative z-10">
                    <p className="text-center">{tooltip}</p>
                  </div>
                  {/* Glossy overlay effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none"></div>
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px]">
                    <div className="border-[10px] border-transparent border-t-blue-600"></div>
                  </div>
                </div>
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
      <div className={`absolute -bottom-6 -right-6 w-32 h-32 rounded-full opacity-10 ${colorClasses[color]} pointer-events-none`}></div>
    </Card>
  );
};

export default AnalyticsCard;
