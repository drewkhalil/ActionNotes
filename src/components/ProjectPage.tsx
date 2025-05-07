import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Project, Summary, Note, ProjectFile, ProjectDoc, ProjectTool, ProjectAIUsage, Task, AppUser } from '../types/types';
import {
  FileText, Upload, Wrench, BookOpen, Pencil, Share2, Brain, PenSquare, Lightbulb, Bookmark, Settings, Trash2, MessageSquare, Download, Plus, Calendar,
  ImageIcon, File, Paperclip, Send, Clock, MoreVertical, CheckSquare, AlertTriangle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Dialog, DialogContent, DialogTitle, DialogOverlay } from '@radix-ui/react-dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from './ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/ScrollArea';
import { Checkbox } from './ui/checkbox';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Calendar as CalendarComponent } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { logos, colorOptions } from '../lib/constants';

interface ProjectPageProps {
  user: AppUser | null;
  setActiveView: React.Dispatch<
    React.SetStateAction<
      'home' | 'tools' | 'history' | 'settings' | 'teach' | 'recap' | 'flashcards' | 'quiz' | 'studyTechniques'
    >
  >;
}

const availableTools = [
  { id: 'teachmethat', name: 'TeachMeThat', view: 'teach', description: 'Transform any topic into an interactive learning experience', icon: <Brain className="h-8 w-8 text-[#1E3A8A]" />, color: 'bg-[#E4D7FF]' },
  { id: 'recapme', name: 'RecapMe', view: 'recap', description: 'Convert notes into clear, structured summaries', icon: <FileText className="h-8 w-8 text-[#1E3A8A]" />, color: 'bg-[#D1F7E0]' },
  { id: 'studytechniques', name: 'StudyTechniques', view: 'studyTechniques', description: 'Learn and apply effective study methods', icon: <PenSquare className="h-8 w-8 text-[#1E3A8A]" />, color: 'bg-[#B3E6E5]' },
  { id: 'quickquizzer', name: 'QuickQuizzer', view: 'quiz', description: 'Create custom quizzes with detailed solutions', icon: <PenSquare className="h-8 w-8 text-[#1E3A8A]" />, color: 'bg-[#FFD6D6]' },
  { id: 'thinkfast', name: 'ThinkFast', view: 'flashcards', description: 'Create and study with AI-generated flashcards', icon: <Bookmark className="h-8 w-8 text-[#1E3A8A]" />, color: 'bg-[#FFE8C8]' },
];

const ProjectPage: React.FC<ProjectPageProps> = ({ user, setActiveView }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [docs, setDocs] = useState<ProjectDoc[]>([]);
  const [projectTools, setProjectTools] = useState<ProjectTool[]>([]);
  const [aiUsage, setAIUsage] = useState<ProjectAIUsage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectIcon, setProjectIcon] = useState('BookOpen');
  const [projectColor, setProjectColor] = useState('emerald');
  const [toolsDialogOpen, setToolsDialogOpen] = useState(false);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDocOpen, setIsDocOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docContent, setDocContent] = useState('');

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  useEffect(() => {
    if (!user || !projectId) {
      setLoading(false);
      return;
    }

    const fetchProjectData = async () => {
      setLoading(true);
      try {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single();
        if (projectError) throw projectError;
        setProject(projectData);
        setProjectTitle(projectData.name);
        setProjectDescription(projectData.description || '');
        setProjectColor(projectData.color || 'emerald');
        setProjectIcon(projectData.logo || 'BookOpen');

        const { data: summariesData, error: summariesError } = await supabase
          .from('summaries')
          .select('*')
          .eq('project_id', projectId);
        if (summariesError) throw summariesError;
        setSummaries(summariesData || []);

        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .eq('project_id', projectId);
        if (notesError) throw notesError;
        setNotes(notesData || []);

        const { data: filesData, error: filesError } = await supabase
          .from('files')
          .select('*')
          .eq('project_id', projectId);
        if (filesError) throw filesError;
        setFiles(filesData || []);

        const { data: docsData, error: docsError } = await supabase
          .from('project_docs')
          .select('*')
          .eq('project_id', projectId);
        if (docsError) throw docsError;
        setDocs(docsData || []);

        const { data: toolsData, error: toolsError } = await supabase
          .from('project_tools')
          .select('*')
          .eq('project_id', projectId);
        if (toolsError) throw toolsError;
        setProjectTools(toolsData || []);
        setSelectedTools(
          toolsData?.map((tool) => tool.tool_name) || []
        );

        const { data: aiUsageData, error: aiUsageError } = await supabase
          .from('project_ai_usage')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });
        if (aiUsageError) throw aiUsageError;
        setAIUsage(aiUsageData || []);

        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('project_id', projectId);
        if (tasksError) throw tasksError;
        setTasks(tasksData || []);
      } catch (error) {
        console.error('Error fetching project data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [user, projectId]);

  const handleSaveProjectChanges = async () => {
    if (!project || !user) return;
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: projectTitle,
          description: projectDescription,
          color: projectColor,
          logo: projectIcon
        })
        .eq('id', project.id)
        .eq('user_id', user.id);
      if (error) throw error;
      setProject({
        ...project,
        name: projectTitle,
        description: projectDescription,
        color: projectColor,
        logo: projectIcon
      });
      setEditProjectOpen(false);
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project. Please try again.');
    }
  };

  const handleDeleteProject = async () => {
    if (!project || !user) return;
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)
        .eq('user_id', user.id);
      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  const handleDocSave = async () => {
    if (!project || !user) return;
    try {
      const { data, error } = await supabase
        .from('project_docs')
        .insert({ project_id: project.id, content: docContent })
        .select()
        .single();
      if (error) throw error;
      setDocs([...docs, data]);
      setDocContent('');
    } catch (error) {
      console.error('Error saving doc:', error);
      alert('Failed to save documentation. Please try again.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project || !user) return;

    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (!['txt', 'md', 'pdf', 'docx', 'jpg', 'png'].includes(fileType || '')) {
      alert('Only .txt, .md, .pdf, .docx, .jpg, and .png files are supported.');
      return;
    }

    try {
      const fileSize = file.size;
      const filePath = `${user.id}/${project.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('files')
        .insert({
          project_id: project.id,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: fileType || '',
          file_size: fileSize,
        });
      if (insertError) throw insertError;

      setFiles([
        ...files,
        {
          id: crypto.randomUUID(),
          project_id: project.id,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: fileType || '',
          file_size: fileSize,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    }
  };

  const handleClearHistory = async () => {
    if (!project || !user || !confirm('Are you sure you want to clear the AI interaction history? This action cannot be undone.')) return;
    try {
      const { error } = await supabase
        .from('project_ai_usage')
        .delete()
        .eq('project_id', project.id);
      if (error) throw error;
      setAIUsage([]);
    } catch (error) {
      console.error('Error clearing AI history:', error);
      alert('Failed to clear AI history. Please try again.');
    }
  };

  const handleToolClick = (view: string) => {
    if (!user) {
      console.log('Show auth modal');
      return;
    }
    setActiveView(view as any);
    navigate('/');
  };

  const toggleToolVisibility = (toolId: string) => {
    const tool = availableTools.find(t => t.id === toolId);
    if (!tool) return;
    if (selectedTools.includes(tool.name)) {
      setSelectedTools(selectedTools.filter(t => t !== tool.name));
    } else {
      setSelectedTools([...selectedTools, tool.name]);
    }
  };

  const handleToolModalSave = async () => {
    if (!project || !user) return;
    try {
      const { error: deleteError } = await supabase
        .from('project_tools')
        .delete()
        .eq('project_id', project.id);
      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('project_tools')
        .insert(selectedTools.map((tool) => ({ project_id: project.id, tool_name: tool })));
      if (insertError) throw insertError;

      setProjectTools(
        selectedTools.map((tool) => ({
          id: crypto.randomUUID(),
          project_id: project.id,
          tool_name: tool,
          created_at: new Date().toISOString(),
        }))
      );
      setToolsDialogOpen(false);
    } catch (error) {
      console.error('Error updating tools:', error);
      alert('Failed to update tools. Please try again.');
    }
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
    if (!project || !user || !newTask.trim()) {
      alert('Please provide a task title.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          project_id: project.id,
          title: newTask,
          due_date: newTaskDueDate ? newTaskDueDate.toISOString() : null,
          completed: false,
        })
        .select()
        .single();
      if (error) throw error;
      setTasks([...tasks, data]);
      setNewTask('');
      setNewTaskDueDate(null);
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task. Please try again.');
    }
  };

  const handleNewTaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addNewTask();
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTask(task.title);
    setNewTaskDueDate(task.due_date ? new Date(task.due_date) : null);
  };

  const handleSaveEditTask = async () => {
    if (!editingTask || !newTask.trim()) {
      alert('Please provide a task title.');
      return;
    }
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: newTask,
          due_date: newTaskDueDate ? newTaskDueDate.toISOString() : null,
        })
        .eq('id', editingTask.id);
      if (error) throw error;
      setTasks(tasks.map(t =>
        t.id === editingTask.id ? { ...t, title: newTask, due_date: newTaskDueDate ? newTaskDueDate.toISOString() : null } : t
      ));
      setEditingTask(null);
      setNewTask('');
      setNewTaskDueDate(null);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      if (error) throw error;
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !project || !user) return;
    try {
      const { data, error } = await supabase
        .from('project_ai_usage')
        .insert({
          project_id: project.id,
          query: message,
          response: 'This is a placeholder response from the AI.',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      setAIUsage([data, ...aiUsage]);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.completed).length;
    return (completedTasks / tasks.length) * 100;
  };

  // Sort tasks: incomplete sorted by due date, then completed
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    if (!a.completed && !b.completed) {
      const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      return dateA - dateB;
    }
    return 0;
  });

  if (loading) {
    return <div className="text-center text-[#4A4F57]">Loading...</div>;
  }

  if (!project) {
    return <div className="text-center text-[#4A4F57]">Project not found</div>;
  }

  const LogoIcon = logos.find((logo) => logo.name === project.logo)?.icon || BookOpen;
  const activeTools = availableTools.filter((tool) => projectTools.some((pt) => pt.tool_name === tool.name));
  const iconOptions = logos.map(logo => ({
    value: logo.value,
    icon: <logo.icon className="h-6 w-6" />
  }));
  const projectColorClass = colorOptions.find(c => c.value === project.color)?.bgClass || 'bg-emerald-500';

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="container px-4 py-6 md:px-6 md:py-8">
          {/* Project Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F5F5]">
                <LogoIcon className="h-7 w-7 text-[#1E3A8A]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold md:text-3xl text-[#1A1A1A]">{project.name}</h1>
                <p className="text-sm text-gray-600">{project.description || 'No description'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditProjectOpen(true)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Project
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <Card className="mb-8">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-[#1A1A1A]">Overall Progress</span>
                <span className="text-sm font-medium text-[#4A4F57]">
                  {tasks.filter(task => task.completed).length}/{tasks.length} tasks completed
                </span>
              </div>
              <Progress value={calculateProgress()} className="h-2 bg-[#F5F5F5]" indicatorClassName={projectColorClass} />
            </CardContent>
          </Card>

          {/* Tasks Section */}
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Tasks</h2>
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                <span>View Calendar</span>
              </Button>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {sortedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-md border p-3 h-12 w-full"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTaskCompletion(task.id)}
                          id={`task-${task.id}`}
                          className={`border-black ${
                            task.completed ? 'border-black bg-black' : 'border-black'
                          }`}
                        />
                        <label
                          htmlFor={`task-${task.id}`}
                          className={`text-sm flex-1 truncate ${
                            task.completed ? 'text-gray-500 line-through' : 'text-black'
                          }`}
                        >
                          {task.title}
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs">
                          Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'None'}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-white border rounded-md shadow-lg p-1">
                            <DropdownMenuItem
                              className="p-2 hover:bg-gray-100 cursor-pointer text-[#4A4F57]"
                              onClick={() => handleEditTask(task)}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="p-2 hover:bg-gray-100 cursor-pointer text-red-600"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}

                  <div className="rounded-md border p-3 h-12 flex items-center">
                    <div className="flex items-center gap-3 w-full">
                      <CheckSquare className="h-5 w-5 text-gray-400" />
                      <Input
                        placeholder={editingTask ? 'Edit task...' : 'Add a new task...'}
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyDown={handleNewTaskKeyDown}
                        className="border-0 p-0 shadow-none focus-visible:ring-0 text-[#4A4F57] flex-1"
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2 bg-white border rounded-md shadow-lg">
                          <CalendarComponent
                            onChange={(value: any, event: React.MouseEvent<HTMLButtonElement>) => {
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
                      {editingTask ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSaveEditTask}
                            disabled={!newTask.trim()}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingTask(null);
                              setNewTask('');
                              setNewTaskDueDate(null);
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addNewTask}
                          disabled={!newTask.trim()}
                        >
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Tools Section */}
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Tools</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setToolsDialogOpen(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Manage Tools</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeTools.map((tool) => (
                <div
                  key={tool.id}
                  onClick={() => handleToolClick(tool.view)}
                  className={`h-full cursor-pointer overflow-hidden transition-all hover:shadow-md ${tool.color}`}
                >
                  <CardContent className="flex flex-col items-center p-4 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center">{tool.icon}</div>
                    <h3 className="mb-1 font-semibold text-[#1A1A1A]">{tool.name}</h3>
                    <p className="text-xs text-[#4A4F57]">{tool.description}</p>
                  </CardContent>
                </div>
              ))}
            </div>
          </section>

          {/* Main Tabs */}
          <Tabs defaultValue="docs" className="mb-8">
            <TabsList className="mb-4 w-full justify-start bg-transparent p-0">
              <TabsTrigger
                value="docs"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#1E3A8A] data-[state=active]:bg-transparent data-[state=active]:text-[#1E3A8A] data-[state=active]:shadow-none text-[#4A4F57]"
              >
                Documents
              </TabsTrigger>
              <TabsTrigger
                value="files"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#1E3A8A] data-[state=active]:bg-transparent data-[state=active]:text-[#1E3A8A] data-[state=active]:shadow-none text-[#4A4F57]"
              >
                Files
              </TabsTrigger>
              <TabsTrigger
                value="ai-history"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#1E3A8A] data-[state=active]:bg-transparent data-[state=active]:text-[#1E3A8A] data-[state=active]:shadow-none text-[#4A4F57]"
              >
                AI History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="docs" className="mt-0">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#1A1A1A]">Documents</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDocContent('');
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Document
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {docs.length > 0 ? (
                  docs.map((doc) => (
                    <Card key={doc.id}>
                      <CardHeader className="flex flex-row items-center justify-between p-4">
                        <CardTitle className="text-base text-[#1A1A1A]">
                          {doc.content ? doc.content.split('\n')[0] : 'Untitled Document'}
                        </CardTitle>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {doc.content || 'No content'}
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                          <Badge className="text-xs rounded-full bg-gray-100">
                            Last edited {Math.floor(
                              (new Date().getTime() - new Date(doc.updated_at || doc.created_at).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )} days ago
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => setIsDocOpen(true)}
                          >
                            Open
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-[#4A4F57]">No documents found. Create a new one to get started!</p>
                )}
                {docContent !== null && (
                  <Card>
                    <CardContent className="p-4">
                      <Textarea
                        value={docContent}
                        onChange={(e) => setDocContent(e.target.value)}
                        className="w-full h-40 p-2 border border-[#EAEAEA] rounded-md text-[#4A4F57] focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]"
                        placeholder="Write your project documentation in markdown..."
                      />
                      <Button
                        onClick={handleDocSave}
                        className="mt-2"
                        variant="outline"
                      >
                        Save Documentation
                      </Button>
                      <div className="mt-4 prose">
                        <ReactMarkdown>{docContent}</ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="files" className="mt-0">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#1A1A1A]">Files</h2>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".txt,.md,.pdf,.docx,.jpg,.png"
                />
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 gap-4 border-b bg-transparent p-4 text-sm font-medium text-[#1A1A1A]">
                      <div className="col-span-6">Name</div>
                      <div className="col-span-2">Size</div>
                      <div className="col-span-3">Uploaded</div>
                      <div className="col-span-1"></div>
                    </div>
                    {files.map((file) => (
                      <div key={file.id} className="grid grid-cols-12 gap-4 border-b p-4 text-sm text-[#4A4F57]">
                        <div className="col-span-6 flex items-center gap-2">
                          {file.file_type === 'pdf' && <FileText className="h-6 w-6 text-red-500" />}
                          {['jpg', 'png'].includes(file.file_type) && <ImageIcon className="h-6 w-6 text-blue-500" />}
                          {['docx', 'txt', 'md'].includes(file.file_type) && <File className="h-6 w-6 text-blue-600" />}
                          <span className="truncate">{file.file_name}</span>
                        </div>
                        <div className="col-span-2 flex items-center">{formatFileSize(file.file_size)}</div>
                        <div className="col-span-3 flex items-center">{new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="col-span-1 flex items-center justify-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="mt-6">
                <h3 className="mb-2 text-lg font-medium text-[#1A1A1A]">Upload Files</h3>
                <Card className="border-dashed border-[#EAEAEA]">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <Upload className="mb-2 h-10 w-10 text-gray-400" />
                    <p className="mb-1 text-center text-[#4A4F57]">Drag and drop files here or click to browse</p>
                    <p className="text-center text-sm text-gray-500">Supports PDF, DOCX, JPG, PNG (up to 10MB)</p>
                    <Button variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                      Browse Files
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ai-history" className="mt-0">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#1A1A1A]">AI Interaction History</h2>
                <Button variant="outline" size="sm" onClick={handleClearHistory}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear History
                </Button>
              </div>

              <div className="space-y-4">
                {aiUsage.map((chat) => (
                  <Card key={chat.id}>
                    <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-[#1E3A8A]" />
                        <span className="font-medium text-[#1A1A1A]">Query</span>
                      </div>
                      <Badge className="font-normal rounded-full bg-gray-100">
                        <Clock className="mr-1 h-3 w-3" />
                        {new Date(chat.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <p className="mb-2 font-medium text-[#1E3A8A]">{chat.query}</p>
                      <p className="text-sm text-gray-700">{chat.response}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {isDocOpen && (
        <div className="w-80 flex-shrink-0 border-l bg-white lg:block">
          <div className="flex h-full flex-col">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Project Assistant</h2>
              <p className="text-sm text-gray-600">Ask questions about your project</p>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {aiUsage.length === 0 ? (
                  <div className="flex flex-col gap-2">
                    <div className="ml-auto max-w-[80%] rounded-lg bg-[#1E3A8A] p-3 text-white">
                      <p className="text-sm">How can I help with your project today?</p>
                    </div>
                    <div className="max-w-[80%] rounded-lg bg-gray-100 p-3">
                      <p className="text-sm text-[#4A4F57]">
                        I can help you understand concepts, create study materials, or answer specific questions about your project.
                      </p>
                    </div>
                  </div>
                ) : (
                  aiUsage.map((chat) => (
                    <div key={chat.id} className="flex flex-col gap-2">
                      <div className="max-w-[80%] rounded-lg bg-gray-100 p-3">
                        <p className="text-sm text-[#4A4F57]">{chat.query}</p>
                      </div>
                      <div className="ml-auto max-w-[80%] rounded-lg bg-[#1E3A8A] p-3 text-white">
                        <p className="text-sm">{chat.response}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="border-t p-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Textarea
                  placeholder="Ask a question..."
                  className="min-h-[80px] resize-none text-[#4A4F57]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <Button
                className="mt-2 w-full"
                onClick={handleSendMessage}
                disabled={!message.trim()}
                variant="outline"
              >
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Dialog */}
      <Dialog open={editProjectOpen} onOpenChange={setEditProjectOpen}>
        <DialogOverlay className="fixed inset-0 bg-black/50 z-40" />
        <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-2xl w-full bg-white rounded-lg shadow-xl z-50 p-6">
          <div className="mb-4">
            <DialogTitle className="text-lg font-semibold text-[#1A1A1A]">Edit Project</DialogTitle>
            <p className="text-sm text-gray-500">Make changes to your project or delete it.</p>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="project-title" className="text-sm font-medium text-[#1A1A1A]">Project Title</Label>
              <Input
                id="project-title"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Enter project title"
                className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description" className="text-sm font-medium text-[#1A1A1A]">Description</Label>
              <Textarea
                id="project-description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Enter project description"
                className="min-h-[100px] border-blue-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1A1A1A]">Project Icon</Label>
              <div className="grid grid-cols-6 gap-2">
                {iconOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={projectIcon === option.value ? "primary" : "outline"}
                    className={`h-12 ${projectIcon === option.value ? "bg-[#1E3A8A] text-white" : "bg-transparent border-blue-300"}`}
                    onClick={() => setProjectIcon(option.value)}
                  >
                    {option.icon}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1A1A1A]">Project Color</Label>
              <div className="grid grid-cols-6 gap-2">
                {colorOptions.map((color) => (
                  <Button
                    key={color.value}
                    type="button"
                    variant={projectColor === color.value ? "primary" : "outline"}
                    className={`h-8 ${color.bgClass} ${color.hoverClass} ${
                      projectColor === color.value ? "border-2 border-blue-500" : "border-blue-300"
                    }`}
                    onClick={() => setProjectColor(color.value)}
                  />
                ))}
              </div>
            </div>
            <Separator className="bg-blue-200" />
            <div className="rounded-md border border-red-200 bg-red-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <h4 className="font-medium text-red-600">Delete Project</h4>
                    <p className="text-xs text-red-500">This action cannot be undone.</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setDeleteAlertOpen(true)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditProjectOpen(false)} className="border-blue-300 text-blue-700 hover:bg-blue-100">
              Cancel
            </Button>
            <Button onClick={handleSaveProjectChanges} className="bg-blue-500 hover:bg-blue-600 text-white">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Tools Dialog */}
      <Dialog open={toolsDialogOpen} onOpenChange={setToolsDialogOpen}>
        <DialogOverlay className="fixed inset-0 bg-black/50 z-40" />
        <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 max-w-[100vw] bg-white border rounded-lg shadow-xl z-50 p-6">
          <div className="mb-4">
            <DialogTitle className="text-lg font-semibold text-[#1A1A1A]">Manage Project Tools</DialogTitle>
            <p className="text-sm text-gray-500">Select which tools you want to display on your project page.</p>
          </div>
          <div className="space-y-4 py-4">
            {availableTools.map((tool) => (
              <div
                key={tool.id}
                className="flex items-center justify-between rounded-lg p-4 border border-[#EAEAEA]"
              >
                <div className="flex items-center space-x-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-md ${tool.color}`}>
                    {tool.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">{tool.name}</h4>
                    <p className="text-xs text-gray-500">{tool.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`tool-${tool.id}`}
                    checked={selectedTools.includes(tool.name)}
                    onCheckedChange={() => toggleToolVisibility(tool.id)}
                  />
                  <Label htmlFor={`tool-${tool.id}`} className="sr-only">
                    Toggle {tool.name}
                  </Label>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setToolsDialogOpen(false)} className="border-blue-300 text-blue-700 hover:bg-blue-100">
              Cancel
            </Button>
            <Button onClick={handleToolModalSave} className="bg-blue-500 hover:bg-blue-600 text-white">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your project and remove all associated data
              from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectPage;
