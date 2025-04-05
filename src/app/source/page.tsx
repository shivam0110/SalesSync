'use client';

import { useState } from 'react';
import GoogleCalendar from './components/GoogleCalendar';
import Search from './components/Search';

export default function SourcePage() {
  const [activeTab, setActiveTab] = useState('calendar');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Source</h1>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Google Calendar
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'search'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Search
            </button>
          </div>

          <div className="mt-6">
            {activeTab === 'calendar' ? <GoogleCalendar /> : <Search />}
          </div>
        </div>
      </div>
    </div>
  );
} 