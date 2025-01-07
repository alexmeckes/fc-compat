import { useState } from 'react';

interface UrlListProps {
  urls: Array<{
    url: string;
    status: number;
    type: 'success' | 'redirect' | 'error';
    timestamp: string;
  }>;
  searchQuery: string;
  urlTypeFilter: string;
}

export function UrlList({ urls, searchQuery, urlTypeFilter }: UrlListProps) {
  const [sortBy, setSortBy] = useState<'url' | 'status' | 'timestamp'>('url');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredUrls = urls.filter(url => {
    if (searchQuery && !url.url.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (urlTypeFilter !== 'all' && url.type !== urlTypeFilter) {
      return false;
    }
    return true;
  });

  const sortedUrls = [...filteredUrls].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'url':
        return direction * a.url.localeCompare(b.url);
      case 'status':
        return direction * (a.status - b.status);
      case 'timestamp':
        return direction * (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      default:
        return 0;
    }
  });

  const handleSort = (field: 'url' | 'status' | 'timestamp') => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const statusColors = {
    success: 'text-green-600',
    redirect: 'text-yellow-600',
    error: 'text-red-600'
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('url')}
            >
              URL {sortBy === 'url' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('status')}
            >
              Status {sortBy === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('timestamp')}
            >
              Timestamp {sortBy === 'timestamp' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedUrls.map((url, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <a href={url.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {url.url}
                </a>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={statusColors[url.type]}>
                  {url.status} ({url.type})
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(url.timestamp).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sortedUrls.length === 0 && (
        <p className="text-center py-4 text-gray-500">No URLs found</p>
      )}
    </div>
  );
} 