import './styles.css';

export function ResultDisplay({ result }) {
  if (!result) return null;

  const { metadata, markdown, html } = result;

  return (
    <div className="result-container">
      <h2 className="result-title">Analysis Results</h2>
      
      <div className="result-section">
        <h3>Status</h3>
        <p>Status Code: {metadata?.statusCode || 'N/A'}</p>
        {metadata?.title && <p>Title: {metadata.title}</p>}
        {metadata?.description && <p>Description: {metadata.description}</p>}
        {metadata?.language && <p>Language: {metadata.language}</p>}
      </div>

      {markdown && (
        <div className="result-section">
          <h3>Content</h3>
          <div className="content-preview">
            <pre>{markdown}</pre>
          </div>
        </div>
      )}
    </div>
  );
} 