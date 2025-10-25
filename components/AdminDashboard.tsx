import React, { useState, useEffect, useCallback } from 'react';
import { User, Submission, ManagedUser, AllowlistClient, AccessRequest, SystemHealth } from '../types';
import { apiService } from '../services/apiService';
import SubmissionsTable from './SubmissionsTable';
import UsersTab from './admin/UsersTab';
import ClientsTab from './admin/ClientsTab';
import RequestsTab from './admin/RequestsTab';
import SystemHealthTab from './admin/SystemHealthTab';
import { DocumentTextIcon, UsersIcon, BuildingLibraryIcon, ShieldCheckIcon, EnvelopeOpenIcon } from './Icons';

interface AdminDashboardProps {
  user: User;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

type AdminTab = 'submissions' | 'users' | 'clients' | 'requests' | 'health';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, addNotification }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('submissions');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [clients, setClients] = useState<AllowlistClient[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (tab: AdminTab) => {
    setIsLoading(true);
    setError(null);
    try {
      switch(tab) {
        case 'submissions':
          setSubmissions(await apiService.getSubmissions(user));
          break;
        case 'users':
          setUsers(await apiService.getUsers());
          break;
        case 'clients':
          setClients(await apiService.getClients());
          break;
        case 'requests':
          setRequests(await apiService.getAccessRequests());
          break;
        case 'health':
            setHealth(await apiService.getSystemHealth());
            break;
      }
    } catch (err: any) {
      const msg = `Failed to fetch data for ${tab}.`;
      setError(msg);
      addNotification(err.message || msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user, addNotification]);
  
  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, fetchData]);
  
  const TABS: { id: AdminTab; name: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
      { id: 'submissions', name: 'Submissions', icon: DocumentTextIcon },
      { id: 'users', name: 'Users', icon: UsersIcon },
      { id: 'clients', name: 'Clients', icon: BuildingLibraryIcon },
      { id: 'requests', name: 'Access Requests', icon: EnvelopeOpenIcon },
      { id: 'health', name: 'System Health', icon: ShieldCheckIcon },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-slate-600 mt-1">Manage submissions, users, and clients.</p>
      </div>

      <div>
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">Select a tab</label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as AdminTab)}
          >
            {TABS.map((tab) => <option key={tab.id} value={tab.id}>{tab.name}</option>)}
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  <tab.icon className="-ml-0.5 mr-2 h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {activeTab === 'submissions' && <SubmissionsTable submissions={submissions} isLoading={isLoading} error={error} isAdminView={true} />}
        {activeTab === 'users' && <UsersTab users={users} setUsers={setUsers} isLoading={isLoading} error={error} addNotification={addNotification} refreshUsers={() => fetchData('users')} />}
        {activeTab === 'clients' && <ClientsTab clients={clients} setClients={setClients} isLoading={isLoading} error={error} addNotification={addNotification} />}
        {activeTab === 'requests' && <RequestsTab requests={requests} setRequests={setRequests} isLoading={isLoading} error={error} addNotification={addNotification} />}
        {activeTab === 'health' && <SystemHealthTab health={health} isLoading={isLoading} error={error} />}
      </div>
    </div>
  );
};

export default AdminDashboard;