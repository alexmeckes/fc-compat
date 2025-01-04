import { CrawlConfig } from '../components/UrlInput';

const API_KEY = 'fc-8931d65d88d84608abe543181f57d7e4';
const BASE_URL = 'https://api.firecrawl.dev/v1';

interface MapResponse {
  success: boolean;
  links: string[];
}

interface MapParams extends CrawlConfig {
  url: string;
}

export const firecrawlService = {
  async analyzeUrl(url: string, config: CrawlConfig): Promise<MapResponse> {
    try {
      console.log('Making request to Firecrawl with URL:', url);
      console.log('Configuration:', config);
      
      const requestBody: MapParams = {
        url: url.startsWith('http') ? url : `https://${url}`,
        ...config
      };
      
      console.log('Request body:', requestBody);

      const response = await fetch(`${BASE_URL}/map`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error data:', errorData);
        throw new Error(
          errorData?.message || 
          `Firecrawl API error (${response.status}): ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (!data.links || !Array.isArray(data.links)) {
        throw new Error('Invalid response format: missing links array');
      }

      return {
        success: true,
        links: data.links
      };
    } catch (error) {
      console.error('Error in analyzeUrl:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to connect to Firecrawl API');
    }
  }
}; 