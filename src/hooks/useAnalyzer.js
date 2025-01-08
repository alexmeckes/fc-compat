import { useState } from 'react';
import { analyzeUrl } from '../services/api';

export function useAnalyzer() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [waitTime, setWaitTime] = useState(30); // Default 30 seconds

  const analyze = async (url, config = {}) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await analyzeUrl(url, {
        ...config,
        waitFor: waitTime * 1000 // Convert to milliseconds
      });
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

  const updateWaitTime = (newTime) => {
    if (newTime !== waitTime) {
      const confirmed = window.confirm(
        `Are you sure you want to change the wait time to ${newTime} seconds? This will be used for future requests.`
      );
      if (confirmed) {
        setWaitTime(newTime);
      }
    }
  };

  return {
    result,
    error,
    loading,
    analyze,
    waitTime,
    updateWaitTime
  };
} 