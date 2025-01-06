import { CrawlConfig } from '../components/UrlInput';

// Get API key from environment variable or fallback to hardcoded value for development
const API_KEY = process.env.FIRECRAWL_API_KEY || 'fc-8931d65d88d84608abe543181f57d7e4';
const BASE_URL = 'https://api.firecrawl.dev/v0';

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
    html?: string;
    metadata: {
      title: string;
      description?: string;
      language?: string;
      sourceURL: string;
      statusCode: number;
      error?: string;
    };
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
    warning?: string;
  };
}

interface ScrapeParams {
  url: string;
  skipTlsVerification?: boolean;
  timeout?: number;
  formats?: string[];
  onlyMainContent?: boolean;
}

interface FirecrawlError {
  message: string;
  code?: string;
  details?: any;
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
        const errorData: FirecrawlError = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Error data:', errorData);
        throw new Error(
          errorData.message || 
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
      
      const requestBody = {
        url: url.startsWith('http') ? url : `https://${url}`,
        formats: ['html', 'metadata'],
        onlyMainContent: false,
        timeout: 30000,
        skipTlsVerification: false,
        waitFor: 1000,
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
        const errorData: FirecrawlError = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Error data:', errorData);
        
        // More specific error handling
        if (response.status === 400) {
          throw new Error(`Invalid request: ${errorData.message}`);
        } else if (response.status === 401) {
          throw new Error('Invalid API key');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        } else {
          throw new Error(
            errorData.message || 
            `Firecrawl API error (${response.status}): ${response.statusText}`
          );
        }
      }

      const data = await response.json();
      console.log('Raw Firecrawl response:', JSON.stringify(data, null, 2));

      // Transform response if needed to match our interface
      const transformedData: ScrapeResponse = {
        success: true,
        data: {
          ...data.data,
          metadata: {
            ...data.data.metadata,
            statusCode: data.data.metadata.statusCode || 200, // Default to 200 if not provided
          },
          // Move SSL and robots.txt data to the correct location if they're at the top level
          ssl: data.data.ssl || data.ssl || {
            valid: url.startsWith('https://'),
            details: { protocol: 'https' }
          },
          robotsTxt: data.data.robotsTxt || data.robotsTxt || {
            exists: false,
            allowed: true,
            userAgent: '*'
          },
        }
      };

      console.log('Transformed response:', JSON.stringify(transformedData, null, 2));
      return transformedData;
    } catch (error) {
      console.error('Error in scrapeUrl:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to connect to Firecrawl API');
    }
  }
}; 