import React, { useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Button } from './ui/button';
import { Upload, Download, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import MathJax from 'react-mathjax2';
import type { Components } from 'react-markdown';

interface MathProps {
  value: string;
}

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

const RecapMe = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    userPlan,
    usageCounts,
    maxUsage,
    incrementUsage,
    checkUsageLimit,
    handleUpgrade,
    isUpgradeOpen,
    setIsUpgradeOpen
  } = useSubscription();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (checkUsageLimit('recap')) {
      setIsUpgradeOpen(true);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });

      if (!response.ok) throw new Error('Failed to generate recap');

      const data = await response.json();
      setOutput(data.recap);
      incrementUsage('recap');
    } catch (err) {
      setError('Failed to generate recap. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setInput(e.target?.result as string);
    };
    reader.readAsText(file);
  };

  const renderContent = (content: string) => {
    return (
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <ReactMarkdown
          components={{
            // Headers
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white border-b pb-2">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-bold mb-3 text-gray-700 dark:text-gray-300">
                {children}
              </h3>
            ),
            // Paragraphs
            p: ({ children }) => (
              <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                {children}
              </p>
            ),
            // Lists
            ul: ({ children }) => (
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300">
                {children}
              </ol>
            ),
            // Tables
            table: ({ children }) => (
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-700">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800 font-semibold">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                {children}
              </td>
            ),
            // Math expressions
            math: ({ value }: MathProps) => (
              <MathJax.Context input='tex'>
                <MathJax.Node>{value}</MathJax.Node>
              </MathJax.Context>
            ),
            inlineMath: ({ value }: MathProps) => (
              <MathJax.Context input='tex'>
                <MathJax.Node inline>{value}</MathJax.Node>
              </MathJax.Context>
            ),
            // Code blocks
            code: ({ node, inline, className, children, ...props }: CodeProps) => {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4 overflow-x-auto">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded" {...props}>
                  {children}
                </code>
              );
            },
            // Blockquotes
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic my-4 text-gray-600 dark:text-gray-400">
                {children}
              </blockquote>
            ),
          } as Components}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">RecapMe</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Transform your notes into clear, structured summaries
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label htmlFor="input" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Your Notes
          </label>
          <textarea
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-64 p-4 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            placeholder="Paste your notes here..."
          />
        </div>

        <div className="flex items-center space-x-4">
          <Button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="flex items-center"
          >
            {isProcessing ? 'Processing...' : 'Generate Recap'}
          </Button>

          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.md"
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </div>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {output && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Generated Recap</h2>
            <Button
              variant="outline"
              onClick={() => {
                const blob = new Blob([output], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'recap.md';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            {renderContent(output)}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecapMe; 