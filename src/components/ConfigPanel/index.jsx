import { useState, useEffect } from 'react';

const DEFAULT_CONFIG = {
  waitFor: 30,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  removeBase64Images: true,
  onlyMainContent: true,
  includeTags: '',
  excludeTags: '',
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
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        waitFor: Math.min(Math.max(parsed.waitFor, 1), 60)
      };
    }
    return DEFAULT_CONFIG;
  });
  const [tempConfig, setTempConfig] = useState(config);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setTempConfig(config);
  }, [config]);

  const handleSave = () => {
    const validatedConfig = {
      ...tempConfig,
      waitFor: Math.min(Math.max(tempConfig.waitFor, 1), 60),
      includeTags: tempConfig.includeTags.trim(),
      excludeTags: tempConfig.excludeTags.trim(),
    };
    setConfig(validatedConfig);
    localStorage.setItem('firecrawlConfig', JSON.stringify(validatedConfig));
    onConfigChange({
      ...validatedConfig,
      waitFor: validatedConfig.waitFor * 1000,
      includeTags: validatedConfig.includeTags ? validatedConfig.includeTags.split(',').map(tag => tag.trim()) : [],
      excludeTags: validatedConfig.excludeTags ? validatedConfig.excludeTags.split(',').map(tag => tag.trim()) : [],
    });
    setHasChanges(false);
    setIsExpanded(false);
  };

  const handleReset = () => {
    setTempConfig(DEFAULT_CONFIG);
    setHasChanges(true);
  };

  const handleWaitTimeChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    setTempConfig(prev => ({ 
      ...prev, 
      waitFor: isNaN(newValue) ? DEFAULT_CONFIG.waitFor : newValue 
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
                  value={tempConfig.waitFor}
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