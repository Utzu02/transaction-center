import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatPercent } from '../../utils/formatters';

const AgePieChart = ({ data = [], height = 250 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  // Calculate radius based on height to make pie chart scale properly
  const outerRadius = Math.floor(height * 0.35);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0];
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{dataPoint.payload.label}</p>
          <p className="text-sm text-gray-600">{dataPoint.value} fraud cases</p>
          {total > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {formatPercent(dataPoint.value / total, 1)} of total fraud
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-gray-400 text-sm">No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ percent }) => formatPercent(percent, 0)}
          outerRadius={outerRadius}
          fill="#8884d8"
          dataKey="value"
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '16px',
            fontWeight: '700'
          }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default AgePieChart;

