import { useState } from 'react';
import UrlInput from './components/UrlInput';
import { AnalysisResults } from './components/AnalysisResults';
import { CheckResult } from './types';
import './index.css';

function App() {
  const [analysisResult, setAnalysisResult] = useState<CheckResult | null>(null);

  const handleResult = (result: CheckResult) => {
    setAnalysisResult(result);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Website Crawlability Checker
          </h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <UrlInput onResult={handleResult} />
          <AnalysisResults result={analysisResult} />
        </div>
      </main>
    </div>
  );
}

export default App; 