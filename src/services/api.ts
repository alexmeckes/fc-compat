import { CrawlConfig } from '../components/UrlInput';

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';

export async function checkUrl(url: string, config: CrawlConfig) {
  const response = await fetch(`${API_URL}/check-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, config }),
  });

  if (!response.ok) {
    throw new Error('Failed to check URL');
  }

  return response.json();
} 