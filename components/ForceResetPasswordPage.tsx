import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { View, User } from '../types';
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from './Icons';
import { es } from '../locale/es';

interface ForceResetPasswordPageProps {
  setView: (view: View) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  onResetSuccess: (user: User) => void;
}

const PasswordStrengthIndicator: React.FC<{ password?: string }> = ({ password = '' }) => {
    const checks = [
        { regex: /.{8,}/, message: "Al menos 8 caracteres" },
        { regex: /[A-Z]/, message: "Una letra mayúscula" },
        { regex: /[a-z]/, message: "Una letra minúscula" },
        { regex: /\d/, message: "Un número" },
    ];

    return (
        <ul className="text-xs text-gray-500 space-y-1 mt-2">
            {checks.map((check, index) => (
                <li key={index} className={`flex items-center ${check.regex.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {check.regex.test(password) ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        )}
                    </svg>
                    {check.message}
                </li>
            ))}
        </ul>
    );
};


const ForceResetPasswordPage: React.FC<ForceResetPasswordPageProps> = ({ setView, addNotification, onResetSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if somehow the user gets here without a session
  useEffect(() => {
    apiService.getSession().then(user => {
        if (!user) {
            setView('login');
        }
    });
  }, [setView]);


  const validatePassword = () => {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/\d/.test(password)) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    
    if (!validatePassword()) {
        setError('La contraseña no cumple con los requisitos de seguridad.');
        return;
    }

    setIsLoading(true);
    try {
        const updatedUser = await apiService.forceResetPassword(password);
        addNotification(es.forceResetSuccess, 'success');
        onResetSuccess(updatedUser); // This is the key change to break the loop
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
      addNotification(err.message || 'Error al restablecer la contraseña.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const pageTitle = es.forceResetTitle;
  const pageDescription = es.forceResetDescription;

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">{pageTitle}</h2>
          <p className="mt-2 text-center text-sm text-gray-600">{pageDescription}</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
             <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password" name="password" type={showPassword ? 'text' : 'password'}
                required
                className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Nueva Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <PasswordStrengthIndicator password={password} />
             <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirm-password" name="confirm-password" type={showPassword ? 'text' : 'password'}
                required
                className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Confirmar Nueva Contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
            >
              {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForceResetPasswordPage;
