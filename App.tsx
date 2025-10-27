import React, { useState, useEffect, useCallback } from 'react';
import { User, View, ToastNotification } from './types';
import { apiService } from './services/apiService';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import RequestAccessPage from './components/RequestAccessPage';
import ForceResetPasswordPage from './components/ForceResetPasswordPage';
import ToastContainer from './components/ToastContainer';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('login');
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const newNotification = { id: Date.now(), message, type };
    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await apiService.getSession();
        if (currentUser) {
          handleLogin(currentUser);
        }
      } catch (error: any) {
        addNotification(error.message, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = apiService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setView('login');
      } else if (event === 'PASSWORD_RECOVERY') {
        setView('reset-password');
      } else if (event === 'SIGNED_IN' && session) {
        const currentUser = apiService.mapSupabaseUserToUser(session.user);
        if (currentUser) {
          handleLogin(currentUser);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [addNotification]);
  
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    if (loggedInUser.mustResetPassword) {
      setView('force-reset-password');
    } else if (loggedInUser.role === 'admin') {
      setView('admin-dashboard');
    } else {
      setView('dashboard');
    }
  };

  const handleLogout = async () => {
    await apiService.logout();
    setUser(null);
    setView('login');
    addNotification('Has cerrado sesión.', 'info');
  };

  const renderView = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center h-screen">Cargando...</div>;
    }

    if (user) {
      switch(view) {
        case 'dashboard':
          return <Dashboard user={user} addNotification={addNotification} />;
        case 'admin-dashboard':
          return <AdminDashboard user={user} addNotification={addNotification} />;
        case 'force-reset-password':
          return <ForceResetPasswordPage setView={setView} addNotification={addNotification} onResetSuccess={handleLogin} />;
        default:
           // Fallback to dashboard if user is logged in but view is something else
           return <Dashboard user={user} addNotification={addNotification} />;
      }
    } else {
      switch(view) {
        case 'login':
          return <LoginPage onLogin={handleLogin} addNotification={addNotification} />;
        case 'signup':
          return <SignupPage setView={setView} addNotification={addNotification} />;
        case 'forgot-password':
            return <ForgotPasswordPage setView={setView} addNotification={addNotification} />;
        case 'reset-password':
            return <ResetPasswordPage setView={setView} addNotification={addNotification} />;
        case 'request-access':
            return <RequestAccessPage setView={setView} addNotification={addNotification} />;
        default:
          return <LoginPage onLogin={handleLogin} addNotification={addNotification} />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header user={user} onLogout={handleLogout} />
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        {renderView()}
      </main>
      <ToastContainer notifications={notifications} removeNotification={removeNotification} />
    </div>
  );
};

export default App;
