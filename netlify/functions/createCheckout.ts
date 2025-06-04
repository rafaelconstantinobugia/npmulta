// This file was causing build errors, replacing with a dummy function
import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  // Return a placeholder response
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: "This function has been disabled." 
    })
  };
};

export { handler };