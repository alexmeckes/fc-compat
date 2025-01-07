import axios from 'axios';

const API_URL = '/api';

export async function analyzeUrl(url, config = null) {
  try {
    const response = await axios.post(`${API_URL}/firecrawl/analyze`, {
      url,
      ...(config && {
        waitFor: config.waitFor,
        headers: {
          'User-Agent': config.userAgent
        }
      })
    }, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    }
    if (error.response?.status === 504) {
      throw new Error('Server took too long to respond. Please try again.');
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to analyze URL. Please try again.');
  }
} 