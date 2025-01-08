import { useState, useEffect } from 'react';

const DEFAULT_CONFIG = {
  waitFor: 5000, // 5 seconds in milliseconds
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  removeBase64Images: true,
  onlyMainContent: true,
  includeTags: '',
  excludeTags: '',
  emulateMobile: false,
};

export const BROWSER_PROFILES = {
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
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        const validatedConfig = {
          ...DEFAULT_CONFIG,
          ...parsed,
          waitFor: Math.min(Math.max(parsed.waitFor || DEFAULT_CONFIG.waitFor, 1000), 60000) // Ensure valid milliseconds
        };
        // Immediately notify parent of loaded config
        setTimeout(() => onConfigChange(validatedConfig), 0);
        return validatedConfig;
      } catch (error) {
        console.error('Error loading saved config:', error);
        // Immediately notify parent of default config
        setTimeout(() => onConfigChange(DEFAULT_CONFIG), 0);
        return DEFAULT_CONFIG;
      }
    }
    // Immediately notify parent of default config
    setTimeout(() => onConfigChange(DEFAULT_CONFIG), 0);
    return DEFAULT_CONFIG;
  });
  const [tempConfig, setTempConfig] = useState(config);
  const [hasChanges, setHasChanges] = useState(false);

  // Ensure config changes are propagated
  useEffect(() => {
    onConfigChange(config);
  }, [config]);

  useEffect(() => {
    setTempConfig(config);
  }, [config]);

  const handleSave = () => {
    const validatedConfig = {
      ...tempConfig,
      waitFor: Math.min(Math.max(tempConfig.waitFor, 1000), 60000), // Ensure valid milliseconds
      includeTags: tempConfig.includeTags.trim(),
      excludeTags: tempConfig.excludeTags.trim(),
    };
    setConfig(validatedConfig);
    localStorage.setItem('firecrawlConfig', JSON.stringify(validatedConfig));
    onConfigChange(validatedConfig);
    setHasChanges(false);
    setIsExpanded(false);
  };

  const handleReset = () => {
    setTempConfig(DEFAULT_CONFIG);
    setHasChanges(true);
  };

  const handleWaitTimeChange = (e) => {
    const seconds = parseInt(e.target.value, 10);
    setTempConfig(prev => ({ 
      ...prev, 
      waitFor: (isNaN(seconds) ? DEFAULT_CONFIG.waitFor : seconds * 1000) // Convert seconds to milliseconds
    }));
    setHasChanges(true);
  };

  const handleBrowserProfileChange = (e) => {
    setTempConfig(prev => ({
      ...prev,
      userAgent: BROWSER_PROFILES[e.target.value]
    }));
    setHasChanges(true);
  };

  const handleToggleChange = (field) => {
    setTempConfig(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
    setHasChanges(true);
  };

  const handleTagsChange = (field, value) => {
    setTempConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
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
        <div className="absolute right-0 top-2 z-10 mt-8 w-96 rounded-lg bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wait Time (seconds):
                <input
                  type="number"
                  value={tempConfig.waitFor / 1000} // Convert milliseconds to seconds for display
                  onChange={handleWaitTimeChange}
                  min="1"
                  max="60"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">Default: 5 seconds. Max: 60 seconds</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Browser Profile:
                <select
                  value={Object.keys(BROWSER_PROFILES).find(key => BROWSER_PROFILES[key] === tempConfig.userAgent) || ''}
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

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={tempConfig.removeBase64Images}
                  onChange={() => handleToggleChange('removeBase64Images')}
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                Remove Base64 Images
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={tempConfig.onlyMainContent}
                  onChange={() => handleToggleChange('onlyMainContent')}
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                Only Main Content
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={tempConfig.emulateMobile}
                  onChange={() => handleToggleChange('emulateMobile')}
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                Emulate Mobile Device
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Include Tags (comma-separated):
                <input
                  type="text"
                  value={tempConfig.includeTags}
                  onChange={(e) => handleTagsChange('includeTags', e.target.value)}
                  placeholder="e.g., article, main, .content"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exclude Tags (comma-separated):
                <input
                  type="text"
                  value={tempConfig.excludeTags}
                  onChange={(e) => handleTagsChange('excludeTags', e.target.value)}
                  placeholder="e.g., nav, footer, .ads"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </label>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
              >
                Reset
              </button>
              <button 
                onClick={handleSave}
                disabled={!hasChanges}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 