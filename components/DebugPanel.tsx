import React from 'react';
import { User, View } from '../types';

interface DebugPanelProps {
  user: User | null;
  view: View;
  setView: (view: View) => void;
  setUser: (user: User | null) => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ user, view, setView, setUser }) => {
  // Simple debug panel, hidden in production builds
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleLogout = () => {
    setUser(null);
    setView('login');
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-xl z-50 text-xs w-64">
      <h4 className="font-bold mb-2">Debug Panel</h4>
      <p><strong>Current View:</strong> {view}</p>
      <div><strong>User:</strong> {user ? <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(user, null, 2)}</pre> : 'null'}</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button onClick={() => setView('login')} className="bg-blue-500 px-2 py-1 rounded text-white w-full">Login</button>
        <button onClick={() => setView('signup')} className="bg-blue-500 px-2 py-1 rounded text-white w-full">Signup</button>
        <button onClick={() => setView('forgot-password')} className="bg-blue-500 px-2 py-1 rounded text-white w-full">Forgot</button>
        <button onClick={() => setView('reset-password')} className="bg-blue-500 px-2 py-1 rounded text-white w-full">Reset</button>
        <button onClick={() => setView('dashboard')} className="bg-green-500 px-2 py-1 rounded text-white w-full">Dashboard</button>
        <button onClick={() => setView('admin-dashboard')} className="bg-purple-500 px-2 py-1 rounded text-white w-full">Admin</button>
        <button onClick={() => setView('force-reset-password')} className="bg-yellow-500 px-2 py-1 rounded text-white w-full">Force Reset</button>
        <button onClick={handleLogout} className="bg-red-500 px-2 py-1 rounded text-white w-full">Logout</button>
      </div>
    </div>
  );
};

export default DebugPanel;
