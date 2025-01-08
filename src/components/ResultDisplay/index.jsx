import { useState } from 'react';

export function ResultDisplay({ result }) {
  try {
    if (!result) return null;

    // Handle nested data structure
    const { data: responseData } = result;
    console.log('Full response data:', responseData);
    
    const { data } = responseData;
    console.log('Nested data object:', data);

    if (!data) return null;

    // For debugging
    console.log('Nested data:', data);
    console.log('Content:', data.content);
    console.log('Markdown:', data.markdown);

    // Detect CAPTCHA or anti-bot measures
    const hasCaptcha = data.markdown?.toLowerCase?.()?.includes('captcha') ||
      data.markdown?.toLowerCase?.()?.includes('are you a human') ||
      data.markdown?.toLowerCase?.()?.includes('bot') ||
      data.markdown?.toLowerCase?.()?.includes('please verify');

    // Determine crawlability status
    const isCrawlable = !hasCaptcha && (data.success || (data.markdown && data.markdown.length > 0));
    const hasRobotsTxt = data.robotsTxt !== undefined;
    const isAllowedByRobots = hasRobotsTxt && !data.robotsTxt?.disallowed;
    const isSecure = data.url?.startsWith('https://');
    const hasValidSSL = data.ssl?.valid === true;

    // Generate status messages
    const crawlabilityMessage = hasCaptcha 
      ? "⚠️ Protected by CAPTCHA/Anti-bot"
      : (isCrawlable 
        ? "✅ Page content is accessible"
        : "❌ Page content may be restricted");

    const robotsMessage = hasRobotsTxt
      ? (isAllowedByRobots ? "✅ Allowed by robots.txt" : "❌ Blocked by robots.txt")
      : "⚠️ No robots.txt found";

    const sslMessage = isSecure
      ? (hasValidSSL ? "✅ Valid SSL certificate" : "❌ Invalid SSL certificate")
      : "⚠️ No SSL (HTTP only)";

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 pb-4 border-b border-gray-200">
          Compatibility Analysis Results
        </h2>

        <div className="space-y-3">
          <div className={`p-3 rounded-lg text-center font-medium ${
            hasCaptcha ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
            (isCrawlable ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200')
          }`}>
            {crawlabilityMessage}
          </div>

          <div className={`p-3 rounded-lg text-center font-medium ${
            !hasRobotsTxt ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
            (isAllowedByRobots ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200')
          }`}>
            {robotsMessage}
          </div>

          <div className={`p-3 rounded-lg text-center font-medium ${
            !isSecure ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
            (hasValidSSL ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200')
          }`}>
            {sslMessage}
          </div>
        </div>
        
        {hasCaptcha && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-medium text-yellow-800 flex items-center gap-2 mb-2">
              ⚠️ Anti-Bot Protection Detected
            </h3>
            <p className="text-yellow-700">
              This site appears to be protected by CAPTCHA or other anti-bot measures. While some content was retrieved, it may not be the actual page content you're looking for.
            </p>
          </div>
        )}
        
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Content Preview
            </h3>
          </div>
          <div className="p-4">
            {(data.content || data.markdown) ? (
              <div className="prose prose-gray max-w-none whitespace-pre-wrap">
                {data.content || data.markdown}
              </div>
            ) : (
              <p className="text-gray-500 italic">No page content available</p>
            )}
          </div>
        </div>

        {data.links?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Discovered Links
              </h3>
            </div>
            <div className="p-4 grid gap-3 grid-cols-1 md:grid-cols-2">
              {data.links.map((link, index) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-50 rounded text-blue-600 hover:text-blue-800 hover:bg-gray-100 truncate transition-all"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        )}

        {data.metadata && Object.keys(data.metadata || {}).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Page Metadata
              </h3>
            </div>
            <div className="p-4 grid gap-3 grid-cols-1 md:grid-cols-2">
              {Object.entries(data.metadata || {}).map(([key, value]) => (
                <div key={key} className="p-3 bg-gray-50 rounded">
                  <strong className="block text-sm font-medium text-gray-700 mb-1">
                    {key}:
                  </strong>
                  <span className="text-gray-600 break-all">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error in ResultDisplay:', error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-medium text-red-800">Error Displaying Results</h3>
        <p className="text-red-700 mt-2">An error occurred while displaying the results. Please try again.</p>
      </div>
    );
  }
} 