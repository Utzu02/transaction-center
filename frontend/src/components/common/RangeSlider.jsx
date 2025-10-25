import { useState } from 'react';

const RangeSlider = ({ label, min, max, step = 1, value, onChange, formatValue, unit = '' }) => {
  const [localValue, setLocalValue] = useState(value || [min, max]);

  const handleMinChange = (e) => {
    const newMin = parseFloat(e.target.value);
    const newValue = [Math.min(newMin, localValue[1]), localValue[1]];
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleMaxChange = (e) => {
    const newMax = parseFloat(e.target.value);
    const newValue = [localValue[0], Math.max(newMax, localValue[0])];
    setLocalValue(newValue);
    onChange(newValue);
  };

  const displayValue = formatValue || ((val) => `${val}${unit}`);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      
      {/* Value Display */}
      <div className="flex items-center justify-between text-sm">
        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-semibold">
          {displayValue(localValue[0])}
        </span>
        <span className="text-gray-400">to</span>
        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-semibold">
          {displayValue(localValue[1])}
        </span>
      </div>

      {/* Sliders */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localValue[0]}
            onChange={handleMinChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="text-xs text-gray-500 mt-1">Min: {displayValue(localValue[0])}</div>
        </div>
        
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localValue[1]}
            onChange={handleMaxChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="text-xs text-gray-500 mt-1">Max: {displayValue(localValue[1])}</div>
        </div>
      </div>
    </div>
  );
};

export default RangeSlider;

