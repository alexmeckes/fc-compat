import React, { useState } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { checkUrl } from '../services/api';

export interface CrawlConfig {
  sitemapOnly: boolean;
  ignoreSitemap: boolean;
  includeSubdomains: boolean;
  maxDepth: number;
  limit: number;
}

interface UrlInputProps {
  onAnalyze: (url: string, config: CrawlConfig) => void;
  onResult: (result: any) => void;
}

interface ConfigOption {
  key: keyof CrawlConfig;
  label: string;
  tooltip: string;
  type: 'toggle' | 'number';
  min?: number;
  max?: number;
}

const CONFIG_OPTIONS: ConfigOption[] = [
  {
    key: 'sitemapOnly',
    label: 'Use Sitemap Only',
    tooltip: 'Only crawl URLs found in the website\'s sitemap.xml file. This is faster but might miss some pages.',
    type: 'toggle'
  },
  {
    key: 'ignoreSitemap',
    label: 'Ignore Sitemap',
    tooltip: 'Ignore the website\'s sitemap.xml file and discover pages by crawling links. This might be slower but more thorough.',
    type: 'toggle'
  },
  {
    key: 'includeSubdomains',
    label: 'Include Subdomains',
    tooltip: 'Also crawl subdomains (e.g., blog.example.com when crawling example.com). This can significantly increase crawl time.',
    type: 'toggle'
  },
  {
    key: 'maxDepth',
    label: 'Max Depth',
    tooltip: 'Maximum number of clicks away from the starting URL to crawl. Higher values mean more thorough but slower crawls.',
    type: 'number',
    min: 1,
    max: 10
  },
  {
    key: 'limit',
    label: 'URL Limit',
    tooltip: 'Maximum number of URLs to crawl. Use this to prevent extremely large crawls.',
    type: 'number',
    min: 1,
    max: 5000
  }
];

export const UrlInput: React.FC<UrlInputProps> = ({ onAnalyze, onResult }) => {
  const [url, setUrl] = useState('');
  const [inputError, setInputError] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [configErrors, setConfigErrors] = useState<Partial<Record<keyof CrawlConfig, string>>>({});
  const [config, setConfig] = useState<CrawlConfig>({
    sitemapOnly: false,
    ignoreSitemap: false,
    includeSubdomains: false,
    maxDepth: 2,
    limit: 100,
  });
  const [isLoading, setIsLoading] = useState(false);

  const validateUrl = (url: string) => {
    if (!url.trim()) {
      return 'URL is required';
    }
    try {
      // Add https:// if no protocol is specified
      const urlToTest = url.startsWith('http') ? url : `https://${url}`;
      new URL(urlToTest);
      return '';
    } catch {
      return 'Please enter a valid URL';
    }
  };

  const validateNumberInput = (value: number, option: ConfigOption): string => {
    if (option.type !== 'number') return '';
    if (isNaN(value)) return 'Must be a number';
    if (option.min !== undefined && value < option.min) {
      return `Minimum value is ${option.min}`;
    }
    if (option.max !== undefined && value > option.max) {
      return `Maximum value is ${option.max}`;
    }
    return '';
  };

  const validateConfigConflicts = (newConfig: CrawlConfig): Partial<Record<keyof CrawlConfig, string>> => {
    const errors: Partial<Record<keyof CrawlConfig, string>> = {};

    // Check sitemap conflicts
    if (newConfig.sitemapOnly && newConfig.ignoreSitemap) {
      errors.sitemapOnly = 'Cannot use sitemap-only mode while ignoring sitemap';
      errors.ignoreSitemap = 'Cannot ignore sitemap while in sitemap-only mode';
    }

    // Check depth and subdomain combination
    if (newConfig.includeSubdomains && newConfig.maxDepth > 5) {
      errors.maxDepth = 'Max depth should be ≤ 5 when including subdomains to prevent excessive crawling';
    }

    // Check depth and limit combination
    if (newConfig.maxDepth > 5 && newConfig.limit < 100) {
      errors.limit = 'URL limit should be ≥ 100 for deep crawls (depth > 5)';
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateUrl(url);
    setInputError(error);
    
    // Validate all number inputs and conflicts before submitting
    const numberErrors: Partial<Record<keyof CrawlConfig, string>> = {};
    let hasErrors = false;
    
    CONFIG_OPTIONS.forEach(option => {
      if (option.type === 'number') {
        const error = validateNumberInput(config[option.key] as number, option);
        if (error) {
          numberErrors[option.key] = error;
          hasErrors = true;
        }
      }
    });

    const conflictErrors = validateConfigConflicts(config);
    if (Object.keys(conflictErrors).length > 0) {
      hasErrors = true;
    }
    
    setConfigErrors({ ...numberErrors, ...conflictErrors });
    
    if (!error && !hasErrors) {
      setIsLoading(true);
      try {
        const result = await checkUrl(url, config);
        if (!result.isValid) {
          setInputError(result.error || 'Failed to check URL');
        }
        onResult(result);
        onAnalyze(url, config);
      } catch (error) {
        setInputError(error instanceof Error ? error.message : 'Failed to check URL');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleConfigChange = (key: keyof CrawlConfig, value: boolean | number) => {
    const newConfig = { ...config };
    
    if (typeof value === 'number') {
      const option = CONFIG_OPTIONS.find(opt => opt.key === key);
      if (option && option.type === 'number') {
        let validValue = value;
        if (option.min !== undefined && value < option.min) {
          validValue = option.min;
        }
        if (option.max !== undefined && value > option.max) {
          validValue = option.max;
        }
        (newConfig[key] as number) = validValue;
      }
    } else {
      (newConfig[key] as boolean) = value;
      // Handle special cases for toggles
      if (key === 'sitemapOnly' && value === true) {
        newConfig.ignoreSitemap = false;
      } else if (key === 'ignoreSitemap' && value === true) {
        newConfig.sitemapOnly = false;
      }
    }
    
    const errors = {
      ...validateConfigConflicts(newConfig),
      ...(typeof value === 'number' ? { [key]: validateNumberInput(value as number, CONFIG_OPTIONS.find(opt => opt.key === key)!) } : {})
    };

    setConfigErrors(errors);
    setConfig(newConfig);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <label htmlFor="url" className="block text-xl font-semibold text-gray-800">
            Enter Website URL
          </label>
          <div className="relative">
            <div className={`flex rounded-xl shadow-sm transition-all duration-200 ${
              inputError ? 'shadow-red-100' : 'hover:shadow-lg'
            }`}>
              <input
                type="text"
                name="url"
                id="url"
                className={`input-base rounded-l-xl ${inputError ? 'input-error' : ''}`}
                placeholder="Enter your website URL (e.g., example.com)"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (inputError) setInputError('');
                }}
                required
                disabled={isLoading}
              />
              <button
                type="submit"
                className={`button-base rounded-r-xl px-8 py-4 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <>
                    <span>Analyze</span>
                    <svg 
                      className="ml-3 -mr-1 w-5 h-5" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
            {inputError && (
              <p className="absolute left-0 mt-2 text-sm font-medium text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                {inputError}
              </p>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            className={`w-full text-base font-medium px-5 py-4 rounded-xl transition-all duration-200 flex items-center justify-between ${
              showConfig 
                ? 'card bg-white text-gray-900 shadow-md hover:shadow-lg border-2 border-gray-200' 
                : 'bg-gray-50 text-gray-600 hover:bg-white hover:shadow-md border border-gray-200'
            }`}
            onClick={() => setShowConfig(!showConfig)}
          >
            <span>Advanced Configuration</span>
            <svg
              className={`h-5 w-5 transform transition-transform duration-200 ${showConfig ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <Transition
            show={showConfig}
            as={Fragment}
            enter="transition-all ease-out duration-300"
            enterFrom="opacity-0 -translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition-all ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 -translate-y-2"
          >
            <div className="mt-4 space-y-3">
              {CONFIG_OPTIONS.map(option => {
                const hasError = !!configErrors[option.key];
                return (
                  <div key={option.key} className="card p-4 flex items-center justify-between">
                    <Popover className="relative flex-1 mr-4">
                      {({ open }) => (
                        <>
                          <Popover.Button className="flex items-center group focus:outline-none">
                            <label className="text-sm font-medium text-gray-800 cursor-help group-hover:text-blue-600 transition-colors duration-200">
                              {option.label}
                              <svg 
                                className={`w-4 h-4 ml-2 inline-block transition-colors duration-200 ${
                                  open ? 'text-blue-500' : 'text-gray-400 group-hover:text-blue-400'
                                }`}
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={2} 
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                                />
                              </svg>
                            </label>
                          </Popover.Button>
                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-200"
                            enterFrom="opacity-0 translate-y-1"
                            enterTo="opacity-100 translate-y-0"
                            leave="transition ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 translate-y-1"
                          >
                            <Popover.Panel className="tooltip w-72 px-4 py-3 mt-2">
                              <div className="relative">
                                <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45" />
                                <p className="relative z-10 leading-relaxed">{option.tooltip}</p>
                              </div>
                            </Popover.Panel>
                          </Transition>
                        </>
                      )}
                    </Popover>
                    
                    {option.type === 'toggle' ? (
                      <div className="relative inline-block w-14 align-middle select-none transition duration-200 ease-in">
                        <input
                          type="checkbox"
                          checked={config[option.key] as boolean}
                          onChange={(e) => handleConfigChange(option.key, e.target.checked)}
                          className={`toggle-checkbox absolute block w-7 h-7 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-200 ease-in-out ${
                            config[option.key] 
                              ? 'transform translate-x-full border-blue-500 shadow-md' 
                              : 'border-gray-300'
                          }`}
                        />
                        <label className={`toggle-label block overflow-hidden h-7 rounded-full cursor-pointer transition-all duration-200 ease-in ${
                          config[option.key] 
                            ? 'bg-blue-500' 
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}></label>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <div className="relative">
                          <input
                            type="number"
                            min={option.min}
                            max={option.max}
                            value={config[option.key] as number}
                            onChange={(e) => {
                              const value = e.target.value === '' ? option.min || 0 : parseInt(e.target.value);
                              handleConfigChange(option.key, value);
                            }}
                            className={`input-base w-28 ${hasError ? 'input-error' : ''}`}
                          />
                          {hasError && (
                            <div className="absolute right-0 mt-2">
                              <span className="text-xs font-medium text-red-500 bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200">
                                {configErrors[option.key]}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Transition>
        </div>
      </form>
    </div>
  );
}; // Test comment
