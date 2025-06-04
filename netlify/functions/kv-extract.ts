import { Handler } from '@netlify/functions';
import pLimit from 'p-limit';
import crypto from 'crypto';

// Create concurrency limiter - max 3 concurrent LayoutLM calls
const limit = pLimit(3);

// Active requests tracker
let activeRequests = 0;

// Cache helpers
async function getFromCache(key: string): Promise<any | null> {
  // In a real implementation, this would use Supabase KV or another storage
  // For this example, we'll just return null
  return null;
}

async function setInCache(key: string, data: any, ttl = 86400): Promise<void> {
  // In a real implementation, this would store in Supabase KV with TTL
  // For this example, we'll just log
  console.log(`Would cache data with key ${key} for ${ttl}s`);
}

interface TicketField {
  text: string;
  confidence: number;
}

interface LayoutLMResponse {
  plate?: TicketField;
  date?: TicketField;
  time?: TicketField;
  fine_amount?: TicketField;
  article?: TicketField;
}

const handler: Handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-cache-key',
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
  if (activeRequests >= 3) {
    return {
      statusCode: 429,
      body: JSON.stringify({ error: 'Too Many Requests. Please try again later.' }),
    };
  }

  // Determine the LayoutLM service URL
  const layoutlmUrl = process.env.KV_EXTRACT_URL || 'http://localhost:9100/extract';
  
  // Check for cache key
  const cacheKey = event.headers['x-cache-key'];
  
  // If cache key is provided, try to get from cache
  if (cacheKey) {
    try {
      const cachedData = await getFromCache(cacheKey);
      if (cachedData) {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Cache': 'HIT',
          },
          body: JSON.stringify(cachedData),
        };
      }
    } catch (error) {
      console.error('Cache error:', error);
      // Continue with the request if cache fails
    }
  }

  // Parse the request
  let requestBody: any;
  let contentType = event.headers['content-type'] || '';
  let imageBuffer: Buffer | null = null;
  let ocrItems: any[] | null = null;
  
  try {
    // Handle multipart form data with file
    if (contentType.includes('multipart/form-data')) {
      // In a real implementation, we would parse the multipart form
      // For this example, we'll treat the body as the raw file data
      imageBuffer = Buffer.from(event.body || '', 'base64');
    } 
    // Handle JSON data with OCR items
    else if (contentType.includes('application/json')) {
      requestBody = JSON.parse(event.body || '{}');
      
      // Extract OCR items if provided
      if (requestBody.ocrItems) {
        ocrItems = requestBody.ocrItems;
      }
      
      // Extract image data if provided
      if (requestBody.imageData) {
        // For base64 encoded image data
        if (typeof requestBody.imageData === 'string') {
          const base64Data = requestBody.imageData.replace(/^data:image\/\w+;base64,/, '');
          imageBuffer = Buffer.from(base64Data, 'base64');
        } else if (requestBody.imageData instanceof Uint8Array) {
          imageBuffer = Buffer.from(requestBody.imageData);
        }
      }
    } 
    // Handle raw binary data
    else {
      imageBuffer = Buffer.from(event.body || '', 'base64');
    }

    // Make sure we have either image data or OCR items
    if (!imageBuffer && !ocrItems) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request: must provide image data or OCR items' }),
      };
    }

    // Calculate cache key if not provided but we have an image
    let effectiveCacheKey = cacheKey;
    if (!effectiveCacheKey && imageBuffer) {
      const hash = crypto.createHash('sha256');
      hash.update(imageBuffer);
      effectiveCacheKey = hash.digest('hex');
    }

    // Track active requests
    activeRequests++;

    // Limit concurrency and forward the request to LayoutLM service
    const response = await limit(async () => {
      try {
        // Prepare the request to the LayoutLM service
        const fetchOptions: RequestInit = {
          method: 'POST',
          headers: {
            'Content-Type': contentType,
          },
        };

        // Set the appropriate body based on what we have
        if (ocrItems) {
          fetchOptions.body = JSON.stringify({ ocrItems });
          fetchOptions.headers = {
            'Content-Type': 'application/json',
          };
        } else if (imageBuffer) {
          fetchOptions.body = imageBuffer;
        }

        // Make the request to the LayoutLM service
        const fetchResponse = await fetch(layoutlmUrl, fetchOptions);

        if (!fetchResponse.ok) {
          throw new Error(`LayoutLM service returned ${fetchResponse.status}: ${await fetchResponse.text()}`);
        }

        return await fetchResponse.json();
      } catch (error) {
        console.error('Error calling LayoutLM service:', error);
        throw error;
      }
    });

    // Cache the result if we have a cache key
    if (effectiveCacheKey) {
      try {
        await setInCache(effectiveCacheKey, response);
      } catch (error) {
        console.error('Error caching result:', error);
        // Continue even if caching fails
      }
    }

    // Set headers for the response
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    };

    // Add cache header if appropriate
    if (effectiveCacheKey) {
      headers['X-Cache'] = 'MISS';
      headers['X-Cache-Key'] = effectiveCacheKey;
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
      body: JSON.stringify({ error: 'layoutlm_gateway' }),
    };
  } finally {
    // Decrement active requests counter
    activeRequests--;
  }
};

export { handler };