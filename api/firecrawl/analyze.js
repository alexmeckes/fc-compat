import axios from 'axios';

export default async function handler(req, res) {
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
    const { url, waitFor, userAgent, removeBase64Images, onlyMainContent, includeTags, excludeTags, emulateMobile } = req.body;
    
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
    const startTime = new Date();
    console.log('Wait time received:', waitFor);

    // Ensure waitFor is a valid number and within bounds
    const validatedWaitFor = typeof waitFor === 'number' && !isNaN(waitFor) 
      ? Math.min(Math.max(waitFor, 1000), 60000) 
      : 1000; // Default to 1 second

    console.log('Using wait time:', validatedWaitFor);

    const requestConfig = {
      url: url.startsWith('http') ? url : `https://${url}`,
      formats: ['markdown', 'html'],
      timeout: 180000, // 3 minute timeout (180 seconds)
      waitFor: validatedWaitFor, // Use validated wait time
      removeBase64Images: removeBase64Images !== undefined ? removeBase64Images : true,
      onlyMainContent: onlyMainContent !== undefined ? onlyMainContent : true,
    };

    console.log('Request config:', {
      timeout: requestConfig.timeout,
      waitFor: requestConfig.waitFor,
      url: requestConfig.url
    });

    // Add mobile emulation if enabled
    if (emulateMobile) {
      requestConfig.device = {
        name: 'iPhone 12',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
        viewport: {
          width: 390,
          height: 844,
          deviceScaleFactor: 3,
          isMobile: true,
          hasTouch: true,
          isLandscape: false
        }
      };
    }

    // Add includeTags if provided
    if (includeTags && includeTags.length > 0) {
      requestConfig.includeTags = includeTags;
    }

    // Add excludeTags if provided
    if (excludeTags && excludeTags.length > 0) {
      requestConfig.excludeTags = excludeTags;
    }

    const response = await axios.post(
      'https://api.firecrawl.dev/v1/scrape',
      requestConfig,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(userAgent && !emulateMobile && { 'User-Agent': userAgent }) // Only use custom user agent if not emulating mobile
        },
        timeout: Math.min(validatedWaitFor + 180000, 240000) // Add 3 minutes to wait time, max 4 minutes total
      }
    );

    const endTime = new Date();
    console.log('Firecrawl raw response:', {
      success: response.data.success,
      hasContent: !!response.data.data?.content,
      hasMarkdown: !!response.data.data?.markdown,
      contentSample: response.data.data?.content?.substring(0, 100),
      markdownSample: response.data.data?.markdown?.substring(0, 100),
      data: response.data
    });

    // Add timing information and original URL to the response
    const responseData = {
      success: response.data.success,
      url: requestConfig.url,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      content: response.data.data?.content || '',
      markdown: response.data.data?.markdown || '',
      ssl: response.data.data?.ssl || { valid: requestConfig.url.startsWith('https://') },
      robotsTxt: response.data.data?.robotsTxt || { exists: false, disallowed: false },
      links: response.data.data?.links || []
    };

    console.log('Final response data:', {
      success: responseData.success,
      hasContent: !!responseData.content,
      hasMarkdown: !!responseData.markdown,
      contentLength: responseData.content?.length,
      markdownLength: responseData.markdown?.length,
      contentSample: responseData.content?.substring(0, 100),
      markdownSample: responseData.markdown?.substring(0, 100)
    });

    return res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
      isAxiosError: axios.isAxiosError(error),
      isTimeout: error.code === 'ECONNABORTED',
      response: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      },
      config: {
        url: error.config?.url,
        timeout: error.config?.timeout,
        waitFor: error.config?.data?.waitFor,
      }
    });
    
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      const errorStatus = error.response?.status || 500;
      
      // Handle specific error cases
      if (error.code === 'ECONNABORTED') {
        return res.status(504).json({
          success: false,
          error: 'The request to Firecrawl timed out. This could be due to high server load or the page taking too long to load.',
          status: 504,
          details: {
            timeout: error.config?.timeout,
            waitFor: error.config?.data?.waitFor,
            message: error.message
          }
        });
      }

      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          error: 'Unable to connect to Firecrawl service. The service may be down or experiencing issues.',
          status: 503,
          details: {
            message: error.message,
            code: error.code
          }
        });
      }

      if (error.response?.status === 429) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          status: 429,
          details: error.response?.data
        });
      }
      
      return res.status(errorStatus).json({
        success: false,
        error: `API Error: ${errorMessage}`,
        status: errorStatus,
        details: {
          ...error.response?.data,
          code: error.code,
          message: error.message
        }
      });
    }
    
    return res.status(500).json({
      success: false,
      error: `Server Error: ${error.message}`,
      details: {
        code: error.code,
        name: error.name,
        message: error.message
      }
    });
  }
} 