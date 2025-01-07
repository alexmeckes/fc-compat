import axios from 'axios';
import { CrawlConfig } from '../types';

// Server endpoint URL - adjust based on environment
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';

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
      console.log('Making request to server with URL:', url);

      const response = await axios.post<ScrapeResponse>(
        `${SERVER_URL}/api/firecrawl/analyze`,
        {
          url: url.startsWith('http') ? url : `https://${url}`,
          ...config
        },
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
      console.error('Error in analyzeUrl:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Server configuration error: Invalid or missing API key');
        }
        throw new Error(`Request failed: ${error.response?.data?.message || error.message}`);
      }
      throw error;
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