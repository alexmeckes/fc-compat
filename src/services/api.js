import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

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
    });

    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to analyze URL. Please try again.');
  }
} 