import { useState, useEffect } from 'react';
import './styles.css';

const DEFAULT_CONFIG = {
  waitFor: 5000,
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
    onConfigChange(config);
  }, [config, onConfigChange]);

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const handleBrowserProfileChange = (e) => {
    setConfig(prev => ({
      ...prev,
      userAgent: BROWSER_PROFILES[e.target.value]
    }));
  };

  return (
    <div className="config-panel">
      <button 
        className="config-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        ⚙️ Advanced Settings {isExpanded ? '▼' : '▶'}
      </button>

      {isExpanded && (
        <div className="config-content">
          <div className="config-group">
            <label>
              Wait Timeout (ms):
              <input
                type="number"
                min="1000"
                max="30000"
                step="1000"
                value={config.waitFor}
                onChange={(e) => setConfig(prev => ({ ...prev, waitFor: parseInt(e.target.value, 10) }))}
              />
            </label>
          </div>

          <div className="config-group">
            <label>
              Browser Profile:
              <select
                value={Object.keys(BROWSER_PROFILES).find(key => BROWSER_PROFILES[key] === config.userAgent) || ''}
                onChange={handleBrowserProfileChange}
              >
                {Object.keys(BROWSER_PROFILES).map(profile => (
                  <option key={profile} value={profile}>
                    {profile}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button className="reset-btn" onClick={handleReset}>
            Reset to Defaults
          </button>
        </div>
      )}
    </div>
  );
} 