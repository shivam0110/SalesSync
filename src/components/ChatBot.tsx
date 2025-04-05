'use client';

import { useState } from 'react';

interface ChatBotProps {
  personName: string;
  personRole: string;
  company: string;
  personLocation?: string;
  personSeniority?: string;
  personHeadline?: string;
  companySize?: string;
  companyIndustry?: string;
  companyLocation?: string;
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
  personLocation,
  personSeniority,
  personHeadline,
  companySize,
  companyIndustry,
  companyLocation,
  onClose
}: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const newMessage: Message = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);

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
          personLocation,
          personSeniority,
          personHeadline,
          companySize,
          companyIndustry,
          companyLocation
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartConversation = async () => {
    setIsLoading(true);
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
          personLocation,
          personSeniority,
          personHeadline,
          companySize,
          companyIndustry,
          companyLocation,
          isInitialPrompt: true
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages([{ role: 'assistant', content: data.message }]);
      }
    } catch (error) {
      console.error('Failed to generate conversation starters:', error);
      setMessages([{
        role: 'assistant',
        content: 'Sorry, I encountered an error generating conversation starters. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Conversation Starter</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center">
              <button
                onClick={handleStartConversation}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Generating...' : 'Generate Conversation Starters'}
              </button>
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
              className="flex-1 min-w-0 rounded-md border border-gray-300 shadow-sm px-4 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 