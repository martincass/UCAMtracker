import React, { useState } from 'react';
import { apiService } from '../../services/apiService';

interface InviteUserModalProps {
  setIsOpen: (isOpen: boolean) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  onInviteSuccess: () => void;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({ setIsOpen, addNotification, onInviteSuccess }) => {
  const [email, setEmail] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !clientId || !clientName) {
        setError('Todos los campos son requeridos.');
        setIsLoading(false);
        return;
    }

    try {
      // FIX: Call the correct adminInviteUser method
      await apiService.adminInviteUser(email, clientId, clientName);
      addNotification(`Invitación enviada a ${email}. Ahora pueden registrarse.`, 'success');
      onInviteSuccess();
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message);
      addNotification(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-medium text-gray-900">Invitar Nuevo Usuario</h2>
        <p className="mt-1 text-sm text-gray-600">
          Esto agregará al usuario a la lista blanca, permitiéndole registrar una cuenta.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Dirección de Correo</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="usuario@ejemplo.com"
            />
          </div>
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">ID de Cliente</label>
            <input
              type="text"
              id="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value.toUpperCase())}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="e.g., ACME"
            />
          </div>
          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Nombre de Cliente</label>
            <input
              type="text"
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="e.g., Acme Inc."
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
            >
              {isLoading ? 'Enviando...' : 'Enviar Invitación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteUserModal;