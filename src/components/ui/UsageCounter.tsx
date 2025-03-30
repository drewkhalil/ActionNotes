import React from "react";
import { useSubscription } from "../../contexts/SubscriptionContext";
import { supabase } from "@/lib/supabase";

const UsageCounter: React.FC = () => {
  const { userPlan, totalUsage, maxUsage } = useSubscription();

  return (
    <div className="text-sm text-gray-600 dark:text-gray-300">
      <span>
        {totalUsage}/
        {maxUsage[userPlan] === Infinity ? "∞" : maxUsage[userPlan]} uses
      </span>
    </div>
  );
};

export default UsageCounter;
import { Handler } from "@netlify/functions";
import Stripe from "stripe";

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
        const session = stripeEvent.data.object;
        const customerId = session.customer as string;
        const plan = session.metadata?.plan || "free";

        // 🔄 Update user subscription in Supabase
        const { error } = await supabase
          .from("users")
          .update({ plan })
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
        const subscription = stripeEvent.data.object;
        const customerId = subscription.customer as string;
        const status =
          subscription.status === "active"
            ? subscription.items.data[0].price.id
            : "free";

        // 🔄 Update user subscription in Supabase
        const { error } = await supabase
          .from("users")
          .update({ plan: status })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Failed to update user subscription:", error);
          return { statusCode: 500, body: "Database update failed" };
        }

        console.log(
          `✅ Subscription status updated: ${customerId} → ${status}`,
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return { statusCode: 200, body: "Success" };
  } catch (error) {
    console.error("Error processing webhook:", error);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};
