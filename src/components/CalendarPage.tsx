import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Project, Task, AppUser } from '../types/types';
import {
  BookOpen, ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, MoreVertical, CheckSquare,
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Calendar as CalendarComponent } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { logos, colorOptions } from '../lib/constants';

interface CalendarPageProps {
  user: AppUser | null;
  setActiveView: React.Dispatch<
    React.SetStateAction<
      'home' | 'tools' | 'history' | 'settings' | 'teach' | 'recap' | 'flashcards' | 'quiz' | 'studyTechniques'
    >
  >;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ user }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState<string>('all');
  const [newTask, setNewTask] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | null>(null);
  const [newTaskProject, setNewTaskProject] = useState<string>('');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id);
        if (projectsError) throw projectsError;
        setProjects(projectsData || []);

        // Fetch all tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*, projects(name, logo, color)')
          .in('project_id', projectsData?.map(p => p.id) || []);
        if (tasksError) throw tasksError;
        setTasks(tasksData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Helper functions for calendar
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const getTasksForDate = (date: string) => {
    return tasks.filter((task) => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date).toISOString().split('T')[0];
      return taskDate === date;
    });
  };

  const toggleTaskCompletion = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId);
      if (error) throw error;
      setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, completed: !task.completed } : t
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const addNewTask = async () => {
    if (!user || !newTask.trim() || !newTaskProject || !newTaskDueDate) {
      alert('Please provide a task title, project, and due date.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          project_id: newTaskProject,
          title: newTask,
          due_date: newTaskDueDate.toISOString(),
          completed: false,
        })
        .select('*, projects(name, logo, color)')
        .single();
      if (error) throw error;
      setTasks([...tasks, data]);
      setNewTask('');
      setNewTaskDueDate(null);
      setNewTaskProject('');
      setIsAddTaskOpen(false);
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task. Please try again.');
    }
  };

  // Generate calendar days for month view
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-200 bg-gray-50"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateString = date.toISOString().split('T')[0];
      const tasksForDay = getTasksForDate(dateString);

      days.push(
        <div key={day} className="h-24 border border-gray-200 p-1">
          <div className="flex justify-between">
            <span className={`text-sm font-medium ${date.getDay() === 0 || date.getDay() === 6 ? 'text-red-500' : ''}`}>
              {day}
            </span>
            {tasksForDay.length > 0 && (
              <Badge className="text-xs">
                {tasksForDay.length}
              </Badge>
            )}
          </div>
          <div className="mt-1 space-y-1 overflow-y-auto">
            {tasksForDay.slice(0, 2).map((task) => {
              const TaskIcon = logos.find(logo => logo.name === task.projects?.logo)?.icon || BookOpen;
              const projectColorClass = colorOptions.find(c => c.value === task.projects?.color)?.bgClass || 'bg-emerald-500';
              return (
                <div
                  key={task.id}
                  className={`flex items-center rounded px-1 py-0.5 text-xs ${
                    task.completed ? 'bg-gray-100 text-gray-500 line-through' : `${projectColorClass} bg-opacity-20`
                  }`}
                >
                  <TaskIcon className="h-3 w-3" />
                  <span className="ml-1 truncate">{task.title}</span>
                </div>
              );
            })}
            {tasksForDay.length > 2 && <div className="text-xs text-gray-500">+{tasksForDay.length - 2} more</div>}
          </div>
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return <div className="text-center text-text">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="container px-4 py-6 md:px-6 md:py-8">
        {/* Calendar Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold md:text-3xl">Calendar</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddTaskOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Calendar Controls */}
        <Card className="mb-6">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-medium">{formatMonth(currentMonth)}</h2>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <Select value={view} onValueChange={(value: 'month' | 'week' | 'day') => setView(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={goToToday}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Today
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Calendar View */}
        <Card>
          <CardContent className="p-0">
            {view === 'month' && (
              <div>
                <div className="grid grid-cols-7 border-b bg-gray-50">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="p-2 text-center text-sm font-medium">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">{generateCalendarDays()}</div>
              </div>
            )}
            {/* Week and Day views can be implemented similarly if needed */}
          </CardContent>
        </Card>

        {/* Task List */}
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Upcoming Tasks</h2>
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {tasks
                  .filter((task) => filterProject === 'all' || task.project_id === filterProject)
                  .filter((task) => !task.completed)
                  .sort((a, b) => new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime())
                  .map((task) => {
                    const TaskIcon = logos.find(logo => logo.name === task.projects?.logo)?.icon || BookOpen;
                    const projectColorClass = colorOptions.find(c => c.value === task.projects?.color)?.bgClass || 'bg-emerald-500';
                    return (
                      <div key={task.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`list-task-${task.id}`}
                            checked={task.completed}
                            onCheckedChange={() => toggleTaskCompletion(task.id)}
                          />
                          <div>
                            <label htmlFor={`list-task-${task.id}`} className="font-medium">
                              {task.title}
                            </label>
                            <div className="flex items-center gap-2">
                              <Badge className={`flex items-center gap-1 ${projectColorClass} bg-opacity-20`}>
                                <TaskIcon className="h-4 w-4" />
                                <span className="text-xs">{task.projects?.name || 'Unknown Project'}</span>
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="text-xs">
                            Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Task Popover */}
      <Popover open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <PopoverContent className="w-80 p-4 bg-white border rounded-md shadow-lg">
          <div className="space-y-4">
            <h3 className="font-semibold">Add New Task</h3>
            <Input
              placeholder="Task title"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className="border-gray-300"
            />
            <Select value={newTaskProject} onValueChange={setNewTaskProject}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newTaskDueDate ? newTaskDueDate.toLocaleDateString() : 'Select due date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 bg-white border rounded-md shadow-lg">
                <CalendarComponent
                  onChange={(value: any) => {
                    if (Array.isArray(value)) {
                      setNewTaskDueDate(value[0] || null);
                    } else {
                      setNewTaskDueDate(value);
                    }
                  }}
                  value={newTaskDueDate}
                  className="border-0"
                />
              </PopoverContent>
            </Popover>
            <Button onClick={addNewTask} disabled={!newTask.trim() || !newTaskProject || !newTaskDueDate}>
              Add Task
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CalendarPage;