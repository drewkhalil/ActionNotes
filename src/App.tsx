import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { StudyTechniques } from './components/StudyTechniques';
import PricingModal from './components/PricingModal';
import {
  FileText, Upload, Clock, CheckCircle2, AlertCircle, X, Zap, Infinity, Download,
  HelpCircle, Brain, Bookmark, PenSquare, Mail, Lock, User, Wrench, Search, Bell, Settings as SettingsIcon,
} from 'lucide-react';
import jsPDF from 'jspdf';
import ReactMarkdown from 'react-markdown';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import ThinkFast from './components/ThinkFast';
import Quiz from './components/Quiz';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import TeachMe from './components/TeachMe';
import RecapMe from './components/RecapMe';
import MathJax from 'react-mathjax2';
import { AppUser, Summary } from './types/types';
import { Dialog, DialogContent, DialogTitle } from '@radix-ui/react-dialog';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import ProjectPage from './components/ProjectPage';
import { Homepage } from './components/Homepage';
import './index.css';
import CalendarPage from './components/CalendarPage';
import Settings from './components/Settings';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<
    'home' | 'tools' | 'history' | 'settings' | 'teach' | 'recap' | 'flashcards' | 'quiz' | 'studyTechniques'
  >('home');
  const [recentSummaries] = useState<Summary[]>([
    {
      id: 'some-id',
      project_id: 'some-project-id',
      content: 'Content from your last summary...',
      created_at: new Date().toISOString(),
      sections: [{ title: 'Recent Summary 1', content: ['Content from your last summary...'] }],
    },
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            username: session.user.user_metadata?.username || '',
            created_at: session.user.created_at,
            app_metadata: session.user.app_metadata || {},
            user_metadata: session.user.user_metadata || {},
            aud: session.user.aud,
          });
          setShowAuthModal(false);
        } else {
          setShowAuthModal(true);
        }

        supabase.auth.onAuthStateChange((event, session) => {
          console.log('Supabase auth event:', event, 'Session:', session);
          if (event === 'SIGNED_IN' && session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email,
              username: session.user.user_metadata?.username || '',
              created_at: session.user.created_at,
              app_metadata: session.user.app_metadata || {},
              user_metadata: session.user.user_metadata || {},
              aud: session.user.aud,
            });
            setShowAuthModal(false);
            setError(null);
            localStorage.setItem('userId', session.user.id);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setShowAuthModal(true);
            localStorage.clear();
          } else if (event === 'USER_UPDATED') {
            setUser({
              id: session?.user.id || '',
              email: session?.user.email,
              username: session?.user.user_metadata?.username || '',
              created_at: session?.user.created_at || new Date().toISOString(),
              app_metadata: session?.user.app_metadata || {},
              user_metadata: session?.user.user_metadata || {},
              aud: session?.user.aud || 'authenticated',
            });
          }
        });
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Failed to initialize authentication. Please try again.');
      }
    };

    initializeAuth();
  }, []);

  const handleEmailAuth = async () => {
    setError(null);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username },
          },
        });
        if (error) throw error;
        setError('Please check your email to verify your account.');
        setIsSignup(false);
        setUsername('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !user.user_metadata?.username) {
        const username = prompt('Please enter your username:');
        if (username) {
          await supabase.auth.updateUser({
            data: { username },
          });
        }
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Google sign-in failed. Please try again.');
    }
  };

  const handleFeatureClick = (view: typeof activeView) => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setActiveView(view);
      navigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsProcessing(true);

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('⚠️ Error: Missing user ID. Please log in.');
        setIsProcessing(false);
        return;
      }

      if (!user) {
        alert('⚠️ Error: User not found. Please log in.');
        setIsProcessing(false);
        return;
      }

      const usageResponse = await fetch('https://actionnotes-production.up.railway.app/api/updateUsage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          content: summary.sections && summary.sections.length > 0 ? summary.sections[0].content.join('\n') : '',
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      if (usageData.remaining !== 'unlimited') {
        localStorage.setItem('summaryUsage', JSON.stringify({
          count: 3 - usageData.remaining,
          lastReset: Date.now(),
        }));
      }
    } catch (error: any) {
      console.error('❌ Error:', error);
      alert('Something went wrong. Please try again.');
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
            created_at: new Date().toISOString(),
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
      if (fileType === 'txt' || fileType === 'md') {
        const text = await file.text();
        setInput(text);
        const summary = await generateSummary(text);
        setSummary(summary);
      } else {
        alert('Unsupported file format. Please convert to .txt before uploading.');
      }
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateSummary = async (text: string): Promise<Summary> => {
    try {
      if (user?.id) {
        const { error } = await supabase
          .from('history')
          .insert({
            user_id: user.id,
            type: 'summary',
            title: 'Summary',
            content: text,
            created_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      return {
        id: 'some-id',
        project_id: 'some-project-id',
        content: text,
        created_at: new Date().toISOString(),
        sections: [{ title: 'Summary', content: text.split('\n') }],
      };
    } catch (error: any) {
      console.error('Error saving summary:', error);
      throw new Error('Failed to save summary');
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

  const handleSubscribe = async (plan: 'starter' | 'ultimate') => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('⚠️ Please log in before subscribing.');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, plan }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error('Stripe not initialized');
      }

      const result = await stripe.redirectToCheckout({ sessionId });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error: any) {
      console.error('Error starting checkout:', error);
      alert(`Failed to start checkout: ${error.message}`);
    }
  };

  const downloadPDF = () => {
    if (!summary) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocked! Allow popups for this site to download PDFs.');
      return;
    }

    printWindow.document.write(`
      <html>
      <head>
          <title>Summary</title>
          <style>
              body { font-family: Arial, sans-serif; padding: 20px; background-color: #FFFFFF; color: #1A1A1A; }
              h1 { text-align: center; color: #1A1A1A; }
              h2 { color: #1A1A1A; }
              ul { padding-left: 20px; }
              li { margin-bottom: 8px; }
          </style>
      </head>
      <body>
          <h1>Summary</h1>
          {summary.sections && summary.sections.map(section => (
            <div key={section.title}>
              <h2>{section.title}</h2>
              <ul>
                {section.content.map(line => <li key={line}>{line}</li>)}
              </ul>
            </div>
          ))}
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
          <h1 key={index} className="text-3xl font-bold mb-4 text-[#1A1A1A]">
            {line.replace('# ', '')}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="text-2xl font-bold mb-3 text-[#1A1A1A]">
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="text-xl font-bold mb-2 text-[#1A1A1A]">
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
                className={`flex-1 ${isHeader ? 'font-bold' : ''} text-[#4A4F57]`}
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
          <div key={index} className="my-4 p-4 bg-[#EAEAEA] rounded-lg">
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
            <span className="text-[#4A4F57]">•</span>
            <div className="text-[#4A4F57]">
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
          <p key={index} className="mb-4 text-[#4A4F57]">
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
          <p key={index} className="mb-4 text-[#4A4F57]">
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
        <p key={index} className="mb-4 text-[#4A4F57]">
          {line}
        </p>
      );
    });
  };

  const renderToolpage = () => (
    <div className="space-y-8 bg-[#FFFFFF]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#1A1A1A] mb-2">Action Notes</h1>
        <p className="text-lg text-[#4A4F57]">Transform your learning experience with AI-powered tools</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        <div 
          onClick={() => handleFeatureClick('teach')}
          className="bg-[#D6BCFA] p-6 rounded-lg shadow-md cursor-pointer transition-all duration-300"
        >
          <div className="flex flex-col items-center">
            <Brain className="h-16 w-16 mb-4 text-[#1E3A5F]" />
            <h2 className="text-2xl font-bold mb-2 text-[#1A1A1A]">TeachMeThat</h2>
            <p className="text-center text-[#4A4F57]">
              Enter any topic, and let AI transform it into an interactive, comprehensive learning experience tailored just for you!
            </p>
          </div>
        </div>
        <div 
          onClick={() => handleFeatureClick('recap')}
          className="bg-[#C6F6D5] p-6 rounded-lg shadow-md cursor-pointer transition-all duration-300"
        >
          <div className="flex flex-col items-center">
            <FileText className="h-16 w-16 mb-4 text-[#1E3A5F]" />
            <h2 className="text-2xl font-bold mb-2 text-[#1A1A1A]">RecapMe</h2>
            <p className="text-center text-[#4A4F57]">
              Convert your meeting notes into clear, structured summaries instantly
            </p>
          </div>
        </div>
        <div 
          onClick={() => handleFeatureClick('studyTechniques')}
          className="bg-[#4FD1C5] p-6 rounded-lg shadow-md cursor-pointer transition-all duration-300"
        >
          <div className="flex flex-col items-center">
            <PenSquare className="h-16 w-16 mb-4 text-[#1E3A5F]" />
            <h2 className="text-2xl font-bold mb-2 text-[#1A1A1A]">StudyTechniques</h2>
            <p className="text-center text-[#4A4F57]">
              Learn and apply effective study methods meant to induce proper study habits
            </p>
          </div>
        </div>
        <div 
          onClick={() => handleFeatureClick('quiz')}
          className="bg-[#FECACA] p-6 rounded-lg shadow-md cursor-pointer transition-all duration-300"
        >
          <div className="flex flex-col items-center">
            <PenSquare className="h-16 w-16 mb-4 text-[#1E3A5F]" />
            <h2 className="text-2xl font-bold mb-2 text-[#1A1A1A]">QuickQuizzer</h2>
            <p className="text-center text-[#4A4F57]">
              Create custom quizzes from your study materials with detailed solutions
            </p>
          </div>
        </div>
        <div 
          onClick={() => handleFeatureClick('flashcards')}
          className="bg-[#FED7AA] p-6 rounded-lg shadow-md cursor-pointer transition-all duration-300"
        >
          <div className="flex flex-col items-center">
            <Bookmark className="h-16 w-16 mb-4 text-[#1E3A5F]" />
            <h2 className="text-2xl font-bold mb-2 text-[#1A1A1A]">ThinkFast</h2>
            <p className="text-center text-[#4A4F57]">
              Create and study with AI-generated flashcards from your summaries
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMainContent = () => {
    switch (activeView) {
      case 'home':
        return <Homepage user={user} setActiveView={setActiveView} />;
      case 'tools':
        return renderToolpage();
      case 'flashcards':
        return <ThinkFast user={user} />;
      case 'studyTechniques':
        return <StudyTechniques user={user} />;
      case 'quiz':
        return <Quiz />;
      case 'teach':
        return <TeachMe />;
      case 'recap':
        return <RecapMe />;
      default:
        return <div className="text-center text-[#4A4F57]">Invalid view</div>;
    }
  };

  return (
    <SubscriptionProvider>
      <Elements stripe={stripePromise}>
        <div className="min-h-screen transition-colors duration-200">
          {/* Auth Modal */}
          <Dialog open={showAuthModal && !user} onOpenChange={setShowAuthModal}>
            {(showAuthModal && !user) && (
              <div className="fixed inset-0 bg-black/50 z-40" aria-hidden="true" />
            )}
            <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 sm:max-w-[500px] bg-[#FFFFFF] p-8 rounded-lg shadow-lg z-50">
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold text-[#1A1A1A]">Action Notes</h1>
              </div>
              <DialogTitle className="text-2xl font-bold text-[#1A1A1A] text-center">
                {isSignup ? 'Sign Up' : 'Log In'}
              </DialogTitle>
              <div className="space-y-4 mt-4">
                {isSignup && (
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-[#4A4F57]" />
                    <input
                      type="text"
                      placeholder="Name"
                      value={username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 border border-[#EAEAEA] rounded-md focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F] text-[#4A4F57]"
                    />
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-[#4A4F57]" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-[#EAEAEA] rounded-md focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F] text-[#4A4F57]"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-[#4A4F57]" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-[#EAEAEA] rounded-md focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F] text-[#4A4F57]"
                  />
                </div>
                <button
                  onClick={handleEmailAuth}
                  className="w-full bg-[#1E3A8A] hover:bg-[#1A2F6D] text-white py-2 rounded-md"
                >
                  {isSignup ? 'Sign Up' : 'Log In'}
                </button>
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full bg-[#FFFFFF] border border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#EAEAEA] py-2 rounded-md flex items-center justify-center"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.20-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-1.01 7.28-2.74l-3.57-2.77c-1.02.68-2.31 1.08-3.71 1.08-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C4.01 20.56 7.85 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.85 1 4.01 3.44 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </button>
                <div className="text-center">
                  <button
                    onClick={() => setIsSignup(!isSignup)}
                    className="text-[#1E3A5F] hover:underline"
                  >
                    {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="bg-[#FFFFFF]">
            <header className="sticky top-0 z-10 border-b bg-white">
              <div className="w-full flex h-16 items-center justify-between px-4 md:px-6">
                <div
                  onClick={() => {
                    setActiveView('home');
                    navigate('/');
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-xl font-bold text-[#1E3A8A]">Action Notes</span>
                </div>

                <div className="relative mx-4 hidden flex-1 max-w-md md:flex">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <input
                    type="search"
                    placeholder="Search projects..."
                    className="w-full bg-[#F5F5F5] pl-8 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div className="flex items-center gap-4">
                  {error && (
                    <span className="text-red-600 text-sm font-medium bg-red-100 px-3 py-1 rounded">
                      {error}
                    </span>
                  )}
                  <button className="p-2 rounded-md text-[#1A1A1A] hover:bg-[#F5F5F5]">
                    <Bell className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setActiveView('tools');
                      navigate('/');
                    }}
                    className="bg-white border border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#F5F5F5] px-4 py-2 rounded-md flex items-center"
                  >
                    <Wrench className="mr-2 h-4 w-4" /> Tools Overview
                  </button>
                  <button
                    onClick={() => {
                      if (!user) {
                        setShowAuthModal(true);
                      } else {
                        navigate('/settings');
                      }
                    }}
                    className="p-2 rounded-md text-[#1A1A1A] hover:bg-[#F5F5F5]"
                  >
                    <SettingsIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </header>

            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={renderMainContent()} />
                <Route
                  path="/project/:projectId"
                  element={<ProjectPage user={user} setActiveView={setActiveView} />}
                />
                <Route path="/thinkfast/:projectId" element={<ThinkFast user={user} />} />
                <Route path="/thinkfast" element={<ThinkFast user={user} />} />
                <Route path="/calendar" element={<CalendarPage user={user} setActiveView={setActiveView} />} />
                <Route
                  path="/settings"
                  element={<Settings user={user} setActiveView={setActiveView} onLogout={handleLogout} />}
                />
                <Route path="/login" element={<div>Login Page (Placeholder)</div>} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>

          {showPricingModal && <PricingModal show={showPricingModal} setShow={setShowPricingModal} />}
        </div>
      </Elements>
    </SubscriptionProvider>
  );
}

export default App;