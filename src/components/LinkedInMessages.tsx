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

interface ChatMessage {
  id: string;
  chatId: string;
  content: string;
  createdAt: string;
  senderId: string;
  senderName: string;
}

interface LinkedInMessagesProps {
  linkedinUrl?: string;  // Make linkedinUrl optional
}

export default function LinkedInMessages({ linkedinUrl }: LinkedInMessagesProps) {
  const [chats, setChats] = useState<LinkedInMessage[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []); // Remove linkedinUrl dependency to fetch all chats on load

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
    }
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/linkedin/messages/chats');  // Remove linkedinUrl parameter
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch LinkedIn chats');
      }

      setChats(data.chats.map((chat: any) => ({
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

  const fetchMessages = async (chatId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/linkedin/messages/${chatId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch messages');
      }

      setMessages(data.messages.map((msg: any) => ({
        id: msg.id,
        chatId: msg.chat_id,
        content: msg.content,
        createdAt: msg.created_at,
        senderId: msg.sender_id,
        senderName: msg.sender_name
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim() || sendingMessage) return;

    try {
      setSendingMessage(true);
      const response = await fetch('/api/linkedin/messages/send', {
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

      // Add the new message to the list
      const newMsg: ChatMessage = {
        id: data.messageId,
        chatId: selectedChat,
        content: newMessage,
        createdAt: new Date().toISOString(),
        senderId: 'me',
        senderName: 'You'
      };
      setMessages(prev => [...prev, newMsg]);

      // Update the chat list
      setChats(prev => prev.map(chat => 
        chat.chatId === selectedChat
          ? { ...chat, lastMessage: newMessage, lastMessageDate: new Date().toISOString() }
          : chat
      ));

      setNewMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'MMM d, yyyy h:mm a') : 'Invalid date';
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading && !selectedChat) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>;
  }

  if (error && !chats.length) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="flex h-[600px] border rounded-lg">
      {/* Chats list */}
      <div className="w-1/3 border-r overflow-y-auto">
        {chats.length === 0 ? (
          <div className="text-center text-gray-500 p-4">
            No chats available
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className={`p-4 cursor-pointer hover:bg-gray-50 ${
                selectedChat === chat.chatId ? 'bg-gray-100' : ''
              }`}
              onClick={() => setSelectedChat(chat.chatId)}
            >
              <div className="font-semibold">{chat.participantName}</div>
              <div className="text-sm text-gray-600 truncate">{chat.lastMessage}</div>
              <div className="text-xs text-gray-400 mt-1">
                {formatDate(chat.lastMessageDate)}
              </div>
              {chat.unreadCount > 0 && (
                <div className="bg-blue-500 text-white rounded-full px-2 py-1 text-xs inline-block mt-1">
                  {chat.unreadCount}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">No messages yet</div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[70%] ${
                        message.senderId === 'me'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100'
                      }`}
                    >
                      <div className="text-xs text-opacity-75 mb-1">
                        {message.senderName}
                      </div>
                      <div className="break-words">{message.content}</div>
                      <div className="text-xs mt-1 opacity-75">
                        {formatDate(message.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )}
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
                  disabled={sendingMessage}
                />
                <button
                  onClick={sendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                  className={`px-4 py-2 rounded-lg ${
                    sendingMessage || !newMessage.trim()
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {sendingMessage ? 'Sending...' : 'Send'}
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