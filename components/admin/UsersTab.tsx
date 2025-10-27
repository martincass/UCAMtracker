import React, { useState } from 'react';
import { ManagedUser, CreateUserResponse } from '../../types';
import { apiService } from '../../services/apiService';
import { es } from '../../locale/es';
import { UserPlusIcon, ArrowPathIcon, ExclamationTriangleIcon, TrashIcon } from '../Icons';
import CreateUserModal from './CreateUserModal';
import ResetPasswordModal from './ResetPasswordModal';

interface UsersTabProps {
  users: ManagedUser[];
  setUsers: React.Dispatch<React.SetStateAction<ManagedUser[]>>;
  isLoading: boolean;
  error: string | null;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  refreshUsers: () => Promise<void>;
}

const UsersTab: React.FC<UsersTabProps> = ({ users, setUsers, isLoading, error, addNotification, refreshUsers }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const handleCreateSuccess = (data: CreateUserResponse) => {
    const newUser: ManagedUser = {
      id: data.user_id,
      email: data.email,
      role: 'user',
      client_id: data.client_id,
      client_name: data.client_name,
      status: 'active',
      last_sign_in_at: null,
      created_at: new Date().toISOString(),
      is_confirmed: true,
    };
    setUsers(prev => [newUser, ...prev]);
    refreshUsers().catch(err => {
        console.error("Background refetch failed:", err);
        addNotification('No se pudo refrescar la lista de usuarios.', 'error');
    });
  };

  const handleDeactivateUser = async (user: ManagedUser) => {
    if (actionInProgress) return;
    if (!window.confirm(`¿Estás seguro de que quieres desactivar al usuario ${user.email}? No podrán iniciar sesión.`)) return;
    
    setActionInProgress(user.id);
    try {
      await apiService.adminDeactivateUser(user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'inactive' } : u));
      addNotification(`Usuario ${user.email} desactivado.`, 'success');
    } catch (err: any) {
      addNotification(`Error al desactivar: ${err.message}`, 'error');
    } finally {
      setActionInProgress(null);
    }
  };
  
  const handleArchiveUser = async (user: ManagedUser) => {
    if (actionInProgress) return;
  
    if (!window.confirm('Este usuario será ocultado de la lista. ¿Continuar?')) {
      return;
    }
  
    setActionInProgress(user.id);
    try {
      await apiService.adminArchiveUser(user.id);
      addNotification(`Usuario ${user.email} archivado.`, 'success');
      await refreshUsers(); // Re-fetch to update the list
    } catch (err: any) {
      addNotification(`Error al archivar: ${err.message}`, 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  const openResetPasswordModal = (user: ManagedUser) => {
    setSelectedUser(user);
    setIsResetModalOpen(true);
  };
  
  const getStatusBadge = (status: ManagedUser['status']) => {
    if (status === 'inactive') {
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{es.statusInactive}</span>;
    }
    switch (status) {
      case 'active':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{es.statusActive}</span>;
      case 'pending_reset':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">{es.statusPendingReset}</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };
  
  const isArchived = (user: ManagedUser) => user.status === 'inactive';

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="sm:flex sm:justify-between sm:items-center mb-4">
        <h3 className="text-xl font-semibold text-slate-800">{es.manageUsersTitle}</h3>
        <div className="flex space-x-2 mt-2 sm:mt-0">
          <button onClick={refreshUsers} disabled={isLoading} className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50">
            <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setIsCreateModalOpen(true)} className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700">
            <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
            {es.createUserButton}
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{es.colEmail}</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{es.colClient}</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{es.colLastSignIn}</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{es.colStatus}</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{es.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && users.length === 0 ? (
              <tr><td colSpan={5} className="text-center p-6 text-gray-500">{es.loadingUsers}</td></tr>
            ) : error ? (
              <tr><td colSpan={5} className="text-center p-6 text-red-500">{error}</td></tr>
            ) : users.length > 0 ? (
              users.map(user => (
                <tr key={user.id} className={`even:bg-white odd:bg-slate-50 ${isArchived(user) ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{user.email}</td>
                  <td className="px-4 py-3 text-gray-500">{user.client_name} ({user.client_id})</td>
                  <td className="px-4 py-3 text-gray-500">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : es.never}</td>
                  <td className="px-4 py-3">{getStatusBadge(user.status)}</td>
                  <td className="px-4 py-3 text-sm font-medium space-x-2">
                    <button onClick={() => openResetPasswordModal(user)} title={es.resetPassword} disabled={actionInProgress === user.id || isArchived(user)} className="text-gray-500 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed">
                        <ArrowPathIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeactivateUser(user)} title={es.deactivate} disabled={actionInProgress === user.id || isArchived(user)} className="text-yellow-600 hover:text-yellow-800 disabled:opacity-30 disabled:cursor-not-allowed">
                        <ExclamationTriangleIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleArchiveUser(user)} title="Archivar Usuario" disabled={actionInProgress === user.id} className="text-red-600 hover:text-red-800 disabled:opacity-30 disabled:cursor-not-allowed">
                        <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="text-center p-6 text-gray-500">{es.noUsersFound}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      {isCreateModalOpen && <CreateUserModal setIsOpen={setIsCreateModalOpen} addNotification={addNotification} onCreateSuccess={handleCreateSuccess} />}
      {isResetModalOpen && selectedUser && <ResetPasswordModal user={selectedUser} setIsOpen={setIsResetModalOpen} addNotification={addNotification} />}
    </div>
  );
};

export default UsersTab;
