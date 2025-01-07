import './styles.css';

export function ResultDisplay({ result }) {
  if (!result) return null;

  const metadata = result.metadata || {};
  const hasMetadata = Object.keys(metadata).length > 0;

  return (
    <div className="result-container">
      <h2 className="result-title">Analysis Results</h2>
      
      {hasMetadata && (
        <div className="result-section">
          <h3>Page Information</h3>
          <div className="metadata-grid">
            {metadata.statusCode && <p><strong>Status:</strong> {metadata.statusCode}</p>}
            {metadata.title && <p><strong>Title:</strong> {metadata.title}</p>}
            {metadata.description && <p><strong>Description:</strong> {metadata.description}</p>}
            {metadata.language && <p><strong>Language:</strong> {metadata.language}</p>}
            {metadata.sourceURL && <p><strong>Source:</strong> {metadata.sourceURL}</p>}
          </div>
        </div>
      )}

      {result.markdown && (
        <div className="result-section">
          <h3>Content</h3>
          <div className="content-preview">
            <pre>{result.markdown}</pre>
          </div>
        </div>
      )}

      {result.html && (
        <div className="result-section">
          <h3>HTML Content</h3>
          <div className="content-preview">
            <pre>{result.html}</pre>
          </div>
        </div>
      )}
    </div>
  );
} 