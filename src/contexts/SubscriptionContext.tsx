import React, { createContext, useContext, useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";

type PlanType = "free" | "starter" | "ultimate";

interface SubscriptionContextType {
  userPlan: PlanType;
  totalUsage: number; // ✅ Use a single counter for all tools
  maxUsage: {
    free: number;
    starter: number;
    ultimate: number;
  };
  incrementUsage: () => void; // ✅ Updated to track all usage
  checkUsageLimit: () => boolean; // ✅ Updated to check total usage
  handleUpgrade: (plan: PlanType) => Promise<void>;
  isUpgradeOpen: boolean;
  setIsUpgradeOpen: (isOpen: boolean) => void;
  updatePlan: (newPlan: PlanType) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
};

const API_URL = import.meta.env.VITE_BACKEND_URL;

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userPlan, setUserPlan] = useState<PlanType>("free");
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [totalUsage, setTotalUsage] = useState(0); // ✅ Single counter

  const maxUsage = {
    free: 4, // ✅ Increased from 3 → 4 per week
    starter: 30,
    ultimate: Infinity,
  };

  // ✅ Load usage count and plan from localStorage on mount
  useEffect(() => {
    const savedUsage = localStorage.getItem("totalUsage");
    const savedPlan = localStorage.getItem("userPlan") as PlanType;
    if (savedUsage) {
      setTotalUsage(parseInt(savedUsage));
    }
    if (savedPlan) {
      setUserPlan(savedPlan);
    }
  }, []);

  // ✅ Save usage count to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("totalUsage", totalUsage.toString());
  }, [totalUsage]);

  // ✅ Reset usage count weekly for free users
  useEffect(() => {
    if (userPlan === "free") {
      const lastReset = localStorage.getItem("lastUsageReset");
      const now = new Date().getTime();
      if (!lastReset || now - parseInt(lastReset) >= 7 * 24 * 60 * 60 * 1000) {
        setTotalUsage(0);
        localStorage.setItem("lastUsageReset", now.toString());
      }
    }
  }, [userPlan]);

  // ✅ Increment total usage
  const incrementUsage = () => {
    setTotalUsage((prev) => prev + 1);
  };

  // ✅ Check if total usage exceeds the limit
  const checkUsageLimit = () => {
    return totalUsage >= maxUsage[userPlan];
  };

  const updatePlan = (newPlan: PlanType) => {
    setUserPlan(newPlan);
    localStorage.setItem("userPlan", newPlan);
    setTotalUsage(0); // ✅ Reset usage count on upgrade
    localStorage.setItem("totalUsage", "0");
  };

  const handleUpgrade = async (plan: PlanType) => {
    try {
      const response = await fetch(
        `/.netlify/functions/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ plan }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { sessionId } = await response.json();
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

      if (!stripe) {
        throw new Error("Failed to load Stripe");
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error starting checkout:", error);
      throw error;
    }
  };

  const value = {
    userPlan,
    totalUsage,
    maxUsage,
    incrementUsage,
    checkUsageLimit,
    handleUpgrade,
    isUpgradeOpen,
    setIsUpgradeOpen,
    updatePlan,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext;
