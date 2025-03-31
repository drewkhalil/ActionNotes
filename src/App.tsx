import React, { useState, useRef, useEffect } from 'react';
import PricingModal from "./PricingModal";
import { FileText, Upload, Clock, CheckCircle2, AlertCircle, X, Zap, Infinity, Download, Menu, Settings as SettingsIcon, History, HelpCircle, BookOpen, Sun, Moon, Brain, FileQuestion, Home, Bookmark, PenSquare, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import ReactMarkdown from 'react-markdown';
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import Login from './components/Login';
import { Settings } from './components/Settings';
import { History as HistoryComponent } from './components/History';
import ThinkFast from './components/ThinkFast';
import Quiz from './components/Quiz';
import { supabase, SupabaseUser } from './lib/supabase'; // Fix import to use SupabaseUser
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import TeachMe from './components/TeachMe';
import RecapMe from './components/RecapMe';
import MathJax from 'react-mathjax2';
import ReMinder from './components/reminder';

// Define custom AppUser type to extend Supabase Auth User
interface AppUser extends SupabaseUser {
  usage_count?: number | null;
  last_reset?: string | null;
  plan?: string | null;
  created_at: string; // Align with SupabaseUser (remove 'null | undefined')
  email?: string | undefined;
}

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session check:', session);
        if (session?.user) {
          setUser(session.user as AppUser); // Cast to AppUser
          localStorage.setItem('userId', session.user.id);
        } else {
          console.log('No active session found. User is logged out.');
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', session);
      setUser(session?.user as AppUser | null ?? null); // Cast to AppUser
      if (session?.user) {
        localStorage.setItem('userId', session.user.id);
      } else {
        localStorage.removeItem('userId');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <SubscriptionProvider>
      <Elements stripe={stripePromise}>
        <MainApp user={user} setUser={setUser} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      </Elements>
    </SubscriptionProvider>
  );
}

type Summary = {
  sections: { title: string; content: string[] }[];
  timestamp: string;
};

interface MainAppProps {
  user: AppUser | null;
  setUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

function MainApp({ user, setUser, isDarkMode, setIsDarkMode }: MainAppProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'main' | 'history' | 'settings' | 'teach' | 'recap' | 'flashcards' | 'quiz' | 'reminder'>('main');

  const [recentSummaries] = useState<Summary[]>([
    { sections: [{ title: "Recent Summary 1", content: ["Content from your last summary..."] }], timestamp: "2024-03-10 14:30" }
  ]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      localStorage.removeItem('userId');
      localStorage.removeItem('usageCounts');
      localStorage.removeItem('userPlan');
      localStorage.removeItem('lastUsageReset');
      
      setUser(null);
      setActiveView('main');
      setIsSidebarOpen(false);
      setSummary(null);
      setInput('');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  const updateUsageCount = async (userId: string) => {
    await fetch("/api/updateUsage", {
      method: "POST",
      body: JSON.stringify({ userId }),
      headers: { "Content-Type": "application/json" }
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      const hamburger = document.getElementById('hamburger-button');
      if (sidebar && hamburger && 
          !sidebar.contains(event.target as Node) && 
          !hamburger.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsProcessing(true);

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        alert("⚠️ Error: Missing user ID. Please log in.");
        setIsProcessing(false);
        return;
      }

      if (!user) {
        alert("⚠️ Error: User not found. Please log in.");
        setIsProcessing(false);
        return;
      }

      const usageResponse = await fetch("http://localhost:4242/api/updateUsage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const usageData = await usageResponse.json();

      if (!usageData.success) {
        alert("🚀 You've used all 3 free summaries this week! Upgrade to continue.");
        setShowPricingModal(true);
        setIsProcessing(false);
        return;
      }

      const summary = await generateSummary(input);
      setSummary(summary);

      const { error } = await supabase
        .from('history')
        .insert({
          user_id: user.id,
          type: 'recap',
          title: 'Summary',
          content: summary.sections[0].content.join('\n'),
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      if (usageData.remaining !== "unlimited") {
        localStorage.setItem("summaryUsage", JSON.stringify({
          count: 3 - usageData.remaining, 
          lastReset: Date.now(),
        }));
      }
    } catch (error: any) {
      console.error("❌ Error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPricingModal(true);
  };

  const handleTeachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsProcessing(true);
    try {
      if (user?.id) {
        const { error } = await supabase
          .from('history')
          .insert({
            user_id: user.id,
            type: 'lesson',
            title: 'Interactive Lesson',
            content: input,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error saving lesson:', error);
      alert('Failed to save lesson. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.name.split('.').pop()?.toLowerCase();
    setIsProcessing(true);

    try {
      if (fileType === "txt" || fileType === "md") {
        const text = await file.text();
        setInput(text);
        const summary = await generateSummary(text);
        setSummary(summary);
      } else {
        alert("Unsupported file format. Please convert to .txt before uploading.");
      }
    } catch (error) {
      console.error("Error processing file:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateSummary = async (text: string) => {
    try {
      if (user?.id) {
        const { error } = await supabase
          .from('history')
          .insert({
            user_id: user.id,
            type: 'summary',
            title: 'Summary',
            content: text,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      return {
        timestamp: new Date().toLocaleString(),
        sections: [{ title: "Summary", content: text.split("\n") }]
      };
    } catch (error: any) {
      console.error("Error saving summary:", error);
      throw new Error("Failed to save summary");
    }
  };

  const cleanMathExpression = (text: string): string => {
    return text
      .replace(/\\\[(.*?)\\\]/gs, (_, math) => `\n\\[${math.trim()}\\]\n`)
      .replace(/\\\((.*?)\\\)/g, (_, math) => `\\(${math.trim()}\\)`)
      .replace(/^\*\*(#+)\s*(.*?)\*\*$/gm, (_, hashes, title) => `${hashes} ${title.trim()}`)
      .replace(/^(#+)\s*(.*)$/gm, (_, hashes, title) => `\n${hashes} ${title.trim()}\n`)
      .replace(/^[-*•]\s*/gm, '\n• ')
      .replace(/^-{3,}$/gm, '\n---\n')
      .replace(/^where:$/gm, 'where:\n')
      .replace(/^(\d+)\.\s*/gm, (_, num) => `${num}. `)
      .replace(/([0-9])°([CF])/g, '$1°$2')
      .replace(/(\d+)\s*([KM])?\s*mol\^?-?\s*1/g, '$1$2 mol⁻¹')
      .replace(/(\d+)\s*K\^?-?\s*1/g, '$1 K⁻¹')
      .replace(/\|([^|]*)\|/g, (_, content) => `|${content.trim()}|`)
      .replace(/\n\s*\|\s*([^|]*)\s*\|\s*\n/g, '\n| $1 |\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .join('\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const handleSubscribe = async (plan: "starter" | "ultimate") => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        alert("⚠️ Please log in before subscribing.");
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, plan }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error("Stripe not initialized");
      }

      const result = await stripe.redirectToCheckout({ sessionId });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error: any) {
      console.error("Error starting checkout:", error);
      alert(`Failed to start checkout: ${error.message}`);
    }
  };

  const getSidebarLinkClasses = (isActive: boolean) => {
    return `flex items-center px-4 py-2 rounded-lg transition-colors duration-200 
      ${isActive ? "bg-gray-200 dark:bg-gray-700" : "bg-transparent"}
      text-gray-900 dark:text-gray-300
      hover:text-teal-600 dark:hover:text-teal-400 
      hover:bg-gray-200 dark:hover:bg-gray-700`;
  };

  const getThemeStyles = () => {
    if (activeView === 'teach') {
      return {
        bgColor: "bg-purple-500 dark:bg-purple-600",
        textColor: "text-purple-800 dark:text-purple-200",
        iconColor: "text-purple-700 dark:text-purple-300",
        hoverTextColor: "hover:text-purple-600 dark:hover:text-purple-400",
        borderColor: "border-purple-400 dark:border-purple-600",
      };
    } else if (activeView === 'recap') {
      return {
        bgColor: "bg-green-500 dark:bg-green-600",
        textColor: "text-green-200 dark:text-green-100",
        iconColor: "text-green-300 dark:text-green-200",
        hoverTextColor: "hover:text-green-400 dark:hover:text-green-300",
        borderColor: "border-green-600 dark:border-green-500",
      };
    } else if (activeView === 'reminder') {
      return {
        bgColor: "bg-teal-500 dark:bg-teal-600",
        textColor: "text-teal-800 dark:text-teal-200",
        iconColor: "text-teal-700 dark:text-teal-300",
        hoverTextColor: "hover:text-teal-600 dark:hover:text-teal-400",
        borderColor: "border-teal-400 dark:border-teal-600",
      };
    } else {
      return {
        bgColor: "bg-green-500 dark:bg-green-600",
        textColor: "text-green-200 dark:text-green-100",
        iconColor: "text-green-300 dark:text-green-200",
        hoverTextColor: "hover:text-green-400 dark:hover:text-green-300",
        borderColor: "border-green-600 dark:border-green-500",
      };
    }
  };

  const downloadPDF = () => {
    if (!summary) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocked! Allow popups for this site to download PDFs.");
      return;
    }

    printWindow.document.write(`
      <html>
      <head>
          <title>Summary</title>
          <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { text-align: center; }
              h2 { color: #2c3e50; }
              ul { padding-left: 20px; }
          </style>
      </head>
      <body>
          <h1>Summary</h1>
          ${summary.sections.map(section => `
              <h2>${section.title}</h2>
              <ul>
                  ${section.content.map(line => `<li>${line}</li>`).join("")}
              </ul>
          `).join("")}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            {line.replace('# ', '')}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-200">
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="text-xl font-bold mb-2 text-gray-700 dark:text-gray-300">
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.includes('|')) {
        const cells = line.split('|').filter(cell => cell.trim());
        const isHeader = lines[index + 1]?.includes('---');
        
        return (
          <div key={index} className="flex gap-4 mb-4">
            {cells.map((cell, cellIndex) => (
              <div
                key={cellIndex}
                className={`flex-1 ${isHeader ? 'font-bold' : ''} text-gray-900 dark:text-gray-300`}
              >
                {cell.trim()}
              </div>
            ))}
          </div>
        );
      }
      if (line.startsWith('\\[') && line.endsWith('\\]')) {
        const mathContent = line.slice(2, -2);
        return (
          <div key={index} className="my-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <MathJax.Context input='tex'>
              <MathJax.Node>{mathContent}</MathJax.Node>
            </MathJax.Context>
          </div>
        );
      }
      if (line.startsWith('- ')) {
        const parts = line.slice(2).split(/(\\\(.*?\\\))/g);
        return (
          <div key={index} className="flex items-start gap-2 mb-2">
            <span className="text-gray-500 dark:text-gray-400">•</span>
            <div className="text-gray-900 dark:text-gray-300">
              {parts.map((part, partIndex) => {
                if (part.startsWith('\\(') && part.endsWith('\\)')) {
                  const mathContent = part.slice(2, -2);
                  return (
                    <MathJax.Context key={partIndex} input='tex'>
                      <MathJax.Node inline>{mathContent}</MathJax.Node>
                    </MathJax.Context>
                  );
                }
                return <span key={partIndex}>{part}</span>;
              })}
            </div>
          </div>
        );
      }
      if (line.includes('\\(') && line.includes('\\)')) {
        const parts = line.split(/(\\\(.*?\\\))/g);
        return (
          <p key={index} className="mb-4 text-gray-900 dark:text-gray-300">
            {parts.map((part, partIndex) => {
              if (part.startsWith('\\(') && part.endsWith('\\)')) {
                const mathContent = part.slice(2, -2);
                return (
                  <MathJax.Context key={partIndex} input='tex'>
                    <MathJax.Node inline>{mathContent}</MathJax.Node>
                  </MathJax.Context>
                );
              }
              return <span key={partIndex}>{part}</span>;
            })}
          </p>
        );
      }
      if (line.includes('**')) {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={index} className="mb-4 text-gray-900 dark:text-gray-300">
            {parts.map((part, partIndex) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <span key={partIndex} className="font-bold">
                    {part.slice(2, -2)}
                  </span>
                );
              }
              return <span key={partIndex}>{part}</span>;
            })}
          </p>
        );
      }
      if (!line.trim()) {
        return <div key={index} className="h-4" />;
      }
      return (
        <p key={index} className="mb-4 text-gray-700 dark:text-gray-300">
          {line}
        </p>
      );
    });
  };

  const renderHomepage = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Action Notes</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">Transform your learning experience with AI-powered tools</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <div 
          onClick={() => setActiveView('teach')}
          className="bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 rounded-xl shadow-2xl p-8 cursor-pointer transform hover:scale-105 transition-all duration-300"
        >
          <div className="flex flex-col items-center text-white">
            <Brain className="h-16 w-16 mb-4" />
            <h2 className="text-2xl font-bold mb-2">TeachMeThat</h2>
            <p className="text-center text-white/90">
              Enter any topic, and let AI transform it into an interactive, comprehensive learning experience tailored just for you!
            </p>
          </div>
        </div>

        <div 
          onClick={() => setActiveView('recap')}
          className="bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-xl shadow-2xl p-8 cursor-pointer transform hover:scale-105 transition-all duration-300"
        >
          <div className="flex flex-col items-center text-white">
            <FileQuestion className="h-16 w-16 mb-4" />
            <h2 className="text-2xl font-bold mb-2">RecapMe</h2>
            <p className="text-center text-white/90">
              Convert your meeting notes into clear, structured summaries instantly
            </p>
          </div>
        </div>

        <div 
          onClick={() => setActiveView('reminder')}
          className="bg-gradient-to-br from-teal-500 to-cyan-600 dark:from-teal-600 dark:to-cyan-700 rounded-xl shadow-2xl p-8 cursor-pointer transform hover:scale-105 transition-all duration-300"
        >
          <div className="flex flex-col items-center text-white">
            <Calendar className="h-16  w-16 mb-4" />
            <h2 className="text-2xl font-bold mb-2">ReMinder</h2>
            <p className="text-center text-white/90">
              Plan your study schedule with AI-generated plans for upcoming tests
            </p>
          </div>
        </div>

        <div 
          onClick={() => setActiveView('quiz')}
          className="bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700 rounded-xl shadow-2xl p-8 cursor-pointer transform hover:scale-105 transition-all duration-300"
        >
          <div className="flex flex-col items-center text-white">
            <PenSquare className="h-16 w-16 mb-4" />
            <h2 className="text-2xl font-bold mb-2">QuickQuizzer</h2>
            <p className="text-center text-white/90">
              Create custom quizzes from your study materials with detailed solutions
            </p>
          </div>
        </div>

        <div 
          onClick={() => setActiveView('flashcards')}
          className="bg-gradient-to-br from-orange-500 to-amber-600 dark:from-orange-600 dark:to-amber-700 rounded-xl shadow-2xl p-8 cursor-pointer transform hover:scale-105 transition-all duration-300"
        >
          <div className="flex flex-col items-center text-white">
            <Bookmark className="h-16 w-16 mb-4" />
            <h2 className="text-2xl font-bold mb-2">ThinkFast</h2>
            <p className="text-center text-white/90">
              Create and study with AI-generated flashcards from your summaries
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMainContent = () => {
    switch (activeView) {
      case 'main':
        return renderHomepage();

      case 'history':
        return (
          <div className="max-w-7xl mx-auto">
            <HistoryComponent user={user} />
          </div>
        );

      case 'settings':
        return (
          <Settings onLogout={handleLogout} />
        );

      case 'flashcards':
        return <ThinkFast />;

      case 'quiz':
        return <Quiz />;

      case 'teach':
        return <TeachMe />;

      case 'recap':
        return <RecapMe />;

      case 'reminder':
        return <ReMinder />;

      default:
        return null;
    }
  };

  return (
    <SubscriptionProvider>
      <Elements stripe={stripePromise}>
        <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'dark' : ''}`}>
          <div
            id="sidebar"
            className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 
                  className="text-xl font-bold text-gray-900 dark:text-white cursor-pointer"
                  onClick={() => setActiveView('main')}
                >
                  Action Notes
                </h2>
              </div>
              <nav className="flex-1 p-4 space-y-2">
                <button
                  onClick={() => setActiveView('main')}
                  className={getSidebarLinkClasses(activeView === 'main')}
                >
                  <Home className="h-5 w-5 mr-2" />
                  Home
                </button>
                <button
                  onClick={() => setActiveView('teach')}
                  className={getSidebarLinkClasses(activeView === 'teach')}
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  TeachMeThat
                </button>
                <button
                  onClick={() => setActiveView('recap')}
                  className={getSidebarLinkClasses(activeView === 'recap')}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  RecapMe
                </button>
                <button
                  onClick={() => setActiveView('flashcards')}
                  className={getSidebarLinkClasses(activeView === 'flashcards')}
                >
                  <Bookmark className="h-5 w-5 mr-2" />
                  ThinkFast
                </button>
                <button
                  onClick={() => setActiveView('quiz')}
                  className={getSidebarLinkClasses(activeView === 'quiz')}
                >
                  <PenSquare className="h-5 w-5 mr-2" />
                  QuickQuizzer
                </button>
                <button
                  onClick={() => setActiveView('reminder')}
                  className={getSidebarLinkClasses(activeView === 'reminder')}
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  ReMinder
                </button>
                <button
                  onClick={() => setActiveView('history')}
                  className={getSidebarLinkClasses(activeView === 'history')}
                >
                  <History className="h-5 w-5 mr-2" />
                  History
                </button>
                <button
                  onClick={() => setActiveView('settings')}
                  className={getSidebarLinkClasses(activeView === 'settings')}
                >
                  <SettingsIcon className="h-5 w-5 mr-2" />
                  Settings
                </button>
              </nav>
            </div>
          </div>

          <div className={`transition-all duration-200 ${isSidebarOpen ? 'ml-64' : 'ml-0'} bg-gray-50 dark:bg-gray-900`}>
            <header className="bg-white dark:bg-gray-800 shadow-sm">
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  id="hamburger-button"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      console.log('Toggling dark mode, current state:', isDarkMode);
                      setIsDarkMode(!isDarkMode);
                    }}
                    className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                  </button>
                </div>
              </div>
            </header>

            <main className="container mx-auto px-4 py-8">
              {activeView === 'settings' ? (
                <Settings onLogout={handleLogout} />
              ) : (
                renderMainContent()
              )}
            </main>
          </div>

          {showPricingModal && <PricingModal show={showPricingModal} setShow={setShowPricingModal} />}
        </div>
      </Elements>
    </SubscriptionProvider>
  );
}

export default App;