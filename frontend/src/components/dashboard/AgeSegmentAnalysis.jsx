import { useEffect, useState } from 'react';
import { Users, AlertCircle } from 'lucide-react';
import Card from '../common/Card';
import AgePieChart from '../charts/AgePieChart';
import { formatPercent } from '../../utils/formatters';

const AgeSegmentAnalysis = ({ transactions = [] }) => {
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({ 
    total: 0, 
    mostVulnerable: null
  });

  useEffect(() => {
    console.log(`📊 AgeSegmentAnalysis received ${transactions.length} transactions`);
    
    // Calculate age segments from fraud transactions
    const fraudTransactions = transactions.filter(t => {
      const isFraudValue = t.isFraud || t.is_fraud;
      // Consistent fraud detection: check is_fraud, isFraud, status === 'blocked' or 'unknown'
      return isFraudValue === true || isFraudValue === 1 || isFraudValue === '1' || isFraudValue === 'true' || t.status === 'blocked' || t.status === 'unknown';
    });
    
    console.log(`📊 Found ${fraudTransactions.length} fraud transactions`);
    
    // If no fraud transactions, clear data
    if (fraudTransactions.length === 0) {
      setChartData([]);
      setStats({ total: 0, mostVulnerable: null });
      return;
    }

    const segmentCounts = {
      '18-24': { count: 0, color: '#ef4444' },
      '25-34': { count: 0, color: '#f59e0b' },
      '35-44': { count: 0, color: '#eab308' },
      '45-54': { count: 0, color: '#3b82f6' },
      '55-64': { count: 0, color: '#8b5cf6' },
      '65+': { count: 0, color: '#10b981' }
    };

    fraudTransactions.forEach(t => {
      // Calculate age from DOB if available
      let age = null;
      if (t.dob) {
        const birthDate = new Date(t.dob);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      } else if (t.age) {
        age = t.age;
      }
      
      // Determine age segment
      let segment = null;
      if (age !== null) {
        if (age >= 18 && age <= 24) segment = '18-24';
        else if (age >= 25 && age <= 34) segment = '25-34';
        else if (age >= 35 && age <= 44) segment = '35-44';
        else if (age >= 45 && age <= 54) segment = '45-54';
        else if (age >= 55 && age <= 64) segment = '55-64';
        else if (age >= 65) segment = '65+';
      } else if (t.ageSegment) {
        segment = t.ageSegment;
      }
      
      if (segment && segmentCounts[segment]) {
        segmentCounts[segment].count++;
      }
    });

    // Convert to array for pie chart format
    const data = Object.entries(segmentCounts)
      .map(([segment, { count, color }]) => ({
        segment,
        fraudCount: count,
        label: `${segment} years`,
        value: count,
        color
      }))
      .filter(item => item.fraudCount > 0); // Only show segments with data

    setChartData(data);

    // Calculate stats
    const total = fraudTransactions.length;
    const mostVulnerable = data.reduce((max, item) => 
      item.fraudCount > (max?.fraudCount || 0) ? item : max, null
    );

    setStats({ total, mostVulnerable });
  }, [transactions]);

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            Fraud Exposure by Age Segment
          </h3>
          <p className="text-sm text-gray-600">{stats.total} fraud cases analyzed</p>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="space-y-6">
          {/* Most Vulnerable Segment */}
          {stats.mostVulnerable && (
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-2 border-red-300">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-600 mb-1">Most Vulnerable Segment</p>
                  <p className="text-lg font-bold text-gray-900">
                    {stats.mostVulnerable.segment} years old
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-semibold">{stats.mostVulnerable.fraudCount}</span> fraud cases
                    {stats.total > 0 && (
                          <span className="text-gray-600">
                            {' '}• {formatPercent(stats.mostVulnerable.fraudCount / stats.total, 1)} of total
                          </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pie Chart */}
          <div className="flex justify-center">
            <AgePieChart data={chartData} height={400} />
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No fraud data with age information available yet</p>
          <p className="text-sm">Data will appear as fraud with age/DOB is detected</p>
        </div>
      )}
    </Card>
  );
};

export default AgeSegmentAnalysis;
