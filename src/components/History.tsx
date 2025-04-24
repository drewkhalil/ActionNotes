import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, Trash2, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AppUser } from '@/types/types';

interface HistoryItem {
  id: string;
  type: 'recap' | 'lesson' | 'flashcards' | 'quiz';
  title: string;
  content: string;
  pdf_path?: string | null;
  created_at: string;
}

interface HistoryProps {
  user: AppUser | null;
}

export function History({ user }: HistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchHistory();
      // Set up automatic cleanup every 24 hours
      const cleanupInterval = setInterval(cleanupExpiredItems, 24 * 60 * 60 * 1000);
      return () => clearInterval(cleanupInterval);
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist
          setError('History table not found. Please contact support.');
          setHistory([]);
          return;
        }
        throw error;
      }
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      setError('Failed to load history. Please try again later.');
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupExpiredItems = async () => {
    if (!user) return;

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Fetch expired history items
      const { data: expiredItems, error: fetchError } = await supabase
        .from('history')
        .select('id, pdf_path')
        .eq('user_id', user.id)
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (fetchError) {
        if (fetchError.code === '42P01') return; // Table doesn't exist, skip cleanup
        throw fetchError;
      }

      // Delete associated PDFs from storage
      for (const item of expiredItems || []) {
        if (item.pdf_path) {
          await supabase.storage
            .from('history_pdfs')
            .remove([item.pdf_path]);
        }
      }

      // Delete the history entries
      const { error: deleteError } = await supabase
        .from('history')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (deleteError) {
        if (deleteError.code === '42P01') return; // Table doesn't exist, skip
        throw deleteError;
      }
      fetchHistory(); // Refresh the list after cleanup
    } catch (error) {
      console.error('Error cleaning up expired items:', error);
    }
  };

  const handleDelete = async (id: string, pdfPath?: string | null) => {
    if (!user) return;

    try {
      // Delete the PDF from storage if it exists
      if (pdfPath) {
        await supabase.storage
          .from('history_pdfs')
          .remove([pdfPath]);
      }

      // Delete the history entry
      const { error } = await supabase
        .from('history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        if (error.code === '42P01') {
          setError('History table not found. Please contact support.');
          return;
        }
        throw error;
      }
      fetchHistory();
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete history item. Please try again.');
    }
  };

  const handleDownload = async (pdfPath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('history_pdfs')
        .download(pdfPath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfPath.split('/').pop() || 'download.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const filteredHistory = history.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Access Denied</h2>
          </CardHeader>
          <CardContent>
            <p>Please log in to view your history.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-red-700">
            {error}
          </CardContent>
        </Card>
      )}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No history items found. Your generations will appear here and automatically be removed after 30 days.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()} | Type: {item.type}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {item.pdf_path && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(item.pdf_path!)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id, item.pdf_path)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  {item.content.split('\n').map((line, index) => (
                    <p key={index} className="mb-2">{line}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}