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
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const app = express();

// Set CSP headers before any other middleware
app.use((req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const cspDirectives = {
    'default-src': ["'self'", "https://actionnotes.netlify.app", "https://*.replit.dev"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*.stripe.com", "https://actionnotes.netlify.app", "https://*.replit.dev"],
    'style-src': ["'self'", "'unsafe-inline'", "https://actionnotes.netlify.app"],
    'img-src': ["'self'", "data:", "https:", "https://actionnotes.netlify.app"],
    'font-src': ["'self'", "data:", "https:", "https://actionnotes.netlify.app", "https://fonts.gstatic.com"],
    'connect-src': [
      "'self'",
      "https://actionnotes-production.up.railway.app/api/create-checkout-session",
      "https://bmuvsbafvrvsgdplhvgp.supabase.co",
      "https://*.supabase.co",
      "https://api.openai.com",
      "https://*.stripe.com",
      "wss://bmuvsbafvrvsgdplhvgp.supabase.co",
      "https://api.stripe.com",
      "https://actionnotes.netlify.app",
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com"
    ],
    'frame-src': ["'self'", "https://*.stripe.com", "https://actionnotes.netlify.app"]
  };

  if (isDevelopment) {
    cspDirectives['connect-src'].push(
      "http://localhost:5173"
    );
  }

  const cspString = Object.entries(cspDirectives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');

  res.setHeader('Content-Security-Policy', cspString);
  next();
});

// Set CORS headers
app.use(cors({ 
  origin: ["https://actionnotes.netlify.app", "http://localhost:5173"], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

app.use(express.json());

// Additional routes and logic here...

export default app;
