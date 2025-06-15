import React, { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Loader2, Crown, Brain, Sparkles, CheckCircle } from "lucide-react";
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;


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
      
    } catch (error) {
      console.error("Error generating lesson:", error);
      alert("Failed to generate lesson. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">

      <main className="container px-4 py-6 md:px-6 md:py-8">
        {/* Tool Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#E4D7FF]">
            <Brain className="h-8 w-8 text-[#1E3A8A]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">TeachMeThat</h1>
            <p className="text-gray-600">Transform any topic into an interactive learning experience</p>
          </div>
        </div>

        {/* Topic Input Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What would you like to learn today?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Enter a topic, concept or problem you want to learn (e.g., 'Quantum Physics for Beginners', 'How to solve quadratic equations', 'The history of Renaissance art')"
                className="min-h-[100px]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={isProcessing || !input.trim()}
                  className="bg-[#1E3A8A] hover:bg-[#152C6B]"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-pulse" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      <span>Teach Me</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lesson Output */}
        {lesson && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Lesson on {input || "Your Topic"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none leading-relaxed space-y-4">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeMathjax]}
                  className="prose dark:prose-invert"
                >
                  {lesson}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* How It Works Section */}
        {!lesson && !isProcessing && (
          <div className="mt-12 space-y-6">
            <h2 className="text-xl font-semibold">How TeachMeThat Works</h2>

            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E4D7FF]">
                    <Brain className="h-6 w-6 text-[#1E3A8A]" />
                  </div>
                  <h3 className="mb-2 font-semibold">1. Enter Any Topic</h3>
                  <p className="text-sm text-gray-600">
                    Type in any subject or concept you want to learn about, from basic to advanced.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E4D7FF]">
                    <Sparkles className="h-6 w-6 text-[#1E3A8A]" />
                  </div>
                  <h3 className="mb-2 font-semibold">2. AI Creates Content</h3>
                  <p className="text-sm text-gray-600">
                    Our AI generates a comprehensive learning experience tailored to your needs.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E4D7FF]">
                    <CheckCircle className="h-6 w-6 text-[#1E3A8A]" />
                  </div>
                  <h3 className="mb-2 font-semibold">3. Learn Interactively</h3>
                  <p className="text-sm text-gray-600">
                    Engage with lessons, interactive elements, quizzes, and additional resources.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeachMe;