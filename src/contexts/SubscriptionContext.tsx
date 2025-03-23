import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';

type PlanType = 'free' | 'starter' | 'ultimate';

interface UsageLimit {
  recap: number;
  teach: number;
  quiz: number;
  flashcards: number;
}

interface SubscriptionContextType {
  userPlan: PlanType;
  usageCounts: UsageLimit;
  maxUsage: {
    free: number;
    starter: number;
    ultimate: number;
  };
  incrementUsage: (feature: keyof UsageLimit) => void;
  checkUsageLimit: (feature: keyof UsageLimit) => boolean;
  handleUpgrade: (plan: PlanType) => Promise<void>;
  isUpgradeOpen: boolean;
  setIsUpgradeOpen: (isOpen: boolean) => void;
  updatePlan: (newPlan: PlanType) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Export the hook as a named constant
export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

const API_URL = import.meta.env.VITE_BACKEND_URL;

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userPlan, setUserPlan] = useState<PlanType>('free');
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [usageCounts, setUsageCounts] = useState<UsageLimit>({
    recap: 0,
    teach: 0,
    quiz: 0,
    flashcards: 0
  });

  const maxUsage = {
    free: 3,
    starter: 30,
    ultimate: Infinity
  };

  // Load usage counts and plan from localStorage on mount
  useEffect(() => {
    const savedUsage = localStorage.getItem('usageCounts');
    const savedPlan = localStorage.getItem('userPlan') as PlanType;
    if (savedUsage) {
      setUsageCounts(JSON.parse(savedUsage));
    }
    if (savedPlan) {
      setUserPlan(savedPlan);
    }
  }, []);

  // Save usage counts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('usageCounts', JSON.stringify(usageCounts));
  }, [usageCounts]);

  // Reset usage counts weekly for free users
  useEffect(() => {
    if (userPlan === 'free') {
      const lastReset = localStorage.getItem('lastUsageReset');
      const now = new Date().getTime();
      if (!lastReset || now - parseInt(lastReset) >= 7 * 24 * 60 * 60 * 1000) {
        setUsageCounts({
          recap: 0,
          teach: 0,
          quiz: 0,
          flashcards: 0
        });
        localStorage.setItem('lastUsageReset', now.toString());
      }
    }
  }, [userPlan]);

  const incrementUsage = (feature: keyof UsageLimit) => {
    setUsageCounts(prev => ({
      ...prev,
      [feature]: prev[feature] + 1
    }));
  };

  const checkUsageLimit = (feature: keyof UsageLimit) => {
    return usageCounts[feature] >= maxUsage[userPlan];
  };

  const updatePlan = (newPlan: PlanType) => {
    setUserPlan(newPlan);
    localStorage.setItem('userPlan', newPlan);
    // Reset usage counts when upgrading
    setUsageCounts({
      recap: 0,
      teach: 0,
      quiz: 0,
      flashcards: 0
    });
    localStorage.setItem('usageCounts', JSON.stringify({
      recap: 0,
      teach: 0,
      quiz: 0,
      flashcards: 0
    }));
  };

  const handleUpgrade = async (plan: PlanType) => {
    try {
      const response = await fetch(`/.netlify/functions/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
      
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      throw error;
    }
  };

  const value = {
    userPlan,
    usageCounts,
    maxUsage,
    incrementUsage,
    checkUsageLimit,
    handleUpgrade,
    isUpgradeOpen,
    setIsUpgradeOpen,
    updatePlan
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext; 