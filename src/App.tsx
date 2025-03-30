import React, { useState, useRef, useEffect } from 'react';
import PricingModal from "./PricingModal";
import { FileText, Upload, Clock, CheckCircle2, AlertCircle, X, Zap, Infinity, Download, Menu, Settings as SettingsIcon, History, HelpCircle, BookOpen, Sun, Moon, Brain, FileQuestion, Home, Bookmark, PenSquare } from 'lucide-react';
import jsPDF from 'jspdf';
import ReactMarkdown from 'react-markdown';
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import Login from './components/Login';
import { Settings } from './components/Settings';
import { History as HistoryComponent } from './components/History';
import Flashcards from './components/Flashcards';
import Quiz from './components/Quiz';
import { supabase } from './lib/supabase';
import type { User } from './lib/supabase';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import TeachMe from './components/TeachMe';
import RecapMe from './components/RecapMe';
import MathJax from 'react-mathjax2';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session check:', session);
        if (session?.user) {
          setUser(session.user);
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
      setUser(session?.user ?? null);
      if (session?.user) {
        localStorage.setItem('userId', session.user.id);
      } else {
        localStorage.removeItem('userId');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <SubscriptionProvider>
      <Elements stripe={stripePromise}>
        <MainApp />
      </Elements>
    </SubscriptionProvider>
  );
}

type Summary = {
  sections: { title: string; content: string[] }[];
  timestamp: string;
};

function MainApp() {
  const [user, setUser] = useState<any>(null);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeView, setActiveView] = useState<'main' | 'history' | 'settings' | 'teach' | 'recap' | 'flashcards' | 'quiz'>('main');

  const [recentSummaries] = useState<Summary[]>([
    { sections: [{ title: "Recent Summary 1", content: ["Content from your last summary..."] }], timestamp: "2024-03-10 14:30" }
  ]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local storage
      localStorage.removeItem('userId');
      localStorage.removeItem('usageCounts');
      localStorage.removeItem('userPlan');
      localStorage.removeItem('lastUsageReset');
      
      // Reset state
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
    const savedTheme = localStorage.getItem("theme") || "light";
    setIsDarkMode(savedTheme === "dark");
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  useEffect(() => {
    const theme = isDarkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [isDarkMode]);

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
        return;
      }

      // Generate summary
      const summary = await generateSummary(input);
      setSummary(summary);

      // Save to history
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

      // Update usage in frontend
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
      // Save to history
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
      // Save to history
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
      // Fix math expressions first
      .replace(/\\\[(.*?)\\\]/gs, (_, math) => `\n\\[${math.trim()}\\]\n`)
      .replace(/\\\((.*?)\\\)/g, (_, math) => `\\(${math.trim()}\\)`)
      // Remove redundant bold markers around headers
      .replace(/^\*\*(#+)\s*(.*?)\*\*$/gm, (_, hashes, title) => `${hashes} ${title.trim()}`)
      // Fix headers with proper spacing
      .replace(/^(#+)\s*(.*)$/gm, (_, hashes, title) => `\n${hashes} ${title.trim()}\n`)
      // Fix bullet points with proper spacing and formatting
      .replace(/^[-*•]\s*/gm, '\n• ')
      // Fix section breaks
      .replace(/^-{3,}$/gm, '\n---\n')
      // Fix "where:" and similar list intros
      .replace(/^where:$/gm, 'where:\n')
      // Fix numbered lists
      .replace(/^(\d+)\.\s*/gm, (_, num) => `${num}. `)
      // Fix special characters and units
      .replace(/([0-9])°([CF])/g, '$1°$2')
      .replace(/(\d+)\s*([KM])?\s*mol\^?-?\s*1/g, '$1$2 mol⁻¹')
      .replace(/(\d+)\s*K\^?-?\s*1/g, '$1 K⁻¹')
      // Fix table formatting
      .replace(/\|([^|]*)\|/g, (_, content) => `|${content.trim()}|`)
      .replace(/\n\s*\|\s*([^|]*)\s*\|\s*\n/g, '\n| $1 |\n')
      // Clean up spacing while preserving structure
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
      hover:text-emerald-600 dark:hover:text-emerald-400 
      hover:bg-gray-200 dark:hover:bg-gray-700`;
  };

  const getThemeStyles = () => {
    if (activeView === "teach") {
      return {
        bgColor: isDarkMode ? "bg-purple-700" : "bg-purple-500",
        textColor: isDarkMode ? "text-purple-200" : "text-purple-800",
        iconColor: isDarkMode ? "text-purple-300" : "text-purple-700",
        hoverTextColor: isDarkMode ? "hover:text-purple-400" : "hover:text-purple-600",
        borderColor: isDarkMode ? "border-purple-600" : "border-purple-400",
      };
    } else {
      return {
        bgColor: isDarkMode ? "bg-emerald-700" : "bg-emerald-500",
        textColor: isDarkMode ? "text-emerald-200" : "text-emerald-800",
        iconColor: isDarkMode ? "text-emerald-300" : "text-emerald-700",
        hoverTextColor: isDarkMode ? "hover:text-emerald-400" : "hover:text-emerald-600",
        borderColor: isDarkMode ? "border-emerald-600" : "border-emerald-400",
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
      // Handle headers
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="text-3xl font-bold mb-4 text-gray-900">
            {line.replace('# ', '')}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="text-2xl font-bold mb-3 text-gray-800">
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="text-xl font-bold mb-2 text-gray-700">
            {line.replace('### ', '')}
          </h3>
        );
      }

      // Handle tables
      if (line.includes('|')) {
        const cells = line.split('|').filter(cell => cell.trim());
        const isHeader = lines[index + 1]?.includes('---');
        
        return (
          <div key={index} className="flex gap-4 mb-4">
            {cells.map((cell, cellIndex) => (
              <div
                key={cellIndex}
                className={`flex-1 ${isHeader ? 'font-bold' : ''}`}
              >
                {cell.trim()}
              </div>
            ))}
          </div>
        );
      }

      // Handle block math expressions
      if (line.startsWith('\\[') && line.endsWith('\\]')) {
        const mathContent = line.slice(2, -2);
        return (
          <div key={index} className="my-4 p-4 bg-gray-50 rounded-lg">
            <MathJax.Context input='tex'>
              <MathJax.Node>{mathContent}</MathJax.Node>
            </MathJax.Context>
          </div>
        );
      }

      // Handle bullet points with inline math
      if (line.startsWith('- ')) {
        const parts = line.slice(2).split(/(\\\(.*?\\\))/g);
        return (
          <div key={index} className="flex items-start gap-2 mb-2">
            <span className="text-gray-500">•</span>
            <div>
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

      // Handle lines with inline math
      if (line.includes('\\(') && line.includes('\\)')) {
        const parts = line.split(/(\\\(.*?\\\))/g);
        return (
          <p key={index} className="mb-4">
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

      // Handle bold text
      if (line.includes('**')) {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={index} className="mb-4">
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

      // Handle empty lines
      if (!line.trim()) {
        return <div key={index} className="h-4" />;
      }

      // Regular text
      return (
        <p key={index} className="mb-4 text-gray-700">
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
          className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-2xl p-8 cursor-pointer transform hover:scale-105 transition-all duration-300"
        >
          <div className="flex flex-col items-center text-white">
            <Brain className="h-16 w-16 mb-4" />
            <h2 className="text-2xl font-bold mb-2">TeachMeThat</h2>
            <p className="text-center text-white/90">
              Transform any topic into an interactive learning experience with AI-powered explanations
            </p>
          </div>
        </div>

        <div 
          onClick={() => setActiveView('recap')}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-2xl p-8 cursor-pointer transform hover:scale-105 transition-all duration-300"
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
          onClick={() => setActiveView('flashcards')}
          className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-2xl p-8 cursor-pointer transform hover:scale-105 transition-all duration-300"
        >
          <div className="flex flex-col items-center text-white">
            <Bookmark className="h-16 w-16 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Flashcards</h2>
            <p className="text-center text-white/90">
              Create and study with AI-generated flashcards from your summaries
            </p>
          </div>
        </div>

        <div 
          onClick={() => setActiveView('quiz')}
          className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-2xl p-8 cursor-pointer transform hover:scale-105 transition-all duration-300"
        >
          <div className="flex flex-col items-center text-white">
            <PenSquare className="h-16 w-16 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Quiz Generator</h2>
            <p className="text-center text-white/90">
              Create custom quizzes from your study materials with detailed solutions
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
          <Settings user={user} onLogout={handleLogout} />
        );

      case 'flashcards':
        return <Flashcards />;

      case 'quiz':
        return <Quiz />;

      case 'teach':
        return <TeachMe />;

      case 'recap':
        return <RecapMe />;

      default:
        return null;
    }
  };

  return (
    <SubscriptionProvider>
      <Elements stripe={stripePromise}>
        <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? "bg-gray-900 text-gray-300" : "bg-gray-50 text-gray-900"}`}>
          {/* Sidebar */}
          <div
            id="sidebar"
            className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Action Notes</h2>
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
                  Flashcards
                </button>
                <button
                  onClick={() => setActiveView('quiz')}
                  className={getSidebarLinkClasses(activeView === 'quiz')}
                >
                  <PenSquare className="h-5 w-5 mr-2" />
                  Quiz Generator
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

          {/* Main Content */}
          <div className={`transition-all duration-200 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
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
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                  </button>
                </div>
              </div>
            </header>

            <main className="container mx-auto px-4 py-8">
              {activeView === 'settings' ? (
                <Settings user={user} onLogout={handleLogout} />
              ) : (
                renderMainContent()
              )}
            </main>
          </div>

          {/* Pricing Modal */}
          {showPricingModal && <PricingModal show={showPricingModal} setShow={setShowPricingModal} />}
        </div>
      </Elements>
    </SubscriptionProvider>
  );
}

export default App;
