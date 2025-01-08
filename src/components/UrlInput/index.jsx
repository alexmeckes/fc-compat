import { useState } from 'react';
import { analyzeUrl } from '../../services/api';
import { ConfigPanel } from '../ConfigPanel';

export function UrlInput({ onResult, onError }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    try {
      const result = await analyzeUrl(url, config);
      onResult(result, config);
    } catch (error) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="relative">
        <ConfigPanel onConfigChange={setConfig} />
        
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL to analyze..."
            required
            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>
      </div>
    </div>
  );
} 