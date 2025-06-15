import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Project, Task, AppUser } from '../types/types';
import { useNavigate } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from '../components/ui/card'; // Adjust the import path as needed
import logoLight from '../assets/logo-light.png'; // Adjust path based on your asset location

interface HomepageProps {
  user: AppUser | null;
  setActiveView: React.Dispatch<
    React.SetStateAction<
      'home' | 'tools' | 'history' | 'settings' | 'teach' | 'recap' | 'flashcards' | 'quiz' | 'studyTechniques' | 'calendar' | 'projects' | 'analytics'
    >
  >;
}

export const Homepage: React.FC<HomepageProps> = ({ user, setActiveView }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', color: '#d4a017', icon: 'Folder' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; // Match the 4 projects per row
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProjects = async () => {
      setLoading(true);
      try {
        const { data: projectsData, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
        if (error) throw error;
        setProjects(projectsData || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  const handleCreateProject = async () => {
    if (!user) {
      setActiveView('home');
      return;
    }
    try {
      const { data: projectData, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: newProject.name || 'New Project',
          description: newProject.description || '',
          logo: newProject.icon,
          color: newProject.color,
        })
        .select()
        .single();
      if (error) throw error;

      setShowCreateModal(false);
      navigate(`/project/${projectData.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    }
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (loading) {
    return <div className="text-center text-white">Loading...</div>;
  }

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-[#171512] dark group/design-root overflow-x-hidden"
      style={{ fontFamily: 'Manrope, "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-30 py-20 flex flex-1 justify-center"> 
          <div className="layout-content-container flex flex-col max-w-[1200px] flex-1"> 
            <div className="flex flex-wrap justify-between items-center gap-6 p-6">
              <p className="text-white text-3xl font-bold leading-tight">Projects</p>
              <button
                className="flex min-w-[100px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-6 bg-[#36332b] text-white text-sm font-medium leading-normal"
                onClick={() => setShowCreateModal(true)}
              >
                <span className="truncate">Add Project</span>
              </button>
            </div>
            <div className="px-6 py-4">
              <label className="flex w-full"> 
                <div className="flex w-full items-stretch rounded-xl bg-[#36332b] h-12">
                  <div className="text-[#b4afa2] flex items-center justify-center pl-4 rounded-l-xl">
                    <Search className="h-6 w-6" />
                  </div>
                  <input
                    placeholder="Search projects"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-[#36332b] focus:border-none h-full placeholder:text-[#b4afa2] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </label>
            </div>
            <div className="px-6 py-4 flex gap-4 flex-wrap"> 
              <button className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full bg-[#36332b] px-4">
                <p className="text-white text-sm font-medium leading-normal">All Projects</p>
              </button>
              <button className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full bg-[#36332b] px-4">
                <p className="text-white text-sm font-medium leading-normal">In Progress</p>
              </button>
              <button className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full bg-[#36332b] px-4">
                <p className="text-white text-sm font-medium leading-normal">Completed</p>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-12 p-8 max-w-[1200px] sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]"> 
              {paginatedProjects.map((project) => (
                <Card
                  key={project.id}
                  className="bg-[#24221e] border-[#4f4a40] h-48 flex flex-col justify-between cursor-pointer"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <CardContent className="flex items-center gap-2 p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path
                        d="M216,72H131.31L104,44.69A15.86,15.86,0,0,0,92.69,40H40A16,16,0,0,0,24,56V200.62A15.4,15.4,0,0,0,39.38,216H216.89A15.13,15.13,0,0,0,232,200.89V88A16,16,0,0,0,216,72ZM40,56H92.69l16,16H40ZM216,200H40V88H216Z"
                      ></path>
                    </svg>
                    <CardTitle className="text-white text-lg font-bold">{project.name}</CardTitle>
                  </CardContent>
                  <CardContent className="p-4">
                    <CardDescription className="text-[#b3aea2] text-sm font-normal">
                      {project.description || 'No description'}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 p-6"> 
              <button
                className="flex size-10 items-center justify-center"
                onClick={handlePrevious}
                disabled={currentPage === 1}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18px"
                  height="18px"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                  className="text-white"
                >
                  <path
                    d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"
                  ></path>
                </svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`flex size-10 items-center justify-center rounded-full text-white text-sm ${currentPage === page ? 'bg-[#36332b] font-bold' : 'font-normal'}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="flex size-10 items-center justify-center"
                onClick={handleNext}
                disabled={currentPage === totalPages}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18px"
                  height="18px"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                  className="text-white"
                >
                  <path
                    d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#171512] p-6 rounded-lg w-[400px] text-white">
            <h2 className="text-2xl font-bold mb-4">Create project</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Project name"
                className="w-full p-2 rounded-lg bg-[#36332b] text-white placeholder-[#b4afa2]"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              />
              <textarea
                placeholder="Description"
                className="w-full p-2 rounded-lg bg-[#36332b] text-white placeholder-[#b4afa2] h-24 resize-none"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
              <div>
                <p className="mb-2">Accent color</p>
                <div className="flex gap-2">
                  {['#d4a017', '#4a4a4a', '#333', '#1e90ff', '#98ff98', '#ffff99'].map((color) => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full ${newProject.color === color ? 'ring-2 ring-white' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewProject({ ...newProject, color })}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2">Icon</p>
                <div className="grid grid-cols-4 gap-2">
                  {['Folder', 'FolderOpen', 'FolderSimple', 'FolderSimpleOpen', 'File', 'FileDashed', 'FileImage', 'FileVideo'].map((icon) => {
                    const svgPaths = {
                      Folder: <path d="M216,72H131.31L104,44.69A15.86,15.86,0,0,0,92.69,40H40A16,16,0,0,0,24,56V200.62A15.4,15.4,0,0,0,39.38,216H216.89A15.13,15.13,0,0,0,232,200.89V88A16,16,0,0,0,216,72ZM40,56H92.69l16,16H40ZM216,200H40V88H216Z" />,
                      FolderOpen: <path d="M216,72H131.31L104,44.69A15.86,15.86,0,0,0,92.69,40H40A16,16,0,0,0,24,56V200.62A15.4,15.4,0,0,0,39.38,216H216.89A15.13,15.13,0,0,0,232,200.89V88A16,16,0,0,0,216,72ZM40,56H92.69l16,16H40ZM216,200H40V88H216Z" />,
                      FolderSimple: <path d="M216,72H131.31L104,44.69A15.86,15.86,0,0,0,92.69,40H40A16,16,0,0,0,24,56V200.62A15.4,15.4,0,0,0,39.38,216H216.89A15.13,15.13,0,0,0,232,200.89V88A16,16,0,0,0,216,72ZM40,56H92.69l16,16H40ZM216,200H40V88H216Z" />,
                      FolderSimpleOpen: <path d="M216,72H131.31L104,44.69A15.86,15.86,0,0,0,92.69,40H40A16,16,0,0,0,24,56V200.62A15.4,15.4,0,0,0,39.38,216H216.89A15.13,15.13,0,0,0,232,200.89V88A16,16,0,0,0,216,72ZM40,56H92.69l16,16H40ZM216,200H40V88H216Z" />,
                      File: <path d="M200,24H72A16,16,0,0,0,56,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V40A16,16,0,0,0,200,24Zm0,192H72V40H200Z" />,
                      FileDashed: <path d="M200,24H72A16,16,0,0,0,56,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V40A16,16,0,0,0,200,24Zm0,192H72V40H200Z" fill="none" stroke="currentColor" strokeDasharray="4" />,
                      FileImage: <path d="M200,24H72A16,16,0,0,0,56,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V40A16,16,0,0,0,200,24Zm0,192H72V40H200Z" />,
                      FileVideo: <path d="M200,24H72A16,16,0,0,0,56,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V40A16,16,0,0,0,200,24Zm0,192H72V40H200Z" />,
                    } as const;
                    return (
                      <button
                        key={icon}
                        className={`flex items-center justify-center w-12 h-12 rounded-lg bg-[#36332b] ${newProject.icon === icon ? 'ring-2 ring-white' : ''}`}
                        onClick={() => setNewProject({ ...newProject, icon })}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                          {svgPaths[icon as keyof typeof svgPaths]}
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-4">
                <button
                  className="px-4 py-2 rounded-full bg-[#4a4a4a] text-white"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-full bg-[#d4a017] text-white"
                  onClick={handleCreateProject}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}