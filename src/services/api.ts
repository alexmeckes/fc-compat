import { CrawlConfig } from '../components/UrlInput';

const API_URL = import.meta.env.VITE_API_URL || '';

export async function checkUrl(url: string, config: CrawlConfig) {
  try {
    const response = await fetch(`${API_URL}/api/check-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, config }),
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.message || 'Failed to check URL');
      } catch (e) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    }

    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
} 