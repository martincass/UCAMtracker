import React, { useState, useEffect } from 'react';
import { ManagedUser } from '../../types';
import { apiService } from '../../services/apiService';
import { es } from '../../locale/es';

interface ResetPasswordModalProps {
  user: ManagedUser;
  setIsOpen: (isOpen: boolean) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ user, setIsOpen, addNotification }) => {
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const resetPassword = async () => {
      try {
        const { password_cleartext } = await apiService.adminResetPassword(user.id);
        setNewPassword(password_cleartext);
        addNotification(es.passwordResetSuccess.replace('{{email}}', user.email), 'success');
      } catch (err: any) {
        setError(err.message);
        addNotification(err.message, 'error');
      } finally {
        setIsLoading(false);
      }
    };
    resetPassword();
  }, [user, addNotification]);

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    addNotification(es.passwordCopied, 'info');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-medium text-gray-900">{es.resetPasswordTitle.replace('{{email}}', user.email)}</h2>
        
        {isLoading && <p className="mt-4 text-center">{es.creating}...</p>}
        {error && <p className="mt-4 text-center text-red-600">{error}</p>}

        {newPassword && (
          <div>
             <p className="mt-2 text-sm text-gray-500">{es.resetPasswordDescription}</p>
             <div className="mt-2 p-3 bg-slate-100 rounded-md text-center font-mono text-lg tracking-wider font-bold">
                 {newPassword}
             </div>
             <div className="mt-4 flex justify-between items-center">
                  <button onClick={handleCopyPassword} className="bg-primary-100 text-primary-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-primary-200">
                     {es.copyPassword}
                  </button>
                  <button onClick={() => setIsOpen(false)} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                     {es.closeModal}
                  </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordModal;