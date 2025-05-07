"use client"

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  BookOpen, Plus, Sparkles, CheckCircle, XCircle, HelpCircle, Edit, Copy, Trash2,
  ChevronLeft, ChevronRight, Clock, RefreshCw, Eye, EyeOff, ArrowRight, Loader2,
  Bookmark,
} from "lucide-react";
import OpenAI from "openai";
import { supabase } from '../lib/supabase';
import './ThinkFast.css';
import { AppUser } from '../types/types';

interface Flashcard {
  id?: string;
  term: string;
  definition: string;
  status: "learning" | "reviewing" | "mastered";
  tags: string[];
  title: string;
  created_at?: string;
}

interface ThinkFastProps {
  user: AppUser | null;
  projectId?: string; // Optional projectId prop to link flashcards to a project
}

const flashcardOpenAI = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: import.meta.env.VITE_OPENAI_FLASH_API_KEY,
  dangerouslyAllowBrowser: true,
});

export default function ThinkFast({ user, projectId }: ThinkFastProps) {
  const [topic, setTopic] = useState("");
  const [inputText, setInputText] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [depthLevel, setDepthLevel] = useState<"short" | "moderate" | "detailed">("moderate");
  const [cardFormat, setCardFormat] = useState<"question-answer" | "term-definition" | "concept-example">("question-answer");
  const [isShuffled, setIsShuffled] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const [studyMode, setStudyMode] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [sortBy, setSortBy] = useState<"term" | "status" | "created_at">("term"); // New state for sorting
  const [error, setError] = useState<string | null>(null);

  // Load flashcards from Supabase on mount, filtered by projectId if provided
  useEffect(() => {
    const fetchFlashcards = async () => {
      if (!user) return;

      try {
        let query = supabase
          .from('flashcards')
          .select('*')
          .eq('user_id', user.id);

        // If projectId is provided, filter by projectId
        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        const { data, error } = await query;

        if (error) throw error;

        console.log("Fetched flashcards from Supabase:", data);
        setFlashcards(data || []);
      } catch (err: any) {
        console.error('Error fetching flashcards:', err);
        setError('Failed to load flashcards. Please try again.');
      }
    };

    fetchFlashcards();
  }, [user, projectId]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (flashcards.length === 0) return;

      switch (event.key) {
        case "ArrowLeft":
          previousCard();
          break;
        case "ArrowRight":
          nextCard();
          break;
        case " ":
          event.preventDefault();
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

  // Extract unique topics from flashcards
  const uniqueTopics = Array.from(new Set(flashcards.map(card => card.title))).sort();

  const generateFlashcards = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }

    if (!user) {
      setError("User not found. Please log in.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formatPrompt = cardFormat === "question-answer"
        ? "Question → Answer"
        : cardFormat === "term-definition"
        ? "Term → Definition"
        : "Concept → Example";

      const prompt = inputText.trim()
        ? `Generate an appropriate number of flashcards on the topic "${topic}" with the following study material:\n${inputText}\nDepth Level: ${depthLevel}\nFormat: ${formatPrompt}`
        : `Generate an appropriate number of flashcards on the topic "${topic}".\nDepth Level: ${depthLevel}\nFormat: ${formatPrompt}`;

      const response = await flashcardOpenAI.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Generate structured flashcards based on the input. For each flashcard, use the format '${cardFormat === "concept-example" ? "Concept: [concept]\nExample: [example]" : "Term: [term]\nDefinition: [definition]"}' with a separator '---' between cards. Adjust the depth and length of the content based on the Depth Level (${depthLevel}): 'short' for concise facts, 'moderate' for balanced explanations, 'detailed' for in-depth content. Decide the number of flashcards based on the complexity of the topic and study material.`,
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
      const formattedFlashcards: Flashcard[] = flashcardsText.map((card) => {
        const lines = card.split('\n').filter(line => line.trim() !== '');
        let term = '';
        let definition = '';

        lines.forEach(line => {
          if (cardFormat === "concept-example") {
            if (line.startsWith("Concept:")) {
              term = line.replace("Concept:", "").trim();
            } else if (line.startsWith("Example:")) {
              definition = line.replace("Example:", "").trim();
            } else if (definition) {
              definition += '\n' + line.trim();
            }
          } else {
            if (line.startsWith("Term:")) {
              term = line.replace("Term:", "").trim();
            } else if (line.startsWith("Definition:")) {
              definition = line.replace("Definition:", "").trim();
            } else if (definition) {
              definition += '\n' + line.trim();
            }
          }
        });

        return {
          term,
          definition,
          status: "learning" as "learning" | "reviewing" | "mastered",
          tags: ["generated"],
          title: topic,
          created_at: new Date().toISOString(),
        };
      }).filter(card => card.term && card.definition);

      console.log("Formatted Flashcards:", formattedFlashcards);

      // Save to Supabase
      let newFlashcards: Flashcard[] = formattedFlashcards;
      if (user) {
        const flashcardsToInsert = formattedFlashcards.map(card => ({
          user_id: user.id,
          project_id: projectId || null, // Include projectId if provided
          type: 'flashcard',
          title: topic,
          term: card.term,
          definition: card.definition,
          status: card.status,
          tags: card.tags,
          created_at: card.created_at,
        }));

        const { data, error } = await supabase
          .from('flashcards')
          .insert(flashcardsToInsert)
          .select();

        if (error) {
          console.error("Supabase insert error:", error);
          setError("Failed to save flashcards to database. Using local data instead.");
        } else {
          console.log("Supabase insert successful, data:", data);
          newFlashcards = data || formattedFlashcards;
        }
      }

      // Update state with either Supabase data or local data
      console.log("Setting flashcards state:", newFlashcards);
      setFlashcards(newFlashcards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setActiveTab("study");
    } catch (err: any) {
      console.error("Error generating flashcards:", err);
      setError("Failed to generate flashcards. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const nextCard = () => {
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setCurrentIndex(0);
    }
  };

  const previousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    } else {
      setCurrentIndex(filteredCards.length - 1);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const shuffleCards = () => {
    const shuffled = [...filteredCards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsShuffled(true);
  };

  // Apply sorting to filteredCards
  const filteredCards = flashcards
    .filter((card) => {
      if (selectedTopic !== "all" && card.title !== selectedTopic) return false;
      if (studyMode !== "all" && card.status !== studyMode) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "term") return a.term.localeCompare(b.term);
      if (sortBy === "status") {
        const order: Record<string, number> = { learning: 0, reviewing: 1, mastered: 2 };
        return order[a.status] - order[b.status];
      }
      if (sortBy === "created_at") {
        if (!a.created_at || !b.created_at) return 0;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });

  const updateCardStatus = async (index: number, newStatus: "learning" | "reviewing" | "mastered") => {
    setError(null);
    const updatedFlashcards = [...flashcards];
    const globalIndex = flashcards.findIndex(card => card === filteredCards[index]);
    updatedFlashcards[globalIndex] = { ...updatedFlashcards[globalIndex], status: newStatus };
    setFlashcards(updatedFlashcards);

    if (user && updatedFlashcards[globalIndex].id) {
      try {
        const { error } = await supabase
          .from('flashcards')
          .update({ status: newStatus })
          .eq('id', updatedFlashcards[globalIndex].id);

        if (error) throw error;
      } catch (err: any) {
        console.error("Error updating flashcard status:", err);
        setError("Failed to update flashcard status. Please try again.");
      }
    }
  };

  const updateCard = async (index: number, updatedCard: Flashcard) => {
    setError(null);
    const updatedFlashcards = [...flashcards];
    const globalIndex = flashcards.findIndex(card => card === filteredCards[index]);
    updatedFlashcards[globalIndex] = updatedCard;
    setFlashcards(updatedFlashcards);

    if (user && updatedCard.id) {
      try {
        const { error } = await supabase
          .from('flashcards')
          .update({
            term: updatedCard.term,
            definition: updatedCard.definition,
            tags: updatedCard.tags,
          })
          .eq('id', updatedCard.id);

        if (error) throw error;
      } catch (err: any) {
        console.error("Error updating flashcard:", err);
        setError("Failed to update flashcard. Please try again.");
      }
    }
  };

  const deleteCard = async (index: number) => {
    setError(null);
    const globalIndex = flashcards.findIndex(card => card === filteredCards[index]);
    const cardId = flashcards[globalIndex].id;
    const updatedFlashcards = flashcards.filter((_, i) => i !== globalIndex);
    setFlashcards(updatedFlashcards);
    if (currentIndex >= filteredCards.length - 1) {
      setCurrentIndex(Math.max(0, filteredCards.length - 2));
    }

    if (user && cardId) {
      try {
        const { error } = await supabase
          .from('flashcards')
          .delete()
          .eq('id', cardId);

        if (error) throw error;
      } catch (err: any) {
        console.error("Error deleting flashcard:", err);
        setError("Failed to delete flashcard. Please try again.");
      }
    }
  };

  const deleteDeck = async () => {
    setError(null);
    if (!user) {
      setError("User not found. Please log in.");
      return;
    }

    try {
      let query = supabase
        .from('flashcards')
        .delete()
        .eq('user_id', user.id);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { error } = await query;

      if (error) throw error;

      setFlashcards([]);
      setCurrentIndex(0);
      setActiveTab("create");
      setSelectedTopic("all");
    } catch (err: any) {
      console.error("Error deleting deck:", err);
      setError("Failed to delete deck. Please try again.");
    }
  };

  const addTag = async (index: number, tag: string) => {
    setError(null);
    const updatedFlashcards = [...flashcards];
    const globalIndex = flashcards.findIndex(card => card === filteredCards[index]);
    updatedFlashcards[globalIndex].tags.push(tag);
    setFlashcards(updatedFlashcards);

    if (user && updatedFlashcards[globalIndex].id) {
      try {
        const { error } = await supabase
          .from('flashcards')
          .update({ tags: updatedFlashcards[globalIndex].tags })
          .eq('id', updatedFlashcards[globalIndex].id);

        if (error) throw error;
      } catch (err: any) {
        console.error("Error adding tag:", err);
        setError("Failed to add tag. Please try again.");
      }
    }
  };

  const removeTag = async (index: number, tagIndex: number) => {
    setError(null);
    const updatedFlashcards = [...flashcards];
    const globalIndex = flashcards.findIndex(card => card === filteredCards[index]);
    updatedFlashcards[globalIndex].tags.splice(tagIndex, 1);
    setFlashcards(updatedFlashcards);

    if (user && updatedFlashcards[globalIndex].id) {
      try {
        const { error } = await supabase
          .from('flashcards')
          .update({ tags: updatedFlashcards[globalIndex].tags })
          .eq('id', updatedFlashcards[globalIndex].id);

        if (error) throw error;
      } catch (err: any) {
        console.error("Error removing tag:", err);
        setError("Failed to remove tag. Please try again.");
      }
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card className="sleek-card">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Please log in to use ThinkFast.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {error && (
        <div className="container mx-auto px-4 py-2">
          <span className="text-red-600 text-sm font-medium bg-red-100 px-3 py-1 rounded-full">
            {error}
          </span>
        </div>
      )}
      <main className="container px-4 py-4 md:px-6 md:py-6">
        {/* Tool Header with Logo */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#FFD8A8]">
            <Bookmark className="h-8 w-8 text-[#1E6A8A]" />
          </div>
          <h1 className="text-2xl font-bold md:text-3xl">ThinkFast</h1>
        </div>

        {/* Flashcard Tabs */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="mb-3 w-full justify-start bg-transparent p-0 border-b border-gray-200">
            <TabsTrigger
              value="create"
              className="px-3 py-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-[#1E6A8A] data-[state=active]:text-[#1E6A8A]"
            >
              Create Flashcards
            </TabsTrigger>
            <TabsTrigger
              value="study"
              className="px-3 py-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-[#1E6A8A] data-[state=active]:text-[#1E6A8A] disabled:opacity-50"
              disabled={flashcards.length === 0}
            >
              Study
            </TabsTrigger>
            <TabsTrigger
              value="manage"
              className="px-3 py-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-[#1E6A8A] data-[state=active]:text-[#1E6A8A] disabled:opacity-50"
              disabled={flashcards.length === 0}
            >
              Manage Deck
            </TabsTrigger>
          </TabsList>

          {/* Create Flashcards Tab */}
          <TabsContent value="create" className="mt-0">
            <Card className="sleek-card">
              <CardHeader>
                <CardTitle className="text-[#1E6A8A]">Create New Flashcards</CardTitle>
                <CardDescription>Enter a topic or paste your study material to generate AI flashcards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Topic</label>
                  <Input
                    placeholder="E.g., Biology Concepts, Spanish Vocabulary, Historical Events"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Study Material (Optional)</label>
                  <Textarea
                    placeholder="Paste your notes, textbook excerpts, or any content you want to convert to flashcards"
                    className="min-h-[120px] rounded-lg"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Flashcard Options</label>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Depth Level</label>
                      <Select value={depthLevel} onValueChange={(value: "short" | "moderate" | "detailed") => setDepthLevel(value)}>
                        <SelectTrigger className="rounded-lg">
                          <SelectValue placeholder="Select depth level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short & Simple</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="detailed">Detailed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Card Format</label>
                      <Select value={cardFormat} onValueChange={(value: "question-answer" | "term-definition" | "concept-example") => setCardFormat(value)}>
                        <SelectTrigger className="rounded-lg">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="question-answer">Question → Answer</SelectItem>
                          <SelectItem value="term-definition">Term → Definition</SelectItem>
                          <SelectItem value="concept-example">Concept → Example</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="flex justify-end p-3">
                <Button
                  onClick={generateFlashcards}
                  disabled={isLoading || !topic.trim()}
                  className="bg-[#1E6A8A] hover:bg-[#155E75] rounded-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Generate Flashcards
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Study Tab */}
          <TabsContent value="study" className="mt-0">
            <div className="mb-4 space-y-3">
              {/* Topic Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Filter by Topic</label>
                <Select value={selectedTopic} onValueChange={(value) => setSelectedTopic(value)}>
                  <SelectTrigger className="w-[180px] rounded-lg">
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {uniqueTopics.map((topic, index) => (
                      <SelectItem key={index} value={topic}>
                        {topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={studyMode === "all" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setStudyMode("all")}
                  className={studyMode === "all" ? "bg-[#1E6A8A] text-white hover:bg-[#155E75] rounded-lg" : "rounded-lg"}
                >
                  All Cards ({filteredCards.length})
                </Button>
                <Button
                  variant={studyMode === "learning" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setStudyMode("learning")}
                  className={studyMode === "learning" ? "bg-[#1E6A8A] text-white hover:bg-[#155E75] rounded-lg" : "rounded-lg"}
                >
                  Learning ({filteredCards.filter((c) => c.status === "learning").length})
                </Button>
                <Button
                  variant={studyMode === "reviewing" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setStudyMode("reviewing")}
                  className={studyMode === "reviewing" ? "bg-[#1E6A8A] text-white hover:bg-[#155E75] rounded-lg" : "rounded-lg"}
                >
                  Reviewing ({filteredCards.filter((c) => c.status === "reviewing").length})
                </Button>
                <Button
                  variant={studyMode === "mastered" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setStudyMode("mastered")}
                  className={studyMode === "mastered" ? "bg-[#1E6A8A] text-white hover:bg-[#155E75] rounded-lg" : "rounded-lg"}
                >
                  Mastered ({filteredCards.filter((c) => c.status === "mastered").length})
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={shuffleCards} className="rounded-lg">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Shuffle
                </Button>
              </div>
            </div>

            {filteredCards.length > 0 ? (
              <div className="flex flex-col items-center">
                <div className="mb-3 flex w-full items-center justify-between">
                  <Badge className="bg-[#FFD8A8] text-[#1E6A8A] rounded-full">
                    Card {currentIndex + 1} of {filteredCards.length}
                  </Badge>
                  <div className="text-sm text-gray-500">
                    {filteredCards[currentIndex].tags.map((tag, i) => (
                      <span key={i} className="mr-2">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <Card
                  className="mb-4 w-full cursor-pointer md:w-3/4 lg:w-2/3 flashcard-container sleek-card"
                  onClick={handleFlip}
                >
                  <CardContent className="p-0">
                    <div className="min-h-[280px] p-5 flashcard-container">
                      <div className="flashcard">
                        <div className={`card ${isFlipped ? 'flipped' : ''}`}>
                          <div className="front flashcard-content">
                            <div className="flex h-full flex-col items-center justify-center text-center">
                              <h3 className="mb-3 text-xl font-medium text-[#1E6A8A]">{filteredCards[currentIndex].term}</h3>
                              <Badge className="mt-3 bg-[#FFD8A8] text-[#1E6A8A] rounded-full">Click to reveal answer</Badge>
                            </div>
                          </div>
                          <div className="back flashcard-content">
                            <div className="flex h-full flex-col items-center justify-center text-center">
                              <Badge className="mb-3 bg-[#FFD8A8] text-[#1E6A8A] rounded-full">Answer</Badge>
                              <p className="text-lg text-gray-700">{filteredCards[currentIndex].definition}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t bg-[#F5F5F5] p-3">
                      <Button variant="ghost" size="sm" onClick={previousCard}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex gap-2">
                        {isFlipped && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500 text-red-500 hover:bg-red-50 rounded-lg"
                              onClick={() => updateCardStatus(currentIndex, "learning")}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Still Learning
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-amber-500 text-amber-500 hover:bg-amber-50 rounded-lg"
                              onClick={() => updateCardStatus(currentIndex, "reviewing")}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Review Later
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-green-500 text-green-500 hover:bg-green-50 rounded-lg"
                              onClick={() => updateCardStatus(currentIndex, "mastered")}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Got It
                            </Button>
                          </>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={nextCard}>
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex w-full justify-center gap-2">
                  <Button variant="outline" size="sm" className="rounded-lg">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Card
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-lg">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Hint
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleFlip} className="rounded-lg">
                    {isFlipped ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Hide Answer
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Show Answer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="sleek-card">
                <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                  <BookOpen className="mb-3 h-10 w-10 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium text-[#1E6A8A]">No cards in this category</h3>
                  <p className="mb-3 text-sm text-gray-500">
                    There are no flashcards in the selected category or topic. Try selecting a different category or topic, or create new flashcards.
                  </p>
                  <Button onClick={() => setActiveTab("create")} className="bg-[#1E6A8A] hover:bg-[#155E75] rounded-lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Flashcards
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Manage Deck Tab */}
          <TabsContent value="manage" className="mt-0">
            <Card className="sleek-card">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-[#1E6A8A]">Generated Flashcards</CardTitle>
                    <CardDescription className="text-gray-600">{filteredCards.length} flashcards • Created {new Date().toLocaleDateString()}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Filter by Topic</label>
                    <Select value={selectedTopic} onValueChange={(value) => setSelectedTopic(value)}>
                      <SelectTrigger className="w-[180px] rounded-lg">
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Topics</SelectItem>
                        {uniqueTopics.map((topic, index) => (
                          <SelectItem key={index} value={topic}>
                            {topic}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <label className="text-sm font-medium text-gray-700">Sort by</label>
                    <Select value={sortBy} onValueChange={(value: "term" | "status" | "created_at") => setSortBy(value)}>
                      <SelectTrigger className="w-[180px] rounded-lg">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="term">Term (A-Z)</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="created_at">Creation Date (Newest First)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="rounded-lg">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Card
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-3">
                    <h3 className="font-medium text-[#1E6A8A]">Flashcards</h3>
                    {filteredCards.length > 0 ? (
                      filteredCards.map((card, index) => (
                        <div key={index} className="rounded-lg p-4 shadow-sm bg-white">
                          <div className="mb-3 flex items-center justify-between">
                            <Badge
                              className={`
                                ${card.status === "learning" ? "bg-red-100 text-red-800" : ""}
                                ${card.status === "reviewing" ? "bg-amber-100 text-amber-800" : ""}
                                ${card.status === "mastered" ? "bg-green-100 text-green-800" : ""}
                                rounded-full
                              `}
                            >
                              {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
                            </Badge>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteCard(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Question</label>
                              <Textarea
                                value={card.term}
                                onChange={(e) => updateCard(index, { ...card, term: e.target.value })}
                                className="min-h-[80px] rounded-lg"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Answer</label>
                              <Textarea
                                value={card.definition}
                                onChange={(e) => updateCard(index, { ...card, definition: e.target.value })}
                                className="min-h-[80px] rounded-lg"
                              />
                            </div>
                          </div>

                          <div className="mt-3 space-y-2">
                            <label className="text-sm font-medium text-gray-700">Tags</label>
                            <div className="flex flex-wrap gap-2">
                              {card.tags.map((tag, i) => (
                                <Badge key={i} className="bg-[#FFD8A8] text-[#1E6A8A] rounded-full">
                                  {tag}
                                  <button
                                    className="ml-1 text-gray-500 hover:text-gray-700"
                                    onClick={() => removeTag(index, i)}
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 rounded-full px-2 text-xs"
                                onClick={() => {
                                  const newTag = prompt("Enter new tag:");
                                  if (newTag) addTag(index, newTag);
                                }}
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Add Tag
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No flashcards available for this topic.</p>
                    )}
                  </div>
                </div>
              </CardContent>
              <div className="flex justify-between p-3">
                <Button variant="outline" className="text-red-500 rounded-lg" onClick={deleteDeck}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Deck
                </Button>
                <Button onClick={() => setActiveTab("study")} className="bg-[#1E6A8A] hover:bg-[#155E75] rounded-lg">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Start Studying
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Features Section */}
        {flashcards.length === 0 && (
          <div className="mt-10">
            <h2 className="mb-5 text-xl font-semibold text-[#1E6A8A]">ThinkFast Features</h2>
            <div className="grid gap-5 md:grid-cols-3">
              <Card className="sleek-card">
                <CardContent className="flex flex-col items-center p-5 text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#FFD8A8]">
                    <Sparkles className="h-5 w-5 text-[#1E6A8A]" />
                  </div>
                  <h3 className="mb-2 font-semibold text-[#1E6A8A]">AI-Generated Flashcards</h3>
                  <p className="text-sm text-gray-600">
                    Instantly create high-quality flashcards from any topic or study material using advanced AI.
                  </p>
                </CardContent>
              </Card>
              <Card className="sleek-card">
                <CardContent className="flex flex-col items-center p-5 text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#FFD8A8]">
                    <BookOpen className="h-5 w-5 text-[#1E6A8A]" />
                  </div>
                  <h3 className="mb-2 font-semibold text-[#1E6A8A]">Spaced Repetition</h3>
                  <p className="text-sm text-gray-600">
                    Study smarter with our adaptive learning system that shows you cards at optimal intervals for retention.
                  </p>
                </CardContent>
              </Card>
              <Card className="sleek-card">
                <CardContent className="flex flex-col items-center p-5 text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#FFD8A8]">
                    <CheckCircle className="h-5 w-5 text-[#1E6A8A]" />
                  </div>
                  <h3 className="mb-2 font-semibold text-[#1E6A8A]">Progress Tracking</h3>
                  <p className="text-sm text-gray-600">
                    Monitor your learning progress with detailed statistics and insights on your study habits.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}