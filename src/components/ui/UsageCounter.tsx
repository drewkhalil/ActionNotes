import React from "react";
import { useSubscription } from "../../contexts/SubscriptionContext";

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
