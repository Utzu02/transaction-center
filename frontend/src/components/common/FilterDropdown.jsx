import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const FilterDropdown = ({ label, options, selected = [], onChange, count }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const clearAll = () => {
    onChange([]);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all hover:border-blue-500 ${
          selected.length > 0 
            ? 'bg-blue-50 border-blue-500 text-blue-700' 
            : 'bg-white border-gray-300 text-gray-700'
        }`}
      >
        <span className="font-medium">{label}</span>
        {selected.length > 0 && (
          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-semibold">
            {selected.length}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-2xl z-[999] animate-fade-in">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
              autoFocus
            />
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <p className="p-4 text-center text-gray-500 text-sm">No results found</p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => handleToggle(option.value)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm ${isSelected ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>
                        {option.label}
                      </span>
                    </div>
                    {option.count !== undefined && (
                      <span className="text-xs text-gray-500 font-medium">{option.count}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {selected.length > 0 && (
            <div className="p-3 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={clearAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;

