import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_STARTER_PRICE_ID = process.env.STRIPE_STARTER_PRICE_ID;
const STRIPE_ULTIMATE_PRICE_ID = process.env.STRIPE_ULTIMATE_PRICE_ID;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!STRIPE_SECRET_KEY) {
  console.error("❌ STRIPE_SECRET_KEY is missing! Check .env file.");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const app = express();

// Set CSP headers before any other middleware
app.use((req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Base CSP directives
  const cspDirectives = {
    'default-src': ["'self'", "https://actionnotes.nelify.app"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*.stripe.com", "https://actionnotes.nelify.app"],
    'style-src': ["'self'", "'unsafe-inline'", "https://actionnotes.nelify.app"],
    'img-src': ["'self'", "data:", "https:", "https://actionnotes.nelify.app"],
    'font-src': ["'self'", "data:", "https:", "https://actionnotes.nelify.app", "https://fonts.gstatic.com"],
    'connect-src': [
      "'self'",
      "https://bmuvsbafvrvsgdplhvgp.supabase.co",
      "https://*.supabase.co",
      "https://api.openai.com",
      "https://*.stripe.com",
      "wss://bmuvsbafvrvsgdplhvgp.supabase.co",
      "https://api.stripe.com",
      "https://actionnotes.nelify.app",
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com"
    ],
    'frame-src': ["'self'", "https://*.stripe.com", "https://actionnotes.nelify.app"]
  };

  // Add development-specific sources
  if (isDevelopment) {
    cspDirectives['connect-src'].push(
      "http://localhost:4242",
      "http://localhost:5173"
    );
  }

  // Convert CSP object to string
  const cspString = Object.entries(cspDirectives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');

  res.setHeader('Content-Security-Policy', cspString);
  next();
});


// Set CORS headers
app.use(cors({ 
  origin: ["https://actionnotes.nelify.app", "http://localhost:5173"], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

app.use(express.json());

// Auth Routes
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// User Profile Routes
app.get("/api/user/profile", async (req, res) => {
  try {
    const { user } = await supabase.auth.getUser(req.headers.authorization);
    if (!user) throw new Error("Not authenticated");
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put("/api/user/profile", async (req, res) => {
  try {
    const { user } = await supabase.auth.getUser(req.headers.authorization);
    if (!user) throw new Error("Not authenticated");
    
    const { name, email } = req.body;
    const { data, error } = await supabase
      .from('profiles')
      .update({ name, email })
      .eq('id', user.id)
      .select()
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Subscription Management Routes
app.get("/api/subscription", async (req, res) => {
  try {
    const { user } = await supabase.auth.getUser(req.headers.authorization);
    if (!user) throw new Error("Not authenticated");
    
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    if (error) throw error;
    res.json(subscription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/subscription/cancel", async (req, res) => {
  try {
    const { user } = await supabase.auth.getUser(req.headers.authorization);
    if (!user) throw new Error("Not authenticated");
    
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .single();
      
    if (!subscription) throw new Error("No active subscription");
    
    await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('user_id', user.id);
      
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ Checkout Route - Create Subscription
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { userId, plan } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing user ID" });

    console.log("🛒 Checkout request received for user:", userId);

    const priceId = plan === "ultimate" ? STRIPE_ULTIMATE_PRICE_ID : STRIPE_STARTER_PRICE_ID;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.VITE_BACKEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_BACKEND_URL}/cancel`,
      client_reference_id: userId,
      metadata: { userId }
    });

    console.log("✅ Session created:", session.id);
    res.json({ sessionId: session.id });

  } catch (error) {
    console.error("❌ Error creating checkout session:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Track Free Summaries & Handle Limit
app.post("/api/updateUsage", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('usage_count, last_reset, is_premium')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!user) {
      await supabase
        .from('users')
        .insert([{ id: userId, usage_count: 1 }]);
      return res.json({ success: true, remaining: 2 });
    }

    const now = new Date();
    const lastReset = new Date(user.last_reset);
    const shouldReset = now.getTime() - lastReset.getTime() > 7 * 24 * 60 * 60 * 1000;

    if (shouldReset) {
      await supabase
        .from('users')
        .update({ usage_count: 1, last_reset: now.toISOString() })
        .eq('id', userId);
      return res.json({ success: true, remaining: 2 });
    }

    if (user.is_premium) {
      return res.json({ success: true, remaining: 'unlimited' });
    }

    if (user.usage_count >= 3) {
      return res.json({ success: false, remaining: 0 });
    }

    await supabase
      .from('users')
      .update({ usage_count: user.usage_count + 1 })
      .eq('id', userId);

    res.json({ success: true, remaining: 2 - user.usage_count });

  } catch (err) {
    console.error("Error updating usage:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Webhook for Stripe Events
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️ Webhook verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📩 Received Stripe event: ${event.type}`);

  try {
    const session = event.data.object;
    const userId = session.metadata?.userId;

    switch (event.type) {
      case 'checkout.session.completed':
        if (!userId) {
          console.error("❌ Missing userId in session metadata.");
          return res.status(400).json({ error: "Invalid session metadata" });
        }
        console.log(`✅ User ${userId} completed checkout. Upgrading to premium.`);
        await supabase.from('users').update({ is_premium: true }).eq('id', userId);
        break;

      case 'customer.subscription.created':
        console.log(`✅ New subscription created: ${session.id}`);
        if (userId) {
          await supabase.from('users').update({ is_premium: true }).eq('id', userId);
        }
        break;

      case 'customer.subscription.updated':
        console.log(`🔄 Subscription updated: ${session.id}`);
        break;

      case 'customer.subscription.deleted':
        console.log(`❌ Subscription canceled: ${session.id}`);
        if (userId) {
          await supabase.from('users').update({ is_premium: false }).eq('id', userId);
        }
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("❌ Error processing webhook:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Success and Cancel pages
app.get("/success", (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Payment Successful!</h1>
        <p>Thank you for your subscription. You can now close this window and return to the app.</p>
      </body>
    </html>
  `);
});

app.get("/cancel", (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Payment Cancelled</h1>
        <p>Your payment was cancelled. You can try again or contact support if you need help.</p>
      </body>
    </html>
  `);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start server without SSL for local development
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
