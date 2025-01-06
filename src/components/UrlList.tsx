import React, { useState, useMemo } from 'react';
import { Transition } from '@headlessui/react';

interface UrlListProps {
  urls: {
    url: string;
    status: number;
    type: 'success' | 'redirect' | 'error';
    timestamp: string;
  }[];
}

interface UrlGroupProps {
  title: string;
  urls: UrlListProps['urls'];
  type: 'success' | 'redirect' | 'error';
  searchQuery: string;
  urlTypeFilter: string;
}

const ITEMS_PER_PAGE = 5;

const UrlGroup: React.FC<UrlGroupProps> = ({ title, urls, type, searchQuery, urlTypeFilter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  
  const colors = {
    success: 'text-green-700 bg-green-50 border-green-200',
    redirect: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    error: 'text-red-700 bg-red-50 border-red-200'
  };

  const filteredUrls = useMemo(() => {
    return urls
      .filter(url => url.type === type)
      .filter(url => {
        if (!searchQuery) return true;
        return url.url.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .filter(url => {
        if (urlTypeFilter === 'all') return true;
        switch (urlTypeFilter) {
          case 'html':
            return url.url.endsWith('.html') || !url.url.includes('.');
          case 'images':
            return /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(url.url);
          case 'documents':
            return /\.(pdf|doc|docx|xls|xlsx|txt)$/i.test(url.url);
          default:
            return true;
        }
      });
  }, [urls, type, searchQuery, urlTypeFilter]);

  if (filteredUrls.length === 0) return null;

  const displayedUrls = filteredUrls.slice(0, displayCount);
  const hasMore = displayCount < filteredUrls.length;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 rounded-lg border ${colors[type]} hover:bg-opacity-75 transition-colors duration-200`}
      >
        <div className="flex items-center">
          <span className="font-medium">{title}</span>
          <span className="ml-2 text-sm opacity-75">({filteredUrls.length})</span>
        </div>
        <svg
          className={`w-5 h-5 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <Transition
        show={isOpen}
        enter="transition-all ease-out duration-300"
        enterFrom="opacity-0 -translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition-all ease-in duration-200"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 -translate-y-2"
      >
        <div className="space-y-2 pl-4">
          {displayedUrls.map((url, index) => (
            <div key={index} className="text-sm p-3 rounded bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-gray-800 truncate">{url.url}</div>
                  <div className="flex items-center mt-1 space-x-2 text-xs text-gray-500">
                    <span>{new Date(url.timestamp).toLocaleString()}</span>
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded-full ${
                      url.status >= 200 && url.status < 300
                        ? 'bg-green-100 text-green-800'
                        : url.status >= 300 && url.status < 400
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {url.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {hasMore && (
            <button
              onClick={() => setDisplayCount(prev => prev + ITEMS_PER_PAGE)}
              className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Show {Math.min(ITEMS_PER_PAGE, filteredUrls.length - displayCount)} more URLs
            </button>
          )}
        </div>
      </Transition>
    </div>
  );
};

export const UrlList: React.FC<UrlListProps> = ({ urls }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [urlTypeFilter, setUrlTypeFilter] = useState('all');

  if (!urls || urls.length === 0) return null;

  return (
    <div className="border-t pt-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-medium text-gray-900">Discovered URLs</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search URLs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={urlTypeFilter}
            onChange={(e) => setUrlTypeFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="html">HTML Pages</option>
            <option value="images">Images</option>
            <option value="documents">Documents</option>
          </select>
        </div>
      </div>
      <div className="space-y-4">
        <UrlGroup 
          title="Successful URLs" 
          urls={urls} 
          type="success"
          searchQuery={searchQuery}
          urlTypeFilter={urlTypeFilter}
        />
        <UrlGroup 
          title="Redirects" 
          urls={urls} 
          type="redirect"
          searchQuery={searchQuery}
          urlTypeFilter={urlTypeFilter}
        />
        <UrlGroup 
          title="Errors" 
          urls={urls} 
          type="error"
          searchQuery={searchQuery}
          urlTypeFilter={urlTypeFilter}
        />
      </div>
    </div>
  );
}; 