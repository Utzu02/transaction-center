import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const RangeFilterDropdown = ({ label, min, max, step = 1, value, onChange, formatValue, unit = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value || [min, max]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMinChange = (e) => {
    const newMin = parseFloat(e.target.value);
    const newValue = [Math.min(newMin, localValue[1]), localValue[1]];
    setLocalValue(newValue);
  };

  const handleMaxChange = (e) => {
    const newMax = parseFloat(e.target.value);
    const newValue = [localValue[0], Math.max(newMax, localValue[0])];
    setLocalValue(newValue);
  };

  const handleApply = () => {
    onChange(localValue);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetValue = [min, max];
    setLocalValue(resetValue);
    onChange(resetValue);
  };

  const displayValue = formatValue || ((val) => `${val}${unit}`);
  const isActive = localValue[0] !== min || localValue[1] !== max;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all hover:border-blue-500 ${
          isActive
            ? 'bg-blue-50 border-blue-500 text-blue-700' 
            : 'bg-white border-gray-300 text-gray-700'
        }`}
      >
        <span className="font-medium">{label}</span>
        {isActive && (
          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-semibold">
            1
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-2xl z-[999] animate-fade-in">
          <div className="p-4 space-y-4">
            {/* Current Range Display */}
            <div className="flex items-center justify-between text-sm">
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-semibold">
                {displayValue(localValue[0])}
              </span>
              <span className="text-gray-400 font-medium">to</span>
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-semibold">
                {displayValue(localValue[1])}
              </span>
            </div>

            {/* Min Slider */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">Minimum</label>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={localValue[0]}
                onChange={handleMinChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="text-xs text-gray-500">{displayValue(localValue[0])}</div>
            </div>

            {/* Max Slider */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">Maximum</label>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={localValue[1]}
                onChange={handleMaxChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="text-xs text-gray-500">{displayValue(localValue[1])}</div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={handleReset}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RangeFilterDropdown;

