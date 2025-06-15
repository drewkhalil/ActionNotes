import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Project, ProjectFile, AppUser } from '../../types/types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from '../ui/alert-dialog'

interface FilesProps {
  project: Project | null
  user: AppUser | null
  files: ProjectFile[]
  setFiles: React.Dispatch<React.SetStateAction<ProjectFile[]>>
}

const Files: React.FC<FilesProps> = ({ project, user, files, setFiles }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!project || !user || !event.target.files || event.target.files.length === 0) return
    setUploading(true)
    const file = event.target.files[0]
    const filePath = `${project.id}/${file.name}`
    try {
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data, error } = await supabase
        .from('project_files')
        .insert({
          project_id: project.id,
          file_name: file.name,
          file_path: filePath,
          uploaded_by: user.id,
          size: file.size,
        })
        .select()
        .single()
      if (error) throw error
      setFiles([...files, data])
    } catch (error) {
      console.error(error)
      alert('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadFile = async (file: ProjectFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .download(file.file_path)
      if (error) throw error
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.file_name
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      alert('Failed to download file. Please try again.')
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      const file = files.find(f => f.id === fileId)
      if (!file) return
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([file.file_path])
      if (storageError) throw storageError
      const { error } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileId)
      if (error) throw error
      setFiles(files.filter(f => f.id !== fileId))
      setDeleteFileId(null)
    } catch (error) {
      console.error(error)
      alert('Failed to delete file. Please try again.')
    }
  }

  const filteredFiles = files.filter(file =>
    file.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatSize = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1) + ' MB'

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">File Management</h3>
      <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
        <label className="flex flex-col min-w-40 flex-1">
          <Input
            placeholder="Search files"
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
                <th className="table-column-120 px-4 py-3 text-left text-white w-[400px] text-sm font-medium leading-normal">File Name</th>
                <th className="table-column-240 px-4 py-3 text-left text-white w-[400px] text-sm font-medium leading-normal">Uploaded By</th>
                <th className="table-column-360 px-4 py-3 text-left text-white w-[400px] text-sm font-medium leading-normal">Date</th>
                <th className="table-column-480 px-4 py-3 text-left text-white w-[400px] text-sm font-medium leading-normal">Size</th>
                <th className="table-column-600 px-4 py-3 text-left text-white w-60 text-[#b9b19d] text-sm font-medium leading-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => (
                <tr key={file.id} className="border-t border-t-[#544d3b]">
                  <td className="table-column-120 h-[72px] px-4 py-2 w-[400px] text-white text-sm font-normal leading-normal">{file.file_name}</td>
                  <td className="table-column-240 h-[72px] px-4 py-2 w-[400px] text-[#b9b19d] text-sm font-normal leading-normal">{file.uploaded_by}</td>
                  <td className="table-column-360 h-[72px] px-4 py-2 w-[400px] text-[#b9b19d] text-sm font-normal leading-normal">
                    {new Date(file.created_at).toLocaleDateString()}
                  </td>
                  <td className="table-column-480 h-[72px] px-4 py-2 w-[400px] text-[#b9b19d] text-sm font-normal leading-normal">{formatSize(file.size)}</td>
                  <td className="table-column-600 h-[72px] px-4 py-2 w-60 text-[#b9b19d] text-sm font-bold leading-normal tracking-[0.015em]">
                    <Button className="text-[#b9b19d] hover:text-white" onClick={() => handleDownloadFile(file)}>View</Button>
                    <Button className="text-red-400 hover:text-red-300 ml-2" onClick={() => setDeleteFileId(file.id)}>Delete</Button>
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
            @container (max-width: 600px) { .table-column-600 { display: none; } }
          `}
        </style>
      </div>
      <div className="flex px-4 py-3 justify-end">
        <label className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#dba10f] text-[#181611] text-sm font-bold leading-normal tracking-[0.015em]">
          <span className="truncate">{uploading ? 'Uploading...' : 'Upload New File'}</span>
          <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
        </label>
      </div>
      <AlertDialog open={!!deleteFileId} onOpenChange={() => setDeleteFileId(null)}>
        <AlertDialogContent className="bg-[#181611] border-[#544d3b]">
          <AlertDialogTitle className="text-white">Delete File?</AlertDialogTitle>
          <AlertDialogDescription className="text-[#b9b19d]">
            This action cannot be undone. Are you sure you want to delete this file?
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel className="bg-[#393428] text-white hover:bg-[#544d3b]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteFileId && handleDeleteFile(deleteFileId)}
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Files