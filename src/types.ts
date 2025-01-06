export interface CrawlConfig {
  maxDepth: number;
  maxUrls: number;
  useFirecrawl: boolean;
  skipTlsVerification: boolean;
}

export type CheckStatus = 'success' | 'error' | 'pending';

export interface CheckResult {
  status: CheckStatus;
  error?: string;
  url: string;
  statusCode?: number;
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
} 