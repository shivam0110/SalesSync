import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full px-4">
        <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">
          Welcome to SalesSync
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link href="/source" 
            className="flex flex-col items-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Source</h2>
            <p className="text-gray-600 text-center">
              Access Google Calendar integration and search functionality
            </p>
          </Link>

          <Link href="/crustdata-copilot"
            className="flex flex-col items-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Crustdata Copilot</h2>
            <p className="text-gray-600 text-center">
              Coming soon...
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
