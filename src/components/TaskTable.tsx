import { Task } from '../types/types';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Calendar as CalendarComponent } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { MoreVertical, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';

interface TaskTableProps {
  tasks: Task[];
  toggleTaskCompletion: (taskId: string) => Promise<void>;
  handleEditTask: (task: Task) => void;
  handleDeleteTask: (taskId: string) => Promise<void>;
  newTask: string;
  setNewTask: React.Dispatch<React.SetStateAction<string>>;
  newTaskDueDate: Date | null;
  setNewTaskDueDate: React.Dispatch<React.SetStateAction<Date | null>>;
  editingTask: Task | null;
  setEditingTask: React.Dispatch<React.SetStateAction<Task | null>>;
  handleSaveEditTask: () => Promise<void>;
  addNewTask: () => Promise<void>;
  handleNewTaskKeyDown: (e: React.KeyboardEvent) => void;
}

const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  toggleTaskCompletion,
  handleEditTask,
  handleDeleteTask,
  newTask,
  setNewTask,
  newTaskDueDate,
  setNewTaskDueDate,
  editingTask,
  setEditingTask,
  handleSaveEditTask,
  addNewTask,
  handleNewTaskKeyDown,
}) => {
  return (
    <div className="px-4 py-3 @container">
      <div className="flex overflow-hidden rounded-xl border border-border bg-darkBg">
        <table className="flex-1">
          <thead>
            <tr className="bg-darkAccent">
              <th className="px-4 py-3 text-left text-textWhite w-[400px] text-sm font-medium leading-normal">Task</th>
              <th className="px-4 py-3 text-left text-textWhite w-60 text-sm font-medium leading-normal">Status</th>
              <th className="px-4 py-3 text-left text-textWhite w-[400px] text-sm font-medium leading-normal">Due Date</th>
              <th className="px-4 py-3 text-left text-textWhite w-14 text-sm font-medium leading-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-t border-border">
                <td className="h-[72px] px-4 py-2 w-[400px] text-textWhite text-sm font-normal leading-normal">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTaskCompletion(task.id)}
                      id={`task-${task.id}`}
                      className={`border-border ${task.completed ? 'bg-neonTeal border-neonTeal' : ''}`}
                    />
                    <label
                      htmlFor={`task-${task.id}`}
                      className={`truncate ${task.completed ? 'line-through text-textSecondary' : ''}`}
                    >
                      {task.title}
                    </label>
                  </div>
                </td>
                <td className="h-[72px] px-4 py-2 w-60 text-sm font-normal leading-normal">
                  <Button
                    className="min-w-[84px] max-w-[480px] rounded-full h-8 px-4 bg-darkAccent text-textWhite text-sm font-medium w-full"
                  >
                    {task.completed ? 'Completed' : 'In Progress'}
                  </Button>
                </td>
                <td className="h-[72px] px-4 py-2 w-[400px] text-textSecondary text-sm font-normal leading-normal">
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'None'}
                </td>
                <td className="h-[72px] px-4 py-2 w-14 text-sm font-normal leading-normal">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4 text-textWhite" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-darkBg border-border rounded-md shadow-lg p-1">
                      <DropdownMenuItem
                        className="p-2 hover:bg-darkAccent cursor-pointer text-textWhite"
                        onClick={() => handleEditTask(task)}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="p-2 hover:bg-darkAccent cursor-pointer text-red-600"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            <tr className="border-t border-border">
              <td className="h-[72px] px-4 py-2 w-[400px]">
                <Input
                  placeholder={editingTask ? 'Edit task...' : 'Add a new task...'}
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={handleNewTaskKeyDown}
                  className="bg-darkAccent border-border text-textWhite focus:border-neonTeal"
                />
              </td>
              <td className="h-[72px] px-4 py-2 w-60"></td>
              <td className="h-[72px] px-4 py-2 w-[400px]">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8 border-border text-textWhite">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2 bg-darkBg border-border rounded-md shadow-lg">
                    <CalendarComponent
                      onChange={(value: any) => {
                        if (Array.isArray(value)) {
                          setNewTaskDueDate(value[0] || null);
                        } else {
                          setNewTaskDueDate(value);
                        }
                      }}
                      value={newTaskDueDate}
                      className="border-0 bg-darkBg text-textWhite"
                    />
                  </PopoverContent>
                </Popover>
              </td>
              <td className="h-[72px] px-4 py-2 w-14">
                {editingTask ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveEditTask}
                      disabled={!newTask.trim()}
                      className="bg-buttonGold text-darkBg rounded-full"
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
                      className="border-border text-textWhite hover:bg-darkAccent rounded-full"
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
                    className="bg-buttonGold text-darkBg rounded-full"
                  >
                    Add
                  </Button>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <style jsx>{`
        @container (max-width: 120px) {
          .table-column-120 {
            display: none;
          }
        }
        @container (max-width: 240px) {
          .table-column-240 {
            display: none;
          }
        }
        @container (max-width: 360px) {
          .table-column-360 {
            display: none;
          }
        }
        @container (max-width: 416px) {
          .table-column-416 {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default TaskTable;