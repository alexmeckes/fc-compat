import { useState } from 'react';
import { analyzeUrl } from '../../services/api';
import { ConfigPanel } from '../ConfigPanel';
import './styles.css';

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
      onResult(result);
    } catch (error) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="url-input-container">
      <ConfigPanel onConfigChange={setConfig} />
      
      <form onSubmit={handleSubmit} className="url-form">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL to analyze..."
          required
          className="url-input"
        />
        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>
    </div>
  );
} 