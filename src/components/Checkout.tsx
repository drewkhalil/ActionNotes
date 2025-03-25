import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { loadStripe } from "@stripe/stripe-js";

interface CheckoutProps {
  planName: "starter" | "ultimate";
  price: string;
}

export const Checkout: React.FC<CheckoutProps> = ({ planName, price }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        alert("Please log in first");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/create-checkout-session`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            userId,
            plan: planName,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Checkout failed: ${errorData}`);
      }

      const { sessionId } = await response.json();
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to start checkout process");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-xl font-semibold">
        {planName.charAt(0).toUpperCase() + planName.slice(1)} Plan
      </h3>
      <p className="text-lg">${price}/month</p>
      <Button onClick={handleCheckout} disabled={isLoading} className="w-full">
        {isLoading ? "Processing..." : "Subscribe Now"}
      </Button>
    </div>
  );
};
