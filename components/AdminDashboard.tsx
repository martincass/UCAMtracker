import React from 'react';
import { User } from '../types';
import UsersTab from './admin/UsersTab';
import ClientsTab from './admin/ClientsTab';
import RequestsTab from './admin/RequestsTab';
import SubmissionsTable from './SubmissionsTable';
import { apiService } from '../services/apiService';
import { ManagedUser, AllowlistClient, AccessRequest, Submission } from '../types';
import { UsersIcon, BuildingLibraryIcon, EnvelopeOpenIcon, DocumentTextIcon } from './Icons';

type AdminTab = 'submissions' | 'users' | 'clients' | 'requests';

const AdminDashboard: React.FC<{
  user: User;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}> = ({ user, addNotification }) => {
  const [activeTab, setActiveTab] = React.useState<AdminTab>('submissions');
  
  // State for each tab's data
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [users, setUsers] = React.useState<ManagedUser[]>([]);
  const [clients, setClients] = React.useState<AllowlistClient[]>([]);
  const [requests, setRequests] = React.useState<AccessRequest[]>([]);

  // Loading and error states
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async (tab: AdminTab) => {
    setIsLoading(true);
    setError(null);
    try {
      switch (tab) {
        case 'submissions':
            const submissionsData = await apiService.adminGetSubmissions();
            setSubmissions(submissionsData);
            break;
        case 'users':
          const usersData = await apiService.adminGetUsers();
          setUsers(usersData);
          break;
        case 'clients':
          const clientsData = await apiService.adminGetClients();
          setClients(clientsData);
          break;
        case 'requests':
          const requestsData = await apiService.adminGetRequests();
          setRequests(requestsData);
          break;
      }
    } catch (err: any) {
      const errorMessage = `Failed to load data for ${tab}: ${err.message}`;
      setError(errorMessage);
      addNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  React.useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, fetchData]);

  const refreshUsers = async () => {
    await fetchData('users');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'submissions':
        return <SubmissionsTable submissions={submissions} setSubmissions={setSubmissions} isLoading={isLoading} error={error} userRole="admin" addNotification={addNotification} />;
      case 'users':
        return <UsersTab users={users} setUsers={setUsers} isLoading={isLoading} error={error} addNotification={addNotification} refreshUsers={refreshUsers} />;
      case 'clients':
        return <ClientsTab clients={clients} setClients={setClients} isLoading={isLoading} error={error} addNotification={addNotification} />;
      case 'requests':
        return <RequestsTab requests={requests} setRequests={setRequests} isLoading={isLoading} error={error} addNotification={addNotification} />;
      default:
        return null;
    }
  };

  const tabs: { id: AdminTab; name: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { id: 'submissions', name: 'Reportes', icon: DocumentTextIcon },
    { id: 'users', name: 'Usuarios', icon: UsersIcon },
    { id: 'clients', name: 'Clientes', icon: BuildingLibraryIcon },
    { id: 'requests', name: 'Solicitudes', icon: EnvelopeOpenIcon },
  ];

  return (
    <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Panel de Administración</h2>
        
        <div className="sm:hidden">
            <label htmlFor="tabs" className="sr-only">Select a tab</label>
            <select
                id="tabs"
                name="tabs"
                className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                onChange={(e) => setActiveTab(e.target.value as AdminTab)}
                value={activeTab}
            >
            {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>{tab.name}</option>
            ))}
            </select>
        </div>

        <div className="hidden sm:block">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`${
                        activeTab === tab.id
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                        <tab.icon className="-ml-0.5 mr-2 h-5 w-5" />
                        {tab.name}
                    </button>
                    ))}
                </nav>
            </div>
        </div>

        <div className="mt-8">
            {renderTabContent()}
        </div>
    </div>
  );
};

export default AdminDashboard;
