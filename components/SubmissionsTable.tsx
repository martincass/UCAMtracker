import React, { useState } from 'react';
import { Submission } from '../types';
import { apiService } from '../services/apiService';
import { es } from '../locale/es';
import { exportToCsv } from '../utils/csvExporter';
import { DocumentTextIcon } from './Icons';

interface SubmissionsTableProps {
  submissions: Submission[];
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
  isLoading: boolean;
  error: string | null;
  userRole: 'admin' | 'user';
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const StatusBadge: React.FC<{ status: Submission['status'] }> = ({ status }) => {
  const statusMap = {
    pendiente: { text: es.statusPending, color: 'bg-yellow-100 text-yellow-800' },
    validado: { text: es.statusValidated, color: 'bg-green-100 text-green-800' },
    rechazado: { text: es.statusRejected, color: 'bg-red-100 text-red-800' },
  };
  const { text, color } = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
  return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>{text}</span>;
};

const PhotoThumbnail: React.FC<{ url: string | null }> = ({ url }) => {
  if (!url) return <span className="text-gray-400">&mdash;</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <img src={url} alt="Evidencia" className="h-12 w-12 object-cover rounded-md" />
    </a>
  );
};

const SubmissionsTable: React.FC<SubmissionsTableProps> = ({ submissions, setSubmissions, isLoading, error, userRole, addNotification }) => {
  
  const handleExport = () => {
    const headers: (keyof Submission)[] = ['created_at', 'client_name', 'email', 'weighing_kg', 'status', 'id'];
    exportToCsv(`submissions_${new Date().toISOString().split('T')[0]}.csv`, submissions, headers);
  };
  
  const handleStatusChange = async (id: string, newStatus: Submission['status']) => {
    const originalSubmissions = [...submissions];
    // Optimistic update
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));

    try {
        await apiService.updateSubmissionStatus(id, newStatus);
        addNotification(`Estado del reporte ${id.substring(0,8)}... actualizado.`, 'success');
    } catch (err: any) {
        addNotification(`Error al actualizar estado: ${err.message}`, 'error');
        // Revert on error
        setSubmissions(originalSubmissions);
    }
  };

  const numberFormatter = new Intl.NumberFormat('es-AR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="sm:flex sm:justify-between sm:items-center mb-4">
        <h3 className="text-xl font-semibold text-slate-800">{es.submissionHistoryTitle}</h3>
        {userRole === 'admin' && submissions.length > 0 && (
            <button onClick={handleExport} className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
              <DocumentTextIcon className="-ml-1 mr-2 h-5 w-5" />
              {es.exportCsv}
            </button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{es.colDate}</th>
              {userRole === 'admin' && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{es.colClient}</th>}
              {userRole === 'admin' && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{es.colUser}</th>}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{es.colIngressPhoto}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{es.colWeighingKg}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{es.colWeighingPhoto}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{es.colReportId}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{es.colStatus}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center p-6 text-gray-500">{es.loadingHistory}</td></tr>
            ) : error ? (
              <tr><td colSpan={8} className="text-center p-6 text-red-500">{error}</td></tr>
            ) : submissions.length > 0 ? (
              submissions.map(s => (
                <tr key={s.id} className="even:bg-white odd:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(s.created_at).toLocaleString('es-AR')}</td>
                  {userRole === 'admin' && <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.client_name}</td>}
                  {userRole === 'admin' && <td className="px-4 py-3 text-sm text-gray-600">{s.email}</td>}
                  <td className="px-4 py-3"><PhotoThumbnail url={s.ingress_photo_url} /></td>
                  <td className="px-4 py-3 text-right text-sm font-mono text-gray-800">{numberFormatter.format(s.weighing_kg || 0)}</td>
                  <td className="px-4 py-3"><PhotoThumbnail url={s.weighing_photo_url} /></td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">{s.id.substring(0, 8)}...</td>
                  <td className="px-4 py-3">
                    {userRole === 'admin' ? (
                      <select
                        value={s.status}
                        onChange={(e) => handleStatusChange(s.id, e.target.value as Submission['status'])}
                        className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-xs"
                      >
                        <option value="pendiente">{es.statusPending}</option>
                        <option value="validado">{es.statusValidated}</option>
                        <option value="rechazado">{es.statusRejected}</option>
                      </select>
                    ) : (
                      <StatusBadge status={s.status} />
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8} className="text-center p-6 text-gray-500">{es.noSubmissionsFound}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubmissionsTable;
