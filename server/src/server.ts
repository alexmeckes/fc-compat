import express, { Request, Response, Router, NextFunction } from 'express';
import cors from 'cors';
import axios, { AxiosResponse, AxiosError } from 'axios';
import { URL } from 'url';
import { connect } from 'tls';
import * as cheerio from 'cheerio';

const app = express();
const router = Router();
const port = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'https://fc-compat.vercel.app',
  'https://fc-compat-git-main-alexmeckes.vercel.app',
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
].filter(Boolean);

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in production for now
    }
  },
  credentials: true
}));

app.use(express.json());

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    errorType: 'UNKNOWN'
  });
});

// Rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS = parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '60', 10);
const WINDOW_MS = 60 * 1000; // 1 minute

// Rate limiting middleware
const rateLimit: express.RequestHandler = (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const requestData = requestCounts.get(ip) || { count: 0, resetTime: now + WINDOW_MS };

  if (now > requestData.resetTime) {
    requestData.count = 0;
    requestData.resetTime = now + WINDOW_MS;
  }

  requestData.count++;
  requestCounts.set(ip, requestData);

  if (requestData.count > MAX_REQUESTS) {
    res.status(429).json({ error: 'Too many requests', errorType: 'RATE_LIMIT' });
    return;
  }

  next();
};

app.use(rateLimit);

// Update axios default headers
const userAgent = process.env.USER_AGENT || 'Mozilla/5.0 (compatible; CrawlabilityChecker/1.0)';
axios.defaults.headers.common['User-Agent'] = userAgent;

interface CrawlConfig {
  sitemapOnly: boolean;
  ignoreSitemap: boolean;
  includeSubdomains: boolean;
  maxDepth: number;
  limit: number;
}

interface UrlCheckResult {
  url: string;
  isValid: boolean;
  statusCode?: number;
  error?: string;
  errorType?: 'RATE_LIMIT' | 'BOT_PROTECTION' | 'ACCESS_DENIED' | 'NETWORK' | 'SSL' | 'UNKNOWN';
  redirectChain?: string[];
  isSecure: boolean;
  robotsTxt?: {
    exists: boolean;
    allowed: boolean;
    content?: string;
    userAgent: string;
    warnings?: string[];
  };
  ssl?: {
    valid: boolean;
    issuer?: string;
    validFrom?: string;
    validTo?: string;
    daysUntilExpiry?: number;
    error?: string;
    details?: {
      protocol?: string;
      cipher?: string;
      verificationError?: string;
    };
  };
  crawledUrls?: {
    url: string;
    status: number;
    type: 'success' | 'redirect' | 'error';
    timestamp: string;
  }[];
}

// Validate URL format
function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

// Enhanced error detection
function detectErrorType(error: any, statusCode?: number): { type: UrlCheckResult['errorType']; message: string } {
  if (statusCode === 429) {
    return { type: 'RATE_LIMIT', message: 'Rate limit exceeded' };
  }
  
  if (statusCode === 403) {
    return { type: 'ACCESS_DENIED', message: 'Access denied - possible bot protection' };
  }

  const errorMessage = error?.message?.toLowerCase() || '';
  if (errorMessage.includes('timeout')) {
    return { type: 'NETWORK', message: 'Request timed out' };
  }
  
  if (errorMessage.includes('certificate') || errorMessage.includes('ssl')) {
    return { type: 'SSL', message: error.message };
  }

  if (errorMessage.includes('blocked') || errorMessage.includes('forbidden')) {
    return { type: 'BOT_PROTECTION', message: 'Request blocked - possible bot protection' };
  }

  return { type: 'UNKNOWN', message: error.message || 'Unknown error occurred' };
}

// Enhanced SSL check
function checkSSL(hostname: string): Promise<UrlCheckResult['ssl']> {
  return new Promise((resolve) => {
    const socket = connect({
      host: hostname,
      port: 443,
      rejectUnauthorized: false,
      timeout: 10000
    }, () => {
      try {
        const cert = socket.getPeerCertificate(true);
        if (!cert) {
          resolve({
            valid: false,
            error: 'No SSL certificate found'
          });
          return;
        }

        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const now = new Date();
        const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        resolve({
          valid: true,
          issuer: cert.issuer.CN || cert.issuer.O,
          validFrom: validFrom.toISOString(),
          validTo: validTo.toISOString(),
          daysUntilExpiry,
          details: {
            protocol: socket.getProtocol() || undefined,
            cipher: socket.getCipher()?.name
          }
        });
      } catch (error) {
        resolve({
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown SSL error',
          details: {
            verificationError: error instanceof Error ? error.message : undefined
          }
        });
      } finally {
        socket.end();
      }
    });

    socket.on('error', (error) => {
      resolve({
        valid: false,
        error: error.message,
        details: {
          verificationError: error.message
        }
      });
      socket.end();
    });

    socket.setTimeout(10000, () => {
      resolve({
        valid: false,
        error: 'SSL check timed out',
        details: {
          verificationError: 'Connection timed out'
        }
      });
      socket.end();
    });
  });
}

// Enhanced robots.txt check
async function checkRobotsTxt(baseUrl: string): Promise<UrlCheckResult['robotsTxt']> {
  try {
    const url = new URL(baseUrl);
    const robotsTxtUrl = `${url.protocol}//${url.hostname}/robots.txt`;
    const response = await axios.get(robotsTxtUrl, { 
      timeout: 5000,
      validateStatus: null,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CrawlabilityChecker/1.0)'
      }
    });

    const warnings: string[] = [];
    
    if (response.status !== 200) {
      warnings.push(`Robots.txt returned status code ${response.status}`);
      return {
        exists: false,
        allowed: true,
        userAgent: '*',
        warnings
      };
    }

    const content = response.data;
    if (!content || content.trim().length === 0) {
      warnings.push('Robots.txt is empty');
      return {
        exists: true,
        allowed: true,
        content: '',
        userAgent: '*',
        warnings
      };
    }

    const lines = content.split('\n');
    let currentUserAgent = '*';
    let isAllowed = true;
    let foundUserAgent = false;
    const targetPath = url.pathname || '/';

    let hasValidDirectives = false;
    for (const line of lines) {
      const trimmedLine = line.trim().toLowerCase();
      
      if (trimmedLine.startsWith('user-agent:')) {
        currentUserAgent = trimmedLine.split(':')[1].trim();
        if (currentUserAgent === '*') {
          foundUserAgent = true;
        }
      } else if (foundUserAgent) {
        if (trimmedLine.startsWith('disallow:') || trimmedLine.startsWith('allow:')) {
          hasValidDirectives = true;
        }
        if (trimmedLine.startsWith('disallow:')) {
          const disallowPath = trimmedLine.split(':')[1].trim();
          if (targetPath.startsWith(disallowPath) && disallowPath !== '') {
            isAllowed = false;
            break;
          }
        } else if (trimmedLine.startsWith('allow:')) {
          const allowPath = trimmedLine.split(':')[1].trim();
          if (targetPath.startsWith(allowPath)) {
            isAllowed = true;
            break;
          }
        }
      }
    }

    if (!hasValidDirectives) {
      warnings.push('No valid Allow/Disallow directives found');
    }

    return {
      exists: true,
      allowed: isAllowed,
      content: content,
      userAgent: currentUserAgent,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  } catch (error) {
    return {
      exists: false,
      allowed: true,
      userAgent: '*',
      warnings: [(error as Error).message]
    };
  }
}

// Helper function to check if a URL should be crawled
function shouldCrawlUrl(url: string, baseUrl: string, config: CrawlConfig): boolean {
  try {
    const urlObj = new URL(url);
    const baseUrlObj = new URL(baseUrl);

    // Check if URL is from same domain
    if (!config.includeSubdomains && urlObj.hostname !== baseUrlObj.hostname) {
      return false;
    }

    // Check if URL is subdomain
    if (config.includeSubdomains && !urlObj.hostname.endsWith(baseUrlObj.hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Helper function to discover links in HTML
function discoverLinks(html: string, baseUrl: string, config: CrawlConfig): string[] {
  const links: string[] = [];
  const $ = cheerio.load(html);
  
  $('a[href]').each((_index: number, element: cheerio.Element) => {
    try {
      const href = $(element).attr('href');
      if (!href) return;

      // Convert relative URLs to absolute
      const absoluteUrl = new URL(href, baseUrl).href;
      if (shouldCrawlUrl(absoluteUrl, baseUrl, config)) {
        links.push(absoluteUrl);
      }
    } catch {
      // Skip invalid URLs
    }
  });

  return links;
}

// Helper function to fetch sitemap
async function fetchSitemap(url: string, config: CrawlConfig): Promise<string[]> {
  try {
    const sitemapUrl = new URL('/sitemap.xml', url).href;
    const response = await axios.get(sitemapUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CrawlabilityChecker/1.0)'
      }
    });
    
    const $ = cheerio.load(response.data, { xmlMode: true });
    const urls = $('loc').map((_index: number, element: cheerio.Element) => $(element).text()).get();
    
    return urls.filter((url: string) => shouldCrawlUrl(url, url, config));
  } catch {
    return [];
  }
}

// Store check results in memory (in production, this should use Redis or similar)
const checkResults = new Map<string, {
  ssl?: UrlCheckResult['ssl'];
  robotsTxt?: UrlCheckResult['robotsTxt'];
  crawledUrls?: UrlCheckResult['crawledUrls'];
  completed: boolean;
  timestamp: number;
}>();

// Store crawl results separately
const crawlResults = new Map<string, {
  crawledUrls?: UrlCheckResult['crawledUrls'];
  completed: boolean;
  timestamp: number;
  error?: string;
}>();

// Clean up old results periodically
setInterval(() => {
  const now = Date.now();
  for (const map of [checkResults, crawlResults]) {
    for (const [key, value] of map.entries()) {
      if (now - value.timestamp > 5 * 60 * 1000) { // 5 minutes
        map.delete(key);
      }
    }
  }
}, 60 * 1000); // Clean up every minute

// URL check endpoint
const checkUrlHandler: express.RequestHandler = async (req, res) => {
  console.log('Received request for URL:', req.body.url);
  
  const { url, config = {
    sitemapOnly: false,
    ignoreSitemap: false,
    includeSubdomains: false,
    maxDepth: 2,
    limit: 100,
  } } = req.body;
  
  console.log('Processing URL with config:', { url, config });
  
  try {
    if (!url) {
      console.log('No URL provided');
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    // Add https:// if no protocol specified
    const urlToCheck = url.startsWith('http') ? url : `https://${url}`;
    console.log('Normalized URL:', urlToCheck);
    
    if (!isValidUrl(urlToCheck)) {
      console.log('Invalid URL format:', urlToCheck);
      res.status(400).json({ error: 'Invalid URL format' });
      return;
    }

    // Generate a unique ID for this check
    const checkId = Buffer.from(urlToCheck).toString('base64');
    
    // Initialize check results
    checkResults.set(checkId, {
      completed: false,
      timestamp: Date.now()
    });

    // Initial URL check with increased timeout
    console.log('Starting initial URL check...');
    let response: AxiosResponse;
    try {
      // Run all initial checks in parallel
      const [urlResponse, sslResult, robotsTxtResult] = await Promise.all([
        axios.get(urlToCheck, {
          timeout: 15000,
          maxRedirects: 5,
          validateStatus: null,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CrawlabilityChecker/1.0)'
          }
        }),
        checkSSL(new URL(urlToCheck).hostname),
        checkRobotsTxt(urlToCheck)
      ]);

      response = urlResponse;
      console.log('Initial checks completed');

      // Store the results
      const result = checkResults.get(checkId);
      if (result) {
        result.ssl = sslResult;
        result.robotsTxt = robotsTxtResult;
        result.completed = true;
        checkResults.set(checkId, result);
      }

      // Send complete response
      res.json({
        checkId,
        url: urlToCheck,
        isValid: response.status >= 200 && response.status < 400,
        statusCode: response.status,
        isSecure: urlToCheck.startsWith('https://'),
        ssl: sslResult,
        robotsTxt: robotsTxtResult,
        message: 'Initial check complete'
      });

    } catch (error) {
      console.error('Error during initial URL check:', error);
      if (axios.isAxiosError(error)) {
        console.log('Axios error details:', {
          code: error.code,
          message: error.message,
          response: error.response?.status
        });
        
        if (error.code === 'ECONNABORTED') {
          res.json({
            checkId,
            url: urlToCheck,
            isValid: false,
            statusCode: 504,
            error: 'Request timed out',
            errorType: 'NETWORK',
            isSecure: urlToCheck.startsWith('https://')
          });
          return;
        }
      }
      throw error;
    }

  } catch (error: any) {
    console.error('Unhandled error:', error);
    const errorInfo = detectErrorType(error);
    res.json({
      url: url,
      isValid: false,
      error: errorInfo.message,
      errorType: errorInfo.type,
      isSecure: url.startsWith('https://')
    });
  }
};

// Get additional check results endpoint
const getCheckResultsHandler: express.RequestHandler = async (req, res) => {
  const { checkId } = req.params;
  
  if (!checkId) {
    res.status(400).json({ error: 'Check ID is required' });
    return;
  }

  const result = checkResults.get(checkId);
  if (!result) {
    res.status(404).json({ error: 'Check results not found' });
    return;
  }

  res.json({
    completed: result.completed,
    ssl: result.ssl,
    robotsTxt: result.robotsTxt,
    crawledUrls: result.crawledUrls
  });
};

// URL crawling endpoint
const crawlUrlsHandler: express.RequestHandler = async (req, res) => {
  console.log('Received crawl request for URL:', req.body.url);
  
  const { url, config = {
    sitemapOnly: false,
    ignoreSitemap: false,
    includeSubdomains: false,
    maxDepth: 2,
    limit: 100,
  } } = req.body;

  try {
    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    // Add https:// if no protocol specified
    const urlToCheck = url.startsWith('http') ? url : `https://${url}`;

    // Generate a unique ID for this crawl using a URL-safe encoding
    const crawlId = Buffer.from(`${urlToCheck}-${Date.now()}`).toString('base64url');
    
    // Initialize crawl results
    crawlResults.set(crawlId, {
      completed: false,
      timestamp: Date.now()
    });

    // Start crawling in the background
    crawlUrls(urlToCheck, config).then(crawledUrls => {
      const result = crawlResults.get(crawlId);
      if (result) {
        result.crawledUrls = crawledUrls;
        result.completed = true;
        crawlResults.set(crawlId, result);
      }
    }).catch(error => {
      console.error('Error during crawling:', error);
      const result = crawlResults.get(crawlId);
      if (result) {
        result.completed = true;
        result.error = error.message;
        crawlResults.set(crawlId, result);
      }
    });

    // Send immediate response with crawl ID
    res.json({
      crawlId,
      message: 'URL crawling started'
    });

  } catch (error) {
    console.error('Error initiating crawl:', error);
    res.status(500).json({ error: 'Failed to start URL crawling' });
  }
};

// Get crawl results endpoint
const getCrawlResultsHandler: express.RequestHandler = async (req, res) => {
  const { crawlId } = req.params;
  
  if (!crawlId) {
    res.status(400).json({ error: 'Crawl ID is required' });
    return;
  }

  const result = crawlResults.get(crawlId);
  if (!result) {
    res.status(404).json({ error: 'Crawl results not found' });
    return;
  }

  res.json({
    completed: result.completed,
    crawledUrls: result.crawledUrls,
    error: result.error
  });
};

router.post('/check-url', checkUrlHandler);
router.get('/check-results/:checkId', getCheckResultsHandler);
router.post('/crawl-urls', crawlUrlsHandler);
router.get('/crawl-results/:crawlId', getCrawlResultsHandler);

// Use the router
app.use('/api', router);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 

// Helper function to crawl URLs
async function crawlUrls(baseUrl: string, config: CrawlConfig): Promise<{
  url: string;
  status: number;
  type: 'success' | 'redirect' | 'error';
  timestamp: string;
}[]> {
  try {
    // First get sitemap URLs if enabled
    let urlsToProcess = new Set<string>([baseUrl]);
    
    if (!config.ignoreSitemap) {
      try {
        const sitemapUrls = await fetchSitemap(baseUrl, config);
        sitemapUrls.forEach(url => urlsToProcess.add(url));
        
        if (config.sitemapOnly) {
          urlsToProcess = new Set(Array.from(urlsToProcess).slice(0, config.limit));
        }
      } catch (error) {
        console.error('Error fetching sitemap:', error);
      }
    }

    // Use Firecrawl's batch scrape endpoint
    const response = await axios.post(`${process.env.FIRECRAWL_BASE_URL || 'https://api.firecrawl.dev/v1'}/batch-scrape`, {
      urls: Array.from(urlsToProcess),
      config: {
        maxDepth: config.maxDepth,
        maxUrls: config.limit,
        includeSubdomains: config.includeSubdomains,
        followRedirects: true,
        timeout: 30000,
        concurrency: 10,
        retries: 2
      }
    }, {
      headers: {
        'Authorization': `Bearer fc-8931d65d88d84608abe543181f57d7e4`,
        'Content-Type': 'application/json'
      }
    });

    // Map Firecrawl response to our format
    return response.data.results.map((result: any) => ({
      url: result.url,
      status: result.statusCode,
      type: result.statusCode >= 200 && result.statusCode < 300 
        ? 'success' 
        : result.statusCode >= 300 && result.statusCode < 400
        ? 'redirect'
        : 'error',
      timestamp: new Date().toISOString()
    }));

  } catch (error) {
    console.error('Error using Firecrawl batch scrape:', error);
    throw error;
  }
} 