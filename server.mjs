import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = "https://bmuvsbafvrvsgdplhvgp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdXZzYmFmdnJ2c2dkcGxodmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY3MjYxNjMsImV4cCI6MjAyMjMwMjE2M30";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();

// CORS configuration
app.use(cors({
  origin: ["https://actionnotes.netlify.app", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204
}));

const YOUR_DOMAIN = process.env.NEXT_PUBLIC_SITE_URL;

// Serve static files (if needed, like public folder for assets)
app.use(express.static('public'));

// Parse incoming JSON requests
app.use(express.json());

// Create Checkout Session
app.post('/create-checkout-session', async (req, res) => {
  const { userId, plan } = req.body;

  if (!userId || !plan) {
    return res.status(400).json({ error: 'Missing userId or plan' });
  }

  const priceId = plan === 'starter' 
    ? process.env.STRIPE_STARTER_PRICE_ID 
    : process.env.STRIPE_ULTIMATE_PRICE_ID;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}?canceled=true`,
    metadata: { userId, plan }
  });

  res.json({ sessionId: session.id });
});

// Webhook for Stripe events
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const { userId, plan } = session.metadata;
      await supabase.from('users').update({ plan }).eq('id', userId);
      break;
    // Handle other event types as needed
    default:
      console.log(`Unhandled event type ${event.type}.`);
  }

  res.send();
});

// Start the server
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});