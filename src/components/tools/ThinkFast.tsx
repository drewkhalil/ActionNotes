import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  BookOpen, Plus, Sparkles, CheckCircle, XCircle,
  HelpCircle, Edit, Trash2, ChevronLeft, ChevronRight, Clock, Eye, EyeOff, ArrowRight,
  RefreshCw, Copy, Download, Save, Pencil, Lock, Mail
} from "lucide-react";
import OpenAI from "openai";
import { createClient } from '@supabase/supabase-js';
import './ThinkFast.css';
import { AppUser } from '../../types/types';

interface Flashcard {
  id?: string;
  term: string;
  definition: string;
  status: "learning" | "reviewing" | "mastered";
  tags: string[];
  title: string;
  project_id?: string;
  created_at?: string;
  last_reviewed?: string;
  review_interval?: number;
}

interface Project {
  id: string;
  name: string;
}

interface ThinkFastProps {
  user: AppUser | null;
  projectId?: string;
  activeView: 'home' | 'tools' | 'history' | 'settings' | 'teach' | 'recap' | 'flashcards' | 'quiz' | 'studyTechniques' | 'calendar' | 'projects' | 'analytics';
  setActiveView: React.Dispatch<React.SetStateAction<'home' | 'tools' | 'history' | 'settings' | 'teach' | 'recap' | 'flashcards' | 'quiz' | 'studyTechniques' | 'calendar' | 'projects' | 'analytics'>>;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const flashcardOpenAI = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: import.meta.env.VITE_OPENAI_FLASH_API_KEY || "",
  dangerouslyAllowBrowser: true,
});

// Mock flashcard data as a fallback
const mockFlashcards: Flashcard[] = [
  {
    term: "What is photosynthesis?",
    definition: "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll, using carbon dioxide and water, generating oxygen as a byproduct.",
    status: "learning",
    tags: ["biology", "plants", "energy"],
    title: "Biology Concepts",
    created_at: new Date().toISOString(),
    last_reviewed: new Date().toISOString(),
    review_interval: 1,
  },
  {
    term: "What are the main components of a cell membrane?",
    definition: "The cell membrane consists primarily of a phospholipid bilayer with embedded proteins. The phospholipids have hydrophilic heads and hydrophobic tails, creating a barrier that regulates what enters and exits the cell.",
    status: "learning",
    tags: ["biology", "cells", "membrane"],
    title: "Biology Concepts",
    created_at: new Date().toISOString(),
    last_reviewed: new Date().toISOString(),
    review_interval: 1,
  },
  {
    term: "What is the difference between mitosis and meiosis?",
    definition: "Mitosis is cell division that results in two identical daughter cells, each with the same number of chromosomes as the parent cell. It's used for growth and repair. Meiosis produces four genetically diverse daughter cells, each with half the chromosomes of the parent cell, and is used for sexual reproduction.",
    status: "mastered",
    tags: ["biology", "cells", "reproduction"],
    title: "Biology Concepts",
    created_at: new Date().toISOString(),
    last_reviewed: new Date().toISOString(),
    review_interval: 1,
  },
  {
    term: "What is cellular respiration?",
    definition: "Cellular respiration is the process by which cells convert nutrients into ATP, the energy currency of cells. It involves three main stages: glycolysis, the Krebs cycle, and the electron transport chain.",
    status: "reviewing",
    tags: ["biology", "cells", "energy"],
    title: "Biology Concepts",
    created_at: new Date().toISOString(),
    last_reviewed: new Date().toISOString(),
    review_interval: 1,
  },
  {
    term: "What are enzymes and how do they work?",
    definition: "Enzymes are biological catalysts that speed up chemical reactions without being consumed in the process. They work by lowering the activation energy required for reactions to occur, often by providing an optimal environment or orientation for the reactants.",
    status: "learning",
    tags: ["biology", "biochemistry", "proteins"],
    title: "Biology Concepts",
    created_at: new Date().toISOString(),
    last_reviewed: new Date().toISOString(),
    review_interval: 1,
  },
];

export default function ThinkFast({ user, projectId, activeView, setActiveView }: ThinkFastProps) {
  const [topic, setTopic] = useState("");
  const [inputText, setInputText] = useState("");
  const [numCards, setNumCards] = useState(10);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTimedMode, setIsTimedMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [depthLevel, setDepthLevel] = useState<"short" | "moderate" | "detailed">("moderate");
  const [cardFormat, setCardFormat] = useState<"question-answer" | "term-definition" | "concept-example">("question-answer");
  const [isShuffled, setIsShuffled] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const [studyMode, setStudyMode] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [sortBy, setSortBy] = useState<"term" | "status" | "created_at">("term");
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [newCard, setNewCard] = useState<Flashcard>({ term: "", definition: "", status: "learning", tags: [], title: "", project_id: projectId });
  const [newTag, setNewTag] = useState("");
  const [deckTitle, setDeckTitle] = useState("");
  const [deckDescription, setDeckDescription] = useState("");

  // Sync activeTab with activeView
  useEffect(() => {
    setActiveTab(activeView === "flashcards" ? "create" : activeView);
  }, [activeView]);

  // Sync activeView with activeTab
  useEffect(() => {
    if (activeTab !== "create" && activeTab !== "study" && activeTab !== "manage") {
      setActiveTab("create");
    }
    setActiveView(activeTab as 'home' | 'tools' | 'history' | 'settings' | 'teach' | 'recap' | 'flashcards' | 'quiz' | 'studyTechniques' | 'calendar' | 'projects' | 'analytics');
  }, [activeTab, setActiveView]);

  const filteredCards = flashcards
    .filter((card) => {
      if (selectedTopic !== "all" && card.title !== selectedTopic) return false;
      if (studyMode !== "all" && card.status !== studyMode) return false;
      const now = new Date();
      const lastReviewed = card.last_reviewed ? new Date(card.last_reviewed) : new Date(0);
      const daysSinceReview = (now.getTime() - lastReviewed.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceReview >= (card.review_interval || 1);
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

  // Load flashcards and projects from Supabase on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        let flashcardQuery = supabase
          .from('flashcards')
          .select('*')
          .eq('user_id', user.id);

        if (projectId) {
          flashcardQuery = flashcardQuery.eq('project_id', projectId);
        }

        const { data: flashcardData, error: flashcardError } = await flashcardQuery;

        if (flashcardError) throw flashcardError;

        console.log("Supabase flashcard data:", flashcardData);
        const flashcardsToSet = !flashcardData || flashcardData.length === 0 ? mockFlashcards : flashcardData;
        console.log("Setting flashcards to:", flashcardsToSet);
        setFlashcards(flashcardsToSet);

        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('id, name')
          .eq('user_id', user.id);

        if (projectError) throw projectError;

        setProjects(projectData || []);
      } catch (err: any) {
        setError('Failed to load data. Please try again.');
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, [user, projectId]);

  // Log flashcards state to debug
  useEffect(() => {
    console.log("Current flashcards state:", flashcards);
    console.log("Filtered Cards:", filteredCards);
    console.log("Selected Topic:", selectedTopic, "Study Mode:", studyMode); // Debug filter state
  }, [flashcards, selectedTopic, studyMode]);

  // Handle keypress navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (filteredCards.length === 0 || isEditModalOpen || isAddCardModalOpen) return;

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
  }, [currentIndex, isFlipped, filteredCards.length, isEditModalOpen, isAddCardModalOpen]);

  // Timed mode countdown
  useEffect(() => {
    if (!isTimedMode || !isFlipped || filteredCards.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsFlipped(false);
          nextCard();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimedMode, isFlipped, currentIndex, filteredCards.length]);

  const uniqueTopics = Array.from(new Set(flashcards.map(card => card.title))).sort();

  const generateFlashcards = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }

    if (!user) {
      setError("User not found. Please log in.");
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
        ? `Generate ${numCards} flashcards on the topic "${topic}" with the following study material:\n${inputText}\nDepth Level: ${depthLevel}\nFormat: ${formatPrompt}\nReturn each flashcard in the format:\n${cardFormat === "concept-example" ? "Concept: [concept]\nExample: [example]" : "Term: [term]\nDefinition: [definition]"}\nSeparate flashcards with '---'.`
        : `Generate ${numCards} flashcards on the topic "${topic}".\nDepth Level: ${depthLevel}\nFormat: ${formatPrompt}\nReturn each flashcard in the format:\n${cardFormat === "concept-example" ? "Concept: [concept]\nExample: [example]" : "Term: [term]\nDefinition: [definition]"}\nSeparate flashcards with '---'.`;

      const response = await flashcardOpenAI.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert flashcard generator. Generate structured flashcards based on the input provided. Ensure each flashcard is clear, concise, and follows the specified format. Adjust content depth according to the specified Depth Level (short: brief facts, moderate: balanced explanations, detailed: in-depth content).`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const text = response.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error("Empty response from OpenAI API.");
      }

      console.log("Raw OpenAI Response:", text);

      const flashcardsText = text.split('---').filter(card => card.trim() !== '');
      const formattedFlashcards = flashcardsText.map((card) => {
        const lines = card.split('\n').filter(line => line.trim() !== '');
        let term = '';
        let definition = '';

        for (const line of lines) {
          if (line.match(/^\s*Term:/i) || line.match(/^\s*Concept:/i)) {
            term = line.replace(/^\s*(Term|Concept):\s*(.*)/i, "$2").trim();
          } else if (line.match(/^\s*Definition:/i) || line.match(/^\s*Example:/i)) {
            definition = line.replace(/^\s*(Definition|Example):\s*(.*)/i, "$2").trim() || definition + "\n" + line.trim();
          } else if (definition) {
            definition += "\n" + line.trim();
          }
        }

        if (!term || !definition) {
          console.log("Skipping invalid card:", { term, definition });
          return null;
        }

        const flashcard = {
          term,
          definition,
          status: "learning" as "learning" | "reviewing" | "mastered",
          tags: ["generated"],
          title: topic,
          project_id: projectId || undefined,
          created_at: new Date().toISOString(),
          last_reviewed: new Date().toISOString(),
          review_interval: 1,
        };

        console.log("Parsed Flashcard:", flashcard);
        return flashcard;
      }).filter(card => card !== null) as Flashcard[];

      console.log("Formatted Flashcards:", formattedFlashcards);

      if (formattedFlashcards.length === 0) {
        throw new Error("No valid flashcards generated from the response.");
      }

      let newFlashcards: Flashcard[] = formattedFlashcards;
      if (user) {
        try {
          const flashcardsToInsert = formattedFlashcards.map(card => ({
            user_id: user.id,
            type: 'flashcard',
            title: card.title,
            term: card.term,
            definition: card.definition,
            status: card.status,
            tags: card.tags,
            created_at: card.created_at,
            last_reviewed: card.last_reviewed,
            review_interval: card.review_interval,
          }));

          const { data, error } = await supabase
            .from('flashcards')
            .insert(flashcardsToInsert)
            .select();

          if (error) {
            console.error("Supabase insert error:", error);
          } else {
            newFlashcards = data.map((dbCard, index) => ({
              ...formattedFlashcards[index],
              id: dbCard.id,
            }));
          }
        } catch (err: any) {
          console.error("Supabase insert failed:", err);
        }
      }

      setFlashcards([...flashcards, ...newFlashcards]);
      setCurrentIndex(0);
      setIsFlipped(false);
      setSelectedTopic(topic);
      setStudyMode("all");
      setActiveTab("study");
      setIsLoading(false);
    } catch (err: any) {
      console.error("Error generating flashcards:", err);
      setError(err.message || "Failed to generate flashcards. Please try again.");
      setIsLoading(false);
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeLeft(30);
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const previousCard = () => {
    setIsFlipped(false);
    setTimeLeft(30);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
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

  const updateCardStatus = async (index: number, newStatus: "learning" | "reviewing" | "mastered") => {
    setError(null);
    const updatedFlashcards = [...flashcards];
    const globalIndex = flashcards.findIndex(card => card === filteredCards[index]);
    const card = updatedFlashcards[globalIndex];

    updatedFlashcards[globalIndex] = { 
      ...card, 
      status: newStatus,
      last_reviewed: new Date().toISOString(),
      review_interval: newStatus === "mastered" ? (card.review_interval || 1) * 2 : card.review_interval || 1,
    };
    setFlashcards(updatedFlashcards);

    if (user && card.id) {
      try {
        const { error } = await supabase
          .from('flashcards')
          .update({ 
            status: newStatus,
            last_reviewed: new Date().toISOString(),
            review_interval: newStatus === "mastered" ? (card.review_interval || 1) * 2 : card.review_interval || 1,
          })
          .eq('id', card.id);

        if (error) throw error;
      } catch (err: any) {
        setError("Failed to update flashcard status.");
        console.error("Error updating status:", err);
      }
    }
  };

  const updateCard = async (updatedCard: Flashcard) => {
    setError(null);
    const updatedFlashcards = flashcards.map(card => 
      card.id === updatedCard.id ? updatedCard : card
    );
    setFlashcards(updatedFlashcards);

    if (user && updatedCard.id) {
      try {
        const { error } = await supabase
          .from('flashcards')
          .update({
            term: updatedCard.term,
            definition: updatedCard.definition,
            tags: updatedCard.tags,
            title: updatedCard.title,
            last_reviewed: updatedCard.last_reviewed,
            review_interval: updatedCard.review_interval,
          })
          .eq('id', updatedCard.id);

        if (error) throw error;
      } catch (err: any) {
        setError("Failed to update flashcard.");
        console.error("Error updating card:", err);
      }
    }
    setIsEditModalOpen(false);
  };

  const copyCard = async (index: number) => {
    setError(null);
    const globalIndex = flashcards.findIndex(card => card === filteredCards[index]);
    const cardToCopy = { ...flashcards[globalIndex], id: undefined };
    const newFlashcards = [...flashcards, cardToCopy];

    if (user) {
      try {
        const { data, error } = await supabase
          .from('flashcards')
          .insert({
            user_id: user.id,
            type: 'flashcard',
            title: cardToCopy.title,
            term: cardToCopy.term,
            definition: cardToCopy.definition,
            status: cardToCopy.status,
            tags: cardToCopy.tags,
            created_at: new Date().toISOString(),
            last_reviewed: cardToCopy.last_reviewed,
            review_interval: cardToCopy.review_interval,
          })
          .select();

        if (error) throw error;
        newFlashcards[newFlashcards.length - 1].id = data[0].id;
      } catch (err: any) {
        setError("Failed to copy flashcard.");
        console.error("Error copying card:", err);
        return;
      }
    }

    setFlashcards(newFlashcards);
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
        setError("Failed to delete flashcard.");
        console.error("Error deleting card:", err);
      }
    }
  };

  const updateDeckDetails = async () => {
    setError(null);
    if (!user) {
      setError("User not found. Please log in.");
      return;
    }

    const updatedFlashcards = flashcards.map(card =>
      card.title === selectedTopic ? { ...card, title: deckTitle } : card
    );
    setFlashcards(updatedFlashcards);

    try {
      const { error } = await supabase
        .from('flashcards')
        .update({ title: deckTitle })
        .eq('user_id', user.id)
        .eq('title', selectedTopic);

      if (error) throw error;

      setSelectedTopic(deckTitle);
    } catch (err: any) {
      setError("Failed to update deck details.");
      console.error("Error updating deck details:", err);
    }
  };

  const exportDeck = () => {
    const deckCards = flashcards.filter(card => card.title === selectedTopic);
    const data = JSON.stringify(deckCards, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTopic}-flashcards.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteDeck = async (title: string) => {
    setError(null);
    if (!user) {
      setError("User not found. Please log in.");
      return;
    }

    try {
      let query = supabase
        .from('flashcards')
        .delete()
        .eq('user_id', user.id)
        .eq('title', title);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { error } = await query;

      if (error) throw error;

      setFlashcards(flashcards.filter(card => card.title !== title));
      setCurrentIndex(0);
      setSelectedTopic("all");
      if (activeTab === "study") {
        setActiveTab("create");
      }
    } catch (err: any) {
      setError("Failed to delete deck.");
      console.error("Error deleting deck:", err);
    }
  };

  const addTag = async (index: number, tag: string) => {
    if (!tag.trim()) return;
    setError(null);
    const updatedFlashcards = [...flashcards];
    const globalIndex = flashcards.findIndex(card => card === filteredCards[index]);
    if (!updatedFlashcards[globalIndex].tags.includes(tag)) {
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
          setError("Failed to add tag.");
          console.error("Error adding tag:", err);
        }
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
        setError("Failed to remove tag.");
        console.error("Error removing tag:", err);
      }
    }
  };

  const getHint = async (index: number) => {
    const card = filteredCards[index];
    setIsLoading(true);
    try {
      const response = await flashcardOpenAI.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Provide a concise hint for the given flashcard without revealing the full answer. The hint should be 1-2 sentences and guide the user toward the answer.",
          },
          {
            role: "user",
            content: `Term: ${card.term}\nDefinition: ${card.definition}\nGenerate a hint.`,
          },
        ],
      });

      const hint = response.choices?.[0]?.message?.content;
      if (hint) {
        setError(hint);
        setTimeout(() => setError(null), 5000);
      }
    } catch (err: any) {
      setError("Failed to generate hint.");
      console.error("Error generating hint:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const addNewCard = async () => {
    if (!newCard.term || !newCard.definition || !newCard.title) {
      setError("Please fill in all required fields.");
      return;
    }

    const cardToAdd: Flashcard = {
      ...newCard,
      status: "learning",
      tags: newCard.tags.length ? newCard.tags : ["manual"],
      project_id: newCard.project_id || projectId,
      created_at: new Date().toISOString(),
      last_reviewed: new Date().toISOString(),
      review_interval: 1,
    };

    let newFlashcards = [...flashcards, cardToAdd];
    if (user) {
      try {
        const { data, error } = await supabase
          .from('flashcards')
          .insert({
            user_id: user.id,
            type: 'flashcard',
            title: cardToAdd.title,
            term: cardToAdd.term,
            definition: cardToAdd.definition,
            status: cardToAdd.status,
            tags: cardToAdd.tags,
            created_at: cardToAdd.created_at,
            last_reviewed: cardToAdd.last_reviewed,
            review_interval: cardToAdd.review_interval,
          })
          .select();

        if (error) throw error;
        newFlashcards = [...flashcards, ...data.map((dbCard) => ({
          ...cardToAdd,
          id: dbCard.id,
        }))];
      } catch (err: any) {
        setError("Failed to add new card.");
        console.error("Error adding new card:", err);
        return;
      }
    }

    setFlashcards(newFlashcards);
    setIsAddCardModalOpen(false);
    setNewCard({ term: "", definition: "", status: "learning", tags: [], title: "", project_id: projectId });
    setNewTag("");
    setActiveTab("study");
    setSelectedTopic(cardToAdd.title);
  };

  const handleAddTagToNewCard = () => {
    if (newTag.trim() && !newCard.tags.includes(newTag.trim())) {
      setNewCard({ ...newCard, tags: [...newCard.tags, newTag.trim()] });
      setNewTag("");
    }
  };

  const handleAddTagToEditingCard = () => {
    if (newTag.trim() && editingCard && !editingCard.tags.includes(newTag.trim())) {
      setEditingCard({ ...editingCard, tags: [...editingCard.tags, newTag.trim()] });
      setNewTag("");
    }
  };

  const decks = uniqueTopics.map(title => ({
    title,
    cards: flashcards.filter(card => card.title === title),
    project: projects.find(project => project.id === flashcards.find(card => card.title === title)?.project_id) || { id: '', name: 'No Project' },
    created_at: flashcards.find(card => card.title === title)?.created_at || new Date().toISOString(),
  }));

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card>
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
    <div className="min-h-screen bg-white">
      {error && (
        <div className="container mx-auto px-4 py-2">
          <span className="text-red-600 text-sm font-medium bg-red-100 px-3 py-1 rounded-full">
            {error}
          </span>
        </div>
      )}

      <main className="container px-4 py-6 md:px-6 md:py-8">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#FFE8C8]">
            <BookOpen className="h-8 w-8 text-[#1E3A8A]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">ThinkFast</h1>
            <p className="text-gray-600">Create and study with AI-generated flashcards</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mb-4 w-full justify-start bg-transparent p-0">
            <TabsTrigger
              value="create"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#1E3A8A] data-[state=active]:bg-transparent data-[state=active]:text-[#1E3A8A] data-[state=active]:shadow-none"
            >
              Create Flashcards
            </TabsTrigger>
            <TabsTrigger
              value="study"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#1E3A8A] data-[state=active]:bg-transparent data-[state=active]:text-[#1E3A8A] data-[state=active]:shadow-none"
            >
              Study
            </TabsTrigger>
            <TabsTrigger
              value="manage"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#1E3A8A] data-[state=active]:bg-transparent data-[state=active]:text-[#1E3A8A] data-[state=active]:shadow-none"
            >
              Manage Deck
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Create New Flashcards</CardTitle>
                <CardDescription>Enter a topic or paste your study material to generate AI flashcards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Topic</label>
                  <Input
                    placeholder="E.g., Biology Concepts, Spanish Vocabulary, Historical Events"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Study Material (Optional)</label>
                  <Textarea
                    placeholder="Paste your notes, textbook excerpts, or any content you want to convert to flashcards"
                    className="min-h-[200px]"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                </div>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-medium">Flashcard Options</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Number of Cards</label>
                      <Input
                        type="number"
                        min="5"
                        max="50"
                        value={numCards}
                        onChange={(e) => setNumCards(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Depth Level</label>
                      <Select value={depthLevel} onValueChange={(value: "short" | "moderate" | "detailed") => setDepthLevel(value)}>
                        <SelectTrigger>
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
                      <label className="text-sm font-medium">Card Format</label>
                      <Select value={cardFormat} onValueChange={(value: "question-answer" | "term-definition" | "concept-example") => setCardFormat(value)}>
                        <SelectTrigger>
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
              <CardFooter className="flex justify-end">
                <Button
                  onClick={generateFlashcards}
                  disabled={isLoading || !topic.trim()}
                  className="bg-[#1E3A8A] hover:bg-[#152C6B]"
                >
                  {isLoading ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Generate Flashcards
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="study" className="mt-0">
            {filteredCards.length > 0 ? (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={studyMode === "all" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setStudyMode("all")}
                    className={studyMode === "all" ? "bg-[#1E3A8A]" : ""}
                  >
                    All Cards ({filteredCards.length})
                  </Button>
                  <Button
                    variant={studyMode === "learning" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setStudyMode("learning")}
                    className={studyMode === "learning" ? "bg-[#1E3A8A]" : ""}
                  >
                    Learning ({filteredCards.filter((c) => c.status === "learning").length})
                  </Button>
                  <Button
                    variant={studyMode === "reviewing" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setStudyMode("reviewing")}
                    className={studyMode === "reviewing" ? "bg-[#1E3A8A]" : ""}
                  >
                    Reviewing ({filteredCards.filter((c) => c.status === "reviewing").length})
                  </Button>
                  <Button
                    variant={studyMode === "mastered" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setStudyMode("mastered")}
                    className={studyMode === "mastered" ? "bg-[#1E3A8A]" : ""}
                  >
                    Mastered ({filteredCards.filter((c) => c.status === "mastered").length})
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={shuffleCards}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Shuffle
                  </Button>
                  <Button
                    variant={isTimedMode ? "primary" : "outline"}
                    size="sm"
                    onClick={() => {
                      setIsTimedMode(!isTimedMode);
                      setTimeLeft(30);
                      setIsFlipped(false);
                    }}
                    className={isTimedMode ? "bg-[#1E3A8A]" : ""}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {isTimedMode ? `Timed Mode (${timeLeft}s)` : "Timed Mode"}
                  </Button>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <BookOpen className="mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium">No flashcards available</h3>
                  <p className="mb-4 text-sm text-gray-500">
                    You don't have any flashcards yet. Start by creating some in the "Create Flashcards" tab.
                  </p>
                  <Button onClick={() => setActiveTab("create")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Flashcards
                  </Button>
                </CardContent>
              </Card>
            )}

            {filteredCards.length > 0 && (
              <div className="flex flex-col items-center">
                <div className="mb-4 w-full">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Study Progress</span>
                    <span className="text-sm text-gray-500">
                      {currentIndex + 1} of {filteredCards.length} reviewed
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-[#1E3A8A]"
                      style={{ width: `${((currentIndex + 1) / filteredCards.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mb-4 flex w-full items-center justify-between">
                  <Badge className="bg-[#FFE8C8] text-[#1E3A8A]">
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

                <Card className="mb-6 w-full cursor-pointer overflow-hidden md:w-3/4 lg:w-2/3" onClick={handleFlip}>
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between border-b bg-[#F8F9FA] p-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`
                            ${filteredCards[currentIndex].status === "learning" ? "bg-red-100 text-red-800" : ""}
                            ${filteredCards[currentIndex].status === "reviewing" ? "bg-amber-100 text-amber-800" : ""}
                            ${filteredCards[currentIndex].status === "mastered" ? "bg-green-100 text-green-800" : ""}
                          `}
                        >
                          {filteredCards[currentIndex].status.charAt(0).toUpperCase() + filteredCards[currentIndex].status.slice(1)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Last reviewed: {formatDate(filteredCards[currentIndex].last_reviewed || new Date().toISOString())}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Next review: {formatDate(new Date(new Date(filteredCards[currentIndex].last_reviewed || new Date()).getTime() + (filteredCards[currentIndex].review_interval || 1) * 86400000).toISOString())}
                      </div>
                    </div>
                    <div className="min-h-[300px] p-6">
                      {!isFlipped ? (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                          <h3 className="mb-4 text-xl font-medium">{filteredCards[currentIndex].term}</h3>
                          <Badge className="mt-4 bg-[#FFE8C8] text-[#1E3A8A]">Click to reveal answer</Badge>
                        </div>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                          <Badge className="mb-4 bg-[#FFE8C8] text-[#1E3A8A]">Answer</Badge>
                          <p className="text-lg">{filteredCards[currentIndex].definition}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t bg-[#F5F5F5] p-4">
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
                              className="border-red-500 text-red-500 hover:bg-red-50"
                              onClick={() => updateCardStatus(currentIndex, "learning")}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Still Learning
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-amber-500 text-amber-500 hover:bg-amber-50"
                              onClick={() => updateCardStatus(currentIndex, "reviewing")}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Review Later
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-green-500 text-green-500 hover:bg-green-50"
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const globalIndex = flashcards.findIndex(card => card === filteredCards[currentIndex]);
                      setEditingCard({ ...flashcards[globalIndex] });
                      setIsEditModalOpen(true);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Card
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => getHint(currentIndex)} disabled={isLoading}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    {isLoading ? "Loading Hint..." : "Hint"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleFlip}>
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
            )}
          </TabsContent>

          <TabsContent value="manage" className="mt-0">
            {decks.length > 0 ? (
              decks.map((deck, deckIndex) => (
                <Card key={deckIndex}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{deck.title}</CardTitle>
                        <CardDescription>{deck.cards.length} flashcards • Created {formatDate(deck.created_at)}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddCardModalOpen(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Card
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportDeck}>
                          <Download className="mr-2 h-4 w-4" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <label className="text-sm font-medium">Deck Title</label>
                          <Input
                            value={deckTitle || deck.title}
                            onChange={(e) => setDeckTitle(e.target.value)}
                          />
                        </div>
                        <Button variant="outline" size="sm" onClick={updateDeckDetails}>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={deckDescription || `Flashcards for ${deck.title}`}
                          onChange={(e) => setDeckDescription(e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>
                      <Separator />
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Deck Statistics</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTopic(deck.title);
                              setActiveTab("study");
                            }}
                          >
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Study Now
                          </Button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-4">
                          <div className="rounded-lg border p-4 text-center">
                            <div className="text-2xl font-bold text-[#1E3A8A]">{deck.cards.length}</div>
                            <div className="text-sm text-gray-500">Total Cards</div>
                          </div>
                          <div className="rounded-lg border p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {deck.cards.filter((c) => c.status === "learning").length}
                            </div>
                            <div className="text-sm text-gray-500">Learning</div>
                          </div>
                          <div className="rounded-lg border p-4 text-center">
                            <div className="text-2xl font-bold text-amber-600">
                              {deck.cards.filter((c) => c.status === "reviewing").length}
                            </div>
                            <div className="text-sm text-gray-500">Reviewing</div>
                          </div>
                          <div className="rounded-lg border p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {deck.cards.filter((c) => c.status === "mastered").length}
                            </div>
                            <div className="text-sm text-gray-500">Mastered</div>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">Flashcards</h3>
                            <div className="relative w-64">
                              <Input type="search" placeholder="Search cards..." className="pl-8" />
                            </div>
                          </div>
                          {deck.cards.map((card, index) => (
                            <div key={index} className="rounded-lg border p-4">
                              <div className="mb-4 flex items-center justify-between">
                                <Badge
                                  className={`
                                    ${card.status === "learning" ? "bg-red-100 text-red-800" : ""}
                                    ${card.status === "reviewing" ? "bg-amber-100 text-amber-800" : ""}
                                    ${card.status === "mastered" ? "bg-green-100 text-green-800" : ""}
                                  `}
                                >
                                  {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
                                </Badge>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const globalIndex = flashcards.findIndex(c => c.id === card.id);
                                      setEditingCard({ ...flashcards[globalIndex] });
                                      setIsEditModalOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyCard(flashcards.findIndex(c => c.id === card.id))}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => deleteCard(flashcards.findIndex(c => c.id === card.id))}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <h4 className="mb-1 text-sm font-medium text-gray-500">Question</h4>
                                  <p className="text-sm">{card.term}</p>
                                </div>
                                <div>
                                  <h4 className="mb-1 text-sm font-medium text-gray-500">Answer</h4>
                                  <p className="text-sm">{card.definition}</p>
                                </div>
                              </div>
                              <div className="mt-4 flex flex-wrap gap-2">
                                {card.tags.map((tag, i) => (
                                  <Badge key={i} className="bg-[#FFE8C8] text-[#1E3A8A]">
                                    {tag}
                                    <button
                                      className="ml-1 text-gray-500 hover:text-gray-700"
                                      onClick={() => removeTag(flashcards.findIndex(c => c.id === card.id), i)}
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                ))}
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Add tag"
                                    className="h-8 w-32"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                        addTag(flashcards.findIndex(c => c.id === card.id), e.currentTarget.value.trim());
                                        e.currentTarget.value = "";
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" className="text-red-500" onClick={() => deleteDeck(deck.title)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Deck
                    </Button>
                    <Button
                      className="bg-[#1E3A8A] hover:bg-[#152C6B]"
                      onClick={() => {
                        setSelectedTopic(deck.title);
                        setActiveTab("study");
                      }}
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Start Studying
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <BookOpen className="mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium">No decks available</h3>
                  <p className="mb-4 text-sm text-gray-500">
                    You haven't created any decks yet. Start by generating flashcards in the "Create Flashcards" tab.
                  </p>
                  <Button onClick={() => setActiveTab("create")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Flashcards
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {flashcards.length === 0 && (
          <div className="mt-12">
            <h2 className="mb-6 text-xl font-semibold">ThinkFast Features</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFE8C8]">
                    <Sparkles className="h-6 w-6 text-[#1E3A8A]" />
                  </div>
                  <h3 className="mb-2 font-semibold">AI-Generated Flashcards</h3>
                  <p className="text-sm text-gray-600">
                    Instantly create high-quality flashcards from any topic or study material using advanced AI.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFE8C8]">
                    <BookOpen className="h-6 w-6 text-[#1E3A8A]" />
                  </div>
                  <h3 className="mb-2 font-semibold">Spaced Repetition</h3>
                  <p className="text-sm text-gray-600">
                    Study smarter with our adaptive learning system that shows you cards at optimal intervals for retention.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFE8C8]">
                    <CheckCircle className="h-6 w-6 text-[#1E3A8A]" />
                  </div>
                  <h3 className="mb-2 font-semibold">Progress Tracking</h3>
                  <p className="text-sm text-gray-600">
                    Monitor your learning progress with detailed statistics and insights on your study habits.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {isEditModalOpen && editingCard && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-[600px]">
            <h2 className="text-lg font-medium mb-4">Edit Flashcard</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Topic</label>
                <Input
                  value={editingCard.title}
                  onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Question</label>
                <Textarea
                  value={editingCard.term}
                  onChange={(e) => setEditingCard({ ...editingCard, term: e.target.value })}
                  className="mt-1 min-h-[80px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Answer</label>
                <Textarea
                  value={editingCard.definition}
                  onChange={(e) => setEditingCard({ ...editingCard, definition: e.target.value })}
                  className="mt-1 min-h-[80px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Project</label>
                <Select
                  value={editingCard.project_id || ""}
                  onValueChange={(value) => setEditingCard({ ...editingCard, project_id: value || undefined })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tags</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {editingCard.tags.map((tag, i) => (
                    <Badge key={i} className="bg-[#FFE8C8] text-[#1E3A8A]">
                      {tag}
                      <button
                        className="ml-1 text-gray-500 hover:text-gray-700"
                        onClick={() => setEditingCard({ ...editingCard, tags: editingCard.tags.filter((_, index) => index !== i) })}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="New tag"
                  />
                  <Button variant="outline" size="sm" onClick={handleAddTagToEditingCard}>
                    Add Tag
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateCard(editingCard)}
                className="bg-[#1E3A8A] hover:bg-[#152C6B]"
                disabled={!editingCard?.term || !editingCard?.definition || !editingCard?.title}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {isAddCardModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-[600px]">
            <h2 className="text-lg font-medium mb-4">Add New Flashcard</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Topic</label>
                <Input
                  value={newCard.title}
                  onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                  placeholder="Enter topic"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Question</label>
                <Textarea
                  value={newCard.term}
                  onChange={(e) => setNewCard({ ...newCard, term: e.target.value })}
                  className="mt-1 min-h-[80px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Answer</label>
                <Textarea
                  value={newCard.definition}
                  onChange={(e) => setNewCard({ ...newCard, definition: e.target.value })}
                  className="mt-1 min-h-[80px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Project</label>
                <Select
                  value={newCard.project_id || ""}
                  onValueChange={(value) => setNewCard({ ...newCard, project_id: value || undefined })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tags</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {newCard.tags.map((tag, i) => (
                    <Badge key={i} className="bg-[#FFE8C8] text-[#1E3A8A]">
                      {tag}
                      <button
                        className="ml-1 text-gray-500 hover:text-gray-700"
                        onClick={() => setNewCard({ ...newCard, tags: newCard.tags.filter((_, index) => index !== i) })}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="New tag"
                  />
                  <Button variant="outline" size="sm" onClick={handleAddTagToNewCard}>
                    Add Tag
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddCardModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={addNewCard}
                className="bg-[#1E3A8A] hover:bg-[#152C6B]"
                disabled={!newCard.term || !newCard.definition || !newCard.title}
              >
                Add Card
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}