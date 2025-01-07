import type { VercelRequest, VercelResponse } from '@vercel/node';
const axios = require('axios');

const handler = async (
  req: VercelRequest,
  res: VercelResponse
) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { url, ...config } = req.body;
    
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'Server configuration error: Missing API key' });
    }

    console.log('Making request to Firecrawl with URL:', url);

    const response = await axios.post(
      'https://api.firecrawl.dev/v1/scrape',
      {
        url: url.startsWith('http') ? url : `https://${url}`,
        ...config
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Firecrawl response:', response.data);

    return res.json({ success: true, data: response.data });
  } catch (error: any) {
    console.error('Error in /api/firecrawl/analyze:', error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return res.status(401).json({ success: false, error: 'Invalid API key' });
      }
      return res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message
      });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = handler; 