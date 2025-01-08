import { useState } from 'react';
import { BROWSER_PROFILES } from '../ConfigPanel';

export function ResultDisplay({ result, config }) {
  try {
    if (!result) return null;

    // Handle nested data structure
    const { data } = result;
    console.log('Response data:', data);
    console.log('Config received:', config);

    if (!data) return null;

    // For debugging
    console.log('Raw content:', data.content);
    console.log('Raw markdown:', data.markdown);
    console.log('SSL data:', data.ssl);
    console.log('Data structure:', {
      hasContent: !!data.content,
      hasMarkdown: !!data.markdown,
      contentLength: data.content?.length,
      markdownLength: data.markdown?.length,
      contentType: typeof data.content,
      markdownType: typeof data.markdown,
      contentSample: data.content?.substring?.(0, 100),
      markdownSample: data.markdown?.substring?.(0, 100),
      fullData: data
    });

    // Calculate runtime in seconds
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    const runtimeSeconds = ((endTime - startTime) / 1000).toFixed(2);

    // Format configuration for display
    const formatConfig = (config) => {
      if (!config) {
        console.log('No config provided to formatConfig');
        return {};
      }
      console.log('Formatting config:', config);
      const formatted = {
        'Wait Time': `${config.waitFor / 1000}s`,
        'Browser Profile': Object.entries(BROWSER_PROFILES).find(([_, ua]) => ua === config.userAgent)?.[0] || 'Custom',
        'Remove Base64 Images': config.removeBase64Images ? 'Yes' : 'No',
        'Only Main Content': config.onlyMainContent ? 'Yes' : 'No',
        'Mobile Emulation': config.emulateMobile ? 'Yes' : 'No',
        'Include Tags': config.includeTags?.length ? config.includeTags.split(',').map(tag => tag.trim()).join(', ') : 'None',
        'Exclude Tags': config.excludeTags?.length ? config.excludeTags.split(',').map(tag => tag.trim()).join(', ') : 'None',
      };
      console.log('Formatted config:', formatted);
      return formatted;
    };

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

    // Add these near the top of the component, after the initial data checks
    const [isExpanded, setIsExpanded] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const maxPreviewLength = 500; // Show first 500 characters by default
    
    // Add this helper function inside the component
    const formatContent = (content) => {
      console.log('Formatting content:', content);
      if (!content) {
        console.log('No content to format');
        return '';
      }
      const text = content.toString();
      console.log('Content length:', text.length);
      console.log('Content sample:', text.substring(0, 100));
      if (!isExpanded && text.length > maxPreviewLength) {
        return text.slice(0, maxPreviewLength) + '...';
      }
      return text;
    };

    const handleCopyContent = () => {
      const contentToCopy = data.content?.length > 0 ? data.content : data.markdown;
      if (contentToCopy) {
        navigator.clipboard.writeText(contentToCopy)
          .then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
          })
          .catch(err => console.error('Failed to copy content:', err));
      }
    };

    return (
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-gray-900 pb-6 border-b border-gray-200">
          Compatibility Analysis Results
        </h2>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              Analysis Details
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                <strong className="block text-sm font-semibold text-gray-700 mb-2">URL:</strong>
                <a 
                  href={data.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 break-all hover:underline transition-colors"
                >
                  {data.url}
                </a>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                <strong className="block text-sm font-semibold text-gray-700 mb-2">Runtime:</strong>
                <span className="text-gray-900">{runtimeSeconds} seconds</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-base font-semibold text-gray-900 mb-4">Configuration Settings:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(formatConfig(config)).map(([key, value]) => (
                  <div key={key} className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                    <strong className="block text-sm font-semibold text-gray-700 mb-2">{key}:</strong>
                    <span className="text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className={`p-4 rounded-lg text-center font-medium shadow-sm transition-all ${
            hasCaptcha ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border border-yellow-200' :
            (isCrawlable ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border border-green-200' : 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border border-red-200')
          }`}>
            <div className="text-lg">{crawlabilityMessage}</div>
          </div>

          <div className={`p-4 rounded-lg text-center font-medium shadow-sm transition-all ${
            !hasRobotsTxt ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border border-yellow-200' :
            (isAllowedByRobots ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border border-green-200' : 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border border-red-200')
          }`}>
            <div className="text-lg">{robotsMessage}</div>
          </div>

          <div className={`p-4 rounded-lg text-center font-medium shadow-sm transition-all ${
            !isSecure ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border border-yellow-200' :
            (hasValidSSL ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border border-green-200' : 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border border-red-200')
          }`}>
            <div className="text-lg">{sslMessage}</div>
          </div>
        </div>
        
        {hasCaptcha && (
          <div className="p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-yellow-800 flex items-center gap-3 mb-3">
              ⚠️ Anti-Bot Protection Detected
            </h3>
            <p className="text-yellow-700 leading-relaxed">
              This site appears to be protected by CAPTCHA or other anti-bot measures. While some content was retrieved, it may not be the actual page content you're looking for.
            </p>
          </div>
        )}
        
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">
              Content Preview
            </h3>
            <button
              onClick={handleCopyContent}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                copySuccess 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 hover:border-gray-300'
              }`}
              title="Copy content"
            >
              {copySuccess ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          <div className="p-6">
            {(data.content?.length > 0 || data.markdown?.length > 0) ? (
              <div>
                <div className="prose prose-gray max-w-none whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-100">
                  {formatContent(data.content?.length > 0 ? data.content : data.markdown)}
                </div>
                {(data.content?.length > maxPreviewLength || data.markdown?.length > maxPreviewLength) && (
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-6 w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 border border-gray-200 hover:border-gray-300"
                  >
                    {isExpanded ? '↑ Show Less' : '↓ Show More'}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic text-center py-8">No page content available</p>
            )}
          </div>
        </div>

        {data.links?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Discovered Links
              </h3>
            </div>
            <div className="p-6 grid gap-4 grid-cols-1 md:grid-cols-2">
              {data.links.map((link, index) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-50 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-gray-100 truncate transition-all border border-gray-100 hover:border-gray-200"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        )}

        {data.metadata && Object.keys(data.metadata || {}).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Page Metadata
              </h3>
            </div>
            <div className="p-6 grid gap-4 grid-cols-1 md:grid-cols-2">
              {Object.entries(data.metadata || {}).map(([key, value]) => (
                <div key={key} className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                  <strong className="block text-sm font-semibold text-gray-700 mb-2">
                    {key}:
                  </strong>
                  <span className="text-gray-900 break-all">
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