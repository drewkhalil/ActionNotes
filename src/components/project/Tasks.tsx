import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Project, Task, AppUser } from '../../types/types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover'
import { Calendar as CalendarComponent } from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { Calendar, MoreVertical } from 'lucide-react'
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from '../ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

interface TasksProps {
  project: Project | null
  user: AppUser | null
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
}

const Tasks: React.FC<TasksProps> = ({ project, user, tasks, setTasks }) => {
  const [newTask, setNewTask] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | null>(null)
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium')
  const [newTaskStatus, setNewTaskStatus] = useState<'Not Started' | 'In Progress' | 'Completed'>('Not Started')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [isAddingTask, setIsAddingTask] = useState(false)

  const tableId = 'table-8a9b0c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d'

  const addNewTask = async () => {
    if (!project || !user || !newTask.trim()) {
      alert('Please provide a task title.')
      return
    }
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          project_id: project.id,
          title: newTask,
          due_date: newTaskDueDate ? newTaskDueDate.toISOString() : null,
          status: newTaskStatus,
          priority: newTaskPriority,
        })
        .select()
        .single()
      if (error) throw error
      setTasks([...tasks, data])
      resetNewTask()
      setIsAddingTask(false)
    } catch (error) {
      console.error('Error adding task:', error)
      alert('Failed to add task. Please try again.')
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id)
    setNewTask(task.title)
    setNewTaskDueDate(task.due_date ? new Date(task.due_date) : null)
    setNewTaskPriority(task.priority || 'Medium')
    setNewTaskStatus(task.status || 'Not Started')
  }

  const handleSaveEditTask = async (taskId: string) => {
    if (!newTask.trim()) {
      alert('Please provide a task title.')
      return
    }
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: newTask,
          due_date: newTaskDueDate ? newTaskDueDate.toISOString() : null,
          status: newTaskStatus,
          priority: newTaskPriority,
        })
        .eq('id', taskId)
      if (error) throw error
      setTasks(tasks.map(t =>
        t.id === taskId ? {
          ...t,
          title: newTask,
          due_date: newTaskDueDate ? newTaskDueDate.toISOString() : null,
          status: newTaskStatus,
          priority: newTaskPriority,
        } : t
      ))
      setEditingTaskId(null)
      resetNewTask()
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Failed to update task. Please try again.')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
      if (error) throw error
      setTasks(tasks.filter(t => t.id !== taskId))
      setDeleteTaskId(null)
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Failed to delete task. Please try again.')
    }
  }

  const resetNewTask = () => {
    setNewTask('')
    setNewTaskDueDate(null)
    setNewTaskPriority('Medium')
    setNewTaskStatus('Not Started')
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    const statusOrder = { 'Not Started': 0, 'In Progress': 1, 'Completed': 2 }
    if (a.status !== b.status) return statusOrder[a.status] - statusOrder[b.status]
    const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity
    const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity
    return dateA - dateB
  })

  return (
    <div className="px-4 py-3 @container">
      <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Task Overview</h3>
      <div className="flex overflow-hidden rounded-xl border border-[#544d3b] bg-[#181611]">
        <table className="flex-1">
          <thead>
            <tr className="bg-[#27241c]">
              <th className={`${tableId}-column-120 px-4 py-3 text-left text-white w-[400px] text-sm font-medium leading-normal`}>Task Name</th>
              <th className={`${tableId}-column-360 px-4 py-3 text-left text-white w-[400px] text-sm font-medium leading-normal`}>Due Date</th>
              <th className={`${tableId}-column-480 px-4 py-3 text-left text-white w-60 text-sm font-medium leading-normal`}>Status</th>
              <th className={`${tableId}-column-600 px-4 py-3 text-left text-white w-60 text-sm font-medium leading-normal`}>Priority</th>
              <th className={`${tableId}-column-720 px-4 py-3 text-left text-white w-14 text-sm font-medium leading-normal`}></th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map((task) => (
              editingTaskId === task.id ? (
                <tr key={task.id} className="border-t border-[#544d3b]">
                  <td className={`${tableId}-column-120 h-[72px] px-4 py-2 w-[400px]`}>
                    <Input
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      className="bg-[#27241c] border-[#544d3b] text-white placeholder-[#b9b19d]"
                    />
                  </td>
                  <td className={`${tableId}-column-360 h-[72px] px-4 py-2 w-[400px]`}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-8 px-4 bg-[#393428] text-white text-sm font-medium">
                          <Calendar className="mr-2 h-4 w-4" />
                          {newTaskDueDate ? newTaskDueDate.toISOString().split('T')[0] : 'Select Date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2 bg-[#27241c] border-[#544d3b] rounded-md shadow-lg">
                        <CalendarComponent
                          onChange={(value: any) => {
                            if (Array.isArray(value)) {
                              setNewTaskDueDate(value[0] || null)
                            } else {
                              setNewTaskDueDate(value)
                            }
                          }}
                          value={newTaskDueDate}
                          className="border-0 text-white bg-[#27241c]"
                        />
                      </PopoverContent>
                    </Popover>
                  </td>
                  <td className={`${tableId}-column-480 h-[72px] px-4 py-2 w-60`}>
                    <Select
                      value={newTaskStatus}
                      onValueChange={(value: 'Not Started' | 'In Progress' | 'Completed') => setNewTaskStatus(value)}
                    >
                      <SelectTrigger className="bg-[#393428] text-white border-none rounded-full h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#181611] border-[#544d3b] text-white">
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className={`${tableId}-column-600 h-[72px] px-4 py-2 w-60`}>
                    <Select
                      value={newTaskPriority}
                      onValueChange={(value: 'High' | 'Medium' | 'Low') => setNewTaskPriority(value)}
                    >
                      <SelectTrigger className="bg-[#393428] text-white border-none rounded-full h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#181611] border-[#544d3b] text-white">
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className={`${tableId}-column-720 h-[72px] px-4 py-2 w-14 flex gap-2`}>
                    <Button
                      className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-8 px-4 bg-[#dba10f] text-[#181611] text-sm font-medium"
                      onClick={() => handleSaveEditTask(task.id)}
                      disabled={!newTask.trim()}
                    >
                      Save
                    </Button>
                    <Button
                      className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-8 px-4 bg-[#393428] text-white text-sm font-medium"
                      onClick={() => {
                        setEditingTaskId(null)
                        resetNewTask()
                      }}
                    >
                      Cancel
                    </Button>
                  </td>
                </tr>
              ) : (
                <tr key={task.id} className="border-t border-[#544d3b]">
                  <td className={`${tableId}-column-120 h-[72px] px-4 py-2 w-[400px] text-white text-sm font-normal leading-normal`}>
                    {task.title}
                  </td>
                  <td className={`${tableId}-column-360 h-[72px] px-4 py-2 w-[400px] text-[#b9b19d] text-sm font-normal leading-normal`}>
                    {task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : 'None'}
                  </td>
                  <td className={`${tableId}-column-480 h-[72px] px-4 py-2 w-60 text-sm font-normal leading-normal`}>
                    <Button
                      className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-8 px-4 bg-[#393428] text-white text-sm font-medium leading-normal w-full"
                      onClick={() => {
                        const nextStatus = task.status === 'Not Started' ? 'In Progress' :
                                          task.status === 'In Progress' ? 'Completed' : 'Not Started'
                        supabase
                          .from('tasks')
                          .update({ status: nextStatus })
                          .eq('id', task.id)
                          .then(({ error }) => {
                            if (error) {
                              alert('Failed to update status.')
                              return
                            }
                            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: nextStatus } : t))
                          })
                      }}
                    >
                      <span className="truncate">{task.status}</span>
                    </Button>
                  </td>
                  <td className={`${tableId}-column-600 h-[72px] px-4 py-2 w-60 text-sm font-normal leading-normal`}>
                    <Button
                      className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-8 px-4 bg-[#393428] text-white text-sm font-medium leading-normal w-full"
                      onClick={() => {
                        const nextPriority = task.priority === 'High' ? 'Medium' :
                                            task.priority === 'Medium' ? 'Low' : 'High'
                        supabase
                          .from('tasks')
                          .update({ priority: nextPriority })
                          .eq('id', task.id)
                          .then(({ error }) => {
                            if (error) {
                              alert('Failed to update priority.')
                              return
                            }
                            setTasks(tasks.map(t => t.id === task.id ? { ...t, priority: nextPriority } : t))
                          })
                      }}
                    >
                      <span className="truncate">{task.priority || 'Medium'}</span>
                    </Button>
                  </td>
                  <td className={`${tableId}-column-720 h-[72px] px-4 py-2 w-14 text-sm font-normal leading-normal`}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button className="h-8 w-8 bg-[#393428] text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-32 bg-[#181611] border-[#544d3b] rounded-md shadow-lg p-2">
                        <Button
                          className="w-full text-left bg-[#393428] text-white hover:bg-[#544d3b] rounded-md mb-1"
                          onClick={() => handleEditTask(task)}
                        >
                          Edit
                        </Button>
                        <Button
                          className="w-full text-left bg-[#393428] text-white hover:bg-[#544d3b] rounded-md"
                          onClick={() => setDeleteTaskId(task.id)}
                        >
                          Delete
                        </Button>
                      </PopoverContent>
                    </Popover>
                  </td>
                </tr>
              )
            ))}
            {isAddingTask && (
              <tr className="border-t border-[#544d3b]">
                <td className={`${tableId}-column-120 h-[72px] px-4 py-2 w-[400px]`}>
                  <Input
                    placeholder="Add a new task..."
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    className="bg-[#27241c] border-[#544d3b] text-white placeholder-[#b9b19d]"
                  />
                </td>
                <td className={`${tableId}-column-360 h-[72px] px-4 py-2 w-[400px]`}>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-8 px-4 bg-[#393428] text-white text-sm font-medium">
                        <Calendar className="mr-2 h-4 w-4" />
                        {newTaskDueDate ? newTaskDueDate.toISOString().split('T')[0] : 'Select Date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2 bg-[#27241c] border-[#544d3b] rounded-md shadow-lg">
                      <CalendarComponent
                        onChange={(value: any) => {
                          if (Array.isArray(value)) {
                            setNewTaskDueDate(value[0] || null)
                          } else {
                            setNewTaskDueDate(value)
                          }
                        }}
                        value={newTaskDueDate}
                        className="border-0 text-white bg-[#27241c]"
                      />
                    </PopoverContent>
                  </Popover>
                </td>
                <td className={`${tableId}-column-480 h-[72px] px-4 py-2 w-60`}>
                  <Select
                    value={newTaskStatus}
                    onValueChange={(value: 'Not Started' | 'In Progress' | 'Completed') => setNewTaskStatus(value)}
                  >
                    <SelectTrigger className="bg-[#393428] text-white border-none rounded-full h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181611] border-[#544d3b] text-white">
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className={`${tableId}-column-600 h-[72px] px-4 py-2 w-60`}>
                  <Select
                    value={newTaskPriority}
                    onValueChange={(value: 'High' | 'Medium' | 'Low') => setNewTaskPriority(value)}
                  >
                    <SelectTrigger className="bg-[#393428] text-white border-none rounded-full h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181611] border-[#544d3b] text-white">
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className={`${tableId}-column-720 h-[72px] px-4 py-2 w-14 flex gap-2`}>
                  <Button
                    className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-8 px-4 bg-[#dba10f] text-[#181611] text-sm font-medium"
                    onClick={addNewTask}
                    disabled={!newTask.trim()}
                  >
                    Add
                  </Button>
                  <Button
                    className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-8 px-4 bg-[#393428] text-white text-sm font-medium"
                    onClick={() => {
                      resetNewTask()
                      setIsAddingTask(false)
                    }}
                  >
                    Cancel
                  </Button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!isAddingTask && (
        <Button
          className="mt-4 flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#dba10f] text-[#181611] text-sm font-bold"
          onClick={() => setIsAddingTask(true)}
        >
          Add Task
        </Button>
      )}
      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent className="bg-[#181611] border-[#544d3b]">
          <AlertDialogTitle className="text-white">Delete Task?</AlertDialogTitle>
          <AlertDialogDescription className="text-[#b9b19d]">
            This action cannot be undone. Are you sure you want to delete this task?
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel className="bg-[#393428] text-white hover:bg-[#544d3b]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteTaskId && handleDeleteTask(deleteTaskId)}
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <style>
        {`
          @container (max-width: 120px) { .${tableId}-column-120 { display: none; } }
          @container (max-width: 360px) { .${tableId}-column-360 { display: none; } }
          @container (max-width: 480px) { .${tableId}-column-480 { display: none; } }
          @container (max-width: 600px) { .${tableId}-column-600 { display: none; } }
          @container (max-width: 720px) { .${tableId}-column-720 { display: none; } }
        `}
      </style>
    </div>
  )
}

export default Tasks