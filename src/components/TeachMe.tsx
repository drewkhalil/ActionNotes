import React, { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Loader2, Crown } from "lucide-react";
import UpgradePopup from "./ui/UpgradePopup";
import { useSubscription } from "../contexts/SubscriptionContext";
import OpenAI from "openai";

const teachOpenAI = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: import.meta.env.VITE_OPENAI_TEACH_API_KEY,
  dangerouslyAllowBrowser: true,
});

const TeachMe: React.FC = () => {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lesson, setLesson] = useState("");

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

    if (checkUsageLimit("teach")) {
      setIsUpgradeOpen(true);
      return;
    }

    setIsProcessing(true);
    try {
      const response = await teachOpenAI.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: input }],
      });

      if (!response || !response.choices || response.choices.length === 0) {
        throw new Error("Invalid response from OpenAI API");
      }

      setLesson(
        response.choices[0].message.content ?? "⚠️ No response from AI.",
      );
      incrementUsage("teach");
    } catch (error) {
      console.error("Error generating lesson:", error);
      alert("Failed to generate lesson. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            TeachMeThat
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <span>
              {usageCounts.teach}/
              {maxUsage[userPlan] === Infinity ? "∞" : maxUsage[userPlan]} uses
            </span>
            {userPlan === "free" && (
              <Button
                onClick={() => setIsUpgradeOpen(true)}
                className="flex items-center space-x-1 text-purple-600 hover:text-purple-700"
                variant="ghost"
              >
                <Crown className="h-4 w-4" />
                <span>Upgrade</span>
              </Button>
            )}
          </div>
        </div>

        <div className="bg-purple-100 dark:bg-purple-900 rounded-xl shadow-lg p-6 border border-purple-300 dark:border-purple-700">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your notes to generate a recap..."
            className="w-full h-64 mb-4 bg-white dark:bg-emerald-800 text-gray-900 dark:text-white"
          />

          />
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || !input.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Generating Lesson...
              </div>
            ) : (
              "Generate Lesson"
            )}
          </Button>
        </div>
      </div>

      {lesson && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-300 dark:border-gray-700 prose dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: lesson }} />
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

export default TeachMe;
