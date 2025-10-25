
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { View } from '../types';
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from './Icons';

interface ResetPasswordPageProps {
  mode: 'recovery' | 'force';
  token?: string | null;
  setView: (view: View) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  onLogout?: () => void; // Only used in 'force' mode
}

const PasswordStrengthIndicator: React.FC<{ password?: string }> = ({ password = '' }) => {
    const checks = [
        { regex: /.{8,}/, message: "At least 8 characters" },
        { regex: /[A-Z]/, message: "An uppercase letter" },
        { regex: /[a-z]/, message: "A lowercase letter" },
        { regex: /\d/, message: "A number" },
        { regex: /[^A-Za-z0-9]/, message: "A special character" },
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


const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ mode, token, setView, addNotification, onLogout }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (mode === 'recovery' && !token) {
      setError("Invalid or missing recovery token. Please request a new link.");
      addNotification("Invalid recovery link. Please try again.", 'error');
    }
  }, [mode, token, addNotification]);

  const validatePassword = () => {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/\d/.test(password)) return false;
    if (!/[^A-Za-z0-9]/.test(password)) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (!validatePassword()) {
        setError('Password does not meet the strength requirements.');
        return;
    }

    setIsLoading(true);
    try {
        if (mode === 'recovery') {
            if (!token) throw new Error("Missing recovery token.");
            await apiService.resetPassword(token, password);
            addNotification('Password successfully reset. Please log in with your new password.', 'success');
            setView('login');
        } else { // 'force' mode
            await apiService.forceResetPassword(password);
            addNotification('Password successfully updated. You have been logged out, please log in again.', 'success');
            onLogout?.();
        }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      addNotification(err.message || 'Failed to reset password.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const pageTitle = mode === 'recovery' ? 'Reset Your Password' : 'Update Your Password';
  const pageDescription = mode === 'recovery' ? 'Enter a new password for your account.' : 'As a security measure, you are required to update your password.';

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
                placeholder="New Password"
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
                placeholder="Confirm New Password"
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
              disabled={isLoading || (mode === 'recovery' && !token)}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
