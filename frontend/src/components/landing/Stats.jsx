import Card from '../common/Card';

const Stats = () => {
  const stats = [
    {
      value: '10M+',
      label: 'Transactions Processed',
      description: 'Monthly'
    },
    {
      value: '98.5%',
      label: 'Detection Rate',
      description: 'Fraud identified'
    },
    {
      value: '500+',
      label: 'Partner Companies',
      description: 'Worldwide'
    },
    {
      value: '$50M+',
      label: 'Losses Prevented',
      description: 'For clients'
    }
  ];

  return (
    <div className="py-24 bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Measurable Results
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Statistics that demonstrate our platform's effectiveness
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <div className="text-5xl font-bold text-primary-600 mb-3">
                {stat.value}
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-2">
                {stat.label}
              </div>
              <div className="text-sm text-gray-600">
                {stat.description}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Stats;

