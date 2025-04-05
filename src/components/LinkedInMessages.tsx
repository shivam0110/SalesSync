'use client';

import { useState, useEffect } from 'react';
import { format, isValid, parseISO } from 'date-fns';

interface LinkedInMessage {
  id: string;
  chatId: string;
  participantName: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
}

interface LinkedInMessagesProps {
  linkedinUrl: string;
}

export default function LinkedInMessages({ linkedinUrl }: LinkedInMessagesProps) {
  const [messages, setMessages] = useState<LinkedInMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchMessages();
  }, [linkedinUrl]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/linkedin/messages?linkedinUrl=${encodeURIComponent(linkedinUrl)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch LinkedIn messages');
      }

      setMessages(data.data.chats.map((chat: any) => ({
        id: chat.id,
        chatId: chat.id,
        participantName: chat.participants[0].name,
        lastMessage: chat.last_message?.content || '',
        lastMessageDate: chat.last_message?.created_at || new Date().toISOString(),
        unreadCount: chat.unread_count || 0
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;

    try {
      const response = await fetch('/api/linkedin/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId: selectedChat,
          message: newMessage.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Update the messages list
      setMessages(messages.map(msg => 
        msg.chatId === selectedChat
          ? { ...msg, lastMessage: newMessage, lastMessageDate: new Date().toISOString() }
          : msg
      ));
      setNewMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid date';
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="flex h-[600px] border rounded-lg">
      {/* Chats list */}
      <div className="w-1/3 border-r overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 cursor-pointer hover:bg-gray-50 ${
              selectedChat === message.chatId ? 'bg-gray-100' : ''
            }`}
            onClick={() => setSelectedChat(message.chatId)}
          >
            <div className="font-semibold">{message.participantName}</div>
            <div className="text-sm text-gray-600 truncate">{message.lastMessage}</div>
            <div className="text-xs text-gray-400 mt-1">
              {formatDate(message.lastMessageDate)}
            </div>
            {message.unreadCount > 0 && (
              <div className="bg-blue-500 text-white rounded-full px-2 py-1 text-xs inline-block mt-1">
                {message.unreadCount}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="flex-1 p-4 overflow-y-auto">
              {/* Messages will be displayed here */}
              <div className="text-center text-gray-500">
                Messages will appear here
              </div>
            </div>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 border rounded-lg px-4 py-2"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
} 