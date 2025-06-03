import { Handler } from '@netlify/functions';

interface SendLetterRequest {
  email: string;
  pdf?: string; // Optional base64 PDF data (simulated in this function)
}

const handler: Handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
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

  try {
    // Parse the request body
    const requestBody = JSON.parse(event.body || '{}') as SendLetterRequest;
    
    // Validate the email parameter
    if (!requestBody.email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email address is required' }),
      };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requestBody.email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid email address format' }),
      };
    }

    // Log the request (simulating email sending)
    console.log(`Letter would be sent to: ${requestBody.email}`);
    console.log(`PDF included: ${requestBody.pdf ? 'Yes (simulated)' : 'No'}`);
    
    // In a real implementation, we would:
    // 1. Save the PDF to storage or send it directly
    // 2. Use an email service like SendGrid, AWS SES, etc.
    // 3. Handle errors appropriately
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: 'Letter sent successfully (simulated)',
        recipient: requestBody.email,
      }),
    };
  } catch (error) {
    console.error('Error processing request:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};

export { handler };