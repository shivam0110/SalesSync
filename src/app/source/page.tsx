'use client';

import { useState } from 'react';
import GoogleCalendar from './components/GoogleCalendar';
import Search from './components/Search';
import { ChatBot } from '@/components/ChatBot';

export default function SourcePage() {
  const [activeTab, setActiveTab] = useState('calendar');
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
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'search'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Search
          </button>
        </div>

        <div className="bg-white shadow rounded-lg">
          {activeTab === 'calendar' ? (
            <GoogleCalendar />
          ) : (
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
                      <dl className="space-y-3">
                        {searchData.person.seniority && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Seniority</dt>
                            <dd className="mt-1 text-sm text-gray-900">{searchData.person.seniority}</dd>
                          </div>
                        )}
                        {searchData.person.headline && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Headline</dt>
                            <dd className="mt-1 text-sm text-gray-900">{searchData.person.headline}</dd>
                          </div>
                        )}
                        {searchData.person.employment_history && searchData.person.employment_history.length > 0 && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Experience</dt>
                            <dd className="mt-1 space-y-2">
                              {searchData.person.employment_history.map((job: any, index: number) => (
                                <div key={index} className="text-sm text-gray-900">
                                  <p className="font-medium">{job.title}</p>
                                  <p>{job.organization}</p>
                                  <p className="text-gray-500">{job.start_date} - {job.end_date || 'Present'}</p>
                                  {job.description && <p className="text-gray-600 mt-1">{job.description}</p>}
                                </div>
                              ))}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Company Details</h3>
                      <dl className="space-y-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Company Name</dt>
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
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Location</dt>
                          <dd className="mt-1 text-sm text-gray-900">{searchData.metrics.location}</dd>
                        </div>
                        {searchData.company.description && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Description</dt>
                            <dd className="mt-1 text-sm text-gray-900">{searchData.company.description}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showChat && searchData && (
        <ChatBot
          personName={searchData.person.name}
          personRole={searchData.person.position}
          company={searchData.company.name}
          linkedinUrl={searchData.linkedinUrl}
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