import { Handler } from '@netlify/functions';
import pLimit from 'p-limit';

// Create concurrency limiter - max 2 concurrent Paddle calls
const limit = pLimit(2);

// Active requests tracker
let activeRequests = 0;

const handler: Handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Cache-Key',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  // Check if we're at the concurrency limit
  if (activeRequests >= 2) {
    return {
      statusCode: 429,
      body: JSON.stringify({ error: 'Too Many Requests. Please try again later.' }),
    };
  }

  // Determine the PaddleOCR service URL
  const paddleOcrUrl = process.env.PADDLE_OCR_URL || 'http://127.0.0.1:9000/ocr';
  
  // Get image data from request
  let imageBuffer: Buffer;
  const contentType = event.headers['content-type'] || '';
  
  try {
    if (contentType.includes('multipart/form-data')) {
      // TODO: For multipart form data, we would need to parse the form
      // This is simplified for demonstration
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Multipart form data not supported in this implementation' }),
      };
    } else {
      // Assume raw image bytes
      imageBuffer = Buffer.from(event.body || '', 'base64');
    }

    // Track active requests
    activeRequests++;

    // Limit concurrency and forward the request to PaddleOCR service
    const response = await limit(async () => {
      try {
        const fetchResponse = await fetch(paddleOcrUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          body: imageBuffer,
        });

        if (!fetchResponse.ok) {
          throw new Error(`PaddleOCR service returned ${fetchResponse.status}`);
        }

        return await fetchResponse.json();
      } catch (error) {
        console.error('Error calling PaddleOCR service:', error);
        throw error;
      }
    });

    // Set cache headers if x-cache-key is provided
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    };

    const cacheKey = event.headers['x-cache-key'];
    if (cacheKey) {
      headers['Cache-Control'] = 'max-age=86400'; // 24 hours
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error processing request:', error);
    
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'PaddleOCR gateway error' }),
    };
  } finally {
    // Decrement active requests counter
    activeRequests--;
  }
};

export { handler };