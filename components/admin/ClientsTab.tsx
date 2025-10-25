
import React, { useState } from 'react';
import { AllowlistClient } from '../../types';
import { apiService } from '../../services/apiService';
import { PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '../Icons';

interface ClientsTabProps {
  clients: AllowlistClient[];
  setClients: React.Dispatch<React.SetStateAction<AllowlistClient[]>>;
  isLoading: boolean;
  error: string | null;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ClientsTab: React.FC<ClientsTabProps> = ({ clients, setClients, isLoading, error, addNotification }) => {
  const [isEditing, setIsEditing] = useState<AllowlistClient | null>(null);

  const handleDelete = async (clientId: string) => {
    if (window.confirm("Are you sure you want to delete this client from the allowlist? This cannot be undone.")) {
      try {
        await apiService.deleteClient(clientId);
        setClients(prev => prev.filter(c => c.id !== clientId));
        addNotification("Client successfully deleted.", 'success');
      } catch (err: any) {
        addNotification(err.message, 'error');
      }
    }
  };
  
  const handleToggleActive = async (client: AllowlistClient) => {
     try {
        const updatedClient = await apiService.updateClient(client.id, { active: !client.active });
        setClients(prev => prev.map(c => c.id === client.id ? updatedClient : c));
        addNotification(`Client ${client.email} has been ${updatedClient.active ? 'activated' : 'deactivated'}.`, 'success');
     } catch(err: any) {
        addNotification(err.message, 'error');
     }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-slate-800">Manage Allowlist Clients</h3>
        {/* TODO: Add 'Create Client' and 'Import CSV' buttons */}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client ID</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client Name</th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Active</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center p-6 text-gray-500">Loading clients...</td></tr>
            ) : error ? (
              <tr><td colSpan={5} className="text-center p-6 text-red-500">{error}</td></tr>
            ) : clients.length > 0 ? (
              clients.map(client => (
                <tr key={client.id} className="even:bg-white odd:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{client.email}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono">{client.client_id}</td>
                  <td className="px-4 py-3 text-gray-500">{client.client_name}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggleActive(client)}>
                      {client.active ? <CheckCircleIcon className="h-5 w-5 text-green-500" /> : <XCircleIcon className="h-5 w-5 text-red-500" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium space-x-4">
                    <button onClick={() => alert("Edit functionality not implemented in mock.")} className="text-primary-600 hover:text-primary-900"><PencilIcon className="h-5 w-5" /></button>
                    <button onClick={() => handleDelete(client.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-5 w-5" /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="text-center p-6 text-gray-500">No clients found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientsTab;
