import React from "react";
import { loadStripe } from '@stripe/stripe-js';

const PricingModal = ({ show, setShow }: { show: boolean; setShow: (state: boolean) => void }) => {
  const handleSubscribe = async (plan: "starter" | "ultimate") => {
    try {
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      const response = await fetch(`/.netlify/functions/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { sessionId } = await response.json();
      const result = await stripe.redirectToCheckout({ sessionId });
      if (result.error) throw new Error(result.error.message);

    } catch (error) {
      console.error("Error starting checkout:", error);
      alert("⚠️ Failed to start checkout. Please try again.");
    }
  };

  return (
    show && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-2xl w-full border border-gray-200 dark:border-gray-700 relative">
          <button onClick={() => setShow(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
            ✖️
          </button>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Choose Your Plan</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border flex flex-col">
              <h3 className="text-xl font-bold text-center">Starter Plan</h3>
              <p className="text-center text-gray-500">$2.99 / month</p>
              <button onClick={() => handleSubscribe("starter")} className="w-full bg-indigo-600 text-white py-2 mt-4 rounded-lg">
                Upgrade to Starter
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-emerald-500 flex flex-col">
              <h3 className="text-xl font-bold text-center">Ultimate Plan</h3>
              <p className="text-center text-gray-500">$6.99 / month</p>
              <button onClick={() => handleSubscribe("ultimate")} className="w-full bg-green-600 text-white py-2 mt-4 rounded-lg">
                Subscribe to Ultimate
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default PricingModal;
