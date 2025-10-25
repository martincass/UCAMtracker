import React, { useState } from 'react';
import { ManagedUser, UserStatus } from '../../types';
import { apiService } from '../../services/apiService';
import InviteUserModal from './InviteUserModal';
import { UserPlusIcon, ArrowPathIcon, PaperAirplaneIcon } from '../Icons';

interface UsersTabProps {
  users: ManagedUser[];
  setUsers: React.Dispatch<React.SetStateAction<ManagedUser[]>>;
  isLoading: boolean;
  error: string | null;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  refreshUsers: () => void;
}

const UsersTab: React.FC<UsersTabProps> = ({ users, setUsers, isLoading, error, addNotification, refreshUsers }) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const handleToggleActive = async (user: ManagedUser) => {
    try {
      const updatedUser = await apiService.updateUser(user.id, { active: !user.active_on_allowlist });
      setUsers(prev => prev.map(u => (u.id === user.id ? updatedUser : u)));
      addNotification(`User ${user.email} has been ${updatedUser.active_on_allowlist ? 'activated' : 'deactivated'}.`, 'success');
    } catch(err: any) {
        addNotification(err.message, 'error');
    }
  };

  const handleToggleAdmin = async (user: ManagedUser) => {
    const newRole = user.role === 'admin' ? 'client' : 'admin';
    try {
        const updatedUser = await apiService.updateUser(user.id, { role: newRole });
        setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
        addNotification(`User ${user.email} role set to ${newRole}.`, 'success');
    } catch(err: any) {
        addNotification(err.message, 'error');
    }
  };
  
  const handleResendConfirmation = async (user: ManagedUser) => {
      try {
          await apiService.resendConfirmation(user.email);
          addNotification(`Confirmation email resent to ${user.email}.`, 'success');
      } catch(err: any) {
          addNotification(err.message, 'error');
      }
  };

  const handleForceReset = async (user: ManagedUser) => {
    if (window.confirm(`Are you sure you want to force a password reset for ${user.email}? This will send them an email directing them to the password reset page.`)) {
        try {
            const updatedUser = await apiService.updateUser(user.id, { must_change_password: true });
            setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
            addNotification(`Password reset has been forced for ${user.email}.`, 'success');
        } catch(err: any) {
            addNotification(err.message, 'error');
        }
    }
  };

  const UserStatusBadge: React.FC<{status: UserStatus}> = ({ status }) => {
    const styles: Record<UserStatus, string> = {
        ACTIVE: "bg-green-100 text-green-800",
        INACTIVE: "bg-red-100 text-red-800",
        PENDING_RESET: "bg-yellow-100 text-yellow-800",
        CONFIRMATION_SENT: "bg-blue-100 text-blue-800",
        INVITED: "bg-gray-100 text-gray-800",
    };
    const text: Record<UserStatus, string> = {
        ACTIVE: "Active",
        INACTIVE: "Inactive",
        PENDING_RESET: "Pending Reset",
        CONFIRMATION_SENT: "Pending Confirmation",
        INVITED: "Invited",
    };
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status]}`}>{text[status]}</span>;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-slate-800">Manage Users</h3>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Invite User
        </button>
      </div>

      {isInviteModalOpen && <InviteUserModal setIsOpen={setIsInviteModalOpen} addNotification={addNotification} onInviteSuccess={refreshUsers} />}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Sign In</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center p-6 text-gray-500">Loading users...</td></tr>
            ) : error ? (
              <tr><td colSpan={5} className="text-center p-6 text-red-500">{error}</td></tr>
            ) : users.length > 0 ? (
              users.map(user => (
                <tr key={user.id} className="even:bg-white odd:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.email}{user.role === 'admin' && <span className="ml-2 text-xs font-bold text-purple-600">(Admin)</span>}</td>
                  <td className="px-4 py-3 text-gray-500">{user.clientName} ({user.clientId})</td>
                  <td className="px-4 py-3 text-center"><UserStatusBadge status={user.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</td>
                  <td className="px-4 py-3 text-sm font-medium">
                    <div className='flex items-center space-x-2'>
                        {user.status === 'CONFIRMATION_SENT' && (
                             <button onClick={() => handleResendConfirmation(user)} className="text-blue-600 hover:text-blue-900 p-1" title="Resend Confirmation"><PaperAirplaneIcon className="h-5 w-5"/></button>
                        )}
                        <button onClick={() => handleToggleAdmin(user)} className="text-primary-600 hover:text-primary-900" title={user.role === 'admin' ? 'Demote to Client' : 'Promote to Admin'}>{user.role === 'admin' ? 'Demote' : 'Promote'}</button>
                        <button onClick={() => handleToggleActive(user)} className={user.active_on_allowlist ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"} title={user.active_on_allowlist ? 'Deactivate User' : 'Activate User'}>{user.active_on_allowlist ? 'Deactivate' : 'Activate'}</button>
                         <button onClick={() => handleForceReset(user)} className="text-yellow-600 hover:text-yellow-900 p-1" title="Force Password Reset"><ArrowPathIcon className="h-5 w-5" /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="text-center p-6 text-gray-500">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTab;
