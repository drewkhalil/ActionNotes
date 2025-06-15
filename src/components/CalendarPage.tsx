import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Project, Task, AppUser } from '../types/types';
import { BookOpen, ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, MoreVertical, CheckSquare } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
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
      'home' | 'tools' | 'history' | 'settings' | 'teach' | 'recap' | 'flashcards' | 'quiz' | 'studyTechniques' | 'calendar' | 'projects' | 'analytics'
    >
  >;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ user, setActiveView }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [nextMonth, setNextMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState<string>('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | null>(null);
  const [newTaskProject, setNewTaskProject] = useState<string>('');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id);
        if (projectsError) throw projectsError;
        setProjects(projectsData || []);

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

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setNextMonth(new Date(nextMonth.getFullYear(), nextMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setNextMonth(new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setNextMonth(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1));
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
    if (!user || !newTaskTitle.trim() || !newTaskProject || !newTaskDueDate) {
      alert('Please provide a task title, project, and due date.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          project_id: newTaskProject,
          title: newTaskTitle,
          due_date: newTaskDueDate.toISOString(),
          completed: false,
        })
        .select('*, projects(name, logo, color)')
        .single();
      if (error) throw error;
      setTasks([...tasks, data]);
      setNewTaskTitle('');
      setNewTaskDueDate(null);
      setNewTaskProject('');
      setIsAddTaskOpen(false);
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task. Please try again.');
    }
  };

  const generateCalendarDays = (date: Date, calendarIndex: number) => {
    const daysInMonth = getDaysInMonth(date);
    const firstDayOfMonth = getFirstDayOfMonth(date);
    const days = [];

    // Generate placeholder days
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div
          key={`empty-${date.getFullYear()}-${date.getMonth()}-${i}-${calendarIndex}`}
          className="h-12 w-full"
        ></div>
      );
    }

    // Generate days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
      const dateString = currentDate.toISOString().split('T')[0];
      const tasksForDay = getTasksForDate(dateString);
      const isToday = currentDate.toDateString() === new Date().toDateString();

      days.push(
        <button
          key={`day-${date.getFullYear()}-${date.getMonth()}-${day}-${calendarIndex}`}
          className="h-12 w-full text-white text-sm font-medium relative"
        >
          <div className={`flex size-full items-center justify-center rounded-full ${isToday ? 'bg-[#c6a351] text-[#161512]' : ''}`}>
            {day}
            {tasksForDay.length > 0 && (
              <span className="absolute top-0 right-0 text-xs bg-[#35322c] rounded-full h-4 w-4 flex items-center justify-center">
                {tasksForDay.length}
              </span>
            )}
          </div>
        </button>
      );
    }

    return days;
  };

  if (loading) {
    return <div className="text-center text-[#b3aea2]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#161512] text-white font-manrope">
      <main className="px-4 py-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between gap-3 p-4">
          <p className="text-white tracking-tight text-[32px] font-bold leading-tight min-w-72">Calendar</p>
          <Button
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-8 px-4 bg-[#c6a351] text-[#161512] text-sm font-bold"
            onClick={() => setIsAddTaskOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="truncate">Add Task</span>
          </Button>
        </div>
        {/* Calendars */}
        <div className="flex flex-wrap items-center justify-center gap-6 p-4">
          {[currentMonth, nextMonth].map((month, index) => (
            <div key={`calendar-${month.getFullYear()}-${month.getMonth()}`} className="flex min-w-72 max-w-[336px] flex-1 flex-col gap-0.5">
              <div className="flex items-center p-1 justify-between">
                {index === 0 && (
                  <Button className="bg-transparent text-white hover:bg-[#35322c]" onClick={prevMonth}>
                    <ChevronLeft size={18} />
                  </Button>
                )}
                <p className="text-white text-base font-bold leading-tight flex-1 text-center">
                  {formatMonth(month)}
                </p>
                {index === 1 && (
                  <Button className="bg-transparent text-white hover:bg-[#35322c]" onClick={handleNextMonth}>
                    <ChevronRight size={18} />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-7">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <p
                    key={`weekday-${day}-${index}`}
                    className="text-white text-[13px] font-bold leading-normal tracking-[0.015em] flex h-12 w-full items-center justify-center pb-0.5"
                  >
                    {day}
                  </p>
                ))}
                {generateCalendarDays(month, index)}
              </div>
            </div>
          ))}
        </div>
        {/* Upcoming Tasks */}
        <div className="mt-8 px-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">Upcoming Tasks</h2>
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-40 bg-[#24221e] border-[#4f4a40] text-white">
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent className="bg-[#24221e] border-[#4f4a40] text-white">
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Card className="bg-[#161512] border-[#4f4a40]">
            <CardContent className="p-0">
              <div className="divide-y divide-[#4f4a40]">
                {tasks
                  .filter((task) => filterProject === 'all' || task.project_id === filterProject)
                  .filter((task) => !task.completed)
                  .sort((a, b) => new Date(a.due_date || '9999-12-31').getTime() - new Date(b.due_date || '9999-12-31').getTime())
                  .map((task) => {
                    const TaskIcon = logos.find(logo => logo.name === task.projects?.logo)?.icon || BookOpen;
                    const projectColorClass = colorOptions.find(c => c.value === task.projects?.color)?.bgClass || 'bg-[#c6a351]';
                    return (
                      <div key={task.id} className="flex items-center gap-4 px-4 min-h-[72px] py-2 justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-white flex items-center justify-center rounded-lg bg-[#35322c] shrink-0 size-12">
                            <CheckSquare
                              size={24}
                              className={task.completed ? 'text-[#c6a351]' : 'text-white'}
                              onClick={() => toggleTaskCompletion(task.id)}
                            />
                          </div>
                          <div className="flex flex-col justify-center">
                            <p className="text-white text-base font-medium leading-normal line-clamp-1">{task.title}</p>
                            <p className="text-[#b3aea2] text-sm font-normal leading-normal line-clamp-2">{task.projects?.name || 'Unknown Project'}</p>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <Badge className={`text-xs ${projectColorClass} bg-opacity-20 text-white`}>
                            Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                          </Badge>
                          <Button className="h-8 w-8 bg-[#35322c] text-white">
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
        <PopoverContent className="w-80 p-4 bg-[#24221e] border-[#4f4a40] rounded-md shadow-lg">
          <div className="space-y-4">
            <h3 className="font-semibold text-white">Add New Task</h3>
            <Input
              placeholder="Task title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="bg-[#35322c] border-[#4f4a40] text-white placeholder-[#b3aea2]"
            />
            <Select value={newTaskProject} onValueChange={setNewTaskProject}>
              <SelectTrigger className="bg-[#35322c] border-[#4f4a40] text-white">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent className="bg-[#24221e] border-[#4f4a40] text-white">
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button className="w-full flex justify-between bg-[#35322c] border-[#4f4a40] text-white">
                  <span>{newTaskDueDate ? newTaskDueDate.toLocaleDateString() : 'Select due date'}</span>
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 bg-[#24221e] border-[#4f4a40] rounded-md shadow-lg">
                <CalendarComponent
                  onChange={(value: any) => {
                    if (Array.isArray(value)) {
                      setNewTaskDueDate(value[0] || null);
                    } else {
                      setNewTaskDueDate(value);
                    }
                  }}
                  value={newTaskDueDate}
                  className="border-0 text-white bg-[#24221e]"
                />
              </PopoverContent>
            </Popover>
            <div className="flex justify-end gap-2">
              <Button
                className="bg-[#35322c] text-white hover:bg-[#4f4a40]"
                onClick={() => {
                  setIsAddTaskOpen(false);
                  setNewTaskTitle('');
                  setNewTaskDueDate(null);
                  setNewTaskProject('');
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#c6a351] text-[#161512] hover:bg-[#b5923e]"
                onClick={addNewTask}
                disabled={!newTaskTitle.trim() || !newTaskProject || !newTaskDueDate}
              >
                Add Task
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CalendarPage;