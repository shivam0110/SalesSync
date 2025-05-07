'use client';

import { useState } from 'react';

interface EmploymentHistory {
  organization: string;
  title: string;
  start_date: string;
  end_date?: string;
}

interface LinkedInMessage {
  id: string;
  chatId: string;
  participantName: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
}

interface CompanyMetrics {
  revenueRange: string;
  location: string;
  industry: string;
  type: string;
  headcount: {
    current: string;
    growth_rate: string;
    growth_percentage: string;
  };
  revenue: {
    range: string;
    growth_rate: string;
    growth_percentage: string;
  };
  funding: {
    total_amount: string;
    latest_round: string;
    latest_round_date: string;
  };
  technology: {
    tech_stack: string[];
    primary_technologies: string[];
    development_tools: string[];
  };
  social: {
    linkedin_followers: string;
    twitter_followers: string;
  };
}

interface CompanyData {
  name: string;
  employees: string;
  founded: string;
  description: string;
  website: string;
  linkedin_company_url: string;
}

interface SearchProps {
  onSearchComplete: (data: any) => void;
}

export default function Search({ onSearchComplete }: SearchProps) {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [companyMetrics, setCompanyMetrics] = useState<CompanyMetrics | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedinUrl) {
      setError('Please enter a LinkedIn URL');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSummary(null);
      setCompanyMetrics(null);
      setCompanyData(null);

      // Get LinkedIn messages from database/Unipile
      const messagesResponse = await fetch(`/api/linkedin/messages/chats?linkedinUrl=${encodeURIComponent(linkedinUrl)}`);
      const messagesData = await messagesResponse.json();
      
      console.log('LinkedIn messages data:', messagesData);

      if (messagesData.success && messagesData.summary) {
        setSummary(messagesData.summary);
      }

      // Get PDL and other data
      const response = await fetch('/api/source', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkedinUrl }),
      });

      const data = await response.json();

      if (data.success) {
        setCompanyMetrics(data.data.metrics);
        setCompanyData(data.data.company);

        // Combine all data
        const combinedData = {
          ...data.data,
          linkedinUrl,
          summary: messagesData.success ? messagesData.summary : null,
          linkedinMessages: messagesData.success ? messagesData.chats.map((chat: any) => ({
            id: chat.id,
            chatId: chat.id,
            participantName: chat.participants[0]?.name || 'Unknown',
            lastMessage: chat.last_message?.content || '',
            lastMessageDate: chat.last_message?.created_at || '',
            unreadCount: chat.unread_count || 0
          })) : [],
          unreadCount: messagesData.success ? messagesData.unreadCount : 0
        };
        onSearchComplete(combinedData);
      } else {
        setError(data.error || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Search</h2>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
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
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700 font-medium mb-1">Conversation Summary</p>
              <p className="text-sm text-blue-600">{summary}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">
            LinkedIn URL
          </label>
          <div className="mt-1">
            <input
              id="linkedin"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="shadow-sm text-black focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3"
              placeholder="https://linkedin.com/in/..."
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
            Company Domain
          </label>
          <input
            id="domain"
            type="text"
            value={companyDomain}
            onChange={(e) => setCompanyDomain(e.target.value)}
            className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="example.com"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </div>
          ) : 'Search'}
        </button>
      </form>

      {companyData && companyMetrics && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Company Details</h3>
          <dl className="grid grid-cols-1 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Company</dt>
              <dd className="mt-1 text-sm text-gray-900">{companyData.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Size</dt>
              <dd className="mt-1 text-sm text-gray-900">{companyData.employees}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Industry</dt>
              <dd className="mt-1 text-sm text-gray-900">{companyMetrics.industry}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Revenue</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <div>{companyMetrics.revenue.range}</div>
                {companyMetrics.revenue.growth_percentage !== 'Unknown' && (
                  <div className="text-xs text-green-600">
                    Growth: {companyMetrics.revenue.growth_percentage}
                  </div>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Headcount Growth</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <div>Current: {companyMetrics.headcount.current}</div>
                {companyMetrics.headcount.growth_percentage !== 'Unknown' && (
                  <div className="text-xs text-green-600">
                    Growth: {companyMetrics.headcount.growth_percentage}
                  </div>
                )}
              </dd>
            </div>
            {companyMetrics.funding.total_amount !== 'Unknown' && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Funding</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <div>Total: {companyMetrics.funding.total_amount}</div>
                  {companyMetrics.funding.latest_round !== 'Unknown' && (
                    <div className="text-xs text-gray-600">
                      Latest Round: {companyMetrics.funding.latest_round}
                      {companyMetrics.funding.latest_round_date !== 'Unknown' && (
                        ` (${new Date(companyMetrics.funding.latest_round_date).toLocaleDateString()})`
                      )}
                    </div>
                  )}
                </dd>
              </div>
            )}
            {companyMetrics.technology.tech_stack.length > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Tech Stack</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <div className="flex flex-wrap gap-1">
                    {companyMetrics.technology.tech_stack.map((tech: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Social Presence</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <div className="flex space-x-4">
                  <div>
                    <span className="text-gray-500">LinkedIn:</span>{' '}
                    {companyMetrics.social.linkedin_followers !== 'Unknown' 
                      ? `${companyMetrics.social.linkedin_followers} followers`
                      : 'N/A'
                    }
                  </div>
                  <div>
                    <span className="text-gray-500">Twitter:</span>{' '}
                    {companyMetrics.social.twitter_followers !== 'Unknown'
                      ? `${companyMetrics.social.twitter_followers} followers`
                      : 'N/A'
                    }
                  </div>
                </div>
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
} 