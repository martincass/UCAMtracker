import React, { useState, useEffect, useCallback } from 'react';
import { User, Submission } from '../types';
import { apiService } from '../services/apiService';
import SubmissionForm from './SubmissionForm';
import SubmissionsTable from './SubmissionsTable';
import { es } from '../locale/es';

interface DashboardProps {
  user: User;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, addNotification }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getClientSubmissions();
      setSubmissions(data);
    } catch (err: any) {
      setError(err.message);
      addNotification(es.fetchSubmissionsError, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);
  
  const handleSubmissionSuccess = (newSubmission: Submission) => {
    setSubmissions(prev => [newSubmission, ...prev]);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Panel de Cliente: {user.client_name}</h2>
      <SubmissionForm user={user} addNotification={addNotification} onSubmissionSuccess={handleSubmissionSuccess} />
      <SubmissionsTable 
        submissions={submissions}
        setSubmissions={setSubmissions}
        isLoading={isLoading}
        error={error}
        userRole="user"
        addNotification={addNotification}
      />
    </div>
  );
};

export default Dashboard;
