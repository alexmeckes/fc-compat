const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio');
const axios = require('axios');
import type { Request, Response } from 'express';
import type { AxiosError } from 'axios';

const app = express();

// CORS configuration - allow all origins for now
app.use(cors());

// Body parser middleware
app.use(express.json());

interface RequestBody {
  url: string;
  [key: string]: any;
}

interface FirecrawlErrorResponse {
  message: string;
}

// Routes
const routes = {
  analyze: async (req: Request<{}, {}, RequestBody>, res: Response) => {
    try {
      const { url, ...config } = req.body;
      
      if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
      }

      const apiKey = process.env.FIRECRAWL_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, error: 'Server configuration error: Missing API key' });
      }

      const response = await axios.post(
        'https://api.firecrawl.dev/scrape',
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

      return res.json({ success: true, data: response.data });
    } catch (error: unknown) {
      console.error('Error in /api/firecrawl/analyze:', error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<FirecrawlErrorResponse>;
        if (axiosError.response?.status === 401) {
          return res.status(401).json({ success: false, error: 'Invalid API key' });
        }
        return res.status(axiosError.response?.status || 500).json({
          success: false,
          error: axiosError.response?.data?.message || axiosError.message
        });
      }
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
};

// Register routes
app.post('/api/firecrawl/analyze', routes.analyze);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app; 