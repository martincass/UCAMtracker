import React, { useState, useEffect, useCallback } from 'react';
import { Submission } from '../types';
import { apiService } from '../services/apiService';
import SubmissionsTable from './SubmissionsTable';

interface ClientReportsTableProps {
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  refreshKey: number;
}

const ClientReportsTable: React.FC<ClientReportsTableProps> = ({ addNotification, refreshKey }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.clientGetSubmissions();
      setSubmissions(data);
    } catch (err: any) {
      const errorMessage = `Error al cargar reportes: ${err.message}`;
      setError(errorMessage);
      addNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchSubmissions();
  }, [refreshKey, fetchSubmissions]);

  return (
    <SubmissionsTable 
      submissions={submissions}
      isLoading={isLoading}
      error={error}
      isAdmin={false}
      refetchSubmissions={fetchSubmissions}
      addNotification={addNotification}
    />
  );
};

export default ClientReportsTable;
