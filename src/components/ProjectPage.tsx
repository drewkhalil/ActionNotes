import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Project, ProjectDoc, ProjectFile, ToolHistory, Task, AppUser } from '../types/types';
import {
  FileText, Upload, Wrench, BookOpen, Pencil, Share2, Brain, PenSquare, Lightbulb, Bookmark, Settings, Trash2, MessageSquare, Download, Plus, Calendar,
  ImageIcon, File, Paperclip, Send, Clock, MoreVertical, CheckSquare, AlertTriangle
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogOverlay } from '@radix-ui/react-dialog';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from './ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { logos, colorOptions } from '../lib/constants';
import Documents from './project/Documents';
import Tasks from './project/Tasks';
import Files from './project/Files';
import ToolHistoryComponent from './project/ToolHistory';

interface ProjectPageProps {
  user: AppUser | null
  setActiveView: React.Dispatch<
    React.SetStateAction<
      'home' | 'tools' | 'history' | 'settings' | 'teach' | 'recap' | 'flashcards' | 'quiz' | 'studyTechniques' | 'calendar' | 'projects' | 'analytics'
    >
  >
}

const ProjectPage: React.FC<ProjectPageProps> = ({ user, setActiveView }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [docs, setDocs] = useState<ProjectDoc[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [toolHistory, setToolHistory] = useState<ToolHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectIcon, setProjectIcon] = useState('BookOpen');
  const [projectColor, setProjectColor] = useState('emerald');
  const [activeTab, setActiveTab] = useState('tasks');

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

        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('project_id', projectId);
        if (tasksError) throw tasksError;
        setTasks(tasksData || []);

        const { data: docsData, error: docsError } = await supabase
          .from('project_docs')
          .select('*')
          .eq('project_id', projectId);
        if (docsError) throw docsError;
        setDocs(docsData || []);

        const { data: filesData, error: filesError } = await supabase
          .from('project_files')
          .select('*')
          .eq('project_id', projectId);
        if (filesError) throw filesError;
        setFiles(filesData || []);

        const { data: toolHistoryData, error: toolHistoryError } = await supabase
          .from('tool_history')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });
        if (toolHistoryError) throw toolHistoryError;
        setToolHistory(toolHistoryData || []);
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
          logo: projectIcon,
        })
        .eq('id', project.id)
        .eq('user_id', user.id);
      if (error) throw error;
      setProject({
        ...project,
        name: projectTitle,
        description: projectDescription,
        color: projectColor,
        logo: projectIcon,
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
      navigate('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  if (loading) {
    return <div className="text-center text-[#b9b19d] bg-[#181611] h-screen">Loading...</div>;
  }

  if (!project) {
    return <div className="text-center text-[#b9b19d] bg-[#181611] h-screen">Project not found</div>;
  }

  const LogoIcon = logos.find((logo) => logo.name === project.logo)?.icon || BookOpen;
  const iconOptions = logos.map((logo) => ({
    value: logo.name,
    icon: <logo.icon className="h-6 w-6" />,
  }));
  const projectColorClass = colorOptions.find((c) => c.value === project.color)?.bgClass || 'bg-[#dba10f]';

  return (
    <div className="flex flex-1 overflow-hidden bg-[#181611]">
      <div className="flex-1 overflow-auto">
        <main className="px-4 py-6">
          <div className="flex flex-wrap gap-2 p-4">
            <Link to="/projects" className="text-[#b9b19d] text-base font-medium">Projects</Link>
            <span className="text-[#b9b19d] text-base font-medium">/</span>
            <span className="text-white text-base font-medium">{project.name}</span>
          </div>
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <div className="flex min-w-72 flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#27241c]">
                  <LogoIcon className="h-7 w-7 text-white" />
                </div>
                <p className="text-white text-[32px] font-bold leading-tight">{project.name}</p>
              </div>
              <p className="text-[#b9b19d] text-sm font-normal">{project.description || 'No description'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="flex h-10 px-4 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#393428] text-white text-sm font-bold tracking-[0.015em]"
                onClick={() => setEditProjectOpen(true)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                <span className="truncate">Edit</span>
              </Button>
              <Button
                className="flex h-10 px-4 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#393428] text-white text-sm font-bold tracking-[0.015em]"
                onClick={() => setDeleteAlertOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span className="truncate">Delete</span>
              </Button>
            </div>
          </div>
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              console.log(`Tab switched to: ${value}`);
              setActiveTab(value);
            }}
            className="mb-8"
          >
            <TabsList className="flex border-b border-[#544d3b] px-4 gap-8 bg-transparent">
              <TabsTrigger
                value="tasks"
                className="text-[#b9b19d] data-[state=active]:text-white data-[state=active]:border-b-[3px] data-[state=active]:border-white pb-[13px] pt-4 text-sm font-bold cursor-pointer"
              >
                Tasks
              </TabsTrigger>
              <TabsTrigger
                value="docs"
                className="text-[#b9b19d] data-[state=active]:text-white data-[state=active]:border-b-[3px] data-[state=active]:border-white pb-[13px] pt-4 text-sm font-bold cursor-pointer"
              >
                Documents
              </TabsTrigger>
              <TabsTrigger
                value="files"
                className="text-[#b9b19d] data-[state=active]:text-white data-[state=active]:border-b-[3px] data-[state=active]:border-white pb-[13px] pt-4 text-sm font-bold cursor-pointer"
              >
                Files
              </TabsTrigger>
              <TabsTrigger
                value="tool-history"
                className="text-[#b9b19d] data-[state=active]:text-white data-[state=active]:border-b-[3px] data-[state=active]:border-white pb-[13px] pt-4 text-sm font-bold cursor-pointer"
              >
                Tool History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="tasks" className="mt-0">
              <div className="error-boundary">
                <Tasks project={project} user={user} tasks={tasks} setTasks={setTasks} />
              </div>
            </TabsContent>
            <TabsContent value="docs" className="mt-0">
              <div className="error-boundary">
                <Documents project={project} user={user} docs={docs} setDocs={setDocs} />
              </div>
            </TabsContent>
            <TabsContent value="files" className="mt-0">
              <div className="error-boundary">
                <Files project={project} user={user} files={files} setFiles={setFiles} />
              </div>
            </TabsContent>
            <TabsContent value="tool-history" className="mt-0">
              <div className="error-boundary">
                <ToolHistoryComponent project={project} toolHistory={toolHistory} setToolHistory={setToolHistory} />
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <Dialog open={editProjectOpen} onOpenChange={setEditProjectOpen}>
        <DialogOverlay className="fixed inset-0 bg-black bg-opacity-50" />
        <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-2xl w-full max-h-[80vh] bg-[#181611] border-[#544d3b] rounded-lg shadow-xl p-0 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-[#544d3b] px-10 py-3">
            <DialogTitle className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">Edit Project</DialogTitle>
          </div>
          <div className="px-10 py-3">
            <div className="flex flex-col w-[512px] max-w-[512px] py-3">
              <h2 className="text-white text-[28px] font-bold leading-tight px-4 pb-3 pt-3">Edit Project</h2>
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-2">
                <label className="flex flex-col min-w-40 flex-1">
                  <Input
                    placeholder="Project name"
                    className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-[#393428] focus:border-none h-14 placeholder:text-[#b9b19d] p-4 text-base font-normal leading-normal"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                  />
                </label>
              </div>
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-2">
                <label className="flex flex-col min-w-40 flex-1">
                  <Textarea
                    placeholder="Description"
                    className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-[#393428] focus:border-none min-h-24 placeholder:text-[#b9b19d] p-4 text-base font-normal leading-normal"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                  />
                </label>
              </div>
              <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-3">Accent color</h3>
              <div className="flex flex-wrap gap-5 p-4">
                {colorOptions.map((color) => (
                  <label
                    key={color.value}
                    className="size-10 rounded-full border border-[#544d3b] ring-[color-mix(in_srgb,#ffffff_50%,_transparent)] has-[:checked]:border-[3px] has-[:checked]:border-[#181611] has-[:checked]:ring"
                    style={{ backgroundColor: color.rgb }}
                  >
                    <input
                      type="radio"
                      className="invisible"
                      name="project-color"
                      checked={projectColor === color.value}
                      onChange={() => setProjectColor(color.value)}
                    />
                  </label>
                ))}
              </div>
              <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-3">Icon</h3>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3 p-4">
                {iconOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`flex flex-col items-center gap-2 rounded-lg border border-[#544d3b] bg-[#27241c] p-4 cursor-pointer ${projectIcon === option.value ? 'ring-2 ring-[#dba10f]' : ''}`}
                    onClick={() => setProjectIcon(option.value)}
                  >
                    <div className="text-white w-12 h-12 flex items-center justify-center">{option.icon}</div>
                    <h2 className="text-white text-sm font-bold leading-tight text-center">{option.value}</h2>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 px-4 py-3">
                <Button
                  className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#393428] text-white text-sm font-bold leading-normal tracking-[0.015em]"
                  onClick={() => setEditProjectOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#dba10f] text-[#181611] text-sm font-bold leading-normal tracking-[0.015em]"
                  onClick={handleSaveProjectChanges}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent className="bg-[#181611] border-[#544d3b]">
          <AlertDialogTitle className="text-white">Delete Project?</AlertDialogTitle>
          <AlertDialogDescription className="text-[#b9b19d]">
            This action cannot be undone. Deleting this project will permanently remove it and all associated data.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel className="bg-[#393428] text-white hover:bg-[#544d3b]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteProject}
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectPage;