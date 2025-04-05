'use client';

import { useState, useEffect } from 'react';

interface ChatBotProps {
  personName: string;
  personRole: string;
  company: string;
  linkedinUrl: string;
  personLocation?: string;
  personSeniority?: string;
  personHeadline?: string;
  companySize?: string;
  companyIndustry?: string;
  companyLocation?: string;
  autobound_insights?: any[];
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatBot({
  personName,
  personRole,
  company,
  linkedinUrl,
  personLocation,
  personSeniority,
  personHeadline,
  companySize,
  companyIndustry,
  companyLocation,
  autobound_insights,
  onClose
}: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const newMessage: Message = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          personName,
          personRole,
          company,
          linkedinUrl,
          personLocation,
          personSeniority,
          personHeadline,
          companySize,
          companyIndustry,
          companyLocation,
          autobound_insights
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again.');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (isSummarizing || messages.length === 0) return;
    
    setIsSummarizing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/chat/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          personName,
          company
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSummary(data.summary);
      } else {
        throw new Error(data.error || 'Failed to generate summary');
      }
    } catch (error) {
      console.error('Failed to summarize chat:', error);
      setError('Failed to generate summary. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleTextToSpeech = async () => {
    if (!summary || isPlaying) return;
    
    try {
      setIsPlaying(true);
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: summary
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      
      const audio = new Audio(url);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
        setAudioUrl(null);
      };
      audio.play();
    } catch (error) {
      console.error('Failed to generate speech:', error);
      setError('Failed to generate speech. Please try again.');
      setIsPlaying(false);
    }
  };

  const handleStartConversation = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Generate conversation starters',
          personName,
          personRole,
          company,
          linkedinUrl,
          personLocation,
          personSeniority,
          personHeadline,
          companySize,
          companyIndustry,
          companyLocation,
          autobound_insights,
          isInitialPrompt: true
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages([{ role: 'assistant', content: data.message }]);
      } else {
        throw new Error(data.error || 'Failed to generate conversation starters');
      }
    } catch (error) {
      console.error('Failed to generate conversation starters:', error);
      setError('Failed to generate conversation starters. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start conversation automatically when component mounts
  useEffect(() => {
    handleStartConversation();
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Conversation Starter</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSummarize}
              disabled={isSummarizing || messages.length === 0}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                isSummarizing || messages.length === 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSummarizing ? 'Summarizing...' : 'Summarize'}
            </button>
            {summary && (
              <button
                onClick={handleTextToSpeech}
                disabled={isPlaying}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  isPlaying
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isPlaying ? 'Playing...' : 'Play Summary'}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {summary && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <h3 className="text-lg font-medium text-blue-900">Chat Summary</h3>
              <p className="mt-2 text-sm text-blue-700">{summary}</p>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse flex space-x-2">
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && messages.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="animate-pulse flex space-x-2">
                  <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex space-x-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className={`px-4 py-2 rounded-lg ${
                isLoading || !inputMessage.trim()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 