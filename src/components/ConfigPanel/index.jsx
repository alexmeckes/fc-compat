import { useState, useEffect } from 'react';

const DEFAULT_CONFIG = {
  waitFor: 30,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

const BROWSER_PROFILES = {
  'Chrome Desktop': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Firefox Desktop': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Safari Desktop': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mobile Chrome': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1',
  'Mobile Safari': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
};

export function ConfigPanel({ onConfigChange }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [config, setConfig] = useState(() => {
    const savedConfig = localStorage.getItem('firecrawlConfig');
    return savedConfig ? JSON.parse(savedConfig) : DEFAULT_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem('firecrawlConfig', JSON.stringify(config));
    onConfigChange({
      ...config,
      waitFor: config.waitFor * 1000
    });
  }, [config, onConfigChange]);

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const handleWaitTimeChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    if (newValue !== config.waitFor) {
      const confirmed = window.confirm(
        `Are you sure you want to change the wait time to ${newValue} seconds? This will be used for future requests.`
      );
      if (confirmed) {
        setConfig(prev => ({ ...prev, waitFor: newValue }));
      } else {
        e.target.value = config.waitFor;
      }
    }
  };

  const handleBrowserProfileChange = (e) => {
    setConfig(prev => ({
      ...prev,
      userAgent: BROWSER_PROFILES[e.target.value]
    }));
  };

  return (
    <div className="relative">
      <button 
        className="absolute -top-8 right-0 p-2 text-gray-600 hover:text-gray-900 transition-all hover:rotate-45"
        onClick={() => setIsExpanded(!isExpanded)}
        title="Advanced Settings"
      >
        ⚙️
      </button>

      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wait Time (seconds):
                <input
                  type="number"
                  min="1"
                  max="60"
                  step="1"
                  value={config.waitFor}
                  onChange={handleWaitTimeChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </label>
              <p className="mt-1 text-xs text-gray-500">Default: 30 seconds. Max: 60 seconds</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Browser Profile:
                <select
                  value={Object.keys(BROWSER_PROFILES).find(key => BROWSER_PROFILES[key] === config.userAgent) || ''}
                  onChange={handleBrowserProfileChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.keys(BROWSER_PROFILES).map(profile => (
                    <option key={profile} value={profile}>
                      {profile}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button 
              onClick={handleReset}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 