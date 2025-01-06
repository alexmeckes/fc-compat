import { FirecrawlService } from './firecrawl';
import { CrawlConfig, CheckResult, CheckStatus } from '../types';

export async function checkUrl(url: string, config: CrawlConfig): Promise<CheckResult> {
  try {
    const firecrawl = new FirecrawlService();
    const response = await firecrawl.scrapeUrl(url);
    
    console.log('Firecrawl response in checkUrl:', response);

    if (response.error) {
      return {
        status: 'error',
        error: response.error,
        url
      };
    }

    const { data } = response;
    const statusCode = data.metadata.statusCode;
    const ssl = data.ssl;
    const robotsTxt = data.robotsTxt;

    // Determine overall status
    let status: CheckStatus = 'success';
    let error: string | undefined;

    if (statusCode >= 400) {
      status = 'error';
      error = `HTTP ${statusCode}`;
    } else if (ssl && !ssl.valid) {
      status = 'error';
      error = ssl.error || 'SSL validation failed';
    } else if (robotsTxt && !robotsTxt.allowed) {
      status = 'error';
      error = 'Access not allowed by robots.txt';
    }

    return {
      status,
      error,
      url,
      statusCode,
      ssl,
      robotsTxt
    };
  } catch (error) {
    console.error('Error in checkUrl:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      url
    };
  }
} 