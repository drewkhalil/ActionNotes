import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Project, ProjectDoc, Summary, Note, ProjectFile } from '../types/types';
import { MessageCircle, X } from 'lucide-react';

interface ChatbotProps {
  user: { id: string } | null;
  projectId: string;
}

interface ChatMessage {
  id: string;
  message: string;
  response: string;
  created_at: string;
}

export function Chatbot({ user, projectId }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user || !projectId) return;
    const fetchChatHistory = async () => {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Error fetching chat history:', error);
        return;
      }
      setMessages(data || []);
    };
    fetchChatHistory();
  }, [user, projectId]);

  const fetchProjectContent = async (): Promise<string> => {
    if (!projectId) return '';
    try {
      const { data: project } = await supabase
        .from('projects')
        .select('name, description')
        .eq('id', projectId)
        .single();
      const { data: doc } = await supabase
        .from('project_docs')
        .select('content')
        .eq('project_id', projectId)
        .maybeSingle();
      const { data: summaries } = await supabase
        .from('summaries')
        .select('content')
        .eq('project_id', projectId);
      const { data: notes } = await supabase
        .from('notes')
        .select('content')
        .eq('project_id', projectId);
      const { data: files } = await supabase
        .from('files')
        .select('file_name, file_url')
        .eq('project_id', projectId);

      let fileContents = '';
      for (const file of files || []) {
        if (file.file_name.endsWith('.txt') || file.file_name.endsWith('.md')) {
          const response = await fetch(file.file_url);
          const text = await response.text();
          fileContents += `File: ${file.file_name}\n${text}\n\n`;
        }
      }

      return `
Project: ${project?.name || 'Unknown'}
Description: ${project?.description || 'No description'}
Docs: ${doc?.content || 'No documentation'}
Summaries: ${summaries?.map((s) => s.content).join('\n') || 'No summaries'}
Notes: ${notes?.map((n) => n.content).join('\n') || 'No notes'}
Files: ${fileContents || 'No files'}
      `.trim();
    } catch (error) {
      console.error('Error fetching project content:', error);
      return '';
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !user || !projectId) return;
    setIsLoading(true);

    try {
      const projectContent = await fetchProjectContent();
      const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_AZURE_OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are an educational assistant for ActionNotes. The user is working on a project with the following content:\n${projectContent}\nAnswer queries relevant to this project. Be concise and helpful.`
            },
            { role: 'user', content: input },
          ],
          max_tokens: 500,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch response from Azure OpenAI');

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      const { data: inserted, error } = await supabase
        .from('chat_history')
        .insert({
          user_id: user.id,
          project_id: projectId,
          message: input,
          response: aiResponse,
        })
        .select()
        .single();

      if (error) throw error;

      setMessages([...messages, inserted]);
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-[#1E3A8A] hover:bg-[#1A2F6D] text-white p-3 rounded-full shadow-lg"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chatbot Sidebar */}
      {isOpen && (
        <div className="fixed top-0 right-0 h-full w-80 bg-[#FFFFFF] shadow-lg z-50 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#1A1A1A]">Project Assistant</h2>
            <button onClick={() => setIsOpen(false)} className="text-[#4A4F57]">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto mb-4">
            {messages.length === 0 ? (
              <p className="text-[#4A4F57]">Ask me anything about your project!</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="space-y-2 mb-4">
                  <div className="bg-[#EAEAEA] p-2 rounded-md">
                    <p className="text-[#1A1A1A] font-semibold">You:</p>
                    <p className="text-[#4A4F57]">{msg.message}</p>
                  </div>
                  <div className="bg-[#D6BCFA] p-2 rounded-md">
                    <p className="text-[#1A1A1A] font-semibold">AI:</p>
                    <p className="text-[#4A4F57]">{msg.response}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 px-3 py-2 border border-[#EAEAEA] rounded-md text-[#4A4F57]"
              placeholder="Ask about your project..."
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              className="bg-[#1E3A8A] hover:bg-[#1A2F6D] text-white px-4 py-2 rounded-md"
              disabled={isLoading}
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}