import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { AppUser } from './types/types';
import ProjectPage from './components/ProjectPage';
import CalendarPage from './components/CalendarPage';
import TeachMe from './components/tools/TeachMe';
import RecapMe from './components/tools/RecapMe';
import ThinkFast from './components/tools/ThinkFast';
import Quiz from './components/tools/Quiz';
import Settings from './components/Settings';
import AnalyticsPage from './components/AnalyticsPage';
import { Dialog, DialogContent, DialogTitle } from '@radix-ui/react-dialog';
import { Home, Calendar, Users, Settings as SettingsIcon, LogOut, Lock, Mail } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import './index.css';
import { Homepage } from './components/Homepage';
import ndLogo from './components/assets/nd-logo-transparent.png';

const getAvatarInitial = (user: AppUser | null) => {
  if (!user) return 'U';
  return user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U';
};

function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<
    'home' | 'tools' | 'history' | 'settings' | 'teach' | 'recap' | 'flashcards' | 'quiz' | 'studyTechniques' | 'calendar' | 'projects' | 'analytics'
  >('home');
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#161512] text-white font-manrope dark:bg-[#ffffff] dark:text-black">
      <div className="flex h-full grow flex-col">
        {/* Global Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#35322c] px-10 py-3">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 text-white dark:text-black">
              <img
                src={ndLogo}
                alt="ND Logo"
                className="h-16 w-auto filter dark:invert"
              />
            </div>
            <div className="flex items-center gap-9">
              <button
                className={`text-white text-sm font-medium leading-normal ${activeView === 'home' ? 'underline' : ''}`}
                onClick={() => {
                  setActiveView('home');
                  navigate('/');
                }}
              >
                Home
              </button>
              <button
                className={`text-white text-sm font-medium leading-normal ${activeView === 'calendar' ? 'underline' : ''}`}
                onClick={() => {
                  setActiveView('calendar');
                  navigate('/calendar');
                }}
              >
                Calendar
              </button>
              <button
                className={`text-white text-sm font-medium leading-normal ${activeView === 'analytics' ? 'underline' : ''}`}
                onClick={() => {
                  setActiveView('analytics');
                  navigate('/analytics');
                }}
              >
                Analytics
              </button>
              <button
                className={`text-white text-sm font-medium leading-normal ${activeView === 'settings' ? 'underline' : ''}`}
                onClick={() => {
                  setActiveView('settings');
                  navigate('/settings');
                }}
              >
                Settings
              </button>
            </div>
          </div>
          <div className="flex flex-1 justify-end gap-8">
            <label className="flex flex-col min-w-40 h-10 max-w-64">
              <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
                <div className="text-[#b3aea2] flex border-none bg-[#35322c] items-center justify-center pl-4 rounded-l-xl border-r-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                  </svg>
                </div>
                <input
                  placeholder="Search"
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-[#35322c] focus:border-none h-full placeholder:text-[#b3aea2] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                />
              </div>
            </label>
            <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 bg-[#35322c] text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
                <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
              </svg>
            </button>
            {user?.user_metadata?.avatar_url ? (
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                style={{ backgroundImage: `url("${user.user_metadata.avatar_url}")` }}
              ></div>
            ) : (
              <div
                className="flex items-center justify-center aspect-square rounded-full size-10 bg-[#4f4b40] text-white text-lg font-semibold"
              >
                {getAvatarInitial(user)}
              </div>
            )}
            <Button
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#c6a351] text-[#161512] text-sm font-bold tracking-[0.015em]"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span className="truncate">Sign Out</span>
            </Button>
          </div>
        </header>
        {/* Main Content */}
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <Routes>
              <Route path="/" element={<Homepage user={user} setActiveView={setActiveView} />} />
              <Route
                path="/project/:projectId"
                element={<ProjectPage user={user} setActiveView={setActiveView} />}
              />
              <Route
                path="/calendar"
                element={<CalendarPage user={user} setActiveView={setActiveView} />}
              />
              <Route
                path="/analytics"
                element={<AnalyticsPage user={user} setActiveView={setActiveView} />}
              />
              <Route
                path="/settings"
                element={<Settings user={user} setActiveView={setActiveView} onLogout={handleLogout} />}
              />
              <Route
                path="/teach/:projectId"
                element={<TeachMe />}
              />
              <Route
                path="/recap/:projectId"
                element={<RecapMe />}
              />
              <Route
                path="/thinkfast/:projectId"
                element={<ThinkFast user={user} activeView="flashcards" setActiveView={setActiveView} />}
              />
              <Route
                path="/quiz/:projectId"
                element={<Quiz />}
              />
            </Routes>
          </div>
        </div>
      </div>
      {/* Auth Modal */}
      <Dialog open={showAuthModal && !user} onOpenChange={setShowAuthModal}>
        <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 sm:max-w-[500px] bg-[#24221e] border-[#4f4a40] p-8 rounded-lg shadow-lg z-50">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-white">Action Notes</h1>
          </div>
          <DialogTitle className="text-2xl font-bold text-white text-center">
            {isSignup ? 'Sign Up' : 'Log In'}
          </DialogTitle>
          {error && (
            <div className="text-red-600 text-sm font-medium bg-red-100 px-3 py-1 rounded mb-4">
              {error}
            </div>
          )}
          <div className="space-y-4 mt-4">
            {isSignup && (
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-[#b3aea2]" />
                <Input
                  type="text"
                  placeholder="Name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-[#35322c] border-[#4f4a40] text-white placeholder-[#b3aea2] focus:border-[#c6a351]"
                />
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-[#b3aea2]" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#35322c] border-[#4f4a40] text-white placeholder-[#b3aea2] focus:border-[#c6a351]"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-[#b3aea2]" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#35322c] border-[#4f4a40] text-white placeholder-[#b3aea2] focus:border-[#c6a351]"
              />
            </div>
            <Button
              onClick={handleEmailAuth}
              className="w-full bg-[#c6a351] text-[#161512] hover:bg-[#b5923e] py-2 rounded-md"
            >
              {isSignup ? 'Sign Up' : 'Log In'}
            </Button>
            <Button
              onClick={handleGoogleSignIn}
              className="w-full bg-[#35322c] border-[#4f4a40] text-white hover:bg-[#4f4a40] py-2 rounded-md flex items-center justify-center"
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
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l-3.15-3.1-5.062C17.45 2.09 14.97 1 12 1 7.85 1 4.01 3.44 2.18 7.07l3.06 2.84c.87-2.60 3.30-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>
            <div className="text-center">
              <Button
                onClick={() => setIsSignup(!isSignup)}
                className="text-[#c6a351] hover:underline bg-transparent text-white"
              >
                {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;