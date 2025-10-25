const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border border-gray-200',
    success: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200',
    danger: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200',
    warning: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border border-yellow-200',
    info: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200',
  };
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;

