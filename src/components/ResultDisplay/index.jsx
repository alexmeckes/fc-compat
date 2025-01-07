import './styles.css';

export function ResultDisplay({ result }) {
  if (!result) return null;

  const { metadata, ssl, robotsTxt } = result;

  return (
    <div className="result-container">
      <h2 className="result-title">Analysis Results</h2>
      
      <div className="result-section">
        <h3>Status</h3>
        <p>Status Code: {metadata.statusCode}</p>
      </div>

      {ssl && (
        <div className="result-section">
          <h3>SSL Certificate</h3>
          <p>Valid: {ssl.valid ? '✅' : '❌'}</p>
          {ssl.issuer && <p>Issuer: {ssl.issuer}</p>}
          {ssl.validFrom && <p>Valid From: {new Date(ssl.validFrom).toLocaleDateString()}</p>}
          {ssl.validTo && <p>Valid To: {new Date(ssl.validTo).toLocaleDateString()}</p>}
          {ssl.daysUntilExpiry && <p>Days Until Expiry: {ssl.daysUntilExpiry}</p>}
        </div>
      )}

      {robotsTxt && (
        <div className="result-section">
          <h3>Robots.txt</h3>
          <p>Exists: {robotsTxt.exists ? '✅' : '❌'}</p>
          <p>Allowed: {robotsTxt.allowed ? '✅' : '❌'}</p>
          {robotsTxt.warnings?.length > 0 && (
            <div>
              <p>Warnings:</p>
              <ul>
                {robotsTxt.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
          {robotsTxt.content && (
            <div className="robots-content">
              <p>Content:</p>
              <pre>{robotsTxt.content}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 