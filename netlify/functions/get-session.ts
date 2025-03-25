import { Handler } from '@netlify/functions';
import Stripe from 'stripe';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { sessionId } = JSON.parse(event.body || '{}');
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Determine the plan based on the price ID
    const priceId = session.line_items?.data[0]?.price?.id;
    let plan = 'free';
    
    if (priceId === process.env.STRIPE_STARTER_PRICE_ID) {
      plan = 'starter';
    } else if (priceId === process.env.STRIPE_ULTIMATE_PRICE_ID) {
      plan = 'ultimate';
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ plan }),
    };
  } catch (error) {
    console.error('Error retrieving session:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve session details' }),
    };
  }
};

export { handler }; 