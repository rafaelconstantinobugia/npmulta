import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

const IMBURSE_TENANT = process.env.IMBURSE_TENANT!;
const IMBURSE_APIKEY = process.env.IMBURSE_APIKEY!;
const HOST_URL = process.env.URL!; // e.g. https://naopaguesamulta.netlify.app

const handler: Handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    // Parse request body
    const requestBody = JSON.parse(event.body || '{}');
    const { email } = requestBody;

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email is required' }),
      };
    }

    // Create an Imburse transaction
    const resp = await fetch(
      `https://api.imbursepayments.com/tenants/${IMBURSE_TENANT}/transactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': IMBURSE_APIKEY,
        },
        body: JSON.stringify({
          amount: 990, // cents => €9.90
          currency: 'EUR',
          customer: { email },
          description: 'Carta de Recurso – Não Pagues a Multa',
          redirectUrl: `${HOST_URL}/success`,
        }),
      }
    );

    if (!resp.ok) {
      return { 
        statusCode: resp.status, 
        body: await resp.text() 
      };
    }

    const { checkoutUrl } = await resp.json();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ url: checkoutUrl }),
    };
  } catch (error) {
    console.error('Error creating payment:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create payment' }),
    };
  }
};

export { handler };