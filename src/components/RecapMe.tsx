import React, { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Loader2, Crown } from "lucide-react";
import UpgradePopup from "./ui/UpgradePopup";
import { useSubscription } from "../contexts/SubscriptionContext";

const RecapMe: React.FC = () => {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState("");

  const {
    userPlan,
    usageCounts,
    maxUsage,
    incrementUsage,
    checkUsageLimit,
    handleUpgrade,
    isUpgradeOpen,
    setIsUpgradeOpen,
  } = useSubscription();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (checkUsageLimit("recap")) {
      setIsUpgradeOpen(true);
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/.netlify/functions/recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      if (!response.ok) throw new Error("Failed to generate recap");

      const data = await response.json();
      setSummary(data.recap);
      incrementUsage("recap");
    } catch (error) {
      console.error("Error generating recap:", error);
      alert("Failed to generate recap. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            RecapMe
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <span>
              {usageCounts.recap}/
              {maxUsage[userPlan] === Infinity ? "∞" : maxUsage[userPlan]} uses
            </span>
            {userPlan === "free" && (
              <Button
                onClick={() => setIsUpgradeOpen(true)}
                className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-700"
                variant="ghost"
              >
                <Crown className="h-4 w-4" />
                <span>Upgrade</span>
              </Button>
            )}
          </div>
        </div>

        <div className="bg-emerald-100 dark:bg-emerald-900 rounded-xl shadow-lg p-6 border border-emerald-300 dark:border-emerald-700">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your notes to generate a recap..."
            className="w-full h-64 mb-4 bg-white dark:bg-emerald-800 text-gray-900 dark:text-white border border-emerald-300 dark:border-emerald-600"
          />

          <Button
            onClick={handleSubmit}
            disabled={isProcessing || !input.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Generating Recap...
              </div>
            ) : (
              "Generate Recap"
            )}
          </Button>
        </div>
      </div>

      {summary && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-300 dark:border-gray-700 prose dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: summary }} />
        </div>
      )}

      <UpgradePopup
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
};

export default RecapMe;
