import axios from 'axios';
import { CrawlConfig } from '../types';

const API_KEY = process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY || 'test_fc_key';
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
  private apiKey: string;

  constructor() {
    this.apiKey = API_KEY;
  }

  async analyzeUrl(url: string, config: CrawlConfig): Promise<MapResponse> {
    try {
      console.log('Making map request to Firecrawl with URL:', url);
      
      const requestBody = {
        url: url.startsWith('http') ? url : `https://${url}`,
        maxDepth: config.maxDepth || 2,
        maxUrls: config.maxUrls || 100,
        skipTlsVerification: false
      };

      const response = await fetch(`${BASE_URL}/map`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Firecrawl API error: ${response.statusText}`);
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
      console.log('Making scrape request to Firecrawl with URL:', url);
      
      const requestBody: ScrapeParams = {
        url: url.startsWith('http') ? url : `https://${url}`,
        formats: ['html', 'metadata'],
        onlyMainContent: false,
        timeout: 30000,
        skipTlsVerification: false,
        waitFor: 1000,
        extract: {
          schema: {
            type: 'object',
            properties: {
              ssl: {
                type: 'object',
                properties: {
                  valid: { type: 'boolean' },
                  issuer: { type: 'string' },
                  validFrom: { type: 'string' },
                  validTo: { type: 'string' },
                  daysUntilExpiry: { type: 'number' },
                  error: { type: 'string' },
                  details: {
                    type: 'object',
                    properties: {
                      protocol: { type: 'string' },
                      cipher: { type: 'string' },
                      verificationError: { type: 'string' }
                    }
                  }
                }
              },
              robotsTxt: {
                type: 'object',
                properties: {
                  exists: { type: 'boolean' },
                  allowed: { type: 'boolean' },
                  content: { type: 'string' },
                  userAgent: { type: 'string' },
                  warnings: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        }
      };
      
      console.log('Request body:', requestBody);

      const response = await axios.post<ScrapeResponse>(
        `${BASE_URL}/scrape`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      console.log('Firecrawl response:', response.data);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      console.error('Error in scrapeUrl:', error);
      throw error;
    }
  }
} 