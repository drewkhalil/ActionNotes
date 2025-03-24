import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  Crown,
} from "lucide-react";
import { useSubscription } from "../contexts/SubscriptionContext"; // ✅ Add this
import UpgradePopup from "./ui/UpgradePopup"; // ✅ Add this
import OpenAI from "openai";
import "./Flashcards.css";

interface Flashcard {
  question: string;
  answer: string;
  bulletPoints: string[];
}

const flashcardOpenAI = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: import.meta.env.VITE_OPENAI_FLASH_API_KEY,
  dangerouslyAllowBrowser: true,
});

const Flashcards: React.FC = () => {
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [cardCount, setCardCount] = useState(10);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputType, setInputType] = useState<"topic" | "notes">("topic");
  const [isShuffled, setIsShuffled] = useState(false);

  // ✅ Import subscription context for usage limits
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

  const generateFlashcards = async () => {
    if (
      (inputType === "topic" && !topic.trim()) ||
      (inputType === "notes" && !notes.trim())
    )
      return;

    // ✅ Check usage limit
    if (checkUsageLimit("flashcards")) {
      setIsUpgradeOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const prompt =
        inputType === "topic"
          ? `Create ${cardCount} detailed flashcards for the topic: ${topic}`
          : `Create ${cardCount} detailed flashcards based on these notes:\n${notes}`;

      const response = await flashcardOpenAI.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `As an expert educational content creator, generate structured flashcards...`,
          },
          { role: "user", content: prompt },
        ],
      });

      const content = response.choices[0].message.content || "[]";
      const cleanedContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      setFlashcards(JSON.parse(cleanedContent));

      // ✅ Increment usage after successful flashcard generation
      incrementUsage("flashcards");

      setCurrentIndex(0);
      setIsFlipped(false);
      setIsShuffled(false);
    } catch (error) {
      console.error("Error generating flashcards:", error);
      alert("Failed to generate flashcards. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Flashcards
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <span>
              {usageCounts.flashcards}/
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

        {/* UI Components */}
      </div>

      {/* Upgrade Popup */}
      <UpgradePopup
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
};

export default Flashcards;
