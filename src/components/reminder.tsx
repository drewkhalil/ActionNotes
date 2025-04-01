import React, { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input"; 
import { Loader2, Crown, Calendar } from "lucide-react";
import UpgradePopup from "./ui/UpgradePopup";
import { useSubscription } from "../contexts/SubscriptionContext";
import OpenAI from "openai";
import { generateAndSavePDF } from "../lib/pdfUtils";
import { supabase } from "../lib/supabase";
import ReactMarkdown from "react-markdown";

const reminderOpenAI = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: import.meta.env.VITE_OPENAI_REMINDER_API_KEY,
  dangerouslyAllowBrowser: true,
});

const ReMinder: React.FC = () => {
  const [testDate, setTestDate] = useState("");
  const [topic, setTopic] = useState("");
  const [minutesPerDay, setMinutesPerDay] = useState(15); // Changed default to 15 minutes
  const [isProcessing, setIsProcessing] = useState(false);
  const [studyPlan, setStudyPlan] = useState("");
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const {
    userPlan,
    totalUsage,
    maxUsage,
    incrementUsage,
    checkUsageLimit,
    handleUpgrade,
  } = useSubscription();

  const generateStudyPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testDate) return;

    if (checkUsageLimit()) {
      setIsUpgradeOpen(true);
      return;
    }

    setIsProcessing(true);
    try {
      const today = new Date();
      const test = new Date(testDate);
      if (test <= today) {
        throw new Error("Test date must be in the future.");
      }

      const daysRemaining = Math.ceil((test.getTime() - today.getTime()) / (1000 * 3600 * 24));
      const hoursPerDay = minutesPerDay / 60; // Convert minutes to hours for the prompt
      const prompt = `Generate a detailed study plan for a ${topic || "test"} in ${daysRemaining} days, assuming ${hoursPerDay} hours per day. Break it into daily tasks, including topics to review, practice problems, and milestones. Use a structured format with dates and clear instructions.`;

      const response = await reminderOpenAI.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert study planner. Create a structured, realistic study plan based on the user's input. Include:
            - Daily tasks with specific topics or activities.
            - Milestones (e.g., weekly reviews) every 7 days.
            - Breaks or rest days if the duration exceeds 7 days.
            - Use bullet points for daily tasks and a table for milestones.
            - Format with headers (e.g., "## Day 1") and clear dates.`
          },
          { role: "user", content: prompt },
        ],
      });

      const plan = response.choices[0].message.content || "No plan generated.";
      setStudyPlan(plan);
      incrementUsage();

      // Save to PDF and history
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (userId) {
        await generateAndSavePDF(userId, {
          title: `ReMinder Plan - ${topic || "Untitled"} (${new Date(testDate).toLocaleDateString()})`,
          type: 'reminder',
          content: plan,
          metadata: {
            date: new Date().toLocaleDateString(),
            topic: topic || "General Study",
            testDate: new Date(testDate).toLocaleDateString(),
          },
        });
      }
    } catch (error) {
      console.error("Error generating study plan:", error);
      alert(`Failed to generate study plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            ReMinder
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <span>
              {totalUsage}/
              {maxUsage[userPlan] === Infinity ? "∞" : maxUsage[userPlan]} uses
            </span>
            {userPlan === "free" && (
              <Button
                onClick={() => setIsUpgradeOpen(true)}
                className="flex items-center space-x-1 text-teal-600 hover:text-teal-700"
                variant="ghost"
              >
                <Crown className="h-4 w-4" />
                <span>Upgrade</span>
              </Button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
          <form onSubmit={generateStudyPlan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Test Date</label>
              <Input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="mt-1 w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 focus:border-teal-600 focus:ring-teal-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Topic/Study Guide</label>
              <Textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Math Exam or list of topics..."
                className="mt-1 w-full h-24 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 focus:border-teal-600 focus:ring-teal-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Minutes Per Day</label>
              <Input
                type="number"
                value={minutesPerDay}
                onChange={(e) => setMinutesPerDay(Math.max(15, parseInt(e.target.value) || 15))} // Minimum 15 minutes, default 15
                min="15"
                max="480" // 8 hours in minutes
                step="5" // Increment by 5 minutes
                className="mt-1 w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 focus:border-teal-600 focus:ring-teal-600"
              />
            </div>
            <Button
              type="submit"
              disabled={isProcessing || !testDate}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Generating Plan...
                </div>
              ) : (
                "Generate Study Plan"
              )}
            </Button>
          </form>
        </div>
      </div>

      {studyPlan && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-300 dark:border-gray-700 prose dark:prose-invert max-w-none leading-relaxed space-y-4">
          <ReactMarkdown className="prose dark:prose-invert">{studyPlan}</ReactMarkdown>
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

export default ReMinder;