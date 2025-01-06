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

interface ScrapeResponse {
  success: boolean;
  data: {
    metadata: {
      title: string;
      description?: string;
      language?: string;
      sourceURL: string;
      statusCode: number;
      error?: string;
    };
    warning?: string;
    ssl?: {
      valid: boolean;
      issuer?: string;
      validFrom?: string;
      validTo?: string;
      daysUntilExpiry?: number;
      error?: string;
      details?: {
        protocol?: string;
        cipher?: string;
        verificationError?: string;
      };
    };
    robotsTxt?: {
      exists: boolean;
      allowed: boolean;
      content?: string;
      userAgent: string;
      warnings?: string[];
    };
  };
}

interface ScrapeParams {
  url: string;
  skipTlsVerification?: boolean;
  timeout?: number;
  formats?: string[];
  onlyMainContent?: boolean;
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
  },

  async scrapeUrl(url: string): Promise<ScrapeResponse> {
    try {
      console.log('Making scrape request to Firecrawl with URL:', url);
      
      const requestBody: ScrapeParams = {
        url: url.startsWith('http') ? url : `https://${url}`,
        skipTlsVerification: false,
        timeout: 30000,
        formats: ['ssl', 'robotsTxt'],
        onlyMainContent: false,
      };
      
      console.log('Request body:', requestBody);

      const response = await fetch(`${BASE_URL}/scrape`, {
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

      return data;
    } catch (error) {
      console.error('Error in scrapeUrl:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to connect to Firecrawl API');
    }
  }
}; 