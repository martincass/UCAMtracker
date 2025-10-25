import React, { useState, useEffect, useCallback } from 'react';
import { User, View, ToastNotification } from './types';
import { apiService } from './services/apiService';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import Header from './components/Header';
import ToastContainer from './components/ToastContainer';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import RequestAccessPage from './components/RequestAccessPage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('login');
  const [loading, setLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);

  useEffect(() => {
    // Supabase recovery links use a URL hash
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');
    const type = params.get('type');

    if (token && type === 'recovery') {
        setRecoveryToken(token);
        setView('reset-password');
        // Clean the URL
        window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }

    const checkSession = async () => {
      try {
        const sessionUser = await apiService.checkSession();
        if (sessionUser) {
          if (sessionUser.must_change_password) {
            setUser(sessionUser);
            setView('force-reset-password');
          } else {
            setUser(sessionUser);
            setView(sessionUser.role === 'admin' ? 'admin' : 'dashboard');
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    if (loggedInUser.must_change_password) {
      setView('force-reset-password');
      addNotification('Please update your password as required.', 'info');
    } else {
      setView(loggedInUser.role === 'admin' ? 'admin' : 'dashboard');
      addNotification('Login successful!', 'success');
    }
  };

  const handleLogout = async () => {
    await apiService.logout();
    setUser(null);
    setView('login');
    addNotification('You have been logged out.', 'info');
  };

  const renderContent = () => {
    if (!user) {
      switch (view) {
        case 'login':
          return <LoginPage onLogin={handleLogin} setView={setView} addNotification={addNotification} />;
        case 'signup':
          return <SignupPage setView={setView} addNotification={addNotification} />;
        case 'request-access':
          return <RequestAccessPage setView={setView} addNotification={addNotification} />;
        case 'forgot-password':
          return <ForgotPasswordPage setView={setView} addNotification={addNotification} />;
        case 'reset-password':
          return <ResetPasswordPage mode="recovery" token={recoveryToken} setView={setView} addNotification={addNotification} />;
        default:
          return <LoginPage onLogin={handleLogin} setView={setView} addNotification={addNotification} />;
      }
    } else {
       switch (view) {
        case 'dashboard':
          return <Dashboard user={user} addNotification={addNotification} />;
        case 'admin':
          return <AdminDashboard user={user} addNotification={addNotification} />;
        case 'force-reset-password':
          return <ResetPasswordPage mode="force" onLogout={handleLogout} addNotification={addNotification} setView={setView} />;
        default:
          return <Dashboard user={user} addNotification={addNotification} />;
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-xl font-semibold text-slate-700">Loading Application...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <Header user={user} onLogout={handleLogout} />
      <main className="p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
      <ToastContainer notifications={notifications} removeNotification={removeNotification} />
    </div>
  );
};

export default App;