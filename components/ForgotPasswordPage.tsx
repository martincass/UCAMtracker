
import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import { View } from '../types';
import { EnvelopeIcon } from './Icons';

interface ForgotPasswordPageProps {
  setView: (view: View) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ setView, addNotification }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isBotProtected, setIsBotProtected] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBotProtected) {
        addNotification("Por favor, confirma que no eres un robot.", "error");
        return;
    }
    setIsLoading(true);
    try {
      await apiService.requestPasswordReset(email);
      // For security, we show the same message whether the user exists or not.
      setIsSubmitted(true);
    } catch (err: any) {
      // Even on failure, we don't want to leak information.
      // The user sees the success state. We log the real error internally.
      console.error("Password reset request failed:", err);
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isSubmitted) {
    return (
        <div className="flex items-center justify-center">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg text-center">
                 <h2 className="text-2xl font-bold text-gray-900">Revisa tu correo</h2>
                 <p className="text-gray-600">
                    Si existe una cuenta para <span className="font-medium text-gray-800">{email}</span>, recibirás un correo electrónico con instrucciones sobre cómo restablecer tu contraseña.
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
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            ¿Olvidaste tu contraseña?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa tu correo y te enviaremos un enlace para recuperar tu cuenta.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
             </div>
             <input
               id="email-address"
               name="email"
               type="email"
               autoComplete="email"
               required
               className="appearance-none rounded-md relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
               placeholder="Dirección de correo"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
             />
           </div>
           
           <div className="flex items-center">
                <input
                    id="bot-protection"
                    name="bot-protection"
                    type="checkbox"
                    checked={isBotProtected}
                    onChange={(e) => setIsBotProtected(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="bot-protection" className="ml-2 block text-sm text-gray-900">
                    No soy un robot (placeholder para hCaptcha)
                </label>
            </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !isBotProtected}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
            >
              {isLoading ? 'Enviando...' : 'Enviar correo de recuperación'}
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

export default ForgotPasswordPage;