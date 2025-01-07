import { useState } from 'react';
import { UrlList } from './UrlList';
import { UrlCheckResult, CrawlConfig } from '../types';

interface AnalysisResultsProps {
  result: UrlCheckResult | null;
}

export function AnalysisResults({ result }: AnalysisResultsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [urlTypeFilter, setUrlTypeFilter] = useState('all');

  if (!result) return null;

  const statusColors = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };

  const getStatusColor = (status: keyof typeof statusColors) => statusColors[status] || 'text-gray-600';

  const handleCrawl = async (initialResult: UrlCheckResult) => {
    if (!initialResult) return;

    const config: CrawlConfig = {
      maxDepth: 2,
      maxUrls: 100,
      useFirecrawl: true,
      skipTlsVerification: false,
      sitemapOnly: false,
      ignoreSitemap: false,
      includeSubdomains: false
    };

    setSearchQuery('');
    setUrlTypeFilter('all');
  };

  return (
    <div className="mt-8 space-y-8">
      {/* SSL Results */}
      {result.ssl && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">SSL Certificate</h2>
          <div className="space-y-2">
            <p className={`${result.ssl.valid ? 'text-green-600' : 'text-red-600'}`}>
              {result.ssl.valid ? 'Valid SSL Certificate' : 'Invalid SSL Certificate'}
            </p>
            {result.ssl.issuer && (
              <p className="text-gray-600">Issuer: {result.ssl.issuer}</p>
            )}
            {result.ssl.validFrom && result.ssl.validTo && (
              <p className="text-gray-600">
                Valid from {new Date(result.ssl.validFrom).toLocaleDateString()} to{' '}
                {new Date(result.ssl.validTo).toLocaleDateString()}
              </p>
            )}
            {result.ssl.daysUntilExpiry !== undefined && (
              <p className={`${
                result.ssl.daysUntilExpiry < 30 ? 'text-yellow-600' : 'text-gray-600'
              }`}>
                Expires in {result.ssl.daysUntilExpiry} days
              </p>
            )}
            {result.ssl.error && (
              <p className="text-red-600">Error: {result.ssl.error}</p>
            )}
          </div>
        </div>
      )}

      {/* Robots.txt Results */}
      {result.robotsTxt && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Robots.txt</h2>
          <div className="space-y-2">
            <p className={`${result.robotsTxt.exists ? 'text-green-600' : 'text-yellow-600'}`}>
              {result.robotsTxt.exists ? 'Robots.txt Found' : 'No Robots.txt Found'}
            </p>
            {result.robotsTxt.exists && (
              <>
                <p className={`${result.robotsTxt.allowed ? 'text-green-600' : 'text-red-600'}`}>
                  Crawling is {result.robotsTxt.allowed ? 'allowed' : 'not allowed'}
                </p>
                {result.robotsTxt.content && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Content:</h3>
                    <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
                      {result.robotsTxt.content}
                    </pre>
                  </div>
                )}
              </>
            )}
            {result.robotsTxt.warnings && result.robotsTxt.warnings.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-yellow-600 mb-2">Warnings:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {result.robotsTxt.warnings.map((warning, index) => (
                    <li key={index} className="text-yellow-600 text-sm">
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Crawled URLs */}
      {result.crawledUrls && result.crawledUrls.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Crawled URLs</h2>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search URLs..."
                className="flex-1 p-2 border rounded"
              />
              <select
                value={urlTypeFilter}
                onChange={(e) => setUrlTypeFilter(e.target.value)}
                className="p-2 border rounded"
              >
                <option value="all">All</option>
                <option value="success">Success</option>
                <option value="redirect">Redirects</option>
                <option value="error">Errors</option>
              </select>
            </div>
            <UrlList
              title="Crawled URLs"
              urls={result.crawledUrls}
              type="crawled"
              searchQuery={searchQuery}
              urlTypeFilter={urlTypeFilter}
            />
          </div>
        </div>
      )}
    </div>
  );
} 