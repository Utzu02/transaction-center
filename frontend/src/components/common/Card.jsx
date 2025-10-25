const Card = ({ children, className = '', hover = false, ...props }) => {
  const baseStyles = 'bg-white rounded-xl shadow-md p-6';
  const hoverStyles = hover ? 'hover:shadow-xl transition-shadow duration-300 cursor-pointer' : '';
  
  return (
    <div className={`${baseStyles} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;

