import { Shield, ArrowRight } from 'lucide-react';
import Button from '../common/Button';

const Hero = ({ onGetStarted }) => {
  return (
    <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
      <div className="container-custom py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full mb-6 backdrop-blur-sm">
            <Shield className="w-12 h-12" />
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Detect Fraudulent Transactions in
            <span className="text-primary-200"> Real Time</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-primary-100 mb-10 max-w-3xl mx-auto">
            Protect your business with advanced fraud detection technology. 
            Automated analysis, instant alerts, and detailed reports.
          </p>
          
          <div className="flex justify-center">
            <Button 
              variant="primary" 
              size="lg"
              onClick={onGetStarted}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600 font-bold text-lg px-10 py-4 shadow-2xl hover:shadow-xl transition-all transform hover:scale-105 border-2 border-yellow-300"
            >
              Get Started
              <ArrowRight className="w-6 h-6" />
            </Button>
          </div>
          
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-primary-200 text-sm">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">&lt;100ms</div>
              <div className="text-primary-200 text-sm">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-primary-200 text-sm">Monitoring</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(249, 250, 251)"/>
        </svg>
      </div>
    </div>
  );
};

export default Hero;

