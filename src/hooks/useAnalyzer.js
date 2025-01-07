import { useState } from 'react';
import { analyzeUrl } from '../services/api';

export function useAnalyzer() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async (url) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await analyzeUrl(url);
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    result,
    error,
    loading,
    analyze
  };
} 