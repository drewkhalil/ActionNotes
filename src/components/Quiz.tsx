import React, { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Loader2, Eye, Crown } from "lucide-react";
import UpgradePopup from "./ui/UpgradePopup";
import { useSubscription } from "../contexts/SubscriptionContext";
import "./Quiz.css";
import OpenAI from "openai";

interface Question {
  id: number;
  type: "multiple-choice" | "short-answer" | "problem-solving";
  question: string;
  answer: string;
  solution?: string;
  options?: string[];
  isRevealed: boolean;
}

interface QuestionTypeCount {
  type: "multiple-choice" | "short-answer" | "problem-solving";
  count: number;
}

const API_ENDPOINT = import.meta.env.DEV
  ? "http://localhost:5173/api/azure"
  : "https://models.inference.ai.azure.com";

const quizOpenAI = new OpenAI({
  baseURL: API_ENDPOINT,
  apiKey: import.meta.env.VITE_OPENAI_QUIZ_API_KEY,
  dangerouslyAllowBrowser: true,
});

const Quiz: React.FC = () => {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionTypes, setQuestionTypes] = useState<QuestionTypeCount[]>([
    { type: "multiple-choice", count: 5 },
    { type: "short-answer", count: 3 },
    { type: "problem-solving", count: 2 },
  ]);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

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

  const handleQuestionTypeChange = (
    type: "multiple-choice" | "short-answer" | "problem-solving",
    value: number,
  ) => {
    setQuestionTypes((prev) =>
      prev.map((qt) =>
        qt.type === type ? { ...qt, count: Math.max(0, value) } : qt,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (checkUsageLimit()) {
      setIsUpgradeOpen(true);
      return;
    }

    setIsProcessing(true);
    try {
      const response = await quizOpenAI.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `As an expert test creator and educational specialist, your task is to generate comprehensive, engaging, and pedagogically sound quizzes based on the provided study guide. Follow these detailed guidelines:

1. Question Types and Distribution:
   - Generate exactly the specified number of each question type:
     * ${questionTypes.find((qt) => qt.type === "multiple-choice")?.count || 0} multiple-choice questions
     * ${questionTypes.find((qt) => qt.type === "short-answer")?.count || 0} short-answer questions
     * ${questionTypes.find((qt) => qt.type === "problem-solving")?.count || 0} problem-solving questions
   - Ensure questions progress from basic understanding to complex application
   - Base all questions directly on the provided study guide content

2. Multiple-Choice Questions:
   - Provide 4 distinct options (A, B, C, D)
   - Make distractors plausible but clearly incorrect
   - Avoid obvious patterns in correct answers
   - Include explanations for why each option is correct/incorrect
   - Use clear, unambiguous language

3. Short-Answer Questions:
   - Focus on key concepts and definitions from the study guide
   - Require concise but complete responses
   - Include expected key points in the answer
   - Provide a rubric or scoring criteria
   - Consider partial credit possibilities

4. Problem-Solving Questions:
   - Present real-world scenarios or applications from the study guide
   - Break down complex problems into steps
   - Include all necessary information
   - Provide detailed solutions with explanations
   - Consider alternative solution methods

5. Question Quality:
   - Use clear, precise language
   - Avoid ambiguous wording
   - Include relevant context from the study guide
   - Test higher-order thinking skills
   - Ensure questions are self-contained

6. Difficulty Levels:
   - Generate all questions at the "${difficulty}" difficulty level
   - For "easy", focus on basic recall and understanding
   - For "medium", include application and analysis
   - For "hard", emphasize synthesis, evaluation, and complex problem-solving
   - Mark questions with difficulty indicators
   - Balance challenge and accessibility

7. Answer Format:
   - Provide complete, detailed answers
   - Include step-by-step solutions where applicable
   - Explain the reasoning behind correct answers
   - Address common misconceptions
   - Include learning objectives

8. Additional Considerations:
   - Include estimated time per question
   - Provide topic tags for each question
   - Consider prerequisite knowledge
   - Include references to learning materials
   - Add hints for challenging questions

Return ONLY a JSON array of questions without any markdown formatting or code blocks. Each question should include:
- id (number)
- type (string: 'multiple-choice', 'short-answer', or 'problem-solving')
- question (string)
- answer (string)
- solution (string, optional)
- options (string[], for multiple-choice)
- difficulty (string: 'easy', 'medium', or 'hard')
- timeEstimate (number in minutes)
- topic (string)
- prerequisites (string[], optional)
- hints (string[], optional)`,
          },
          {
            role: "user",
            content: input,
          },
        ],
      });

      const content = response.choices[0].message.content || "[]";
      const cleanedContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      try {
        const rawQuestions = JSON.parse(cleanedContent);
        setQuestions(
          rawQuestions.map((q: any, idx: number) => ({
            ...q,
            id: idx + 1,
            isRevealed: false,
          })),
        );
        incrementUsage();
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        throw new Error(
          "Failed to parse quiz questions. The response format was invalid.",
        );
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      alert("Failed to generate quiz. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleAnswer = (questionId: number) => {
    setQuestions(
      questions.map((q: Question) =>
        q.id === questionId ? { ...q, isRevealed: !q.isRevealed } : q,
      ),
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            QuickQuizzes
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <span>
              {totalUsage}/
              {maxUsage[userPlan] === Infinity ? "∞" : maxUsage[userPlan]} uses
            </span>
            {userPlan === "free" && (
              <Button
                onClick={() => setIsUpgradeOpen(true)}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                variant="ghost"
              >
                <Crown className="h-4 w-4" />
                <span>Upgrade</span>
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your study guide here..."
              className="w-full h-64 mb-4 border-gray-300 focus:border-[#F87171] focus:ring-[#F87171] text-gray-900 dark:text-white"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {questionTypes.map((qt) => (
                <div key={qt.type} className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {qt.type
                      .split("-")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1),
                      )
                      .join(" ")}{" "}
                    Questions
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={qt.count}
                    onChange={(e) =>
                      handleQuestionTypeChange(
                        qt.type,
                        parseInt(e.target.value),
                      )
                    }
                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 focus:border-[#F87171] focus:ring-[#F87171] text-gray-900 dark:text-white"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col space-y-2 mb-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 focus:border-[#F87171] focus:ring-[#F87171] text-gray-900 dark:text-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <Button
              type="submit"
              disabled={isProcessing || !input.trim()}
              className={`quiz-button w-full ${
                isProcessing ? "opacity-50" : ""
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Generating Quiz...
                </div>
              ) : (
                "Generate Quiz"
              )}
            </Button>
          </div>
        </form>
      </div>

      {questions.length > 0 && (
        <div className="space-y-6">
          {questions.map((question) => (
            <div
              key={question.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Question {question.id}:{" "}
                  {question.type
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </h3>
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                  {question.question}
                </p>

                {question.type === "multiple-choice" && question.options && (
                  <div className="mt-4 space-y-2">
                    {question.options.map((option, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          id={`question-${question.id}-option-${idx}`}
                          className="quiz-radio"
                        />
                        <label
                          htmlFor={`question-${question.id}-option-${idx}`}
                          className="text-gray-700 dark:text-gray-300"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Answer:
                  </h4>
                  <Button
                    onClick={() => toggleAnswer(question.id)}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>{question.isRevealed ? "Hide" : "Show"} Answer</span>
                  </Button>
                </div>
                <div
                  className={`answer-container ${!question.isRevealed ? "answer-blur" : ""}`}
                >
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300">
                      {question.isRevealed ? question.answer : "BLUR"}
                    </p>
                    {question.solution && question.isRevealed && (
                      <div className="mt-4">
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                          Solution:
                        </h5>
                        <p className="text-gray-700 dark:text-gray-300">
                          {question.solution}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
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

export default Quiz;