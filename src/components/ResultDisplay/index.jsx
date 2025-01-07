import './styles.css';

export function ResultDisplay({ result }) {
  if (!result) return null;

  const { data } = result;
  if (!data) return null;

  return (
    <div className="result-container">
      <h2 className="result-title">Analysis Results</h2>
      
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