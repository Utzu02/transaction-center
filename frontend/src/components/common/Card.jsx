const Card = ({ children, className = '', hover = false, ...props }) => {
  const baseStyles = 'bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6';
  const hoverStyles = hover ? 'hover:shadow-2xl hover:border-blue-200 transition-all duration-300 cursor-pointer transform hover:-translate-y-1' : 'transition-all duration-200';
  
  return (
    <div className={`${baseStyles} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;

