import React, { useState, useEffect, useCallback } from 'react';
import { Submission, ManagedUser, AllowlistClient, User } from '../types';
import { apiService } from '../services/apiService';
import { es } from '../locale/es';
import SubmissionsTable from './SubmissionsTable';
import UsersTab from './admin/UsersTab';
import ClientsTab from './admin/ClientsTab';

interface AdminDashboardProps {
  user: User;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

type AdminTab = 'submissions' | 'users' | 'clients';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, addNotification }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('submissions');
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [clients, setClients] = useState<AllowlistClient[]>([]);
  
  const [loading, setLoading] = useState<Record<AdminTab, boolean>>({ submissions: true, users: true, clients: true });
  const [error, setError] = useState<Record<AdminTab, string | null>>({ submissions: null, users: null, clients: null });

  const fetchDataForTab = useCallback(async (tab: AdminTab) => {
    setLoading(prev => ({ ...prev, [tab]: true }));
    setError(prev => ({ ...prev, [tab]: null }));
    try {
      if (tab === 'submissions') {
        const data = await apiService.adminGetSubmissions();
        setSubmissions(data);
      } else if (tab === 'users') {
        const data = await apiService.adminGetUsers();
        setUsers(data);
      } else if (tab === 'clients') {
        const data = await apiService.adminGetClients();
        setClients(data);
      }
    } catch (e: any) {
      const errorMessage = e.message || `Failed to load data for ${tab}`;
      setError(prev => ({ ...prev, [tab]: errorMessage }));
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }));
    }
  }, [addNotification]);

  useEffect(() => {
    fetchDataForTab(activeTab);
  }, [activeTab, fetchDataForTab]);

  const renderTabContent = () => {
    switch(activeTab) {
      case 'submissions':
        return (
          <SubmissionsTable
            submissions={submissions}
            isLoading={loading.submissions}
            error={error.submissions}
            isAdmin={true}
            refetchSubmissions={() => fetchDataForTab('submissions')}
            addNotification={addNotification}
          />
        );
      case 'users':
        return (
          <UsersTab
            users={users}
            setUsers={setUsers}
            isLoading={loading.users}
            error={error.users}
            addNotification={addNotification}
            refreshUsers={() => fetchDataForTab('users')}
          />
        );
      case 'clients':
        return (
          <ClientsTab
            clients={clients}
            setClients={setClients}
            isLoading={loading.clients}
            error={error.clients}
            addNotification={addNotification}
          />
        );
      default: return null;
    }
  };

  const TabButton: React.FC<{ tab: AdminTab; label: string }> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-md ${
        activeTab === tab
          ? 'bg-primary-100 text-primary-700'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">{es.adminDashboardTitle}</h2>
        <p className="mt-1 text-sm text-gray-600">{es.adminDashboardSubtitle}</p>
        <div className="mt-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            <TabButton tab="submissions" label={es.tabSubmissions} />
            <TabButton tab="users" label={es.tabUsers} />
            <TabButton tab="clients" label={es.tabClients} />
          </nav>
        </div>
      </div>
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
