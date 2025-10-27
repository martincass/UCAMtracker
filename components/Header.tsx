import React from 'react';
import { User } from '../types';
import { es } from '../locale/es';
import { PowerIcon, UserCircleIcon } from './Icons';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-primary-600">{es.appTitle}</h1>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <UserCircleIcon className="h-6 w-6 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700 hidden sm:block">
                    {/* FIX: Corrected property access from clientName to client_name */}
                    {user.email} ({user.role === 'admin' ? es.roleAdmin : user.client_name})
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PowerIcon className="h-5 w-5 text-slate-500"/>
                  <span className="hidden sm:block">{es.logoutButton}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;