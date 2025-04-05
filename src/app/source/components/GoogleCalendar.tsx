'use client';

import { useState } from 'react';

export default function GoogleCalendar() {
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    // TODO: Implement Google Calendar OAuth
    setIsConnected(true);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-600 mb-4">Connect your Google Calendar to view and manage events</p>
        <button
          onClick={handleConnect}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Connect Google Calendar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Your Calendar</h2>
        <button
          onClick={() => setIsConnected(false)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Disconnect
        </button>
      </div>
      <div className="border rounded-lg p-4 text-center text-gray-500">
        Calendar events will appear here after implementation
      </div>
    </div>
  );
} 