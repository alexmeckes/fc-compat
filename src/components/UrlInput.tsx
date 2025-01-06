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
  useFirecrawl: boolean;
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
    key: 'useFirecrawl',
    label: 'Use Firecrawl API',
    tooltip: 'Use Firecrawl API for initial analysis (more accurate but uses credits)',
    type: 'toggle'
  },
  {
    key: 'sitemapOnly',
    label: 'Sitemap Only',
    tooltip: 'Only discover URLs from sitemap',
    type: 'toggle'
  },
  {
    key: 'ignoreSitemap',
    label: 'Ignore Sitemap',
    tooltip: 'Ignore sitemap when discovering URLs',
    type: 'toggle'
  },
  {
    key: 'includeSubdomains',
    label: 'Include Subdomains',
    tooltip: 'Include subdomains when discovering URLs',
    type: 'toggle'
  },
  {
    key: 'maxDepth',
    label: 'Max Depth',
    tooltip: 'Maximum depth to crawl (1-5)',
    type: 'number',
    min: 1,
    max: 5
  },
  {
    key: 'limit',
    label: 'URL Limit',
    tooltip: 'Maximum number of URLs to discover (10-1000)',
    type: 'number',
    min: 10,
    max: 1000
  }
];

export const UrlInput: React.FC<UrlInputProps> = ({ onAnalyze, onResult }) => {
  const [url, setUrl] = useState('');
  const [inputError, setInputError] = useState('');
  const [configErrors, setConfigErrors] = useState<Partial<Record<keyof CrawlConfig, string>>>({});
  const [config, setConfig] = useState<CrawlConfig>({
    sitemapOnly: false,
    ignoreSitemap: false,
    includeSubdomains: false,
    maxDepth: 2,
    limit: 100,
    useFirecrawl: true
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
          <div className="flex justify-between items-center">
            <label htmlFor="url" className="block text-xl font-semibold text-gray-800">
              Enter Website URL
            </label>
            <Popover className="relative">
              {({ open }) => (
                <>
                  <Popover.Button
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      open ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <svg
                      className={`w-6 h-6 ${open ? 'text-blue-600' : 'text-gray-400'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
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
                    <Popover.Panel className="absolute right-0 z-10 mt-2 w-96 origin-top-right">
                      <div className="bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 p-4">
                        <div className="mb-3 pb-2 border-b">
                          <h3 className="text-lg font-medium text-gray-900">Advanced Settings</h3>
                          <p className="text-sm text-gray-500">Configure crawling behavior and limits</p>
                        </div>
                        <div className="space-y-3">
                          {CONFIG_OPTIONS.map(option => {
                            const hasError = !!configErrors[option.key];
                            return (
                              <div key={option.key} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                                <div className="flex-1 mr-4">
                                  <div className="group relative">
                                    <label className="text-sm font-medium text-gray-800 cursor-help group-hover:text-blue-600 transition-colors duration-200">
                                      {option.label}
                                      <span className="ml-2 text-gray-400 group-hover:text-blue-400">ⓘ</span>
                                    </label>
                                    <div className="hidden group-hover:block absolute left-0 bottom-full mb-2 w-72">
                                      <div className="bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg">
                                        {option.tooltip}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
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
                      </div>
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
          </div>
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
      </form>
    </div>
  );
}; // Test comment
