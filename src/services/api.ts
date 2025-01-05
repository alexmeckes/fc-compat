import { CrawlConfig } from '../components/UrlInput';

const API_URL = '/api';

export async function checkUrl(url: string, config: CrawlConfig) {
  try {
    const response = await fetch(`${API_URL}/check-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, config }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check URL');
    }

    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
} 