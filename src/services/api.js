import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const analyzeUrl = async (url) => {
  try {
    const response = await axios.post(`${API_URL}/api/analyze`, { url });
    return response.data;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Failed to analyze URL');
  }
}; 