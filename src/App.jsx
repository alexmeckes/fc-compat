import { UrlInput } from './components/UrlInput';
import { ResultDisplay } from './components/ResultDisplay';
import { ErrorMessage } from './components/ErrorMessage';
import { useAnalyzer } from './hooks/useAnalyzer';
import './App.css';

function App() {
  const { result, error, loading, analyze } = useAnalyzer();

  return (
    <div className="app">
      <header className="header">
        <h1>URL Analyzer</h1>
        <p>Enter a URL to analyze its SSL certificate and robots.txt configuration</p>
      </header>

      <main className="main">
        <UrlInput onAnalyze={analyze} isLoading={loading} />
        <ErrorMessage message={error} />
        <ResultDisplay result={result} />
      </main>
    </div>
  );
}

export default App;
