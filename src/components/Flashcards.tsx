import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Loader2, ChevronLeft, ChevronRight, RotateCcw, Shuffle } from "lucide-react";
import OpenAI from 'openai';
import './Flashcards.css';

interface Flashcard {
  question: string;
  answer: string;
  bulletPoints: string[];
}

const flashcardOpenAI = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: import.meta.env.VITE_OPENAI_FLASH_API_KEY,
  dangerouslyAllowBrowser: true
});

// Helper function to process Markdown text
const processMarkdown = (text: string): string => {
  return text
    .replace(/###\s*Flashcard\s*\d*:\s*/g, '') // Remove flashcard numbering
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert bold text
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Convert italic text
    .replace(/`(.*?)`/g, '<code>$1</code>') // Convert code text
    .replace(/The formula is:/g, '<div class="formula-title">The formula is:</div>') // Style formula title
    .replace(/([a-zA-Z])\s*=\s*([^•\n]+)/g, '<code>$1</code> = $2'); // Style formula variables
};

const Flashcards: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [cardCount, setCardCount] = useState(10);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputType, setInputType] = useState<'topic' | 'notes'>('topic');
  const [isShuffled, setIsShuffled] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (flashcards.length === 0) return;

      switch (e.key) {
        case 'ArrowLeft':
          previousCard();
          break;
        case 'ArrowRight':
          nextCard();
          break;
        case 'Enter':
          if (isFlipped) {
            nextCard();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, isFlipped, flashcards.length]);

  const generateFlashcards = async () => {
    if ((inputType === 'topic' && !topic.trim()) || (inputType === 'notes' && !notes.trim())) return;

    setIsLoading(true);
    try {
      const prompt = inputType === 'topic' 
        ? `Create ${cardCount} detailed flashcards for the topic: ${topic}`
        : `Create ${cardCount} detailed flashcards based on these notes:\n${notes}`;

      const response = await flashcardOpenAI.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `As an expert educational content creator, your task is to generate high-quality flashcards from the provided content. Follow these detailed guidelines:

1. Flashcard Structure:
   - Create clear, concise cards
   - Use simple, direct language
   - Keep questions focused
   - Provide complete answers
   - Include examples when relevant

2. Content Organization:
   - Group related concepts
   - Progress from basic to advanced
   - Include key definitions
   - Cover main concepts
   - Add practical examples

3. Question Types:
   - Definition cards
   - Concept cards
   - Process cards
   - Example cards
   - Application cards

4. Quality Guidelines:
   - One concept per card
   - Clear, unambiguous questions
   - Complete, accurate answers
   - Include context when needed
   - Use appropriate difficulty levels

5. Additional Features:
   - Add hints when helpful
   - Include related concepts
   - Provide mnemonics
   - Add visual cues
   - Include practice tips

Return ONLY a JSON array of flashcards without any markdown formatting or code blocks. Each flashcard should include:
- id (number)
- question (string)
- answer (string)
- hint (string, optional)
- category (string)
- difficulty (string: 'easy', 'medium', or 'hard')
- relatedCards (number[], optional)`
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const content = response.choices[0].message.content || '[]';
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      try {
        const rawCards = JSON.parse(cleanedContent);
        setFlashcards(rawCards.map((card: any, idx: number) => ({
          ...card,
          id: idx + 1,
          isFlipped: false
        })));
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsShuffled(false);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        throw new Error('Failed to parse flashcards. The response format was invalid.');
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      alert('Failed to generate flashcards. Please try again.');
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

  const resetCards = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const shuffleCards = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setIsShuffled(true);
  };

  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Flashcards</h2>
        
        <div className="mb-4 flex gap-4">
          <Button
            onClick={() => setInputType('topic')}
            variant={inputType === 'topic' ? 'primary' : 'outline'}
            className="flex-1"
          >
            Topic
          </Button>
          <Button
            onClick={() => setInputType('notes')}
            variant={inputType === 'notes' ? 'primary' : 'outline'}
            className="flex-1"
          >
            Notes
          </Button>
        </div>

        <div className="space-y-4">
          {inputType === 'topic' ? (
            <Input
              type="text"
              value={topic}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
              placeholder="Enter a topic to generate flashcards (e.g., Photosynthesis, World War II, Calculus)"
              className="w-full"
            />
          ) : (
            <Textarea
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              placeholder="Enter your notes here to generate flashcards..."
              className="w-full h-32 resize-none"
            />
          )}

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Number of cards:
            </label>
            <select
              value={cardCount}
              onChange={(e) => setCardCount(Number(e.target.value))}
              className="border rounded-md px-3 py-2 bg-white dark:bg-gray-800"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
              <option value="25">25</option>
              <option value="30">30</option>
            </select>

            <Button
              onClick={generateFlashcards}
              disabled={isLoading || (inputType === 'topic' ? !topic.trim() : !notes.trim())}
              className="bg-orange-500 hover:bg-orange-600 text-white ml-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Flashcards'
              )}
            </Button>
          </div>
        </div>
      </div>

      {flashcards.length > 0 && (
        <div className="space-y-6">
          <div className="progress-bar">
            <div 
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flashcard-container">
            <div
              className={`flashcard ${isFlipped ? 'rotate-y-180' : ''}`}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {/* Front of card */}
              <div className="flashcard-content">
                <div 
                  className="question-text"
                  dangerouslySetInnerHTML={{ __html: flashcards[currentIndex].question }}
                />
              </div>
              
              {/* Back of card */}
              <div className="flashcard-content back">
                <div 
                  className="answer-text"
                  dangerouslySetInnerHTML={{ __html: flashcards[currentIndex].answer }}
                />
                <ul className="bullet-points">
                  {flashcards[currentIndex].bulletPoints.map((point, index) => (
                    <li 
                      key={index}
                      dangerouslySetInnerHTML={{ __html: point }}
                    />
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="navigation-buttons">
            <Button
              onClick={previousCard}
              disabled={currentIndex === 0}
              className="nav-button"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <div className="flex items-center gap-4">
              <span className="progress-text">
                Card {currentIndex + 1} of {flashcards.length}
              </span>
              <Button
                onClick={shuffleCards}
                className="shuffle-button"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Shuffle
              </Button>
              <Button
                onClick={resetCards}
                variant="outline"
                className="text-orange-500 hover:text-orange-600"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
            <Button
              onClick={nextCard}
              disabled={currentIndex === flashcards.length - 1}
              className="nav-button"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            <p>Keyboard shortcuts:</p>
            <p>← → : Navigate | Enter : Next (when flipped)</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Flashcards; 