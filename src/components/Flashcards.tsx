import React, { useState, useEffect } from "react";
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
import { useSubscription } from "../contexts/SubscriptionContext";
import UpgradePopup from "./ui/UpgradePopup";
import OpenAI from "openai";

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
    totalUsage,
    maxUsage,
    incrementUsage,
    checkUsageLimit,
    handleUpgrade,
    isUpgradeOpen,
    setIsUpgradeOpen,
  } = useSubscription();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (flashcards.length === 0) return;

      switch (e.key) {
        case "ArrowLeft":
          previousCard();
          break;
        case "ArrowRight":
          nextCard();
          break;
        case "Enter":
          if (isFlipped) {
            nextCard();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentIndex, isFlipped, flashcards.length]);

  const generateFlashcards = async () => {
    if (
      (inputType === "topic" && !topic.trim()) ||
      (inputType === "notes" && !notes.trim())
    )
      return;

    // ✅ Check usage limit
    if (checkUsageLimit()) {
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
      setFlashcards(JSON.parse(content));

      // ✅ Increment usage after successful flashcard generation
      incrementUsage();

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

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const previousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
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
              {totalUsage}/
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

        {/* ✅ Input Fields for Topic and Notes */}
        <div className="mb-4 flex gap-4">
          <Button
            onClick={() => setInputType("topic")}
            variant={inputType === "topic" ? "primary" : "outline"}
            className="flex-1"
          >
            Topic
          </Button>
          <Button
            onClick={() => setInputType("notes")}
            variant={inputType === "notes" ? "primary" : "outline"}
            className="flex-1"
          >
            Notes
          </Button>
        </div>

        <div className="space-y-4">
          {inputType === "topic" ? (
            <Input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic..."
              className="w-full"
            />
          ) : (
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter your notes..."
              className="w-full h-32 resize-none"
            />
          )}
          <Button
            onClick={generateFlashcards}
            disabled={
              isLoading ||
              (inputType === "topic" ? !topic.trim() : !notes.trim())
            }
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Flashcards"
            )}
          </Button>
        </div>
      </div>

      {/* ✅ Flashcards Display */}
      {flashcards.length > 0 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-lg font-semibold mb-2">
              {flashcards[currentIndex].question}
            </div>
            {isFlipped && (
              <div className="text-gray-700 dark:text-gray-300">
                {flashcards[currentIndex].answer}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button onClick={previousCard} disabled={currentIndex === 0}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button onClick={() => setIsFlipped(!isFlipped)}>Flip</Button>
            <Button
              onClick={nextCard}
              disabled={currentIndex === flashcards.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ✅ Upgrade Popup */}
      <UpgradePopup
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
};

export default Flashcards;
