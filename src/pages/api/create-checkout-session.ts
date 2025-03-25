import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import Cors from "cors";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16", // Use your desired API version
});

// Initialize CORS
const cors = Cors({
  methods: ["GET", "POST", "OPTIONS"],
  origin: "https://actionnotes.netlify.app", // Allow only requests from your Netlify app
});

// Helper function to run middleware
const runCors = (req, res, next) => cors(req, res, next);

// API handler function
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Run CORS before handling the rest of your logic
  await new Promise((resolve, reject) =>
    runCors(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      resolve(result);
    }),
  );

  if (req.method === "POST") {
    try {
      const { plan } = req.body;

      // Get the price ID from environment variables based on the plan
      const priceId =
        plan === "starter"
          ? process.env.STRIPE_STARTER_PRICE_ID
          : plan === "ultimate"
            ? process.env.STRIPE_ULTIMATE_PRICE_ID
            : null;

      if (!priceId) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade-cancelled`,
        metadata: { plan },
      });

      // Respond with the session ID
      return res.status(200).json({ sessionId: session.id });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      return res
        .status(500)
        .json({ error: "Failed to create checkout session" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
