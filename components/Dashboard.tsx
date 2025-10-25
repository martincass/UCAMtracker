
import React, { useState, useEffect, useCallback } from 'react';
import { User, Submission } from '../types';
import { apiService } from '../services/apiService';
import SubmissionForm from './SubmissionForm';
import SubmissionsTable from './SubmissionsTable';

interface DashboardProps {
  user: User;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, addNotification }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getSubmissions(user);
      setSubmissions(data);
    } catch (err) {
      setError('Failed to fetch submission history.');
      addNotification('Failed to fetch submission history.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user, addNotification]);
  
  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleNewSubmission = (newSubmission: Submission) => {
    setSubmissions(prev => [newSubmission, ...prev]);
    addNotification('Submission successfully created!', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Welcome, {user.clientName}</h1>
        <p className="text-slate-600 mt-1">Submit new production data and view your history.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <SubmissionForm user={user} onSubmissionSuccess={handleNewSubmission} addNotification={addNotification} />
        </div>
        <div className="lg:col-span-2">
            <SubmissionsTable 
                submissions={submissions}
                isLoading={isLoading}
                error={error}
                isAdminView={false}
            />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
