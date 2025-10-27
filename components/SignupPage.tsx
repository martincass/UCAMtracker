import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import { View } from '../types';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, EnvelopeIcon } from './Icons';

interface SignupPageProps {
  setView: (view: View) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

// FIX: Updated SignupStatus type to match the API response casing.
type SignupStatus = 'idle' | 'PENDING_REVIEW' | 'CONFIRMATION_SENT';

const SignupPage: React.FC<SignupPageProps> = ({ setView, addNotification }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupStatus, setSignupStatus] = useState<SignupStatus>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await apiService.signup(email, password);
      setSignupStatus(result.status);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during signup.');
      addNotification(err.message || 'Signup failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // FIX: Updated conditional check to match the new uppercase status type.
  if (signupStatus === 'CONFIRMATION_SENT') {
    return (
        <div className="flex items-center justify-center">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg text-center">
                 <h2 className="text-2xl font-bold text-gray-900">Revisa tu correo</h2>
                 <p className="text-gray-600">
                    Hemos enviado un enlace de confirmación a <span className="font-medium text-gray-800">{email}</span>. Por favor, haz clic en el enlace para activar tu cuenta.
                 </p>
                 <button onClick={() => setView('login')} className="font-medium text-primary-600 hover:text-primary-500">
                    &larr; Volver al inicio de sesión
                 </button>
            </div>
        </div>
    );
  }
  
  // FIX: Updated conditional check to match the new uppercase status type.
  if (signupStatus === 'PENDING_REVIEW') {
      return (
        <div className="flex items-center justify-center">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg text-center">
                 <h2 className="text-2xl font-bold text-gray-900">Registro Restringido</h2>
                 <p className="text-gray-600">
                    Tu correo <span className="font-medium text-gray-800">{email}</span> aún no está en la lista de acceso. Por favor, contacta a tu administrador o solicita acceso.
                 </p>
                 <div className="flex justify-center space-x-4">
                    <button onClick={() => setView('login')} className="font-medium text-slate-600 hover:text-slate-500">
                        &larr; Volver al inicio de sesión
                    </button>
                    <button onClick={() => setView('request-access')} className="font-medium text-primary-600 hover:text-primary-500">
                        Solicitar Acceso &rarr;
                    </button>
                 </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Crear una cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <button onClick={() => setView('login')} className="font-medium text-primary-600 hover:text-primary-500">
              Iniciar sesión
            </button>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
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
                    className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="Dirección de correo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                 />
             </div>
            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <LockClosedIcon className="h-5 w-5 text-gray-400" />
               </div>
               <input
                 id="password"
                 name="password"
                 type={showPassword ? 'text' : 'password'}
                 autoComplete="new-password"
                 required
                 className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                 placeholder="Contraseña"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
               />
               <button
                 type="button"
                 className="absolute inset-y-0 right-0 pr-3 flex items-center"
                 onClick={() => setShowPassword(!showPassword)}
               >
                 {showPassword ? <EyeSlashIcon className="h-5 w-5 text-gray-500" /> : <EyeIcon className="h-5 w-5 text-gray-500" />}
               </button>
             </div>
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creando cuenta...' : 'Registrarse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;