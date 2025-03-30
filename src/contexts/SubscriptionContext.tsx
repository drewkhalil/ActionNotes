import React, { createContext, useContext, useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";

type PlanType = "free" | "starter" | "ultimate";

interface SubscriptionContextType {
  userPlan: PlanType;
  totalUsage: number;
  maxUsage: {
    free: number;
    starter: number;
    ultimate: number;
  };
  incrementUsage: () => void;
  checkUsageLimit: () => boolean;
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

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userPlan, setUserPlan] = useState<PlanType>("free");
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [totalUsage, setTotalUsage] = useState(0);

  const maxUsage = {
    free: Infinity,
    starter: 30,
    ultimate: Infinity,
  };

  // ✅ Load user plan from API
  useEffect(() => {
    const fetchUpdatedPlan = async () => {
      try {
        const userId = localStorage.getItem("user_id"); // ✅ Get user ID
        if (!userId) return;

        const res = await fetch(`/api/get-user-plan?user_id=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setUserPlan(data.plan);
        }
      } catch (err) {
        console.error("Failed to fetch updated plan:", err);
      }
    };

    fetchUpdatedPlan();
  }, []);

  // ✅ Save usage count
  useEffect(() => {
    localStorage.setItem("totalUsage", totalUsage.toString());
  }, [totalUsage]);

  // ✅ Reset usage weekly
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

  const incrementUsage = () => {
    setTotalUsage((prev) => prev + 1);
  };

  const checkUsageLimit = () => {
    return totalUsage >= maxUsage[userPlan];
  };

  const updatePlan = (newPlan: PlanType) => {
    setUserPlan(newPlan);
    localStorage.setItem("userPlan", newPlan);
    setTotalUsage(0);
    localStorage.setItem("totalUsage", "0");
  };

  const handleUpgrade = async (plan: PlanType) => {
    try {
      const API_URL = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { sessionId } = await response.json();
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

      if (!stripe) {
        throw new Error("Failed to load Stripe");
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (!error) {
        setTimeout(async () => {
          try {
            const userId = localStorage.getItem("user_id"); // ✅ Ensure userId is used
            if (!userId) return;

            const res = await fetch(`/api/get-user-plan?user_id=${userId}`);
            if (res.ok) {
              const data = await res.json();
              updatePlan(data.plan);
            }
          } catch (err) {
            console.error("Failed to fetch updated plan:", err);
          }
        }, 5000);
      } else {
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
