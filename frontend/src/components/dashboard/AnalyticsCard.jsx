import Card from '../common/Card';

const AnalyticsCard = ({ title, value, icon: Icon, color = 'primary' }) => {
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
          <p className="text-sm text-gray-600 mb-1">{title}</p>
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

