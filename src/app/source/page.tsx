'use client';

import { useState } from 'react';
import Search from './components/Search';
import { ChatBot } from '@/components/ChatBot';
import GoogleCalendar from './components/GoogleCalendar';
import LinkedInMessages from '@/components/LinkedInMessages';

export default function SourcePage() {
  const [activeTab, setActiveTab] = useState<'search' | 'calendar' | 'linkedin'>('search');
  const [searchData, setSearchData] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);

  const handleSearchComplete = (data: any) => {
    setSearchData(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'search'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'calendar'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setActiveTab('linkedin')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'linkedin'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            LinkedIn Messages
          </button>
        </div>

        <div className="bg-white shadow rounded-lg">
          {activeTab === 'search' ? (
            <div className="p-6">
              <Search onSearchComplete={handleSearchComplete} />
              
              {searchData && (
                <div className="mt-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{searchData.person.name}</h2>
                      <p className="mt-1 text-gray-600">{searchData.person.position}</p>
                      <p className="text-gray-500">{searchData.person.location}</p>
                    </div>
                    <button
                      onClick={() => setShowChat(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Conversation Starter
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Person Details</h3>
                      <dl className="grid grid-cols-1 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Position</dt>
                          <dd className="mt-1 text-sm text-gray-900">{searchData.person.position}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Location</dt>
                          <dd className="mt-1 text-sm text-gray-900">{searchData.person.location}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Seniority</dt>
                          <dd className="mt-1 text-sm text-gray-900">{searchData.person.seniority}</dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Company Details</h3>
                      <dl className="grid grid-cols-1 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Company</dt>
                          <dd className="mt-1 text-sm text-gray-900">{searchData.company.name}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Size</dt>
                          <dd className="mt-1 text-sm text-gray-900">{searchData.company.employees}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Industry</dt>
                          <dd className="mt-1 text-sm text-gray-900">{searchData.metrics.industry}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'calendar' ? (
            <div className="p-6">
              <GoogleCalendar />
            </div>
          ) : (
            <div className="p-6">
              {searchData?.person?.linkedin_url ? (
                <LinkedInMessages linkedinUrl={searchData.person.linkedin_url} />
              ) : (
                <div className="text-center text-gray-500">
                  Please search for a person first to view their LinkedIn messages
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showChat && searchData && searchData.person && searchData.company && (
        <ChatBot
          personName={searchData.person.name || ''}
          personRole={searchData.person.position || ''}
          company={searchData.company.name || ''}
          linkedinUrl={searchData.person.linkedin_url || ''}
          personLocation={searchData.person.location}
          personSeniority={searchData.person.seniority}
          personHeadline={searchData.person.headline}
          companySize={searchData.company.employees}
          companyIndustry={searchData.metrics.industry}
          companyLocation={searchData.metrics.location}
          autobound_insights={searchData.autobound_insights}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
} 