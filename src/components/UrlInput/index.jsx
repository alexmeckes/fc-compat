import { useState } from 'react';
import './styles.css';

export function UrlInput({ onAnalyze, isLoading }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAnalyze(url);
  };

  return (
    <form onSubmit={handleSubmit} className="url-input-form">
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL to analyze"
        className="url-input"
        required
      />
      <button type="submit" disabled={isLoading} className="analyze-button">
        {isLoading ? 'Analyzing...' : 'Analyze'}
      </button>
    </form>
  );
} 