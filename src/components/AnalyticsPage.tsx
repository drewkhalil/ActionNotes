import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AppUser, Project, Task, ProjectAIUsage } from '../types/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';

interface AnalyticsPageProps {
  user: AppUser | null;
  setActiveView: React.Dispatch<
    React.SetStateAction<
      'home' | 'tools' | 'history' | 'settings' | 'teach' | 'recap' | 'flashcards' | 'quiz' | 'studyTechniques' | 'calendar' | 'projects' | 'analytics'
    >
  >;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ user, setActiveView }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [aiUsage, setAIUsage] = useState<ProjectAIUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchAnalyticsData = async () => {
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
          .select('*')
          .eq('user_id', user.id);
        if (tasksError) throw tasksError;
        setTasks(tasksData || []);

        const { data: aiUsageData, error: aiUsageError } = await supabase
          .from('project_ai_usage')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (aiUsageError) throw aiUsageError;
        setAIUsage(aiUsageData || []);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [user]);

  const calculateProjectCompletion = () => {
    if (projects.length === 0) return 0;
    const completedProjects = projects.filter(p => {
      const projectTasks = tasks.filter(t => t.project_id === p.id);
      return projectTasks.length > 0 && projectTasks.every(t => t.completed);
    }).length;
    return (completedProjects / projects.length) * 100;
  };

  const calculateTaskCompletion = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(t => t.completed).length;
    return (completedTasks / tasks.length) * 100;
  };

  const calculateAIUsageTrend = () => {
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsage = aiUsage.filter(u => new Date(u.created_at) > last7Days).length;
    const totalUsage = aiUsage.length;
    return totalUsage > 0 ? (recentUsage / totalUsage) * 100 : 0;
  };

  if (loading) {
    return <div className="text-center text-[#b3aea2]">Loading...</div>;
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-white text-[32px] font-bold leading-tight mb-6">Analytics Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Project Completion */}
        <Card className="bg-[#24221e] border-[#4f4a40]">
          <CardHeader>
            <CardTitle className="text-white text-lg">Project Completion Rate</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Progress value={calculateProjectCompletion()} className="h-2 bg-[#35322c]" indicatorClassName="bg-[#c6a351]" />
            <p className="text-sm text-[#b3aea2] mt-2">{calculateProjectCompletion().toFixed(1)}% complete</p>
          </CardContent>
        </Card>
        {/* Task Completion */}
        <Card className="bg-[#24221e] border-[#4f4a40]">
          <CardHeader>
            <CardTitle className="text-white text-lg">Task Completion Rate</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Progress value={calculateTaskCompletion()} className="h-2 bg-[#35322c]" indicatorClassName="bg-[#c6a351]" />
            <p className="text-sm text-[#b3aea2] mt-2">{calculateTaskCompletion().toFixed(1)}% complete</p>
            <Button
              className="mt-4 bg-[#35322c] text-white hover:bg-[#4f4a40]"
              onClick={() => setActiveView('projects')}
            >
              View Tasks
            </Button>
          </CardContent>
        </Card>
        {/* AI Usage Trend */}
        <Card className="bg-[#24221e] border-[#4f4a40]">
          <CardHeader>
            <CardTitle className="text-white text-lg">AI Usage (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Progress value={calculateAIUsageTrend()} className="h-2 bg-[#35322c]" indicatorClassName="bg-[#c6a351]" />
            <p className="text-sm text-[#b3aea2] mt-2">{calculateAIUsageTrend().toFixed(1)}% of total usage</p>
            <Button
              className="mt-4 bg-[#35322c] text-white hover:bg-[#4f4a40]"
              onClick={() => setActiveView('projects')}
            >
              View AI History
            </Button>
          </CardContent>
        </Card>
      </div>
      {/* Simple Chart (Canvas Panel Suggestion) */}
      <div className="mt-6">
        <Card className="bg-[#24221e] border-[#4f4a40]">
          <CardHeader>
            <CardTitle className="text-white text-lg">Task Completion Over Time</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div id="chart-canvas" className="w-full h-64 bg-[#35322c] text-white">
              {/* Canvas panel can be opened here to visualize */}
              {/* Sample data for chart: tasks completed per day */}
            </div>
            <Button
              className="mt-4 bg-[#c6a351] text-[#161512] hover:bg-[#b5923e]"
              onClick={() => {
                // Open canvas panel with code to draw chart
                const ctx = document.getElementById('chart-canvas') as HTMLCanvasElement | null;
                if (ctx) {
                  const canvas = ctx.getContext('2d');
                  if (canvas) {
                    canvas.fillStyle = '#c6a351';
                    canvas.fillRect(0, 0, ctx.width, ctx.height);
                    canvas.fillStyle = '#ffffff';
                    canvas.font = '16px Arial';
                    canvas.fillText('Chart Placeholder', 10, 20);
                  }
                }
              }}
            >
              Visualize Chart
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;