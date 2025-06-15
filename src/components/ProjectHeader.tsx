import { Project, Task } from '../types/types';
import { Button } from './ui/button';
import { Pencil, Share2, Download } from 'lucide-react';
import { Progress } from './ui/progress';

interface ProjectHeaderProps {
  project: Project;
  tasks: Task[];
  projectColorClass: string;
  setEditProjectOpen: React.Dispatch<React.SetStateAction<boolean>>;
  calculateProgress: () => number;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  tasks,
  projectColorClass,
  setEditProjectOpen,
  calculateProgress,
}) => {
  return (
    <>
      <div className="flex flex-wrap gap-2 p-4">
        <a className="text-textSecondary text-base font-medium leading-normal" href="#">Projects</a>
        <span className="text-textSecondary text-base font-medium leading-normal">/</span>
        <span className="text-textWhite text-base font-medium leading-normal">{project.name}</span>
      </div>
      <div className="flex flex-wrap justify-between gap-3 p-4">
        <div className="flex min-w-72 flex-col gap-3">
          <p className="text-textWhite tracking-tight text-[32px] font-bold leading-tight">{project.name}</p>
          <p className="text-textSecondary text-sm font-normal leading-normal">
            {project.description || 'No description'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditProjectOpen(true)}
            className="border-border text-textWhite hover:bg-darkAccent"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
          <Button variant="outline" size="sm" className="border-border text-textWhite hover:bg-darkAccent">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm" className="border-border text-textWhite hover:bg-darkAccent">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      <div className="px-4 pb-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-medium text-textWhite">Overall Progress</span>
          <span className="text-sm font-medium text-textSecondary">
            {tasks.filter(task => task.completed).length}/{tasks.length} tasks completed
          </span>
        </div>
        <Progress value={calculateProgress()} className="h-2 bg-darkAccent" indicatorClassName={projectColorClass} />
      </div>
    </>
  );
};

export default ProjectHeader;