import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import { load } from 'cheerio';
import axios from 'axios';

const app = express();

// CORS configuration - allow all origins for now
app.use(cors());

// Body parser middleware
app.use(express.json());

// Create router
const router: Router = express.Router();

interface AnalyzeRequest {
  url: string;
  [key: string]: any;
}

// Firecrawl API endpoint
router.post('/api/firecrawl/analyze', async (req: Request<{}, {}, AnalyzeRequest>, res: Response) => {
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
  } catch (error) {
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
});

// Mount the router
app.use(router);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 