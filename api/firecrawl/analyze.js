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

    const requestConfig = {
      url: url.startsWith('http') ? url : `https://${url}`,
      formats: ['markdown', 'html'],
      timeout: 180000, // 3 minute timeout (180 seconds)
      waitFor: typeof waitFor === 'number' ? waitFor : 30000, // Use provided wait time or default to 30 seconds
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
        timeout: 180000 // 3 minute timeout (180 seconds)
      }
    );

    const endTime = new Date();
    console.log('Firecrawl raw response:', response.data);
    console.log('SSL info:', response.data.ssl);
    console.log('Content info:', {
      hasContent: !!response.data.content,
      contentLength: response.data.content?.length,
      hasMarkdown: !!response.data.markdown,
      markdownLength: response.data.markdown?.length,
      contentSample: response.data.content?.substring(0, 100),
      markdownSample: response.data.markdown?.substring(0, 100)
    });

    // Add timing information and original URL to the response
    const responseData = {
      ...response.data,
      url: requestConfig.url,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      // Ensure these fields exist and are not empty
      content: response.data.content || response.data.markdown || '',
      markdown: response.data.markdown || response.data.content || '',
      ssl: response.data.ssl || { valid: response.data.url?.startsWith('https://') },
      robotsTxt: response.data.robotsTxt || { exists: false, disallowed: false }
    };

    console.log('Final response data:', {
      ...responseData,
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
      response: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      }
    });
    
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      const errorStatus = error.response?.status || 500;
      
      return res.status(errorStatus).json({
        success: false,
        error: `API Error: ${errorMessage}`,
        status: errorStatus,
        details: error.response?.data
      });
    }
    
    return res.status(500).json({
      success: false,
      error: `Server Error: ${error.message}`
    });
  }
} 