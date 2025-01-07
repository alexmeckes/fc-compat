import { VercelRequest, VercelResponse } from '../types';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Request received:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  });

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  console.log('CORS headers set');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('Processing POST request');
    const { url, ...config } = req.body;
    
    if (!url) {
      console.log('URL missing from request body');
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      console.log('API key missing from environment');
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
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    
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
} 