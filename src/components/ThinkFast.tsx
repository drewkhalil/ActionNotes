import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
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
import './ThinkFast.css';

interface Flashcard {
  term: string;
  definition: string;
}

const flashcardOpenAI = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: import.meta.env.VITE_OPENAI_FLASH_API_KEY,
  dangerouslyAllowBrowser: true,
});

const ThinkFast: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputType, setInputType] = useState<"bullets" | "definition">("bullets");
  const [isShuffled, setIsShuffled] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const {
    userPlan,
    totalUsage,
    maxUsage,
    incrementUsage,
    checkUsageLimit,
    handleUpgrade,
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
        case " ":
          e.preventDefault();
          handleFlip();
          break;
        case "Enter":
          if (isFlipped) {
            setIsFlipped(false);
          } else {
            nextCard();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentIndex, isFlipped, flashcards.length]);

  const generateFlashcards = async () => {
    if (!inputText.trim()) return;

    if (checkUsageLimit()) {
      setIsUpgradeOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const lines = inputText.split('\n').filter(line => line.trim() !== '');
      const prompt =
        inputType === "definition"
          ? `Create one concise flashcard per line with the original term (which may be in Spanish) and a one-line English definition for the following terms:\n${lines.join('\n')}`
          : `Create one detailed flashcard per line with the original term (which may be in Spanish) and multiple bullet points in English for the following terms:\n${lines.join('\n')}`;

      const response = await flashcardOpenAI.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Generate structured flashcards based on the input. Keep the original term (which may be in Spanish) as provided and provide definitions or explanations in English. For definition mode, use 'Term: [original term]\nDefinition: [one-line English definition]\n---'. For bullet mode, use 'Term: [original term]\nDefinition: [multiple bullet points in English]\n---' with a separator between cards."
          },
          { role: "user", content: prompt },
        ],
      });

      const text = response.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error("Empty response from OpenAI API.");
      }

      console.log("Raw OpenAI Response:", text);

      const flashcardsText = text.split('---').filter(card => card.trim() !== '');
      const formattedFlashcards: Flashcard[] = flashcardsText.map((card, index) => {
        const lines = card.split('\n').filter(line => line.trim() !== '');
        let term = '';
        let definition = '';

        lines.forEach(line => {
          if (line.startsWith("Term:")) {
            term = line.replace("Term:", "").trim();
          } else if (line.startsWith("Definition:")) {
            definition = line.replace("Definition:", "").trim();
          } else if (definition) {
            definition += '\n' + line.trim();
          }
        });

        return { term, definition };
      }).filter(card => card.term && card.definition);

      console.log("Formatted Flashcards:", formattedFlashcards);
      setFlashcards(formattedFlashcards);
      incrementUsage();
      setCurrentIndex(0);
      setIsFlipped(false);
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

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            ThinkFast
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

        <div className="mb-4 flex gap-4">
          <Button
            onClick={() => setInputType("bullets")}
            variant={inputType === "bullets" ? "primary" : "outline"}
            className="flex-1"
          >
            Explained Bullets
          </Button>
          <Button
            onClick={() => setInputType("definition")}
            variant={inputType === "definition" ? "primary" : "outline"}
            className="flex-1"
          >
            Term & Definition
          </Button>
        </div>

        <div className="space-y-4">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={inputType === "bullets" 
              ? "Enter your notes here..." 
              : "Enter terms one per line..."}
            className="w-full h-32 resize-none"
          />
          <Button
            onClick={generateFlashcards}
            disabled={isLoading || !inputText.trim()}
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

      {flashcards.length > 0 ? (
        <div className="space-y-0">
          <div className="flashcard-container">
            <div className="flashcard" onClick={handleFlip}>
              <div className={`card ${isFlipped ? 'flipped' : ''}`}>
                <div className="front flashcard-content">
                  {inputType === "definition" ? (
                    <p className="question-text">{flashcards[currentIndex].term}</p>
                  ) : (
                    <div className="question-text">
                      <p>{flashcards[currentIndex].term}</p>
                      <ul className="bullet-points">
                        {flashcards[currentIndex].definition.split("\n").map((line, idx) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="back flashcard-content">
                  <p className="answer-text">{flashcards[currentIndex].definition}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center mt-0">
            <div className="progress-text">
              Card {currentIndex + 1} of {flashcards.length}
            </div>
            <div className="flex justify-between navigation-buttons w-full mt-0">
              <Button onClick={previousCard} disabled={currentIndex === 0} className="nav-button">
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button onClick={handleFlip} className="nav-button">Flip</Button>
              <Button
                onClick={nextCard}
                disabled={currentIndex === flashcards.length - 1}
                className="nav-button"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500">
          No flashcards generated. Please click "Generate Flashcards" to create some.
        </p>
      )}

      <UpgradePopup
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
};

export default ThinkFast;