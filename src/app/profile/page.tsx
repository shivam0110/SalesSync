'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Alert } from '@/components/Alert';

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [selling, setSelling] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newLinkedinUrl, setNewLinkedinUrl] = useState('');

  const linkedinUrl = searchParams.get('linkedinUrl');

  useEffect(() => {
    if (linkedinUrl) {
      fetchProfile();
    }
  }, [linkedinUrl]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/profile?linkedinUrl=${encodeURIComponent(linkedinUrl || '')}`);
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.data);
        setSelling(data.data.selling || '');
      } else {
        setError(data.error || 'Failed to fetch profile');
      }
    } catch (err) {
      setError('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedinUrl) {
      setError('LinkedIn URL is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkedinUrl,
          selling,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Profile updated successfully!');
        await fetchProfile(); // Refresh profile data
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkedinUrl) {
      setError('Please enter a LinkedIn URL');
      return;
    }
    router.push(`/profile?linkedinUrl=${encodeURIComponent(newLinkedinUrl)}`);
  };

  if (!linkedinUrl) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white p-8 rounded-lg shadow">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Enter LinkedIn Profile</h2>
              <p className="mt-2 text-sm text-gray-600">
                Please provide your LinkedIn profile URL to continue
              </p>
            </div>

            {error && <Alert type="error" message={error} />}

            <form onSubmit={handleLinkedinSubmit} className="space-y-4">
              <div>
                <label htmlFor="linkedin-url" className="block text-sm font-medium text-gray-700">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  id="linkedin-url"
                  name="linkedin-url"
                  placeholder="https://linkedin.com/in/your-profile"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={newLinkedinUrl}
                  onChange={(e) => setNewLinkedinUrl(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-lg shadow">
          {loading && (
            <div className="flex justify-center items-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}
          
          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          {profile && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-gray-600">{profile.position}</p>
                <p className="text-gray-500">{profile.location}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="selling" className="block text-sm font-medium text-gray-700">
                    What are you selling?
                  </label>
                  <textarea
                    id="selling"
                    name="selling"
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={selling}
                    onChange={(e) => setSelling(e.target.value)}
                    placeholder="Describe what you're selling..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </form>

              <div className="mt-6 border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium">Profile Details</h3>
                <dl className="mt-2 space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Seniority</dt>
                    <dd className="text-sm text-gray-900">{profile.seniority}</dd>
                  </div>
                  {profile.headline && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Headline</dt>
                      <dd className="text-sm text-gray-900">{profile.headline}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">LinkedIn URL</dt>
                    <dd className="text-sm text-gray-900">
                      <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">
                        {profile.linkedinUrl}
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => router.push('/profile')}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Look up a different profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 