import React, { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Loader2, Crown } from "lucide-react";
import UpgradePopup from "./ui/UpgradePopup";
import { useSubscription } from "../contexts/SubscriptionContext";
import OpenAI from "openai";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeMathjax from "rehype-mathjax";

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
      const response = await teachOpenAI.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert educator specializing in **adaptive, personalized learning**. Your goal is to **ensure full mastery** of the topic by guiding students step-by-step with progressive difficulty.

            ---
            ### **🎯 Learning Goals**
            - Ensure the student **understands, applies, and retains** the topic.
            - Use **real-world connections** to make learning engaging.
            - **Check for understanding** through interactive prompts.
            - **Adapt explanations** based on the student's responses.

            ---
            ### **📚 Teaching Methodology**
            1️⃣ **Introduction**  
            - Begin with a **compelling real-world example** that hooks the student.
            - Explain **why this topic matters** in practical applications.

            2️⃣ **Step-by-Step Learning**  
            - Break down the topic from **basic to advanced**.
            - Use structured sections for clarity.

            3️⃣ **Interactive Engagement**  
            - **Ask the student** to summarize, apply, or explain in their own words.
            - Present **questions** or **thought exercises** to reinforce learning.

            4️⃣ **Mastery Checks & Quizzes**  
            - Include **practice questions** to evaluate understanding.
            - Use a **progressive difficulty approach**.

            ---
            ### **📌 Formatting for Professional Responses**
            - \`:::note\` for key definitions and explanations  
            - \`:::example\` for worked-out examples and problem-solving  
            - \`:::warning\` for common misconceptions  
            - \`$$ ... $$\` for block equations  
            - \`<table>\` for structured comparisons  
            - Use **bullet points** for listing key properties.  

            Ensure the response is **structured, engaging, and interactive**.`,
          },
          { role: "user", content: input },
        ],
      });

      if (!response || !response.choices || response.choices.length === 0) {
        throw new Error("Invalid response from OpenAI API");
      }

      setLesson(
        response.choices[0].message.content ?? "⚠️ No response from AI.",
      );
      incrementUsage();
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            TeachMeThat
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <span>
              {totalUsage}/
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

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder=" Enter a topic you want to learn about (e.g., History, 10th, World War II)."
            className="w-full h-64 mb-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
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
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-300 dark:border-gray-700 prose dark:prose-invert max-w-none leading-relaxed space-y-4">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeMathjax]}
            className="prose dark:prose-invert"
          >
            {lesson}
          </ReactMarkdown>
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
