import React, { useState } from 'react';
import { User } from '../types';
import SubmissionForm from './SubmissionForm';
import ClientReportsTable from './ClientReportsTable'; 

interface DashboardProps {
  user: User;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, addNotification }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSubmissionSuccess = () => {
    // This will trigger a refetch in the ClientReportsTable component
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <div className="space-y-6">
      <SubmissionForm 
        user={user} 
        addNotification={addNotification} 
        onSubmissionSuccess={handleSubmissionSuccess} 
      />
      <ClientReportsTable 
        addNotification={addNotification} 
        refreshKey={refreshKey}
      />
    </div>
  );
};

export default Dashboard;
