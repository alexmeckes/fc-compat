import { CrawlConfig } from '../components/UrlInput';
import { firecrawlService } from './firecrawl';

async function basicHttpCheck(url: string) {
  try {
    const response = await fetch(url.startsWith('http') ? url : `https://${url}`);
    const isSecure = url.startsWith('https://') || url.startsWith('http://') && response.url.startsWith('https://');

    return {
      url,
      isValid: response.status >= 200 && response.status < 400,
      statusCode: response.status,
      error: response.status >= 400 ? `HTTP Error ${response.status}` : undefined,
      errorType: response.status === 429 ? 'RATE_LIMIT' : 
                 response.status === 403 ? 'BOT_PROTECTION' :
                 response.status === 401 ? 'ACCESS_DENIED' :
                 response.status >= 400 ? 'UNKNOWN' : undefined,
      isSecure,
      ssl: {
        valid: isSecure,
        details: {
          protocol: 'https'
        }
      },
      robotsTxt: {
        exists: false,
        allowed: true,
        userAgent: '*'
      }
    };
  } catch (error) {
    console.error('Basic HTTP check error:', error);
    return {
      url,
      isValid: false,
      error: error instanceof Error ? error.message : 'Network error',
      errorType: 'NETWORK',
      isSecure: false,
      ssl: {
        valid: false,
        error: 'Failed to establish connection'
      },
      robotsTxt: {
        exists: false,
        allowed: true,
        userAgent: '*'
      }
    };
  }
}

export async function checkUrl(url: string, config: CrawlConfig) {
  try {
    if (config.useFirecrawl) {
      const scrapeResult = await firecrawlService.scrapeUrl(url);

      if (!scrapeResult.success) {
        throw new Error('Failed to analyze URL');
      }

      const { data } = scrapeResult;
      const { metadata, ssl, robotsTxt } = data;

      // Determine error type based on metadata and warnings
      let errorType: string | undefined;
      if (metadata.statusCode === 429) {
        errorType = 'RATE_LIMIT';
      } else if (metadata.statusCode === 403) {
        errorType = 'BOT_PROTECTION';
      } else if (metadata.statusCode === 401) {
        errorType = 'ACCESS_DENIED';
      } else if (ssl?.error) {
        errorType = 'SSL';
      } else if (metadata.error) {
        errorType = 'UNKNOWN';
      }

      return {
        url,
        isValid: metadata.statusCode >= 200 && metadata.statusCode < 400,
        statusCode: metadata.statusCode,
        error: metadata.error,
        errorType,
        isSecure: ssl?.valid ?? false,
        ssl,
        robotsTxt
      };
    } else {
      return await basicHttpCheck(url);
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
} 