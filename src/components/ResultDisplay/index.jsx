import './styles.css';

export function ResultDisplay({ result }) {
  if (!result) return null;

  const { data } = result;
  if (!data) return null;

  // Detect CAPTCHA or anti-bot measures
  const hasCaptcha = data.markdown?.toLowerCase().includes('captcha') ||
    data.markdown?.toLowerCase().includes('are you a human') ||
    data.markdown?.toLowerCase().includes('bot') ||
    data.markdown?.toLowerCase().includes('please verify');

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
    <div className="result-container">
      <h2 className="result-title">Analysis Results</h2>

      <div className="status-card">
        <div className={`status-indicator ${hasCaptcha ? 'warning' : (isCrawlable ? 'success' : 'error')}`}>
          {crawlabilityMessage}
        </div>
        <div className={`status-indicator ${!hasRobotsTxt ? 'warning' : (isAllowedByRobots ? 'success' : 'error')}`}>
          {robotsMessage}
        </div>
        <div className={`status-indicator ${!isSecure ? 'warning' : (hasValidSSL ? 'success' : 'error')}`}>
          {sslMessage}
        </div>
      </div>
      
      {hasCaptcha && (
        <div className="result-section warning-section">
          <h3>⚠️ Anti-Bot Protection Detected</h3>
          <p>This site appears to be protected by CAPTCHA or other anti-bot measures. While some content was retrieved, it may not be the actual page content you're looking for.</p>
        </div>
      )}
      
      <div className="result-section">
        <h3>Content Preview</h3>
        <div className="content-preview markdown">
          {data.markdown && (
            <div className="markdown-content">
              {data.markdown.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {data.links && data.links.length > 0 && (
        <div className="result-section">
          <h3>Discovered Links</h3>
          <div className="links-grid">
            {data.links.map((link, index) => (
              <a key={index} href={link} target="_blank" rel="noopener noreferrer" className="link-item">
                {link}
              </a>
            ))}
          </div>
        </div>
      )}

      {data.metadata && Object.keys(data.metadata).length > 0 && (
        <div className="result-section">
          <h3>Page Metadata</h3>
          <div className="metadata-grid">
            {Object.entries(data.metadata).map(([key, value]) => (
              <div key={key} className="metadata-item">
                <strong>{key}:</strong> {value}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 