import React, { useState } from 'react';
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
}

const UrlGroup: React.FC<UrlGroupProps> = ({ title, urls, type }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const colors = {
    success: 'text-green-700 bg-green-50 border-green-200',
    redirect: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    error: 'text-red-700 bg-red-50 border-red-200'
  };

  const filteredUrls = urls.filter(url => url.type === type);
  if (filteredUrls.length === 0) return null;

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
          {filteredUrls.map((url, index) => (
            <div key={index} className="text-sm p-2 rounded bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-gray-800 truncate">{url.url}</span>
                <span className="text-gray-500 text-xs">{url.status}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">{url.timestamp}</div>
            </div>
          ))}
        </div>
      </Transition>
    </div>
  );
};

export const UrlList: React.FC<UrlListProps> = ({ urls }) => {
  if (!urls || urls.length === 0) return null;

  return (
    <div className="border-t pt-4 space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Discovered URLs</h3>
      <div className="space-y-4">
        <UrlGroup title="Successful URLs" urls={urls} type="success" />
        <UrlGroup title="Redirects" urls={urls} type="redirect" />
        <UrlGroup title="Errors" urls={urls} type="error" />
      </div>
    </div>
  );
}; 