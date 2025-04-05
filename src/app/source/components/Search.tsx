'use client';

import { useState } from 'react';

interface EmploymentHistory {
  organization: string;
  title: string;
  start_date: string;
  end_date?: string;
}

export default function Search() {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/source', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkedinUrl,
          companyDomain,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ 
        success: false, 
        message: 'An error occurred while fetching data' 
      });
    }
    setLoading(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Search</h2>
      
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">
            LinkedIn URL
          </label>
          <input
            id="linkedin"
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://linkedin.com/in/..."
            required
          />
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="example.com"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-lg text-white transition-colors ${
            loading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {result && (
        <div className={`mt-6 p-4 rounded-lg ${
          result.success ? 'bg-white shadow-lg' : 'bg-red-50'
        }`}>
          {!result.success && (
            <p className="text-sm text-red-800">{result.message}</p>
          )}
          
          {result.success && result.data && (
            <div className="space-y-6">
              {/* Company Information */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {result.data.company.name}
                </h3>
                <div className="mt-2 flex gap-4 text-sm text-gray-600">
                  <span>{result.data.company.employees}</span>
                  <span>•</span>
                  <span>Founded {result.data.company.founded}</span>
                </div>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  {result.data.company.description}
                </p>
              </div>

              {/* Metrics */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Company Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(result.data.metrics).map(([key, value]) => (
                    <div key={key} className="bg-white p-3 rounded-md">
                      <dt className="text-sm text-gray-500 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">{String(value)}</dd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Person Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    {result.data.person.photo_url && (
                      <img 
                        src={result.data.person.photo_url} 
                        alt={result.data.person.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h4 className="text-xl font-medium text-gray-900">{result.data.person.name}</h4>
                      <p className="text-gray-600">{result.data.person.position}</p>
                      <p className="text-gray-500 text-sm">{result.data.person.location}</p>
                      <p className="text-blue-600 text-sm mt-1">{result.data.person.seniority}</p>
                    </div>
                  </div>
                  
                  {result.data.person.headline && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-700 italic">"{result.data.person.headline}"</p>
                    </div>
                  )}

                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Employment History</h5>
                    <div className="space-y-3">
                      {result.data.person.employment_history.map((job: EmploymentHistory, index: number) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium text-gray-900">{job.organization}</p>
                          <p className="text-gray-600 text-sm">{job.title}</p>
                          <p className="text-gray-500 text-sm">
                            {formatDate(job.start_date)} - {formatDate(job.end_date)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 