import { Handler } from "@netlify/functions";
import Stripe from "stripe";
import supabase from "../../src/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia",
});

export const handler: Handler = async (event) => {
  try {
    const sig = event.headers["stripe-signature"];
    if (!sig) {
      return { statusCode: 400, body: "Missing Stripe signature" };
    }

    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body as string,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET as string,
      );
    } catch (err) {
      console.error("Webhook signature verification failed.", err);
      return { statusCode: 400, body: "Webhook signature verification failed" };
    }

    // 📌 Handle Stripe event types
    switch (stripeEvent.type) {
      case "checkout.session.completed": {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const plan = session.metadata?.plan || "free"; // ✅ Ensure it never becomes undefined

        // 🔄 Update user subscription in Supabase
        const { error } = await supabase
          .from("users")
          .update({ plan, stripe_customer_id: customerId }) // ✅ Ensure stripe_customer_id is stored
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Failed to update user plan:", error);
          return { statusCode: 500, body: "Database update failed" };
        }

        console.log(`✅ Subscription updated: ${customerId} → ${plan}`);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // 🔄 Map Stripe price IDs to plan names
        const priceId = subscription.items.data[0].price.id;
        let plan = "free"; // Default if not matched

        if (priceId === process.env.STRIPE_STARTER_PRICE_ID) plan = "starter";
        if (priceId === process.env.STRIPE_ULTIMATE_PRICE_ID) plan = "ultimate";

        if (subscription.status !== "active") {
          plan = "free"; // ✅ Ensure plan is "free" if subscription is canceled
        }

        // 🔄 Update user subscription in Supabase
        const { error } = await supabase
          .from("users")
          .update({ plan })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Failed to update user subscription:", error);
          return { statusCode: 500, body: "Database update failed" };
        }

        console.log(`✅ Subscription status updated: ${customerId} → ${plan}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: "Success",
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow all origins or specify your frontend URL
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Specify allowed methods
        "Access-Control-Allow-Headers": "Content-Type, Authorization", // Specify allowed headers
      },
    };
  } catch (error) {
    console.error("Error processing webhook:", error);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};
