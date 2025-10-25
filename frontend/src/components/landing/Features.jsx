import { Shield, Zap, Bell, TrendingUp, Lock, BarChart3 } from 'lucide-react';
import Card from '../common/Card';

const Features = () => {
  const features = [
    {
      icon: Shield,
      title: 'Advanced Protection',
      description: 'Machine learning algorithms that identify suspicious patterns in real time.',
      color: 'text-primary-600',
      bg: 'bg-primary-50'
    },
    {
      icon: Zap,
      title: 'Instant Analysis',
      description: 'Ultra-fast transaction processing with latency under 100ms.',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50'
    },
    {
      icon: Bell,
      title: 'Real-Time Alerts',
      description: 'Instant notifications for suspicious transactions through multiple channels.',
      color: 'text-danger-600',
      bg: 'bg-danger-50'
    },
    {
      icon: TrendingUp,
      title: 'Predictive Analytics',
      description: 'Anticipate risks before fraud occurs with advanced forecasting.',
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      icon: Lock,
      title: 'Maximum Security',
      description: 'End-to-end encrypted data with full GDPR compliance.',
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      icon: BarChart3,
      title: 'Detailed Reports',
      description: 'Intuitive dashboards with actionable statistics and insights.',
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    }
  ];

  return (
    <div className="py-24 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to combat fraud and protect your business
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              hover 
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`${feature.bg} ${feature.color} w-14 h-14 rounded-lg flex items-center justify-center mb-4`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;

