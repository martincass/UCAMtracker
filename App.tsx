import React, { useState, useEffect, useCallback } from 'react';
import { User, View, ToastNotification } from './types';
import { apiService } from './services/apiService';

import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import ForceResetPasswordPage from './components/ForceResetPasswordPage';
import RequestAccessPage from './components/RequestAccessPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import Header from './components/Header';
import ToastContainer from './components/ToastContainer';
import DebugPanel from './components/DebugPanel';
import { es } from './locale/es';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('login');
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const newNotification: ToastNotification = {
      id: Date.now(),
      message,
      type,
    };
    setNotifications(prev => [...prev, newNotification]);
  }, []);
  
  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleLogout = useCallback(async () => {
    await apiService.logout();
    setUser(null);
    setView('login');
  }, []);
  
  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    if (loggedInUser.must_reset_password) {
      setView('force-reset-password');
    } else if (loggedInUser.role === 'admin') {
      setView('admin-dashboard');
    } else {
      setView('dashboard');
    }
  };

  const handleForceResetSuccess = (updatedUser: User) => {
    // Re-evaluate the view based on the now-updated user object
    setUser(updatedUser);
    if (updatedUser.role === 'admin') {
      setView('admin-dashboard');
    } else {
      setView('dashboard');
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionUser = await apiService.getSession();
        if (sessionUser) {
          handleLoginSuccess(sessionUser);
        } else {
          // Handle deep links for password reset
          const hash = window.location.hash;
          if (hash.includes('type=recovery')) {
              setView('reset-password');
          } else {
              setView('login');
          }
        }
      } catch (err: any) {
        addNotification(err.message || es.errorUnexpected, 'error');
        setView('login');
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, [addNotification]);
  
  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-screen"><p>Cargando...</p></div>;
    }
    
    switch (view) {
        case 'signup':
            return <SignupPage setView={setView} addNotification={addNotification} />;
        case 'forgot-password':
            return <ForgotPasswordPage setView={setView} addNotification={addNotification} />;
        case 'reset-password':
            return <ResetPasswordPage setView={setView} addNotification={addNotification} />;
        case 'request-access':
            return <RequestAccessPage setView={setView} addNotification={addNotification} />;
        
        case 'dashboard':
            return user ? <Dashboard user={user} addNotification={addNotification} /> : <LoginPage onLogin={handleLoginSuccess} addNotification={addNotification} />;
        case 'admin-dashboard':
            return user && user.role === 'admin' ? <AdminDashboard user={user} addNotification={addNotification} /> : <LoginPage onLogin={handleLoginSuccess} addNotification={addNotification} />;
        case 'force-reset-password':
            return user ? <ForceResetPasswordPage setView={setView} addNotification={addNotification} onResetSuccess={handleForceResetSuccess} /> : <LoginPage onLogin={handleLoginSuccess} addNotification={addNotification} />;

        case 'login':
        default:
            return <LoginPage onLogin={handleLoginSuccess} addNotification={addNotification} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header user={user} onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
      <ToastContainer notifications={notifications} removeNotification={removeNotification} />
      {process.env.NODE_ENV === 'development' && <DebugPanel user={user} view={view} setView={setView} setUser={setUser} />}
    </div>
  );
};

export default App;
