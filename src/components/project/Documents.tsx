import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Project, ProjectDoc, AppUser } from '../../types/types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from '../ui/alert-dialog';
import { Pencil, Trash2, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogOverlay } from '@radix-ui/react-dialog';

interface DocumentsProps {
  project: Project | null;
  user: AppUser | null;
  docs: ProjectDoc[];
  setDocs: React.Dispatch<React.SetStateAction<ProjectDoc[]>>;
}

const Documents: React.FC<DocumentsProps> = ({ project, user, docs, setDocs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [inlineEditContent, setInlineEditContent] = useState<{ [key: string]: string }>({});
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const createNewDocument = async () => {
    if (!project || !user || !newDocContent.trim()) {
      alert('Please provide document content.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('project_docs')
        .insert({
          project_id: project.id,
          content: newDocContent,
        })
        .select()
        .single();
      if (error) throw error;
      setDocs([...docs, data]);
      setNewDocContent('');
      setModalOpen(false);
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Failed to create document. Please try again.');
    }
  };

  const startInlineEdit = (doc: ProjectDoc) => {
    setInlineEditContent({ ...inlineEditContent, [doc.id]: doc.content });
    setEditingDocId(doc.id);
  };

  const saveInlineEdit = async (docId: string) => {
    const content = inlineEditContent[docId];
    if (!content?.trim()) {
      alert('Please provide document content.');
      return;
    }
    try {
      const { error } = await supabase
        .from('project_docs')
        .update({
          content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', docId);
      if (error) throw error;
      setDocs(docs.map((d) =>
        d.id === docId ? { ...d, content, updated_at: new Date().toISOString() } : d
      ));
      setEditingDocId(null);
      const { [docId]: _, ...rest } = inlineEditContent;
      setInlineEditContent(rest);
    } catch (error) {
      console.error('Error updating document:', error);
      alert('Failed to update document. Please try again.');
    }
  };

  const cancelInlineEdit = (docId: string) => {
    setEditingDocId(null);
    const { [docId]: _, ...rest } = inlineEditContent;
    setInlineEditContent(rest);
  };

  const openModalEdit = (doc: ProjectDoc) => {
    setEditingDocId(doc.id);
    setNewDocContent(doc.content);
    setModalOpen(true);
  };

  const saveDocumentModal = async () => {
    if (!newDocContent.trim()) {
      alert('Please provide document content.');
      return;
    }
    try {
      if (editingDocId) {
        const { error } = await supabase
          .from('project_docs')
          .update({
            content: newDocContent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingDocId);
        if (error) throw error;
        setDocs(docs.map(d =>
          d.id === editingDocId ? { ...d, content: newDocContent, updated_at: new Date().toISOString() } : d
        ));
        setEditingDocId(null);
      } else {
        await createNewDocument();
      }
      setNewDocContent('');
      setModalOpen(false);
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Failed to save document. Please try again.');
    }
  };

  const deleteDocument = async (docId: string) => {
    try {
      const { error } = await supabase
        .from('project_docs')
        .delete()
        .eq('id', docId);
      if (error) throw error;
      setDocs(docs.filter(d => d.id !== docId));
      setDeleteDocId(null);
      if (editingDocId === docId) {
        setEditingDocId(null);
        setNewDocContent('');
        setModalOpen(false);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const filteredDocs = docs.filter(doc =>
    doc.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDocType = (content: string) => 'Text';
  const getDocSize = (content: string) => `${(content.length / 1024).toFixed(2)} KB`;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-white text-lg font-semibold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Document Management</h3>
      <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
        <label className="flex flex-col min-w-40 flex-1">
          <Input
            placeholder="Search documents"
            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#544d3b] bg-[#27241c] focus:border-[#544d3b] h-14 placeholder:text-[#b9b19d] p-[15px] text-base font-medium leading-normal"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="flex px-4 py-3 justify-end">
        <Button
          className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#dba10f] text-[#181611] text-sm font-semibold"
          onClick={() => {
            setEditingDocId(null);
            setNewDocContent('');
            setModalOpen(true);
          }}
        >
          <span className="truncate">Create New Document</span>
        </Button>
      </div>
      <div className="px-4 py-3 @container">
        <div className="flex overflow-hidden rounded-xl border border-[#544d3b] bg-[#181611]">
          <table className="min-w-full flex-1">
            <thead>
              <tr className="bg-[#27241c]">
                <th className="table-column-120 px-4 py-3 text-left text-white w-[400px] text-sm font-semibold leading-normal">Name</th>
                <th className="table-column-240 px-4 py-3 text-left text-white w-[400px] text-sm font-medium leading-normal">Type</th>
                <th className="table-column-360 px-4 py-3 text-left text-white w-[400px] text-sm font-semibold">Size</th>
                <th className="table-column-480 px-4 py-3 text-left text-white w-[400px] text-sm font-semibold leading-normal">Last Modified</th>
                <th className="table-column-600 px-4 py-3 text-left text-white w-60 text-[#b9b19d] text-sm font-semibold leading-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="border-t border-[#544d3b]">
                  <td className="table-column-120 h-[72px] px-4 py-2 text-sm font-semibold w-[400px]">
                    {editingDocId === doc.id ? (
                      <Textarea
                        value={inlineEditContent[doc.id] || ''}
                        onChange={(e) => setInlineEditContent({ ...inlineEditContent, [doc.id]: e.target.value })}
                        className="w-full bg-[#27241c] border-[#544d3b] text-white placeholder:text-[#b9b19d] min-h-[72px]"
                      />
                    ) : (
                      <span className="text-white truncate">{doc.content.substring(0, 20) + (doc.content.length > 20 ? '...' : '')}</span>
                    )}
                  </td>
                  <td className="table-column-240 h-[72px] px-4 py-2 w-[400px] text-[#b9b19d] text-sm font-medium">
                    {getDocType(doc.content)}
                  </td>
                  <td className="table-column-360 h-[72px] px-4 py-2 w-[400px] text-[#b9b19d] text-sm font-medium">
                    {getDocSize(doc.content)}
                  </td>
                  <td className="table-column-480 h-[72px] px-4 py-2 w-[400px] text-[#b9b19d] text-sm font-medium">
                    {doc.updated_at || doc.created_at ? new Date(doc.updated_at || doc.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="table-column-600 px-4 py-2 w-60 flex items-center gap-2 text-[#b9b19d]">
                    {editingDocId === doc.id ? (
                      <>
                        <Button
                          className="h-8 w-8 bg-[#393428] text-white hover:bg-[#544d3b]"
                          onClick={() => saveInlineEdit(doc.id)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          className="h-8 w-8 bg-[#393428] text-white hover:bg-[#544d3b]"
                          onClick={() => cancelInlineEdit(doc.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          className="text-[#b9b19d] hover:text-white"
                          onClick={() => startInlineEdit(doc)}
                        >
                          <Pencil className="h-4 w-4 mr-1" /> Inline
                        </Button>
                        <Button
                          className="text-[#b9b19d] hover:text-white"
                          onClick={() => openModalEdit(doc)}
                        >
                          <Pencil className="h-4 w-4 mr-1" /> Modal
                        </Button>
                        <Button
                          className="text-red-400 hover:text-red-600 ml-2"
                          onClick={() => setDeleteDocId(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </>
                    )}
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
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogOverlay className="fixed inset-0 bg-black bg-opacity-50" />
        <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-2xl w-full max-h-[80vh] bg-[#181611] border-[#544d3b] rounded-lg shadow-xl p-0 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-[#544d3b] px-10 py-3">
            <DialogTitle className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">
              {editingDocId ? 'Edit Document' : 'Create Document'}
            </DialogTitle>
          </div>
          <div className="px-10 py-3">
            <div className="flex flex-col w-full py-3">
              <div className="flex max-w-[960px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <Textarea
                    placeholder="Start typing your document here..."
                    className="flex w-full min-w-0 flex-1 resize-none overflow-auto rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#544d3b] bg-[#27241c] focus:border-[#544d3b] min-h-[500px] placeholder:text-[#b9b19d] p-[15px] text-base font-normal leading-normal"
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                  />
                </label>
              </div>
              <div className="flex justify-end gap-3 px-4 py-3">
                <Button
                  className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#393428] text-white text-sm font-bold leading-normal tracking-[0.015em]"
                  onClick={() => {
                    setNewDocContent('');
                    setEditingDocId(null);
                    setModalOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#dba10f] text-[#181611] text-sm font-bold leading-normal tracking-[0.015em]"
                  onClick={saveDocumentModal}
                  disabled={!newDocContent.trim()}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteDocId} onOpenChange={() => setDeleteDocId(null)}>
        <AlertDialogContent className="bg-[#181611] border-[#544d3b]">
          <AlertDialogTitle className="text-white">Delete Document?</AlertDialogTitle>
          <AlertDialogDescription className="text-[#b9b19d]">
            This action cannot be undone. Are you sure you want to delete this document?
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel className="bg-[#393428] text-white hover:bg-[#544d3b]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteDocId && deleteDocument(deleteDocId)}
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Documents;