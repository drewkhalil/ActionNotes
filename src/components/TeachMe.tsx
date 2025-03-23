import React, { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Loader2, Crown } from "lucide-react";
import UpgradePopup from "./ui/UpgradePopup";
import { useSubscription } from "../contexts/SubscriptionContext";
import UsageCounter from "./ui/UsageCounter";
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

    // Check usage limits
    if (checkUsageLimit("teach")) {
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
            content: `As an expert educational specialist and instructional designer, your task is to create comprehensive, engaging, and effective learning experiences. Follow these detailed guidelines:

1. Learning Objectives:
   - Define clear, measurable objectives
   - Align with educational standards
   - Consider different learning styles
   - Include prerequisite knowledge
   - Set appropriate difficulty level

2. Content Structure:
   - Begin with an engaging introduction
   - Break down complex concepts
   - Use progressive complexity
   - Include real-world examples
   - Provide clear transitions

3. Instructional Methods:
   - Use multiple teaching strategies
   - Incorporate active learning
   - Include visual aids
   - Provide hands-on examples
   - Encourage critical thinking

4. Engagement Elements:
   - Use interactive components
   - Include thought-provoking questions
   - Add relevant examples
   - Incorporate analogies
   - Use storytelling when appropriate

5. Assessment and Feedback:
   - Include formative assessments
   - Provide immediate feedback
   - Use self-check questions
   - Include practice exercises
   - Offer extension activities

6. Content Organization:
   - Use clear headings and subheadings
   - Include bullet points for key concepts
   - Number sequential steps
   - Highlight important terms
   - Use tables for structured data

7. Accessibility and Inclusivity:
   - Use clear, simple language
   - Provide multiple explanations
   - Include visual alternatives
   - Consider different learning needs
   - Offer additional resources

8. Additional Features:
   - Include key vocabulary
   - Provide study tips
   - Add real-world applications
   - Include troubleshooting guides
   - Offer further reading

Format your response with:
- Introduction
- Learning Objectives
- Key Concepts
- Detailed Explanations
- Examples and Applications
- Practice Questions
- Summary
- Additional Resources

Use markdown formatting for:
- Headers (##)
- Bullet points (-)
- Numbered lists (1.)
- Bold text (**)
- Italics (*)
- Code blocks (if needed)
- Tables (if needed)`,
          },
          {
            role: "user",
            content: input,
          },
        ],
      });

      // ✅ No `.ok`, `.status`, or `.json()`
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
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
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                variant="ghost"
              >
                <Crown className="h-4 w-4" />
                <span>Upgrade</span>
              </Button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a topic or paste content you want to learn about..."
            className="w-full h-64 mb-4"
          />
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || !input.trim()}
            className={`w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white ${
              isProcessing ? "opacity-50" : ""
            }`}
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 prose dark:prose-invert max-w-none">
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
