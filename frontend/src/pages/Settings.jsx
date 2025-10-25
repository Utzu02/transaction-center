import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/common/ToastContainer';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import LiveMonitorControl from '../components/dashboard/LiveMonitorControl';
import websocketService from '../services/websocket';
import sseService from '../services/sse';

const Settings = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Check if currently monitoring
  useEffect(() => {
    // Check connection status from services
    const checkStatus = () => {
      // This is a simplified check - you might want to implement a proper status check in your services
      setIsMonitoring(false);
    };
    checkStatus();
  }, []);

  const handleStartMonitoring = ({ connectionType, streamUrl, apiKey }) => {
    try {
      if (connectionType === 'sse') {
        sseService.connect(streamUrl, { apiKey });
        toast.showSuccess('SSE connection started. Return to dashboard to view live data.', 4000);
      } else {
        websocketService.connect(streamUrl);
        toast.showSuccess('WebSocket connection started. Return to dashboard to view live data.', 4000);
      }
      setIsMonitoring(true);
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      toast.showError(`Failed to start monitoring: ${error.message}`, 4000);
    }
  };

  const handleStopMonitoring = () => {
    websocketService.disconnect();
    sseService.disconnect();
    setIsMonitoring(false);
    toast.showInfo('Monitoring stopped', 2000);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Back button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>

          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
              <p className="text-gray-600">Configure your live monitoring connection and system preferences</p>
            </div>

            {/* Live Monitor Control Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Live Data Stream Configuration</h2>
              <LiveMonitorControl 
                onStart={handleStartMonitoring}
                onStop={handleStopMonitoring}
                isRunning={isMonitoring}
              />
            </div>

            {/* Future Settings Sections */}
            <div className="grid gap-6">
              {/* Placeholder for future settings */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;

