import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Badge } from './ui/badge';
import { Clock, Play, Pause, RefreshCw, Star, BookOpen, Brain, Lightbulb, Calendar, AlarmClock, Coffee, Volume2, Music } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AppUser } from '../types/types';

interface StudyTechniquesProps {
  user: AppUser | null;
}

interface StudyMethod {
  name: string;
  description: string;
  workDuration: number;
  breakDuration: number;
  benefits?: string[];
}

const studyMethods: StudyMethod[] = [
  {
    name: 'Pomodoro Technique',
    description: 'Work for 25 minutes, then take a 5-minute break. Repeat 4 times, then take a longer 15-30 minute break.',
    workDuration: 25,
    breakDuration: 5,
    benefits: ['Improves focus', 'Reduces burnout', 'Increases productivity'],
  },
  {
    name: 'Feynman Technique',
    description: 'Explain a concept in simple terms as if teaching it to a child. Identify gaps and review.',
    workDuration: 30,
    breakDuration: 0,
    benefits: ['Identifies knowledge gaps', 'Simplifies complex ideas', 'Improves understanding'],
  },
  {
    name: 'Active Recall',
    description: 'Test yourself on the material without looking at notes. Use flashcards or questions.',
    workDuration: 20,
    breakDuration: 0,
    benefits: ['Strengthens memory', 'Identifies knowledge gaps', 'Improves test performance'],
  },
  {
    name: 'Spaced Repetition',
    description: 'Review material at increasing intervals over time.',
    workDuration: 15,
    breakDuration: 0,
    benefits: ['Enhances memory', 'Efficient learning', 'Better recall'],
  },
  {
    name: 'Blurting',
    description: 'Write down everything you remember about a topic, then check for gaps.',
    workDuration: 10,
    breakDuration: 0,
    benefits: ['Identifies knowledge gaps', 'Reinforces memory', 'Improves recall'],
  },
  {
    name: 'SQ3R',
    description: 'Survey, Question, Read, Recite, Review. A structured method for reading textbooks.',
    workDuration: 40,
    breakDuration: 5,
    benefits: ['Improves comprehension', 'Organizes information', 'Enhances retention'],
  },
];

const methodColors: { [key: string]: string } = {
  'Pomodoro Technique': 'bg-[#B3E6E5]',
  'Feynman Technique': 'bg-[#FFD6D6]',
  'Active Recall': 'bg-[#E4D7FF]',
  'Spaced Repetition': 'bg-[#D1F7E0]',
  'Blurting': 'bg-[#FFE8C8]',
  'SQ3R': 'bg-[#B3E6E5]',
};

const methodIcons: { [key: string]: JSX.Element } = {
  'Pomodoro Technique': <Clock className="h-6 w-6 text-[#1E3A8A]" />,
  'Feynman Technique': <BookOpen className="h-6 w-6 text-[#1E3A8A]" />,
  'Active Recall': <Brain className="h-6 w-6 text-[#1E3A8A]" />,
  'Spaced Repetition': <Calendar className="h-6 w-6 text-[#1E3A8A]" />,
  'Blurting': <Lightbulb className="h-6 w-6 text-[#1E3A8A]" />,
  'SQ3R': <BookOpen className="h-6 w-6 text-[#1E3A8A]" />,
};

const timerSound = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');

export function StudyTechniques({ user }: StudyTechniquesProps) {
  const [selectedMethod, setSelectedMethod] = useState<StudyMethod | null>(null);
  const [customMethods, setCustomMethods] = useState<StudyMethod[]>([]);
  const [customMethodName, setCustomMethodName] = useState('');
  const [customMethodDesc, setCustomMethodDesc] = useState('');
  const [customWorkDuration, setCustomWorkDuration] = useState('');
  const [customBreakDuration, setCustomBreakDuration] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [deleteMethodName, setDeleteMethodName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("techniques");
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);

  // Debugging: Log when activeTab changes
  useEffect(() => {
    console.log("Active tab changed to:", activeTab);
  }, [activeTab]);

  useEffect(() => {
    const loadCustomMethods = async () => {
      if (!user) {
        setCustomMethods([]);
        return;
      }
      const { data, error } = await supabase
        .from('custom_study_methods')
        .select('*')
        .eq('user_id', user.id);
      if (error) {
        console.error('Error loading custom methods:', error.message);
        alert(`Failed to load custom methods: ${error.message}`);
      } else {
        const methods = data?.map(item => ({
          name: item.name,
          description: item.description,
          workDuration: item.work_duration,
          breakDuration: item.break_duration,
        })) || [];
        setCustomMethods(methods);
      }
    };

    loadCustomMethods();
  }, [user]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          const newTimeLeft = prev - 1;
          if (newTimeLeft <= 0) {
            timerSound.play().catch(err => console.error('Error playing sound:', err));
            if (!isBreak) {
              alert(`${selectedMethod?.name} session complete! Time for a break.`);
              setIsBreak(true);
              return selectedMethod?.breakDuration ? selectedMethod.breakDuration * 60 : 0;
            } else {
              alert(`Break is over! Starting a new ${selectedMethod?.name} session.`);
              setIsBreak(false);
              return selectedMethod ? selectedMethod.workDuration * 60 : 0;
            }
          }
          return newTimeLeft;
        });
        if (!isBreak) {
          setTimeSpent(prev => prev + 1);
        }
      }, 1000);
    } else if (timeLeft === 0 && selectedMethod?.breakDuration) {
      if (!isBreak) {
        setIsBreak(true);
        setTimeLeft(selectedMethod.breakDuration * 60);
        if (selectedMethod.name === 'Pomodoro Technique') {
          setPomodoroCount(prev => prev + 1);
        }
      } else {
        setIsBreak(false);
        setTimeLeft(selectedMethod.workDuration * 60);
      }
    } else {
      setIsTimerRunning(false);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerRunning, timeLeft, isBreak, selectedMethod]);

  useEffect(() => {
    if (selectedMethod) {
      const totalSeconds = (isBreak ? selectedMethod.breakDuration : selectedMethod.workDuration) * 60;
      setTimeLeft(totalSeconds);
      setPomodoroMinutes(Math.floor(totalSeconds / 60));
      setPomodoroSeconds(totalSeconds % 60);
    }
  }, [selectedMethod, isBreak]);

  const deleteCustomMethod = async (methodName: string) => {
    if (!user) {
      alert('You must be logged in to delete custom methods.');
      return;
    }

    const { error } = await supabase
      .from('custom_study_methods')
      .delete()
      .eq('user_id', user.id)
      .eq('name', methodName);
    if (error) {
      console.error('Error deleting custom method:', error.message);
      alert(`Failed to delete custom method: ${error.message}`);
      return;
    }

    setCustomMethods(customMethods.filter(method => method.name !== methodName));
    if (selectedMethod?.name === methodName) {
      setSelectedMethod(null);
      setTimeLeft(0);
      setIsTimerRunning(false);
    }
    setDeleteMethodName(null);
  };

  const selectMethod = (method: StudyMethod) => {
    setSelectedMethod(method);
    setTimeLeft(method.workDuration * 60);
    setIsTimerRunning(false);
    setIsBreak(false);
    setPomodoroCount(0);
    setTimeSpent(0);
  };

  const addCustomMethod = async () => {
    if (!customMethodName || !customMethodDesc || !customWorkDuration) {
      alert('Please fill in name, description, and work duration.');
      return;
    }

    const workDuration = parseInt(customWorkDuration);
    const breakDuration = customBreakDuration ? parseInt(customBreakDuration) : 0;

    if (isNaN(workDuration) || workDuration <= 0) {
      alert('Work duration must be a positive number.');
      return;
    }

    if (customBreakDuration && (isNaN(breakDuration) || breakDuration < 0)) {
      alert('Break duration must be a non-negative number.');
      return;
    }

    if (!user) {
      alert('You must be logged in to add custom methods.');
      return;
    }

    const newMethod: StudyMethod = {
      name: customMethodName,
      description: customMethodDesc,
      workDuration,
      breakDuration,
    };

    const { error } = await supabase
      .from('custom_study_methods')
      .insert({
        user_id: user.id,
        name: newMethod.name,
        description: newMethod.description,
        work_duration: newMethod.workDuration,
        break_duration: newMethod.breakDuration,
      });
    if (error) {
      console.error('Error saving custom method:', error.message);
      alert(`Failed to save custom method: ${error.message}`);
      return;
    }

    setCustomMethods([...customMethods, newMethod]);
    setCustomMethodName('');
    setCustomMethodDesc('');
    setCustomWorkDuration('');
    setCustomBreakDuration('');
  };

  const startTimer = () => {
    if (!selectedMethod) {
      alert('Please select a study method.');
      return;
    }
    setIsTimerRunning(true);
  };

  const pauseTimer = () => setIsTimerRunning(false);

  const resetTimer = () => {
    setIsTimerRunning(false);
    setIsBreak(false);
    setTimeLeft(selectedMethod?.workDuration ? selectedMethod.workDuration * 60 : 0);
    setPomodoroCount(0);
    setPomodoroMinutes(selectedMethod?.workDuration || 25);
    setPomodoroSeconds(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Please log in to use Study Techniques.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="container px-4 py-6 md:px-6 md:py-8">
        {/* Tool Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#B3E6E5]">
            <Clock className="h-8 w-8 text-[#1E3A8A]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">StudyTechniques</h1>
            <p className="text-gray-600">Learn and apply effective study methods</p>
          </div>
        </div>

        {/* Active Study Session (if any) */}
        {selectedMethod && (
          <Card className="mb-8 border-2 border-[#1E3A8A]">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#B3E6E5]">
                    <Clock className="h-6 w-6 text-[#1E3A8A]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{selectedMethod.name} Active</h3>
                    <p className="text-sm text-gray-600">Focus on your work until the timer ends</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{formatTime(timeLeft)}</div>
                    <p className="text-xs text-gray-500">Time Remaining</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full"
                      onClick={() => (isTimerRunning ? pauseTimer() : startTimer())}
                    >
                      {isTimerRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full"
                      onClick={resetTimer}
                    >
                      <RefreshCw className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mb-4 w-full justify-start bg-transparent p-0">
            <TabsTrigger
              value="techniques"
              className="px-4 py-2 text-sm font-medium transition-all"
            >
              Study Techniques
            </TabsTrigger>
            <TabsTrigger
              value="tools"
              className="px-4 py-2 text-sm font-medium transition-all"
            >
              Study Tools
            </TabsTrigger>
          </TabsList>

          {/* Study Techniques Tab */}
          <TabsContent value="techniques" className="mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...studyMethods, ...customMethods].map((method) => (
                <Card
                  key={method.name}
                  className={`overflow-hidden ${selectedMethod?.name === method.name ? "border-2 border-[#1E3A8A]" : ""}`}
                >
                  <CardHeader className={`${methodColors[method.name] || 'bg-[#B3E6E5]'} p-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {methodIcons[method.name] || <Clock className="h-6 w-6 text-[#1E3A8A]" />}
                        <CardTitle className="text-lg">{method.name}</CardTitle>
                      </div>
                      <Badge className="bg-white text-[#1E3A8A]">
                        {method.name === 'Pomodoro Technique' ? '95%' : '80%'} Effective
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="mb-4 text-sm">{method.description}</p>
                    {method.benefits && (
                      <div className="mb-4">
                        <h4 className="mb-2 text-sm font-medium">Benefits:</h4>
                        <ul className="ml-5 list-disc text-sm">
                          {method.benefits.map((benefit, index) => (
                            <li key={index}>{benefit}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Button
                      className="w-full"
                      onClick={() => selectMethod(method)}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Try This Technique
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Study Tools Tab */}
          <TabsContent value="tools" className="mt-0">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Pomodoro Timer */}
              <Card>
                <CardHeader>
                  <CardTitle>Pomodoro Timer</CardTitle>
                  <CardDescription>Focus timer with work and break intervals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 flex items-center justify-center">
                    <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-4 border-[#B3E6E5]">
                      <div className="text-3xl font-bold">{formatTime(timeLeft)}</div>
                      <div className="absolute -right-2 top-1/2 flex -translate-y-1/2 transform gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-full"
                          onClick={() => (isTimerRunning ? pauseTimer() : startTimer())}
                        >
                          {isTimerRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-full"
                          onClick={resetTimer}
                        >
                          <RefreshCw className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    <Button
                      variant={pomodoroMinutes === 15 ? "primary" : "outline"}
                      onClick={() => {
                        setPomodoroMinutes(15);
                        setPomodoroSeconds(0);
                        setTimeLeft(15 * 60);
                        setIsTimerRunning(false);
                      }}
                    >
                      15 min
                    </Button>
                    <Button
                      variant={pomodoroMinutes === 25 ? "primary" : "outline"}
                      onClick={() => {
                        setPomodoroMinutes(25);
                        setPomodoroSeconds(0);
                        setTimeLeft(25 * 60);
                        setIsTimerRunning(false);
                      }}
                    >
                      25 min
                    </Button>
                    <Button
                      variant={pomodoroMinutes === 50 ? "primary" : "outline"}
                      onClick={() => {
                        setPomodoroMinutes(50);
                        setPomodoroSeconds(0);
                        setTimeLeft(50 * 60);
                        setIsTimerRunning(false);
                      }}
                    >
                      50 min
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coffee className="h-4 w-4 text-[#1E3A8A]" />
                        <span className="text-sm">Break Length</span>
                      </div>
                      <select
                        className="rounded-md border p-1 text-sm"
                        value={selectedMethod?.breakDuration || 5}
                        onChange={(e) => {
                          if (selectedMethod) {
                            const newBreakDuration = parseInt(e.target.value);
                            setSelectedMethod({ ...selectedMethod, breakDuration: newBreakDuration });
                            if (isBreak) setTimeLeft(newBreakDuration * 60);
                          }
                        }}
                      >
                        <option value="5">5 minutes</option>
                        <option value="10">10 minutes</option>
                        <option value="15">15 minutes</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlarmClock className="h-4 w-4 text-[#1E3A8A]" />
                        <span className="text-sm">Sound Alert</span>
                      </div>
                      <select className="rounded-md border p-1 text-sm">
                        <option value="bell">Bell</option>
                        <option value="chime">Chime</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-[#1E3A8A]" />
                        <span className="text-sm">Background Sounds</span>
                      </div>
                      <select className="rounded-md border p-1 text-sm">
                        <option value="none">None</option>
                        <option value="white-noise">White Noise</option>
                        <option value="rain">Rain Sounds</option>
                        <option value="cafe">Cafe Ambience</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
                <div>
                  <Button
                    className="w-full"
                    onClick={startTimer}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Focus Session
                  </Button>
                </div>
              </Card>

              {/* Study Environment */}
              <Card>
                <CardHeader>
                  <CardTitle>Study Environment</CardTitle>
                  <CardDescription>Optimize your study space</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-lg bg-[#F5F5F5] p-4">
                      <h3 className="mb-2 font-medium">Environment Checklist</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="quiet" className="h-4 w-4 rounded border-gray-300" defaultChecked />
                          <label htmlFor="quiet" className="text-sm">Quiet space with minimal distractions</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="lighting" className="h-4 w-4 rounded border-gray-300" defaultChecked />
                          <label htmlFor="lighting" className="text-sm">Good lighting</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="comfortable" className="h-4 w-4 rounded border-gray-300" defaultChecked />
                          <label htmlFor="comfortable" className="text-sm">Comfortable seating</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="water" className="h-4 w-4 rounded border-gray-300" />
                          <label htmlFor="water" className="text-sm">Water and healthy snacks nearby</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="devices" className="h-4 w-4 rounded border-gray-300" />
                          <label htmlFor="devices" className="text-sm">Devices on do-not-disturb mode</label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="mb-2 font-medium">Background Sounds</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" className="flex flex-col gap-1 p-3">
                          <Music className="h-5 w-5" />
                          <span className="text-xs">Lo-Fi</span>
                        </Button>
                        <Button variant="outline" className="flex flex-col gap-1 p-3">
                          <Volume2 className="h-5 w-5" />
                          <span className="text-xs">White Noise</span>
                        </Button>
                        <Button variant="outline" className="flex flex-col gap-1 p-3">
                          <Coffee className="h-5 w-5" />
                          <span className="text-xs">Cafe</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <div>
                  <Button className="w-full">Get Environment Tips</Button>
                </div>
              </Card>

              {/* Study Resources */}
              <Card>
                <CardHeader>
                  <CardTitle>Study Resources</CardTitle>
                  <CardDescription>Helpful materials for effective studying</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-[#1E3A8A]" />
                        <div>
                          <p className="font-medium">Effective Study Habits Guide</p>
                          <p className="text-xs text-gray-500">PDF • 12 pages</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-[#1E3A8A]" />
                        <div>
                          <p className="font-medium">Memory Techniques Cheat Sheet</p>
                          <p className="text-xs text-gray-500">PDF • 5 pages</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div className="flex items-center gap-3">
                        <Play className="h-5 w-5 text-[#1E3A8A]" />
                        <div>
                          <p className="font-medium">How to Use the Pomodoro Technique</p>
                          <p className="text-xs text-gray-500">Video • 8:24</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Watch</Button>
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div className="flex items-center gap-3">
                        <Play className="h-5 w-5 text-[#1E3A8A]" />
                        <div>
                          <p className="font-medium">Active Recall Tutorial</p>
                          <p className="text-xs text-gray-500">Video • 12:15</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Watch</Button>
                    </div>
                  </div>
                </CardContent>
                <div>
                  <Button className="w-full">Browse All Resources</Button>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}