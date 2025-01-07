import { useState } from 'react';
import { checkUrl } from '../services/api';
import { CrawlConfig, UrlCheckResult } from '../types';

interface UrlInputProps {
  onResult: (result: UrlCheckResult) => void;
}

export default function UrlInput({ onResult }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [config, setConfig] = useState<CrawlConfig>({
    maxDepth: 2,
    maxUrls: 100,
    useFirecrawl: true,
    skipTlsVerification: false,
    sitemapOnly: false,
    ignoreSitemap: false,
    includeSubdomains: false
  });

  const handleConfigChange = (key: keyof CrawlConfig, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      [key]: typeof value === 'string' ? parseInt(value, 10) || 0 : value
    }));
  };

  const handleAnalyze = async () => {
    if (!url) return;
    
    setIsAnalyzing(true);
    try {
      const result = await checkUrl(url, config);
      onResult(result);
    } catch (error) {
      console.error('Error analyzing URL:', error);
      onResult({
        url,
        isValid: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        isSecure: url.startsWith('https://')
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL to analyze"
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !url}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          <span className="flex items-center">
            <svg
              className={`w-4 h-4 mr-1 transform ${showAdvanced ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            Advanced Settings
          </span>
        </button>
      </div>

      {showAdvanced && (
        <div className="p-4 bg-gray-50 rounded space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Max Depth
              <input
                type="number"
                value={config.maxDepth}
                onChange={(e) => handleConfigChange('maxDepth', e.target.value)}
                min="1"
                max="5"
                className="mt-1 block w-full p-2 border rounded"
              />
            </label>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Max URLs
              <input
                type="number"
                value={config.maxUrls}
                onChange={(e) => handleConfigChange('maxUrls', e.target.value)}
                min="1"
                max="1000"
                className="mt-1 block w-full p-2 border rounded"
              />
            </label>
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.useFirecrawl}
                onChange={(e) => handleConfigChange('useFirecrawl', e.target.checked)}
                className="rounded text-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Use Firecrawl API (recommended)
              </span>
            </label>
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.skipTlsVerification}
                onChange={(e) => handleConfigChange('skipTlsVerification', e.target.checked)}
                className="rounded text-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Skip TLS Verification
              </span>
            </label>
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.sitemapOnly}
                onChange={(e) => handleConfigChange('sitemapOnly', e.target.checked)}
                className="rounded text-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Only Use Sitemap
              </span>
            </label>
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.ignoreSitemap}
                onChange={(e) => handleConfigChange('ignoreSitemap', e.target.checked)}
                className="rounded text-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Ignore Sitemap
              </span>
            </label>
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.includeSubdomains}
                onChange={(e) => handleConfigChange('includeSubdomains', e.target.checked)}
                className="rounded text-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Include Subdomains
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
