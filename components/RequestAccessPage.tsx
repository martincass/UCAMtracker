import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import { View } from '../types';

interface RequestAccessPageProps {
  setView: (view: View) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const RequestAccessPage: React.FC<RequestAccessPageProps> = ({ setView, addNotification }) => {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [clientId, setClientId] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiService.requestAccess({ email, company, client_id: clientId, note });
      setIsSubmitted(true);
    } catch (err: any) {
      addNotification(err.message || 'Error al enviar la solicitud.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isSubmitted) {
    return (
        <div className="flex items-center justify-center">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg text-center">
                 <h2 className="text-2xl font-bold text-gray-900">Solicitud Enviada</h2>
                 <p className="text-gray-600">
                    Gracias. Tu solicitud de acceso ha sido enviada al administrador para su revisión.
                 </p>
                 <button onClick={() => setView('login')} className="font-medium text-primary-600 hover:text-primary-500">
                    &larr; Volver al inicio de sesión
                 </button>
            </div>
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Solicitar Acceso
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Completa el siguiente formulario para solicitar acceso a un administrador.
          </p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Tu Correo</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                <input type="text" id="company" value={company} onChange={(e) => setCompany(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
             <div>
                <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">ID de Cliente (si lo conoces)</label>
                <input type="text" id="clientId" value={clientId} onChange={(e) => setClientId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
             <div>
                <label htmlFor="note" className="block text-sm font-medium text-gray-700">Mensaje</label>
                <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" placeholder="Por favor, proporciona una breve razón para tu solicitud de acceso."></textarea>
            </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
            >
              {isLoading ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
           <p className="mt-4 text-center text-sm">
             <button onClick={() => setView('login')} className="font-medium text-primary-600 hover:text-primary-500">
               &larr; Volver al inicio de sesión
             </button>
           </p>
        </form>
      </div>
    </div>
  );
};

export default RequestAccessPage;