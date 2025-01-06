import React, { useState, useEffect } from 'react';
import { UrlList } from './UrlList';

interface AnalysisResultsProps {
  result: {
    url: string;
    isValid: boolean;
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
    crawledUrls?: {
      url: string;
      status: number;
      type: 'success' | 'redirect' | 'error';
      timestamp: string;
    }[];
  } | null;
}

const StatusIndicator: React.FC<{ status: 'success' | 'warning' | 'error' }> = ({ status }) => {
  const colors = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result: initialResult }) => {
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlStarted, setCrawlStarted] = useState(false);
  const [crawlId, setCrawlId] = useState<string | null>(null);
  const [result, setResult] = useState(initialResult);
  const [crawledUrls, setCrawledUrls] = useState<{
    url: string;
    status: number;
    type: 'success' | 'redirect' | 'error';
    timestamp: string;
  }[] | null>(null);

  // Update result when prop changes
  useEffect(() => {
    setResult(initialResult);
    // Reset crawl state when initial result changes
    setCrawlStarted(false);
    setIsCrawling(false);
    setCrawlId(null);
    setCrawledUrls(null);
  }, [initialResult]);

  // Poll for crawl results
  useEffect(() => {
    if (!crawlId) return;

    const pollCrawlResults = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/crawl-results/${crawlId}`);
        if (!response.ok) {
          console.error('Error polling crawl results:', response.status);
          return;
        }

        const data = await response.json();
        console.log('Received crawl results:', data);
        
        // Update SSL and robots.txt data if available
        if (data.ssl || data.robotsTxt) {
          setResult(prev => prev ? {
            ...prev,
            ssl: data.ssl || prev.ssl,
            robotsTxt: data.robotsTxt || prev.robotsTxt
          } : prev);
        }

        // Update crawled URLs if available
        if (data.crawledUrls) {
          setCrawledUrls(data.crawledUrls);
        }

        // Stop polling if completed
        if (data.completed) {
          setCrawlId(null);
          setIsCrawling(false);
        }
      } catch (error) {
        console.error('Error polling crawl results:', error);
      }
    };

    const interval = setInterval(pollCrawlResults, 1000);
    return () => clearInterval(interval);
  }, [crawlId]);

  if (!result) return null;

  const getStatusColor = (statusCode?: number) => {
    if (!statusCode) return 'error';
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 300 && statusCode < 400) return 'warning';
    return 'error';
  };

  const handleDiscoverUrls = async () => {
    setIsCrawling(true);
    setCrawlStarted(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/crawl-urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: result.url,
          config: {
            sitemapOnly: false,
            ignoreSitemap: false,
            includeSubdomains: false,
            maxDepth: 2,
            limit: 100,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start URL discovery');
      }

      const data = await response.json();
      setCrawlId(data.crawlId);
    } catch (error) {
      console.error('Error starting URL discovery:', error);
      setIsCrawling(false);
      setCrawlStarted(false);
    }
  };

  const getErrorTypeDisplay = (type?: string) => {
    switch (type) {
      case 'RATE_LIMIT': return 'Rate Limited';
      case 'BOT_PROTECTION': return 'Bot Protection';
      case 'ACCESS_DENIED': return 'Access Denied';
      case 'NETWORK': return 'Network Error';
      case 'SSL': return 'SSL Error';
      default: return 'Unknown Error';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <div className="bg-white shadow-lg rounded-xl p-6 space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-xl font-semibold text-gray-900">Analysis Results</h2>
          <p className="mt-1 text-sm text-gray-500">{result.url}</p>
        </div>

        {/* Status Section with Enhanced Error Details */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Status</span>
            <div className="flex items-center space-x-2">
              <StatusIndicator status={getStatusColor(result.statusCode)} />
              {result.statusCode && (
                <span className="text-sm text-gray-600">
                  ({result.statusCode})
                </span>
              )}
            </div>
          </div>
          {result.errorType && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {getErrorTypeDisplay(result.errorType)}
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{result.error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-gray-700">HTTPS</span>
            <StatusIndicator status={result.isSecure ? 'success' : 'error'} />
          </div>
        </div>

        {/* SSL Certificate with Enhanced Details */}
        {result.ssl && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">SSL Certificate</h3>
              <StatusIndicator status={result.ssl.valid ? 'success' : 'error'} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {result.ssl.issuer && (
                <div>
                  <span className="text-gray-500">Issuer</span>
                  <p className="text-gray-900">{result.ssl.issuer}</p>
                </div>
              )}
              {result.ssl.details?.protocol && (
                <div>
                  <span className="text-gray-500">Protocol</span>
                  <p className="text-gray-900">{result.ssl.details.protocol}</p>
                </div>
              )}
              {result.ssl.details?.cipher && (
                <div>
                  <span className="text-gray-500">Cipher</span>
                  <p className="text-gray-900">{result.ssl.details.cipher}</p>
                </div>
              )}
              {result.ssl.validFrom && (
                <div>
                  <span className="text-gray-500">Valid From</span>
                  <p className="text-gray-900">{formatDate(result.ssl.validFrom)}</p>
                </div>
              )}
              {result.ssl.validTo && (
                <div>
                  <span className="text-gray-500">Valid Until</span>
                  <p className="text-gray-900">{formatDate(result.ssl.validTo)}</p>
                </div>
              )}
              {result.ssl.daysUntilExpiry !== undefined && (
                <div>
                  <span className="text-gray-500">Days Until Expiry</span>
                  <p className={`text-gray-900 ${
                    result.ssl.daysUntilExpiry < 30 ? 'text-red-600' : ''
                  }`}>
                    {result.ssl.daysUntilExpiry}
                  </p>
                </div>
              )}
            </div>
            {result.ssl.details?.verificationError && (
              <div className="mt-2 text-sm text-red-600">
                Error: {result.ssl.details.verificationError}
              </div>
            )}
          </div>
        )}

        {/* Robots.txt with Warnings */}
        {result.robotsTxt && (
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Robots.txt</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">File Exists</span>
                <StatusIndicator status={result.robotsTxt.exists ? 'success' : 'warning'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Crawling Allowed</span>
                <StatusIndicator status={result.robotsTxt.allowed ? 'success' : 'error'} />
              </div>
              {result.robotsTxt.warnings && result.robotsTxt.warnings.length > 0 && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Warnings</h4>
                  <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                    {result.robotsTxt.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.robotsTxt.content && (
                <div className="mt-4">
                  <span className="text-gray-500 block mb-2">Content</span>
                  <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                    {result.robotsTxt.content}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Redirect Chain */}
        {result.redirectChain && result.redirectChain.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Redirect Chain</h3>
            <div className="space-y-2">
              {result.redirectChain.map((url, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-gray-500">{index + 1}.</span>
                  <span className="text-gray-900">{url}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {result.error && (
          <div className="border-t pt-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <span className="text-red-800">{result.error}</span>
            </div>
          </div>
        )}

        {/* URL Discovery Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">URL Discovery</h3>
              <p className="mt-1 text-sm text-gray-500">
                Discover and analyze all URLs on this website
              </p>
            </div>
            {!crawlStarted ? (
              <button
                onClick={handleDiscoverUrls}
                disabled={isCrawling}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isCrawling ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isCrawling ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Starting Discovery...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Discover URLs
                  </>
                )}
              </button>
            ) : (
              <span className="inline-flex items-center px-4 py-2 text-sm text-gray-500">
                Discovery in progress...
              </span>
            )}
          </div>
          {(crawledUrls || result.crawledUrls) && (
            <UrlList urls={crawledUrls || result.crawledUrls || []} />
          )}
        </div>
      </div>
    </div>
  );
}; 