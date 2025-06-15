import { useState } from 'react'
import type { Project, ToolHistory, AppUser, ProjectAIUsage } from '../../types/types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Dialog, DialogContent, DialogTitle } from '@radix-ui/react-dialog';

interface ToolHistoryProps {
  project: Project | null
  toolHistory: ToolHistory[]
  setToolHistory: React.Dispatch<React.SetStateAction<ToolHistory[]>>
}

const ToolHistory: React.FC<ToolHistoryProps> = ({ project, toolHistory, setToolHistory }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTool, setSelectedTool] = useState<ToolHistory | null>(null)

  const filteredHistory = toolHistory.filter(item =>
    item.tool_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Tool History</h2>
      <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
        <label className="flex flex-col min-w-40 flex-1">
          <Input
            placeholder="Search tool history"
            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#544d3b] bg-[#27241c] focus:border-[#544d3b] h-14 placeholder:text-[#b9b19d] p-[15px] text-base font-normal leading-normal"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="px-4 py-3 @container">
        <div className="flex overflow-hidden rounded-xl border border-[#544d3b] bg-[#181611]">
          <table className="flex-1">
            <thead>
              <tr className="bg-[#27241c]">
                <th className="table-column-120 px-4 py-3 text-left text-white w-[400px] text-sm font-medium leading-normal">Tool</th>
                <th className="table-column-240 px-4 py-3 text-left text-white w-[400px] text-sm font-medium leading-normal">Title</th>
                <th className="table-column-360 px-4 py-3 text-left text-white w-[400px] text-sm font-medium leading-normal">Date</th>
                <th className="table-column-480 px-4 py-3 text-left text-white w-[400px] text-sm font-medium leading-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => (
                <tr key={item.id} className="border-t border-t-[#544d3b]">
                  <td className="table-column-120 h-[72px] px-4 py-2 w-[400px] text-white text-sm font-normal leading-normal">{item.tool_name}</td>
                  <td className="table-column-240 h-[72px] px-4 py-2 w-[400px] text-white text-sm font-normal leading-normal">{item.title}</td>
                  <td className="table-column-360 h-[72px] px-4 py-2 w-[400px] text-[#b9b19d] text-sm font-normal leading-normal">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="table-column-480 h-[72px] px-4 py-2 w-[400px] text-[#b9b19d] text-sm font-normal leading-normal">
                    <Button className="text-[#b9b19d] hover:text-white" onClick={() => setSelectedTool(item)}>Open</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <style>
          {`
            @container (max-width: 120px) { .table-column-120 { display: none; } }
            @container (max-width: 240px) { .table-column-240 { display: none; } }
            @container (max-width: 360px) { .table-column-360 { display: none; } }
            @container (max-width: 480px) { .table-column-480 { display: none; } }
          `}
        </style>
      </div>
      <Dialog open={!!selectedTool} onOpenChange={() => setSelectedTool(null)}>
        <DialogContent className="bg-[#181611] border-[#544d3b]">
          <div>
            <DialogTitle className="text-white">{selectedTool?.tool_name}</DialogTitle>
            <div className="text-[#b9b19d]">
              {selectedTool?.title} - {selectedTool && new Date(selectedTool.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className="text-[#b9b19d]">
            {/* Placeholder for tool-specific content */}
            No additional details available for this tool action.
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ToolHistory