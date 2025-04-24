import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Clock, CheckCircle, Menu, Trash2, Pencil, Star } from 'lucide-react';
import { Dialog, DialogContent } from '@radix-ui/react-dialog';
import { supabase } from '../lib/supabase';
import { AppUser } from '../types/types';

interface StudyTechniquesProps {
  user: AppUser | null;
}

interface Task {
  task_id: string;
  name: string;
  subject?: string;
  hours_needed: number;
  progress: number;
  completed: boolean;
  priority?: 'High' | 'Medium' | 'Low';
  tags?: string[];
  created_at: string;
}

interface StudyMethod {
  name: string;
  description: string;
  workDuration: number;
  breakDuration: number;
}

const studyMethods: StudyMethod[] = [
  {
    name: 'Pomodoro Technique',
    description: 'Work for 25 minutes, then take a 5-minute break. Repeat 4 times, then take a longer 15-30 minute break.',
    workDuration: 25,
    breakDuration: 5,
  },
  {
    name: 'Feynman Technique',
    description: 'Explain a concept in simple terms as if teaching it to a child. Identify gaps and review.',
    workDuration: 30,
    breakDuration: 0,
  },
  {
    name: 'Active Recall',
    description: 'Test yourself on the material without looking at notes. Use flashcards or questions.',
    workDuration: 20,
    breakDuration: 0,
  },
  {
    name: 'Spaced Repetition',
    description: 'Review material at increasing intervals over time.',
    workDuration: 15,
    breakDuration: 0,
  },
  {
    name: 'Blurting',
    description: 'Write down everything you remember about a topic, then check for gaps.',
    workDuration: 10,
    breakDuration: 0,
  },
  {
    name: 'SQ3R',
    description: 'Survey, Question, Read, Recite, Review. A structured method for reading textbooks.',
    workDuration: 40,
    breakDuration: 5,
  },
];

const timerSound = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');

export function StudyTechniques({ user }: StudyTechniquesProps) {
  const [selectedMethod, setSelectedMethod] = useState<StudyMethod | null>(null);
  const [customMethods, setCustomMethods] = useState<StudyMethod[]>([]);
  const [customMethodName, setCustomMethodName] = useState('');
  const [customMethodDesc, setCustomMethodDesc] = useState('');
  const [customWorkDuration, setCustomWorkDuration] = useState('');
  const [customBreakDuration, setCustomBreakDuration] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [newTaskHours, setNewTaskHours] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low' | ''>('');
  const [newTaskTags, setNewTaskTags] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [points, setPoints] = useState(0);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [deleteMethodName, setDeleteMethodName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadTasks = async () => {
      if (!user) {
        setTasks([]);
        return;
      }
      const { data, error } = await supabase
        .from('study_flow_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error loading tasks:', error.message);
        alert(`Failed to load tasks: ${error.message}`);
      } else {
        console.log('Loaded tasks:', data);
        setTasks(data || []);
      }
    };

    const loadPoints = async () => {
      if (!user) {
        setPoints(0);
        return;
      }
      const { data, error } = await supabase
        .from('user_points')
        .select('points')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
        console.error('Error loading points:', error.message);
        alert(`Failed to load points: ${error.message}`);
      } else {
        setPoints(data?.points || 0);
      }
    };

    loadTasks();
    loadPoints();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const taskSubscription = supabase
      .channel('study_flow_tasks_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_flow_tasks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Task change detected:', payload);
          loadTasks();
        }
      )
      .subscribe();

    const pointsSubscription = supabase
      .channel('user_points_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_points',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Points change detected:', payload);
          loadPoints();
        }
      )
      .subscribe();

    async function loadTasks() {
      if (!user) {
        setTasks([]);
        return;
      }
      const { data, error } = await supabase
        .from('study_flow_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error reloading tasks:', error.message);
      } else {
        setTasks(data || []);
      }
    }

    async function loadPoints() {
      if (!user) {
        setPoints(0);
        return;
      }
      const { data, error } = await supabase
        .from('user_points')
        .select('points')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
        console.error('Error reloading points:', error.message);
      } else {
        setPoints(data?.points || 0);
      }
    }

    return () => {
      supabase.removeChannel(taskSubscription);
      supabase.removeChannel(pointsSubscription);
    };
  }, [user]);

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
            if (!isBreak && selectedMethod) {
              setIsBreak(true);
              return selectedMethod.breakDuration * 60;
            } else {
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
    const updateProgress = async () => {
      if (!selectedTaskId || !selectedMethod || isBreak || !user) return;

      const selectedTask = tasks.find(task => task.task_id === selectedTaskId);
      if (!selectedTask) return;

      const totalExpectedSeconds = selectedTask.hours_needed * 3600;
      const newProgress = Math.min(100, (timeSpent / totalExpectedSeconds) * 100);

      setTasks(tasks.map(task =>
        task.task_id === selectedTaskId ? { ...task, progress: newProgress } : task
      ));

      const { error } = await supabase
        .from('study_flow_tasks')
        .update({ progress: newProgress })
        .eq('user_id', user.id)
        .eq('task_id', selectedTaskId);
      if (error) {
        console.error('Error updating task progress:', error.message);
      }

      if (newProgress >= 100 && !selectedTask.completed) {
        const { error: completeError } = await supabase
          .from('study_flow_tasks')
          .update({ completed: true })
          .eq('user_id', user.id)
          .eq('task_id', selectedTaskId);
        if (completeError) {
          console.error('Error marking task as completed:', completeError.message);
        }

        const { data: pointsData, error: pointsError } = await supabase
          .from('user_points')
          .select('points')
          .eq('user_id', user.id)
          .maybeSingle();
        if (pointsError) {
          console.error('Error fetching points for update:', pointsError.message);
        }

        const newPoints = (pointsData?.points || 0) + 10;
        const { error: upsertError } = await supabase
          .from('user_points')
          .upsert({ user_id: user.id, points: newPoints }, { onConflict: 'user_id' });
        if (upsertError) {
          console.error('Error updating points:', upsertError.message);
        }
      }
    };

    updateProgress();
  }, [timeSpent, selectedTaskId, selectedMethod, isBreak, user, tasks]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    const lowerQuery = searchQuery.toLowerCase();
    return tasks.filter(task =>
      task.name.toLowerCase().includes(lowerQuery) ||
      (task.tags && task.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );
  }, [tasks, searchQuery]);

  const addTask = async () => {
    if (!newTaskName) {
      alert('Please enter a task name.');
      return;
    }

    const hours = parseFloat(newTaskHours);
    if (!newTaskHours || isNaN(hours) || hours <= 0) {
      alert('Please enter a valid positive number for hours needed.');
      return;
    }

    if (!user) {
      alert('You must be logged in to add tasks.');
      return;
    }

    const tagsArray = newTaskTags ? newTaskTags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    const newTask: Task = {
      task_id: Date.now().toString(),
      name: newTaskName,
      subject: isCustomSubject ? customSubject : newTaskSubject || undefined,
      hours_needed: hours,
      progress: 0,
      completed: false,
      priority: newTaskPriority || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      created_at: new Date().toISOString(),
    };

    try {
      const session = await supabase.auth.getSession();
      console.log('Supabase session before insert:', session);
      console.log('Inserting task with user_id:', user.id);

      if (!session.data.session) {
        console.error('No Supabase session available');
        alert('Please check your email for a Supabase magic link to complete login.');
        return;
      }

      const { error } = await supabase
        .from('study_flow_tasks')
        .insert({ ...newTask, user_id: user.id });
      if (error) {
        console.error('Error adding task:', error);
        alert(`Failed to add task: ${error.message}`);
        return;
      }

      setTasks([newTask, ...tasks]);
      setNewTaskName('');
      setNewTaskSubject('');
      setCustomSubject('');
      setIsCustomSubject(false);
      setNewTaskHours('');
      setNewTaskPriority('');
      setNewTaskTags('');
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task. Please try again.');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) {
      alert('You must be logged in to delete tasks.');
      return;
    }

    const { error } = await supabase
      .from('study_flow_tasks')
      .delete()
      .eq('user_id', user.id)
      .eq('task_id', taskId);
    if (error) {
      console.error('Error deleting task:', error.message);
      alert(`Failed to delete task: ${error.message}`);
      return;
    }

    setTasks(tasks.filter(task => task.task_id !== taskId));
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
      setSelectedMethod(null);
      setTimeSpent(0);
      setTimeLeft(0);
    }
    setDeleteTaskId(null);
  };

  const saveEditedTask = async (updatedTask: Task) => {
    if (!updatedTask.name) {
      alert('Please enter a task name.');
      return;
    }

    const hours = parseFloat(updatedTask.hours_needed.toString());
    if (isNaN(hours) || hours <= 0) {
      alert('Please enter a valid positive number for hours needed.');
      return;
    }

    if (!user) {
      alert('You must be logged in to edit tasks.');
      return;
    }

    const { error } = await supabase
      .from('study_flow_tasks')
      .update({
        name: updatedTask.name,
        subject: updatedTask.subject || null,
        hours_needed: hours,
        priority: updatedTask.priority || null,
        tags: updatedTask.tags && updatedTask.tags.length > 0 ? updatedTask.tags : null,
      })
      .eq('user_id', user.id)
      .eq('task_id', updatedTask.task_id);
    if (error) {
      console.error('Error updating task:', error.message);
      alert(`Failed to update task: ${error.message}`);
      return;
    }

    setTasks(tasks.map(task =>
      task.task_id === updatedTask.task_id ? { ...task, ...updatedTask, hours_needed: hours } : task
    ));
    setEditTask(null);
  };

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
    if (!selectedTaskId) {
      alert('Please select a task to work on.');
      return;
    }
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
  };

  const finishTask = async () => {
    if (!selectedTaskId || !user) {
      alert('You must be logged in to finish tasks.');
      return;
    }

    const { error: updateError } = await supabase
      .from('study_flow_tasks')
      .update({ progress: 100, completed: true })
      .eq('user_id', user.id)
      .eq('task_id', selectedTaskId);
    if (updateError) {
      console.error('Error finishing task:', updateError.message);
      alert(`Failed to finish task: ${updateError.message}`);
      return;
    }

    setTasks(tasks.map(task =>
      task.task_id === selectedTaskId ? { ...task, progress: 100, completed: true } : task
    ));

    const { data: pointsData, error: pointsError } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', user.id)
      .maybeSingle();
    if (pointsError) {
      console.error('Error fetching points for update:', pointsError.message);
    }

    const newPoints = (pointsData?.points || 0) + 10;
    const { error: upsertError } = await supabase
      .from('user_points')
      .upsert({ user_id: user.id, points: newPoints }, { onConflict: 'user_id' });
    if (upsertError) {
      console.error('Error updating points:', upsertError.message);
      alert(`Failed to update points: ${upsertError.message}`);
    }

    setIsTimerRunning(false);
    setSelectedTaskId(null);
    setSelectedMethod(null);
    setTimeSpent(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Access Denied</h2>
          </CardHeader>
          <CardContent>
            <p className="text-[#4A4F57]">Please log in to use Study Techniques.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedTask = tasks.find(task => task.task_id === selectedTaskId);
  const progress = selectedTask ? selectedTask.progress : 0;

  return (
    <div className="flex min-h-screen bg-[#FFFFFF]">
      {/* Sidebar Checklist */}
      <div
        className={`fixed inset-y-0 left-0 w-80 bg-[#FFFFFF] shadow-lg transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-20 border-r border-[#EAEAEA]`}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#1A1A1A]">Tasks</h2>
            <Button
              variant="ghost"
              className="md:hidden text-[#1A1A1A] !bg-transparent"
              onClick={() => setIsSidebarOpen(false)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
          {/* Search Bar */}
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks or tags..."
            className="mb-4 border-[#EAEAEA] focus:border-[#1E3A5F] focus:ring-[#1E3A5F]"
          />
          {/* Quick Add Task Form */}
          <div className="space-y-2 mb-4">
            <Input
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="Task name (e.g., Chapter 3 Review)"
              className="border-[#EAEAEA] focus:border-[#1E3A5F] focus:ring-[#1E3A5F]"
            />
            <Select
              value={newTaskSubject}
              onValueChange={(value) => {
                setNewTaskSubject(value);
                setIsCustomSubject(value === 'Custom');
                if (value !== 'Custom') setCustomSubject('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Subject (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Math">Math</SelectItem>
                <SelectItem value="Science">Science</SelectItem>
                <SelectItem value="History">History</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {isCustomSubject && (
              <Input
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Enter custom subject"
                className="border-[#EAEAEA] focus:border-[#1E3A5F] focus:ring-[#1E3A5F]"
              />
            )}
            <Input
              type="number"
              value={newTaskHours}
              onChange={(e) => setNewTaskHours(e.target.value)}
              placeholder="Hours needed (e.g., 0.5)"
              min="0.1"
              step="0.1"
              className="border-[#EAEAEA] focus:border-[#1E3A5F] focus:ring-[#1E3A5F]"
            />
            <Select
              value={newTaskPriority}
              onValueChange={(value) => setNewTaskPriority(value as 'High' | 'Medium' | 'Low' | '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Priority (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={newTaskTags}
              onChange={(e) => setNewTaskTags(e.target.value)}
              placeholder="Tags (comma-separated, optional)"
              className="border-[#EAEAEA] focus:border-[#1E3A5F] focus:ring-[#1E3A5F]"
            />
            <Button
              onClick={addTask}
              className="w-full bg-[#4FD1C5] hover:bg-[#3DB8AC] text-white !bg-[#4FD1C5] !important"
            >
              Add Task
            </Button>
          </div>
          {/* Task List */}
          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <p className="text-[#4A4F57]">{searchQuery ? "No tasks found." : "No tasks yet. Add one above!"}</p>
            ) : (
              filteredTasks.map(task => (
                <div
                  key={task.task_id}
                  className="p-3 bg-[#EAEAEA] rounded-lg border border-[#EAEAEA]"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-medium text-[#1A1A1A]">{task.name}</h4>
                      {task.subject && (
                        <p className="text-xs text-[#4A4F57]">{task.subject}</p>
                      )}
                      <p className="text-xs text-[#4A4F57]">{task.hours_needed} hours</p>
                      {task.priority && (
                        <p className="text-xs text-[#4A4F57]">Priority: {task.priority}</p>
                      )}
                      {task.tags && task.tags.length > 0 && (
                        <p className="text-xs text-[#4A4F57]">Tags: {task.tags.join(', ')}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setEditTask(task)}
                        variant="ghost"
                        className="text-[#1E3A5F] hover:text-[#1A1A1A] !bg-transparent"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => setDeleteTaskId(task.task_id)}
                        variant="ghost"
                        className="text-[#1E3A5F] hover:text-[#1A1A1A] !bg-transparent"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-[#FFFFFF] rounded-full h-2">
                      <div
                        className="bg-[#4FD1C5] h-2 rounded-full"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-[#4A4F57]">{task.progress.toFixed(1)}%</span>
                  </div>
                  {task.completed && (
                    <CheckCircle className="h-4 w-4 text-[#4FD1C5] mt-1" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete Task Confirmation Modal */}
      <Dialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md bg-[#FFFFFF] border-[#EAEAEA] p-6 rounded-lg shadow-lg z-50">
          <div className="text-[#1A1A1A] text-lg font-semibold">Confirm Deletion</div>
          <p className="text-[#4A4F57] mt-2">Are you sure you want to delete this task? This action cannot be undone.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              onClick={() => setDeleteTaskId(null)}
              className="bg-[#4FD1C5] hover:bg-[#3DB8AC] text-white !bg-[#4FD1C5] !important"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteTaskId && deleteTask(deleteTaskId)}
              className="bg-[#4FD1C5] hover:bg-[#3DB8AC] text-white !bg-[#4FD1C5] !important"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task Modal */}
      <Dialog open={!!editTask} onOpenChange={() => setEditTask(null)}>
        <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md bg-[#FFFFFF] border-[#EAEAEA] p-6 rounded-lg shadow-lg z-50">
          <div className="text-[#1A1A1A] text-lg font-semibold">Edit Task</div>
          {editTask && (
            <div className="space-y-4 mt-2">
              <Input
                value={editTask.name}
                onChange={(e) => setEditTask({ ...editTask, name: e.target.value })}
                placeholder="Task name (e.g., Chapter 3 Review)"
                className="border-[#EAEAEA] focus:border-[#1E3A5F] focus:ring-[#1E3A5F]"
              />
              <Select
                value={editTask.subject || ''}
                onValueChange={(value) => setEditTask({ ...editTask, subject: value || undefined })}
              >
                <SelectTrigger className="border-[#EAEAEA] focus:border-[#1E3A5F]">
                  <SelectValue placeholder="Subject (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Math">Math</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="History">History</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {editTask.subject === 'Custom' && (
                <Input
                  value={editTask.subject}
                  onChange={(e) => setEditTask({ ...editTask, subject: e.target.value })}
                  placeholder="Enter custom subject"
                  className="border-[#EAEAEA] focus:border-[#1E3A5F] focus:ring-[#1E3A5F]"
                />
              )}
              <Input
                type="number"
                value={editTask.hours_needed}
                onChange={(e) => setEditTask({ ...editTask, hours_needed: parseFloat(e.target.value) || 0 })}
                placeholder="Hours needed (e.g., 0.5)"
                min="0.1"
                step="0.1"
                className="border-[#EAEAEA] focus:border-[#1E3A5F] focus:ring-[#1E3A5F]"
              />
              <Select
                value={editTask.priority || ''}
                onValueChange={(value) => setEditTask({ ...editTask, priority: value as 'High' | 'Medium' | 'Low' || undefined })}
              >
                <SelectTrigger className="border-[#EAEAEA] focus:border-[#1E3A5F]">
                  <SelectValue placeholder="Priority (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={editTask.tags?.join(', ') || ''}
                onChange={(e) => setEditTask({
                  ...editTask,
                  tags: e.target.value ? e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) : undefined
                })}
                placeholder="Tags (comma-separated, optional)"
                className="border-[#EAEAEA] focus:border-[#1E3A5F] focus:ring-[#1E3A5F]"
              />
            </div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button
              onClick={() => setEditTask(null)}
              className="bg-[#4FD1C5] hover:bg-[#3DB8AC] text-white !bg-[#4FD1C5] !important"
            >
              Cancel
            </Button>
            <Button
              onClick={() => editTask && saveEditedTask(editTask)}
              className="bg-[#4FD1C5] hover:bg-[#3DB8AC] text-white !bg-[#4FD1C5] !important"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Custom Method Confirmation Modal */}
      <Dialog open={!!deleteMethodName} onOpenChange={() => setDeleteMethodName(null)}>
        <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md bg-[#FFFFFF] border-[#EAEAEA] p-6 rounded-lg shadow-lg z-50">
          <div className="text-[#1A1A1A] text-lg font-semibold">Confirm Deletion</div>
          <p className="text-[#4A4F57] mt-2">Are you sure you want to delete this custom method? This action cannot be undone.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              onClick={() => setDeleteMethodName(null)}
              className="bg-[#4FD1C5] hover:bg-[#3DB8AC] text-white !bg-[#4FD1C5] !important"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteMethodName && deleteCustomMethod(deleteMethodName)}
              className="bg-[#4FD1C5] hover:bg-[#3DB8AC] text-white !bg-[#4FD1C5] !important"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="flex-1 p-4">
        <Button
          variant="ghost"
          className="md:hidden mb-4 text-[#1A1A1A] !bg-transparent"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" />
          <span className="ml-2">Tasks</span>
        </Button>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-[#1A1A1A]">Study Techniques</h2>
                <p className="text-[#4A4F57]">Apply effective study methods with a timer.</p>
              </div>
              <span className="text-sm text-[#4A4F57]">
                Points: {points} <CheckCircle className="inline h-4 w-4 text-[#4FD1C5]" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Study Methods Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#1A1A1A]">Choose a Study Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {studyMethods.map(method => (
                  <div
                    key={method.name}
                    onClick={() => selectMethod(method)}
                    className={`p-4 bg-[#EAEAEA] rounded-lg cursor-pointer border-2 relative ${
                      selectedMethod?.name === method.name
                        ? 'border-[#4FD1C5]'
                        : 'border-transparent'
                    } hover:border-[#4FD1C5]`}
                  >
                    {method.name === 'Pomodoro Technique' && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-[#1A1A1A] text-xs font-semibold px-2 py-1 rounded-full flex items-center">
                        <Star className="h-3 w-3 mr-1" /> Popular
                      </div>
                    )}
                    <h4 className="text-md font-medium text-[#1A1A1A]">{method.name}</h4>
                    <p className="text-[#4A4F57]">{method.description}</p>
                  </div>
                ))}
                {customMethods.map(method => (
                  <div
                    key={method.name}
                    className={`p-4 bg-[#EAEAEA] rounded-lg border-2 relative ${
                      selectedMethod?.name === method.name
                        ? 'border-[#4FD1C5]'
                        : 'border-transparent'
                    } hover:border-[#4FD1C5]`}
                  >
                    <div className="flex justify-between items-start">
                      <div
                        onClick={() => selectMethod(method)}
                        className="cursor-pointer flex-1"
                      >
                        <h4 className="text-md font-medium text-[#1A1A1A]">{method.name}</h4>
                        <p className="text-[#4A4F57]">{method.description}</p>
                      </div>
                      <Button
                        onClick={() => setDeleteMethodName(method.name)}
                        variant="ghost"
                        className="text-[#1E3A5F] hover:text-[#1A1A1A] !bg-transparent"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Study Method Input */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#1A1A1A]">Create a Custom Study Method</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#4A4F57]">Method Name</label>
                  <Input
                    value={customMethodName}
                    onChange={(e) => setCustomMethodName(e.target.value)}
                    placeholder="e.g., My Study Method"
                    className="border-[#EAEAEA] focus:border-[#1E3A5F] focus:ring-[#1E3A5F]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#4A4F57]">Description</label>
                  <Input
                    value={customMethodDesc}
                    onChange={(e) => setCustomMethodDesc(e.target.value)}
                    placeholder="Describe your method"
                    className="border-[#EAEAEA] focus:border-[#1E3A5F] focus:ring-[#1E3A5F]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#4A4F57]">Work Duration (minutes)</label>
                  <Input
                    type="number"
                    value={customWorkDuration}
                    onChange={(e) => setCustomWorkDuration(e.target.value)}
                    placeholder="e.g., 30"
                    min="1"
                    className="border-[#EAEAEA] focus:border-[#1E3A5F] focus:ring-[#1E3A5F]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#4A4F57]">Break Duration (minutes, optional)</label>
                  <Input
                    type="number"
                    value={customBreakDuration}
                    onChange={(e) => setCustomBreakDuration(e.target.value)}
                    placeholder="e.g., 5"
                    min="0"
                    className="border-[#EAEAEA] focus:border-[#1E3A5F] focus:ring-[#1E3A5F]"
                  />
                </div>
                <Button
                  onClick={addCustomMethod}
                  className="bg-[#4FD1C5] hover:bg-[#3DB8AC] text-white !bg-[#4FD1C5] !important"
                >
                  Add Custom Method
                </Button>
              </div>
            </div>

            {/* Task Selection and Timer */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#1A1A1A]">Apply a Study Method</h3>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="w-full md:w-1/3">
                  <label className="block text-sm font-medium mb-1 text-[#4A4F57]">Select Task</label>
                  <Select value={selectedTaskId || ''} onValueChange={setSelectedTaskId}>
                    <SelectTrigger className="border-[#EAEAEA] focus:border-[#1E3A5F]">
                      <SelectValue placeholder={tasks.length === 0 ? "No tasks available" : "Select a task"} />
                    </SelectTrigger>
                    <SelectContent>
                      {tasks.length === 0 ? (
                        <SelectItem value="none" disabled>No tasks available. Add tasks in the sidebar.</SelectItem>
                      ) : (
                        tasks.map(task => (
                          <SelectItem key={task.task_id} value={task.task_id}>
                            {task.name} {task.subject ? `(${task.subject})` : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {selectedMethod && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-6 w-6 text-[#4A4F57]" />
                    <span className="text-xl font-semibold text-[#1A1A1A]">
                      {isBreak ? 'Time Left on Break: ' : 'Time Left Studying: '}
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                )}
              </div>

              {selectedTaskId && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-[#EAEAEA] rounded-full h-2.5">
                      <div
                        className="bg-[#4FD1C5] h-2.5 rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-[#4A4F57]">{progress.toFixed(1)}%</span>
                  </div>
                  {progress >= 100 && (
                    <Button
                      onClick={finishTask}
                      className="w-full bg-[#4FD1C5] hover:bg-[#3DB8AC] text-white !bg-[#4FD1C5] !important flex items-center justify-center"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Finish Task
                    </Button>
                  )}
                </div>
              )}

              {selectedMethod && (
                <div className="flex gap-2">
                  <Button
                    onClick={startTimer}
                    disabled={isTimerRunning || tasks.length === 0 || !selectedTaskId}
                    className="bg-[#4FD1C5] hover:bg-[#3DB8AC] text-white !bg-[#4FD1C5] !important"
                  >
                    Start
                  </Button>
                  <Button
                    onClick={pauseTimer}
                    disabled={!isTimerRunning}
                    className="bg-[#4FD1C5] hover:bg-[#3DB8AC] text-white !bg-[#4FD1C5] !important"
                  >
                    Pause
                  </Button>
                  <Button
                    onClick={resetTimer}
                    disabled={!selectedMethod}
                    className="bg-[#4FD1C5] hover:bg-[#3DB8AC] text-white !bg-[#4FD1C5] !important"
                  >
                    Reset
                  </Button>
                </div>
              )}
            </div>

            {selectedMethod?.name === 'Pomodoro Technique' && (
              <div className="text-sm text-[#4A4F57]">
                {isBreak ? (
                  <p>Break time! Relax for {formatTime(timeLeft)}.</p>
                ) : (
                  <p>
                    Pomodoro #{pomodoroCount + 1}: {formatTime(timeLeft)} remaining
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}