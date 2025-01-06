import { CrawlConfig } from '../components/UrlInput';

const API_URL = import.meta.env.VITE_API_URL || '';

interface CheckResponse {
  checkId: string;
  url: string;
  isValid: boolean;
  statusCode?: number;
  error?: string;
  errorType?: string;
  isSecure: boolean;
  message?: string;
}

interface AdditionalChecks {
  completed: boolean;
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
  crawledUrls?: {
    url: string;
    status: number;
    type: 'success' | 'redirect' | 'error';
    timestamp: string;
  }[];
}

export async function checkUrl(url: string, config: CrawlConfig) {
  try {
    // Initial URL check
    const response = await fetch(`${API_URL}/api/check-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, config }),
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.message || 'Failed to check URL');
      } catch (e) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    }

    const initialResult: CheckResponse = await response.json();

    // Start polling for additional results
    if (initialResult.checkId) {
      const additionalResults = await pollAdditionalResults(initialResult.checkId);
      return {
        ...initialResult,
        ...additionalResults
      };
    }

    return initialResult;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

async function pollAdditionalResults(checkId: string, maxAttempts = 30): Promise<AdditionalChecks | null> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${API_URL}/api/check-results/${checkId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const result: AdditionalChecks = await response.json();
      
      // Only return if we have completed and have crawled URLs
      if (result.completed && result.crawledUrls) {
        return result;
      }

      // Wait 1 second before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    } catch (error) {
      console.error('Error polling for results:', error);
      return null;
    }
  }

  console.warn('Max polling attempts reached');
  return null;
} 