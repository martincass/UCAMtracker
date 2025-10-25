
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
        addNotification("Please confirm you are not a robot.", "error");
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
                 <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
                 <p className="text-gray-600">
                    If an account exists for <span className="font-medium text-gray-800">{email}</span>, you will receive an email with instructions on how to reset your password.
                 </p>
                 <button onClick={() => setView('login')} className="font-medium text-primary-600 hover:text-primary-500">
                    &larr; Back to login
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
            Forgot Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email and we'll send you a link to get back into your account.
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
               placeholder="Email address"
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
                    I am not a robot (placeholder for hCaptcha)
                </label>
            </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !isBotProtected}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
            >
              {isLoading ? 'Sending...' : 'Send Recovery Email'}
            </button>
          </div>
           <p className="mt-4 text-center text-sm">
             <button onClick={() => setView('login')} className="font-medium text-primary-600 hover:text-primary-500">
               &larr; Back to login
             </button>
           </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
