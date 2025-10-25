import { useState } from 'react';
import { Play, Square, Settings } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';

const LiveMonitorControl = ({ onStart, onStop, isRunning }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [streamUrl, setStreamUrl] = useState(
    import.meta.env.VITE_STREAM_URL || 'https://95.217.75.14:8443/stream'
  );
  const [apiKey, setApiKey] = useState(
    import.meta.env.VITE_API_KEY || ''
  );
  const [connectionType, setConnectionType] = useState(
    import.meta.env.VITE_DEFAULT_CONNECTION_TYPE || 'sse'
  ); // 'sse' or 'websocket'

  const handleStart = () => {
    const url = streamUrl.trim();
    const key = apiKey.trim();
    
    if (!url) {
      alert('Please enter a stream URL');
      return;
    }

    if (connectionType === 'sse' && !key) {
      alert('Please enter an API Key for SSE connection');
      return;
    }

    // Auto-prepend protocol if not present for WebSocket
    let finalUrl = url;
    if (connectionType === 'websocket') {
      if (!finalUrl.startsWith('ws://') && !finalUrl.startsWith('wss://')) {
        finalUrl = 'ws://' + finalUrl;
      }
    } else {
      // For SSE, ensure it starts with http:// or https://
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
      }
    }

    onStart({ connectionType, streamUrl: finalUrl, apiKey: key });
    setShowConfig(false);
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Live Monitor Control</h3>
          <p className="text-sm text-gray-600">
            {isRunning ? 'Monitoring active' : 'Start monitoring to receive live transactions'}
          </p>
        </div>
        
        <div className="flex gap-2">
          {!isRunning ? (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowConfig(!showConfig)}
              >
                <Settings className="w-4 h-4" />
                Configure
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={handleStart}
              >
                <Play className="w-4 h-4" />
                Start Monitoring
              </Button>
            </>
          ) : (
            <Button 
              variant="danger" 
              size="sm"
              onClick={onStop}
            >
              <Square className="w-4 h-4" />
              Stop Monitoring
            </Button>
          )}
        </div>
      </div>

      {showConfig && (
        <div className="mt-4 p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200 space-y-4">
          {/* Connection Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Connection Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setConnectionType('sse')}
                className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-105 ${
                  connectionType === 'sse'
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 font-semibold shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                SSE (Hackathon)
              </button>
              <button
                onClick={() => setConnectionType('websocket')}
                className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-105 ${
                  connectionType === 'websocket'
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 font-semibold shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                WebSocket
              </button>
            </div>
          </div>

          {/* Stream URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Stream URL
            </label>
            <input
              type="text"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder={connectionType === 'sse' ? 'https://95.217.75.14:8443/stream' : 'localhost:8080/stream'}
              className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-white/80"
            />
            <p className="mt-1 text-xs text-gray-500">
              {connectionType === 'sse' 
                ? 'Enter the full HTTPS URL for SSE stream'
                : 'Protocol ws:// is automatically added for WebSocket'}
            </p>
          </div>

          {/* API Key (only for SSE) */}
          {connectionType === 'sse' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                API Key <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key (X-API-Key header)"
                className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-white/80 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Required for authenticating with the hackathon stream
              </p>
            </div>
          )}

          {/* Help Text */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs text-blue-800">
              <strong>💡 Hackathon Setup:</strong><br/>
              • Use SSE connection type<br/>
              • Stream URL: <code className="bg-blue-100 px-1 rounded">https://95.217.75.14:8443/stream</code><br/>
              • Flag URL: <code className="bg-blue-100 px-1 rounded">https://95.217.75.14:8443/api/flag</code><br/>
              • Add your API key in <code className="bg-blue-100 px-1 rounded">.env</code> file or here
            </p>
          </div>
          
          {/* Environment Status */}
          {import.meta.env.VITE_API_KEY && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3">
              <p className="text-xs text-green-800">
                ✅ <strong>API Key loaded from .env file</strong>
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default LiveMonitorControl;

