import React from 'react';
const Error: React.FC = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h1 className="text-3xl font-bold text-white mb-2">Something went wrong</h1>
      <p className="text-gray-400 mb-6">An unexpected error occurred.</p>
      <a href="/" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Go Home</a>
    </div>
  </div>
);
export default Error;
