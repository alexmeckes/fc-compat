import { useState } from 'react';
import { UrlInput } from './components/UrlInput';
import { ResultDisplay } from './components/ResultDisplay';
import { ErrorMessage } from './components/ErrorMessage';

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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Firecrawl Compatibility Checker
        </h1>
        <UrlInput 
          onResult={handleResult}
          onError={handleError}
        />
        {error && <ErrorMessage message={error} />}
        {result && <ResultDisplay result={result} />}
      </div>
    </div>
  );
}

export default App;
