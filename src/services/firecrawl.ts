import axios from 'axios';
import { CrawlConfig } from '../types';

// Server endpoint URL - use production URL in production environment
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://fc-compat.vercel.app';

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

export class FirecrawlService {
  async analyzeUrl(url: string, config: CrawlConfig): Promise<ScrapeResponse> {
    try {
      const endpoint = `${SERVER_URL}/v1/scrape`;
      const requestData = {
        url: url.startsWith('http') ? url : `https://${url}`,
        ...config
      };

      console.log('Making request:', {
        endpoint,
        method: 'POST',
        data: requestData,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await axios.post<ScrapeResponse>(
        endpoint,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Server response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error: unknown) {
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        response: axios.isAxiosError(error) ? {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
        } : undefined
      });

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Server configuration error: Invalid or missing API key');
        }
        throw new Error(`Request failed: ${error.response?.data?.message || error.message}`);
      }
      throw error instanceof Error ? error : new Error('An unknown error occurred');
    }
  }

  async scrapeUrl(url: string): Promise<ScrapeResponse> {
    return this.analyzeUrl(url, {
      maxDepth: 2,
      maxUrls: 100,
      useFirecrawl: true,
      skipTlsVerification: false,
      sitemapOnly: false,
      ignoreSitemap: false,
      includeSubdomains: false
    });
  }
}

export const firecrawlService = new FirecrawlService(); 