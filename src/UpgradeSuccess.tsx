import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "./contexts/SubscriptionContext";

const UpgradeSuccess = () => {
  const navigate = useNavigate();
  const { setIsUpgradeOpen, updatePlan } = useSubscription();

  useEffect(() => {
    const updateSubscription = async () => {
      try {
        // Get the session ID from URL
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("session_id");

        if (!sessionId) {
          throw new Error("No session ID found");
        }

        // Fetch the session details from our backend
        const response = await fetch(`/.netlify/functions/get-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch session details");
        }

        const data = await response.json();
        console.log("🔍 Fetched session data:", data);

        const { plan } = data;
        updatePlan(plan);

        // Update the subscription plan using the context
        updatePlan(plan);

        // Close the upgrade modal
        setIsUpgradeOpen(false);

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } catch (error) {
        console.error("Error updating subscription:", error);
        navigate("/dashboard");
      }
    };

    updateSubscription();
  }, [navigate, setIsUpgradeOpen, updatePlan]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Payment Successful! 🎉
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Your subscription has been upgraded successfully. Redirecting you to
            the dashboard...
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeSuccess;
