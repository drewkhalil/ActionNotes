import { useState } from 'react';

const API_ENDPOINT = 'https://models.inference.ai.azure.com';

export default function TeachMe() {
  const [topic, setTopic] = useState('');
  const [lesson, setLesson] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateLesson = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': import.meta.env.VITE_AZURE_API_KEY
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful teaching assistant that creates detailed lesson plans.'
            },
            {
              role: 'user',
              content: `Create a detailed lesson plan for: ${topic}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setLesson(data.choices[0].message.content);
    } catch (error) {
      console.error('Error generating lesson:', error);
      setError('Failed to generate lesson. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Teach Me</h1>
      
      <div className="mb-6">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic to learn about..."
          className="w-full p-2 border rounded"
        />
        <button
          onClick={generateLesson}
          disabled={isLoading || !topic}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          {isLoading ? 'Generating...' : 'Generate Lesson'}
        </button>
      </div>

      {error && (
        <div className="text-red-500 mb-4">
          {error}
        </div>
      )}

      {lesson && (
        <div className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Lesson Plan</h2>
          <div dangerouslySetInnerHTML={{ __html: lesson }} />
        </div>
      )}
    </div>
  );
} 