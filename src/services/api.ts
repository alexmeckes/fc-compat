import { firecrawlService } from './firecrawl';
import { CrawlConfig, UrlCheckResult } from '../types';

export async function checkUrl(url: string, config: CrawlConfig): Promise<UrlCheckResult> {
  try {
    const response = await firecrawlService.scrapeUrl(url);
    
    console.log('Firecrawl response in checkUrl:', response);

    if (response.error) {
      return {
        url,
        isValid: false,
        status: 'error',
        error: response.error,
        isSecure: url.startsWith('https://')
      };
    }

    const { data } = response;
    const statusCode = data.metadata.statusCode;
    const ssl = data.ssl;
    const robotsTxt = data.robotsTxt;

    // Determine status
    let status: 'success' | 'error' | 'warning' = 'success';
    if (statusCode >= 400) {
      status = 'error';
    } else if (ssl && !ssl.valid) {
      status = 'error';
    } else if (robotsTxt && !robotsTxt.allowed) {
      status = 'warning';
    }

    return {
      url,
      isValid: statusCode >= 200 && statusCode < 400,
      status,
      statusCode,
      isSecure: url.startsWith('https://'),
      ssl,
      robotsTxt
    };
  } catch (error) {
    console.error('Error in checkUrl:', error);
    return {
      url,
      isValid: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      isSecure: url.startsWith('https://')
    };
  }
} 