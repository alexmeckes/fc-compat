export interface CrawlConfig {
  maxDepth: number;
  maxUrls: number;
  useFirecrawl: boolean;
  skipTlsVerification: boolean;
  sitemapOnly?: boolean;
  ignoreSitemap?: boolean;
  includeSubdomains?: boolean;
}

export interface UrlCheckResult {
  url: string;
  isValid: boolean;
  status: 'success' | 'error' | 'warning';
  statusCode?: number;
  error?: string;
  errorType?: 'RATE_LIMIT' | 'BOT_PROTECTION' | 'ACCESS_DENIED' | 'NETWORK' | 'SSL' | 'UNKNOWN';
  redirectChain?: string[];
  isSecure: boolean;
  robotsTxt?: {
    exists: boolean;
    allowed: boolean;
    content?: string;
    userAgent: string;
    warnings?: string[];
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
  crawledUrls?: Array<{
    url: string;
    status: number;
    type: 'success' | 'redirect' | 'error';
    timestamp: string;
  }>;
} 