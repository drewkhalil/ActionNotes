import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Project, Task, AppUser } from '../types/types';
import { BookOpen, Plus, Calendar, CheckSquare, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { logos, colorOptions } from '../lib/constants';

interface HomepageProps {
  user: AppUser | null;
  setActiveView: React.Dispatch<
    React.SetStateAction<
      'home' | 'tools' | 'history' | 'settings' | 'teach' | 'recap' | 'flashcards' | 'quiz' | 'studyTechniques'
    >
  >;
}

export const Homepage: React.FC<HomepageProps> = ({ user, setActiveView }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<'all' | 'recent' | 'inProgress'>('all');
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
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
        if (projectsError) throw projectsError;
        setProjects(projectsData || []);

        // Fetch all tasks for progress calculation
        const { data: allTasksData, error: allTasksError } = await supabase
          .from('tasks')
          .select('*, projects(name, logo, color)')
          .in('project_id', projectsData?.map(p => p.id) || []);
        if (allTasksError) throw allTasksError;
        setTasks(allTasksData || []);

        // Fetch overdue tasks (incomplete, due date passed by 11:59 PM of that day)
        const now = new Date();
        const { data: overdueTasksData, error: overdueTasksError } = await supabase
          .from('tasks')
          .select('*, projects(name, logo, color)')
          .eq('completed', false)
          .not('due_date', 'is', null)
          .lte('due_date', now.toISOString())
          .order('due_date', { ascending: true });
        if (overdueTasksError) throw overdueTasksError;

        // Filter tasks to ensure due date is before today at 11:59 PM
        const filteredOverdueTasks = overdueTasksData?.filter(task => {
          const dueDate = new Date(task.due_date);
          dueDate.setHours(23, 59, 59, 999); // Set to 11:59:59.999 PM of the due date
          return dueDate < now;
        }) || [];
        setOverdueTasks(filteredOverdueTasks);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleCreateProject = async () => {
    if (!user) return;
    try {
      // Create new project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: 'New Project',
          description: '',
          logo: 'BookOpen',
          color: 'emerald',
        })
        .select()
        .single();
      if (projectError) throw projectError;

      // Insert default tools
      const defaultTools = ['TeachMeThat', 'RecapMe', 'ThinkFast', 'QuickQuizzer'];
      const { error: toolsError } = await supabase
        .from('project_tools')
        .insert(
          defaultTools.map((tool) => ({
            project_id: projectData.id,
            tool_name: tool,
          }))
        );
      if (toolsError) throw toolsError;

      navigate(`/project/${projectData.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    }
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  // Calculate task progress for a project
  const calculateProjectProgress = (projectId: string) => {
    const projectTasks = tasks.filter(task => task.project_id === projectId);
    if (projectTasks.length === 0) return { completed: 0, total: 0, percentage: 0 };
    const completedTasks = projectTasks.filter(task => task.completed).length;
    const totalTasks = projectTasks.length;
    const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    return { completed: completedTasks, total: totalTasks, percentage };
  };

  // Calculate Productivity Score
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const overdueCount = overdueTasks.length;

  let productivityScore = 0;
  if (totalTasks > 0) {
    productivityScore = (completedTasks / totalTasks) * 100;
    productivityScore -= overdueCount * 2; // 2% penalty per overdue task
    if (productivityScore < 0) productivityScore = 0; // No negative scores
    if (productivityScore > 100) productivityScore = 100; // Cap at 100%
  }

  // Map and sort projects
  const mappedProjects = projects
    .map((project) => {
      const { completed, total, percentage } = calculateProjectProgress(project.id);
      const LogoIcon = logos.find(logo => logo.name === project.logo)?.icon || BookOpen;
      const projectColor = colorOptions.find(c => c.value === project.color)?.bgClass || 'bg-emerald-500';
      return {
        id: project.id,
        title: project.name,
        description: project.description || 'No description',
        progress: percentage,
        tasksCompleted: completed,
        totalTasks: total,
        updatedDays: Math.floor(
          (new Date().getTime() - new Date(project.updated_at || project.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
        icon: <LogoIcon className="h-6 w-6" />,
        color: projectColor,
        href: `/project/${project.id}`,
      };
    })
    .filter((project) => {
      if (sortMode === 'recent') {
        return project.updatedDays <= 7; // Show projects updated in the last 7 days
      }
      if (sortMode === 'inProgress') {
        return project.totalTasks > 0 && project.progress < 100; // Show projects with tasks and not fully completed
      }
      return true; // Show all projects
    })
    .sort((a, b) => {
      if (sortMode === 'recent') {
        return a.updatedDays - b.updatedDays; // Sort by most recently updated
      }
      if (sortMode === 'inProgress') {
        return b.progress - a.progress; // Sort by progress (highest to lowest)
      }
      return 0; // Default order (by updated_at from Supabase query)
    });

  // Analytics data
  const analytics = [
    {
      title: 'Study Time',
      value: '12.5 hrs',
      change: '+15% from last week',
      positive: true,
      color: 'bg-black',
      period: 'This week',
      link: null,
    },
    {
      title: 'Overdue Tasks',
      value: overdueTasks.length.toString(),
      change: overdueTasks.length > 0 ? 'needs attention' : 'all caught up',
      positive: overdueTasks.length === 0,
      color: 'bg-black',
      period: 'Past due',
      link: '/calendar',
    },
    {
      title: 'Productivity Score',
      value: `${Math.round(productivityScore)}%`,
      positive: productivityScore >= 70,
      color: 'bg-black',
      period: 'Overall rating',
      link: null,
    },
  ];

  if (loading) {
    return <div className="text-center text-text">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="container px-4 py-6 md:px-6 md:py-8">
        {/* Hero Section */}
        <section className="mb-10">
          <h1 className="text-3xl font-bold md:text-4xl">
            Welcome back, {user?.username || user?.email?.split('@')[0]}! Let's tackle your projects.
          </h1>
          <p className="mt-2 text-gray-600">Continue your study journey where you left off.</p>
        </section>

        {/* My Projects Section */}
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold md:text-2xl">My Projects</h2>
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 rounded-md ${sortMode === 'all' ? 'bg-[#F5F5F5] text-[#1E3A8A]' : 'bg-transparent text-gray-600 hover:bg-[#F5F5F5]'}`}
                onClick={() => setSortMode('all')}
              >
                All
              </button>
              <button
                className={`px-4 py-2 rounded-md ${sortMode === 'recent' ? 'bg-[#F5F5F5] text-[#1E3A8A]' : 'bg-transparent text-gray-600 hover:bg-[#F5F5F5]'}`}
                onClick={() => setSortMode('recent')}
              >
                Recent
              </button>
              <button
                className={`px-4 py-2 rounded-md ${sortMode === 'inProgress' ? 'bg-[#F5F5F5] text-[#1E3A8A]' : 'bg-transparent text-gray-600 hover:bg-[#F5F5F5]'}`}
                onClick={() => setSortMode('inProgress')}
              >
                In Progress
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mappedProjects.map((project) => (
              <div key={project.id} onClick={() => handleProjectClick(project.id)}>
                <Card className="overflow-hidden transition-all hover:shadow-md cursor-pointer">
                  <div className="flex flex-row items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]">
                      {project.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1E3A8A]">{project.title}</h3>
                      <p className="text-sm text-gray-600">{project.description}</p>
                    </div>
                  </div>
                  <div className="px-4 pb-2">
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{project.tasksCompleted}/{project.totalTasks} tasks done</span>
                    </div>
                    <Progress
                      value={project.progress}
                      className="h-2 bg-[#F5F5F5]"
                      indicatorClassName={project.color}
                    />
                  </div>
                  <div className="px-4 pb-4 text-sm text-gray-500">
                    Updated {project.updatedDays} days ago
                  </div>
                </Card>
              </div>
            ))}

            {/* Create Project Card */}
            <Card
              onClick={handleCreateProject}
              className="flex h-full cursor-pointer flex-col items-center justify-center border-dashed border-[#1E3A8A] bg-white p-6 text-center transition-all hover:bg-[#F5F5F5]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#1E3A8A]">
                <Plus className="h-6 w-6 text-[#1E3A8A]" />
              </div>
              <h3 className="font-semibold text-[#1E3A8A]">Create a new project</h3>
            </Card>
          </div>
        </section>

        {/* Upcoming Tasks Section */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Upcoming Tasks</h2>
            <button
              onClick={() => navigate('/calendar')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm flex items-center"
            >
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar
            </button>
          </div>

          <Card>
            <div className="divide-y">
              {tasks.filter(task => !task.completed && task.due_date && new Date(task.due_date) > new Date()).length > 0 ? (
                tasks
                  .filter(task => !task.completed && task.due_date && new Date(task.due_date) > new Date())
                  .map((task) => {
                    const TaskIcon = logos.find(logo => logo.name === task.projects?.logo)?.icon || BookOpen;
                    const projectColorClass = colorOptions.find(c => c.value === task.projects?.color)?.bgClass || 'bg-emerald-500';
                    return (
                      <div key={task.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <CheckSquare className="h-5 w-5 text-[#1E3A8A]" />
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <Badge className={`flex items-center gap-1 ${projectColorClass} bg-opacity-20`}>
                              <TaskIcon className="h-4 w-4" />
                              <span className="text-xs">{task.projects?.name || 'Unknown Project'}</span>
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="border-gray-300">
                            Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="p-4 text-center text-gray-600">
                  No upcoming tasks.
                </div>
              )}
            </div>
            <div className="flex justify-center border-t p-2">
              <button
                onClick={() => navigate('/calendar')}
                className="text-[#1E3A8A] hover:underline"
              >
                View all tasks
              </button>
            </div>
          </Card>
        </section>

        {/* Study Analytics Section */}
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Study Analytics</h2>
            <button className="text-[#1E3A8A] hover:underline">
              View detailed stats
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {analytics.map((item, index) => (
              <div
                key={index}
                onClick={() => item.link && navigate(item.link)}
                className={`space-y-2 ${item.link ? 'cursor-pointer hover:opacity-90' : ''}`}
              >
                <h3 className="font-medium">{item.title}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{item.value}</span>
                  <span className="text-sm text-gray-500">{item.period}</span>
                </div>
                <Progress
                  value={item.title === 'Productivity Score' ? productivityScore : 75}
                  className="h-2 bg-[#F5F5F5]"
                  indicatorClassName="bg-emerald-500"
                />
                <p
                  className={`text-sm ${
                    item.positive === true
                      ? 'text-emerald-600'
                      : item.positive === false
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {item.change}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
