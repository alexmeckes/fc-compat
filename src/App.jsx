import { useState } from 'react';
import { UrlInput } from './components/UrlInput';
import { ResultDisplay } from './components/ResultDisplay';
import { ErrorMessage } from './components/ErrorMessage';
import './App.css';

function App() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleResult = (data) => {
    setError(null);
    setResult(data);
  };

  const handleError = (message) => {
    setResult(null);
    setError(message);
  };

  return (
    <div className="app">
      <h1>Firecrawl Compatibility Checker</h1>
      <UrlInput 
        onResult={handleResult}
        onError={handleError}
      />
      {error && <ErrorMessage message={error} />}
      {result && <ResultDisplay result={result} />}
    </div>
  );
}

export default App;
