import { useMemo, useState } from 'react';
import { TrendingUp, Clock } from 'lucide-react';
import Card from '../common/Card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';

const TOP_N = 5;

const COLORS = {
  'High-Value Transaction': '#ef4444',
  'Geographical Anomaly': '#f59e0b',
  'Unusual Time': '#eab308',
  'Online Purchase Risk': '#3b82f6',
  'Micro-Transaction Pattern': '#8b5cf6',
  'Suspicious Behavior': '#ec4899',
  'Travel/Gas Anomaly': '#f97316',
  'Retail Fraud': '#06b6d4',
  __default: '#6b7280',
};
const getPatternColor = (pattern) => COLORS[pattern] || COLORS.__default;

// sec vs ms safe
const toMs = (val) => {
  if (val == null) return undefined;
  if (typeof val === 'number') return val < 1e12 ? val * 1000 : val;
  const t = new Date(val).getTime();
  return Number.isFinite(t) ? t : undefined;
};
const getTxTimeMs = (t) => {
  if (t.timestamp != null) return toMs(t.timestamp);
  if (t.created_at != null) return toMs(t.created_at);
  if (t.unix_time != null) return toMs(t.unix_time);
  return undefined;
};
const isFraudTx = (t) => {
  const status = String(t.status ?? '').toLowerCase();
  return Boolean(
    t.isFraud || t.is_fraud || t.fraud || ['blocked', 'unknown', 'fraud', 'declined'].includes(status)
  );
};

const detectPatterns = (t) => {
  const tags = [];
  const amount = Number(t.amt ?? t.amount ?? 0) || 0;

  if (amount > 500) tags.push('High-Value Transaction');

  let hour;
  if (t.trans_time) {
    const hh = parseInt(String(t.trans_time).split(':')[0], 10);
    if (!Number.isNaN(hh)) hour = hh;
  }
  if (hour == null) {
    const ms = getTxTimeMs(t);
    if (ms != null) hour = new Date(ms).getHours();
  }
  if (hour != null && (hour >= 22 || hour < 6)) tags.push('Unusual Time');

  const category = String(t.category ?? '').toLowerCase();
  if (category.includes('online') || category.includes('shopping_net')) {
    tags.push('Online Purchase Risk');
  } else if (category.includes('gas') || category.includes('travel')) {
    tags.push('Travel/Gas Anomaly');
  } else if (category.includes('grocery') || category.includes('food')) {
    tags.push('Retail Fraud');
  }

  if (amount > 0 && amount < 10) tags.push('Micro-Transaction Pattern');

  if (tags.length === 0) tags.push('Suspicious Behavior');
  return tags;
};

function FraudPatterns({ transactions = [] }) {
  const [timeframe, setTimeframe] = useState('all');

  const { data, totalFraud } = useMemo(() => {
    const now = Date.now();
    const fraudTx = transactions.filter((t) => {
      if (!isFraudTx(t)) return false;
      if (timeframe === 'all') return true;
      const cutoff = now - Number.parseInt(timeframe, 10) * 1000;
      const txTime = getTxTimeMs(t);
      if (txTime == null) return true;
      return txTime >= cutoff;
    });

    const counts = new Map();
    fraudTx.forEach((t) => {
      const tags = detectPatterns(t);
      tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
    });

    const arr = Array.from(counts.entries())
      .map(([pattern, count]) => ({ pattern, count, color: getPatternColor(pattern) }))
      .sort((a, b) => b.count - a.count || a.pattern.localeCompare(b.pattern))
      .slice(0, TOP_N);

    const total = fraudTx.length || 1; // evit div/0
    const enriched = arr.map((d, i) => ({
      ...d,
      rank: i + 1,
      pct: d.count / total,
      pctLabel: `${Math.round((d.count / total) * 100)}%`,
    }));

    return { data: enriched, totalFraud: fraudTx.length };
  }, [transactions, timeframe]);

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'all': return 'All Time';
      case '7200': return '2h';
      case '14400': return '4h';
      case '28800': return '8h';
      case '86400': return '1d';
      case '604800': return '7d';
      case '2592000': return '30d';
      default: return 'All Time';
    }
  };

  // Tick Y personalizat: bulină color + text
  const PatternTick = ({ x, y, payload }) => {
    const item = data.find((d) => d.pattern === payload.value);
    const c = item?.color || COLORS.__default;
    return (
      <g transform={`translate(${x},${y})`}>
        <circle cx={0} cy={0} r={4} fill={c} />
        <text x={10} y={4} fontSize={12} fill="#374151">{payload.value}</text>
      </g>
    );
  };

  // Label la capătul barei: "count • %"
  const ValueLabel = (props) => {
    const { x, y, width, height, value, index } = props;
    const d = data[index];
    if (!d) return null;
    const textX = x + width + 8;
    const textY = y + height / 2 + 4;
    return (
      <g>
        {index === 0 && (
          <g>
            {/* badge Top pe prima bară */}
            <rect x={x + width - 42} y={y - 18} rx={8} ry={8} width={40} height={16} fill={d.color} opacity={0.12} />
            <text x={x + width - 22} y={y - 6} fontSize={10} fill={d.color} textAnchor="middle">Top</text>
          </g>
        )}
        <text x={textX} y={textY} fontSize={12} fill="#111827">{`${value} • ${d.pctLabel}`}</text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: d.color }} />
          <span className="font-semibold text-gray-900">{d.pattern}</span>
        </div>
        <div className="text-sm text-gray-600 mt-1">{d.count} cases • {d.pctLabel}</div>
      </div>
    );
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Top 5 Fraud Patterns
          </h3>
          <p className="text-sm text-gray-600">
            Last {getTimeframeLabel()} • {totalFraud} fraud cases
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="text-sm font-semibold bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 text-blue-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:shadow-md cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="7200">Last 2h</option>
            <option value="14400">Last 4h</option>
            <option value="28800">Last 8h</option>
            <option value="86400">Last 24h</option>
            <option value="604800">Last 7d</option>
            <option value="2592000">Last 30d</option>
          </select>
        </div>
      </div>

      {(data?.length ?? 0) === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No fraud patterns detected yet</p>
          <p className="text-sm">Data will appear as fraud is detected</p>
        </div>
      ) : (
        <>
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={240} key={timeframe}>
              <BarChart
                data={data}
                layout="horizontal"
                margin={{ top: 16, right: 24, bottom: 8, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  stroke="#888"
                  allowDecimals={false}
                  domain={[0, 'dataMax']}
                  label={{ value: 'Fraud cases', position: 'insideBottomRight', offset: -2, fill: '#6b7280' }}
                />
                <YAxis
                  dataKey="pattern"
                  type="category"
                  stroke="#888"
                  width={190}
                  tick={<PatternTick />}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  isAnimationActive
                  animationDuration={500}
                  radius={[0, 8, 8, 0]}
                  barSize={22}
                  background={{ fill: 'rgba(0,0,0,0.04)' }}
                >
                  {data.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="count" content={<ValueLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {data.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-gray-700 text-xs">{p.pattern}</span>
                  <span className="text-gray-500 ml-auto font-semibold">
                    {p.count} • {p.pctLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

export default FraudPatterns;
