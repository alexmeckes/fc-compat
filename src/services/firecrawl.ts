import axios from 'axios';
import { CrawlConfig } from '../types';

// Server endpoint URL - adjust based on environment
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';

interface MapResponse {
  success: boolean;
  links: string[];
}

interface MapParams extends CrawlConfig {
  url: string;
}

interface ScrapeResponse {
  success: boolean;
  error?: string;
  data: {
    metadata: {
      statusCode: number;
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
  };
}

interface ScrapeParams {
  url: string;
  skipTlsVerification?: boolean;
  timeout?: number;
  formats?: string[];
  onlyMainContent?: boolean;
  waitFor?: number;
  extract?: {
    schema?: {
      type: string;
      properties: {
        ssl?: {
          type: string;
          properties: {
            valid: { type: string };
            issuer: { type: string };
            validFrom: { type: string };
            validTo: { type: string };
            daysUntilExpiry: { type: string };
            error: { type: string };
            details: {
              type: string;
              properties: {
                protocol: { type: string };
                cipher: { type: string };
                verificationError: { type: string };
              };
            };
          };
        };
        robotsTxt?: {
          type: string;
          properties: {
            exists: { type: string };
            allowed: { type: string };
            content: { type: string };
            userAgent: { type: string };
            warnings: { type: string; items: { type: string } };
          };
        };
      };
    };
  };
}

interface FirecrawlError {
  message: string;
  code?: string;
  details?: any;
}

export class FirecrawlService {
  async analyzeUrl(url: string, config: CrawlConfig): Promise<MapResponse> {
    try {
      console.log('Making map request to server with URL:', url);
      
      const requestBody = {
        url: url.startsWith('http') ? url : `https://${url}`,
        maxDepth: config.maxDepth || 2,
        maxUrls: config.maxUrls || 100,
        skipTlsVerification: false
      };

      const response = await fetch(`${SERVER_URL}/api/firecrawl/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in analyzeUrl:', error);
      throw error;
    }
  }

  async scrapeUrl(url: string): Promise<ScrapeResponse> {
    try {
      console.log('Making scrape request to server with URL:', url);

      const response = await axios.post<ScrapeResponse>(
        `${SERVER_URL}/api/firecrawl/analyze`,
        { url: url.startsWith('http') ? url : `https://${url}` },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Server response:', response.data);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      console.error('Error in scrapeUrl:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Server configuration error: Invalid or missing API key');
        }
        throw new Error(`Request failed: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }
}

export const firecrawlService = new FirecrawlService(); 