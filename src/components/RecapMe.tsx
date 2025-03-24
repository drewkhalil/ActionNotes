import React, { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Loader2, Crown } from "lucide-react";
import UpgradePopup from "./ui/UpgradePopup";
import { useSubscription } from "../contexts/SubscriptionContext";
import OpenAI from "openai";

const recapOpenAI = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: import.meta.env.VITE_OPENAI_RECAP_API_KEY, // Ensure this is set in .env
  dangerouslyAllowBrowser: true,
});

const RecapMe: React.FC = () => {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState("");

  const {
    userPlan,
    totalUsage,
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

    if (checkUsageLimit()) {
      setIsUpgradeOpen(true);
      return;
    }

    setIsProcessing(true);
    try {
      const response = await recapOpenAI.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that specializes in summarizing study materials in a structured, professional format. Your job is to condense key concepts while ensuring **clarity, organization, and reinforcement**.

            ### **📚 Recap Strategy**
            - **Concise Summary:** Provide a structured summary covering all key points.
            - **Main Concepts:** List fundamental ideas with bullet points.
            - **Key Terms & Definitions:** Use \`:::note\` for defining terms.
            - **Examples:** Provide \`:::example\` blocks for real-world applications.
            - **Common Misconceptions:** Highlight mistakes students often make using \`:::warning\`.
            - **Visual Organization:** Utilize tables (\`<table>\`) for structured comparisons.
            - **Final Takeaway:** End with a **brief reinforcement of key ideas**.

            ### **📌 Markdown Formatting for a Professional Recap**
            - \`:::note\` for key definitions and explanations
            - \`:::example\` for worked-out examples and problem-solving
            - \`:::warning\` for common misconceptions
            - \`$$ ... $$\` for block equations
            - \`<table>\` for structured comparisons
            - Use bullet points for listing key properties.

            Ensure the response is **clear, structured, and easy to absorb for students.**`,
          },
          { role: "user", content: input },
        ],
      });

      if (!response || !response.choices || response.choices.length === 0) {
        throw new Error("Invalid response from OpenAI API");
      }

      setSummary(
        response.choices[0].message.content ?? "⚠️ No response from AI.",
      );
      incrementUsage();
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
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

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your notes to generate a recap..."
            className="w-full h-64 mb-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
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
