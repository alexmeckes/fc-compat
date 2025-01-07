import './styles.css';

export function ResultDisplay({ result }) {
  if (!result) return null;

  return (
    <div className="result-container">
      <h2 className="result-title">Analysis Results</h2>
      
      <div className="result-section">
        <h3>Status</h3>
        <p>Status Code: {result.metadata?.statusCode || 'N/A'}</p>
        {result.metadata?.title && <p>Title: {result.metadata.title}</p>}
        {result.metadata?.description && <p>Description: {result.metadata.description}</p>}
        {result.metadata?.language && <p>Language: {result.metadata.language}</p>}
        {result.metadata?.sourceURL && <p>Source URL: {result.metadata.sourceURL}</p>}
      </div>

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