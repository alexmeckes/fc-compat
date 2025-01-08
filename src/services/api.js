import axios from 'axios';

const API_URL = '/api';

export async function analyzeUrl(url, config = null) {
  try {
    const response = await axios.post(`${API_URL}/firecrawl/analyze`, {
      url,
      ...(config && {
        waitFor: config.waitFor || 1000, // Default 1 second if not specified
        userAgent: config.userAgent,
        removeBase64Images: config.removeBase64Images,
        onlyMainContent: config.onlyMainContent,
        includeTags: config.includeTags,
        excludeTags: config.excludeTags,
        emulateMobile: config.emulateMobile,
      })
    }, {
      timeout: (config?.waitFor || 1000) + 5000, // Add 5 seconds to wait time for buffer
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again or increase the wait time.');
    }
    if (error.response?.status === 504) {
      throw new Error('Server took too long to respond. Try increasing the wait time.');
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to analyze URL. Please try again.');
  }
} 