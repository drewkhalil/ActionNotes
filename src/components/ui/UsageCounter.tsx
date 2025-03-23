import React from 'react';
import { useSubscription } from '../../contexts/SubscriptionContext';

interface UsageCounterProps {
  feature: 'recap' | 'teach' | 'quiz' | 'flashcards';
}

const UsageCounter: React.FC<UsageCounterProps> = ({ feature }) => {
  const {
    userPlan,
    usageCounts,
    maxUsage
  } = useSubscription();

  return (
    <div className="text-sm text-gray-600 dark:text-gray-300">
      <span>{usageCounts[feature]}/{maxUsage[userPlan] === Infinity ? '∞' : maxUsage[userPlan]} uses</span>
    </div>
  );
};

export default UsageCounter; 