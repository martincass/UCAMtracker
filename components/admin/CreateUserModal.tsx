import React, { useState, useRef, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { es } from '../../locale/es';
import { CreateUserResponse } from '../../types';

interface CreateUserModalProps {
  setIsOpen: (isOpen: boolean) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  onCreateSuccess: (data: CreateUserResponse) => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ setIsOpen, addNotification, onCreateSuccess }) => {
  const [email, setEmail] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<CreateUserResponse | null>(null);
  const [passwordDelivered, setPasswordDelivered] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the first input when the modal opens
    emailInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent double submits

    setError('');
    setIsLoading(true);

    try {
      const data = await apiService.adminCreateUser(email, clientId, clientName);
      onCreateSuccess(data); // Trigger optimistic update in parent
      setSuccessData(data); // Switch modal to success view
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        addNotification('Sesión inválida. Por favor, inicia sesión de nuevo.', 'error');
        window.location.reload(); // Simple redirect for SPA-like structure
      } else {
        const errorMessage = err.message || 'No se pudo crear el usuario.';
        setError(errorMessage);
        addNotification(errorMessage, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (successData?.password) {
      navigator.clipboard.writeText(successData.password);
      addNotification(es.passwordCopied, 'info');
    }
  };
  
  const resetFormForNextUser = () => {
    setEmail('');
    // Optionally keep client info for faster entry
    // setClientId(''); 
    // setClientName('');
    setError('');
    setSuccessData(null);
    setPasswordDelivered(false);
    // Use a short timeout to ensure the input is visible before focusing
    setTimeout(() => emailInputRef.current?.focus(), 50);
  };

  // Render Success View
  if (successData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4">
          <h2 className="text-lg font-medium text-gray-900">{es.createUserTitle}</h2>
          
          {successData.email_sent ? (
            <div className="text-center py-4">
                <p className="text-sm text-gray-600">Se envió un email con los detalles de la cuenta a <span className="font-medium text-gray-800">{successData.email}</span>.</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600">No se pudo enviar el email. Comparte esta contraseña temporal con <span className="font-medium text-gray-800">{successData.email}</span>:</p>
              
              {!passwordDelivered && (
                <div className="mt-2 p-3 bg-slate-100 rounded-md flex items-center justify-between">
                  <span className="font-mono text-lg tracking-wider font-bold">{successData.password}</span>
                  <button onClick={handleCopyPassword} className="bg-primary-100 text-primary-700 py-1 px-3 rounded-md text-sm font-medium hover:bg-primary-200">{es.copyPassword}</button>
                </div>
              )}
              
              <div className="mt-4 flex items-center">
                <input
                    id="delivered"
                    type="checkbox"
                    checked={passwordDelivered}
                    onChange={() => setPasswordDelivered(!passwordDelivered)}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="delivered" className="ml-2 block text-sm text-gray-900">
                    Marcar como entregada
                </label>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button onClick={resetFormForNextUser} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Crear otro</button>
            <button onClick={() => setIsOpen(false)} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">{es.closeModal}</button>
          </div>
        </div>
      </div>
    );
  }

  // Render Form View
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-medium text-gray-900">{es.createUserTitle}</h2>
        <p className="mt-1 text-sm text-gray-600">{es.createUserDescription}</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">{es.colEmail}</label>
            <input ref={emailInputRef} type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="usuario@ejemplo.com" />
          </div>
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">{es.formClientId}</label>
            <input type="text" id="clientId" value={clientId} onChange={(e) => setClientId(e.target.value.toUpperCase())} required placeholder={es.formClientIdPlaceholder} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">{es.formClientName}</label>
            <input type="text" id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} required placeholder={es.formClientNamePlaceholder} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsOpen(false)} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">{es.cancel}</button>
            <button type="submit" disabled={isLoading} className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed">
               {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              {isLoading ? es.creating : es.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
