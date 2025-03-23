import Stripe from 'stripe';
import type { NextApiRequest, NextApiResponse } from 'next';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.body;

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Get the subscription
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Update user's plan in your database
    // This is where you would update the user's subscription status in your database
    // For example:
    // await db.user.update({
    //   where: { id: session.client_reference_id },
    //   data: { plan: session.metadata?.planType }
    // });

    res.status(200).json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planType: session.metadata?.planType || 'default',
      },
    });
  } catch (error) {
    console.error('Error verifying subscription:', error);
    res.status(500).json({ error: 'Failed to verify subscription' });
  }
} 