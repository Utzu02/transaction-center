import { useToast } from '../components/common/ToastContainer';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import LiveMonitorControl from '../components/dashboard/LiveMonitorControl';

const Settings = () => {
  const toast = useToast();

  const handleConfigChange = (config) => {
    toast.showSuccess('Configuration saved successfully!', 3000);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
              <p className="text-gray-600">Configure your live monitoring connection and system preferences</p>
            </div>

            {/* Live Monitor Control Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Live Data Stream Configuration</h2>
              <LiveMonitorControl onChange={handleConfigChange} />
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

