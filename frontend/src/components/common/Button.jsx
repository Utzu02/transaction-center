const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  className = '',
  disabled = false,
  ...props 
}) => {
  const baseStyles = 'font-semibold rounded-xl transition-all duration-300 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105';
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 shadow-lg hover:shadow-2xl hover:shadow-blue-500/30',
    secondary: 'bg-white/80 backdrop-blur-sm text-gray-800 hover:bg-white border border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg',
    danger: 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 shadow-lg hover:shadow-2xl hover:shadow-red-500/30',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 backdrop-blur-sm',
    ghost: 'text-gray-700 hover:bg-white/50 backdrop-blur-sm',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

