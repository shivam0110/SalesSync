'use client';

export default function GoogleCalendar() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Google Calendar Integration</h2>
      <div className="bg-gray-50 p-8 rounded-lg text-center">
        <p className="text-gray-600 mb-4">Connect your Google Calendar to sync events and meetings.</p>
        <button 
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          onClick={() => {
            // TODO: Implement Google Calendar OAuth
            alert('Google Calendar integration coming soon!');
          }}
        >
          Connect Google Calendar
        </button>
      </div>
    </div>
  );
} 