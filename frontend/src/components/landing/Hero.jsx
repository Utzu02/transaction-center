import { Shield, Rocket, Lock, Eye, Zap } from "lucide-react";
import Button from "../common/Button";

const Hero = ({ onGetStarted }) => {
  return (
    <div className="relative h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden flex items-center">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e3a8a15_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 md:w-96 md:h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 md:w-96 md:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto">
          {/* Icon with glow effect */}
          <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-50 animate-pulse"></div>
              <div className="relative inline-flex items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl backdrop-blur-sm border border-blue-400/30">
                <Shield className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Main heading */}
          <h1 className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-3 sm:mb-4 md:mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              Real-Time Fraud Detection
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              AI-Powered Security
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-center text-lg sm:text-xl md:text-2xl text-gray-300 mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto font-medium">
            SIEM for POS Fraud Detection
          </p>

          {/* CTA Button */}
          <div className="flex justify-center mb-8 sm:mb-12 md:mb-16">
            <button
              onClick={onGetStarted}
              className="group relative inline-flex items-center gap-2 sm:gap-3 px-5 sm:px-6 py-3 sm:py-4 md:py-5 text-lg sm:text-xl font-display font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
            >
              <span>Launch Dashboard</span>
              <Rocket className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-y-1 group-hover:rotate-12 transition-all duration-300" />
            </button>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6">
            <div className="flex items-center gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 bg-white/5 backdrop-blur-md rounded-full border border-white/10 hover:border-blue-400/50 transition-all duration-300 hover:scale-105">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              <span className="text-xs sm:text-sm md:text-base font-semibold font-display">Real-Time Detection</span>
            </div>
            <div className="flex items-center gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 bg-white/5 backdrop-blur-md rounded-full border border-white/10 hover:border-blue-400/50 transition-all duration-300 hover:scale-105">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              <span className="text-xs sm:text-sm md:text-base font-semibold font-display">Live Monitoring</span>
            </div>
            <div className="flex items-center gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 bg-white/5 backdrop-blur-md rounded-full border border-white/10 hover:border-blue-400/50 transition-all duration-300 hover:scale-105">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              <span className="text-xs sm:text-sm md:text-base font-semibold font-display">Secure & Private</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-24 md:h-32 bg-gradient-to-t from-gray-50 to-transparent"></div>
    </div>
  );
};

export default Hero;
