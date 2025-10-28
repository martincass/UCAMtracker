import React, { useState } from 'react';
import { Submission } from '../types';
import { apiService } from '../services/apiService';
import { fmtDate, fmtKg } from '../utils/formatting';
import { es } from '../locale/es';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from './Icons';
import { exportToCsv } from '../utils/csvExporter';

interface SubmissionsTableProps {
  submissions: Submission[];
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  refetchSubmissions: () => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const SubmissionsTable: React.FC<SubmissionsTableProps> = ({ submissions, isLoading, error, isAdmin, refetchSubmissions, addNotification }) => {
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleStatusChange = async (submissionId: string, newStatus: 'validado' | 'rechazado' | 'pendiente') => {
    if (actionInProgress) return;
    setActionInProgress(submissionId);
    try {
      await apiService.updateSubmissionStatus(submissionId, newStatus);
      addNotification('Estado actualizado.', 'success');
      refetchSubmissions();
    } catch (err: any) {
      addNotification(err.message, 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleExportCsv = () => {
    const headers: (keyof Submission)[] = ['fecha', 'cliente', 'usuario', 'pesaje_kg', 'estado', 'notas', 'reporte_id', 'foto_ingreso', 'foto_pesaje'];
    exportToCsv(`reportes-${new Date().toISOString().split('T')[0]}.csv`, submissions, headers);
  };
  
  const handleExportToSheets = async () => {
    setIsExporting(true);
    try {
        const result = await apiService.exportToSheets();
        addNotification(`${result.appended} nuevas filas exportadas a Google Sheets.`, 'success');
    } catch(err: any) {
        addNotification(`Error al exportar: ${err.message}`, 'error');
    } finally {
        setIsExporting(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'validado':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{es.statusApproved}</span>;
      case 'rechazado':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">{es.statusRejected}</span>;
      case 'pendiente':
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">{es.statusPending}</span>;
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="sm:flex sm:justify-between sm:items-center mb-4">
        <h3 className="text-xl font-semibold text-slate-800">{isAdmin ? es.tabSubmissions : es.submissionsTitle}</h3>
        {isAdmin && (
            <div className="flex space-x-2 mt-2 sm:mt-0">
                <button onClick={handleExportCsv} className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">{es.exportCsv}</button>
                <button onClick={handleExportToSheets} disabled={isExporting} className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50">
                    {isExporting ? es.exporting : es.exportToSheets}
                </button>
            </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{es.colDate}</th>
              {isAdmin && <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{es.colClient}</th>}
              {isAdmin && <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{es.colUser}</th>}
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{es.formWeighingKg}</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fotos</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{es.colNotes}</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{es.colStatus}</th>
              {isAdmin && <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{es.colActions}</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={isAdmin ? 8 : 6} className="text-center p-6 text-gray-500">{es.loadingSubmissions}</td></tr>
            ) : error ? (
              <tr><td colSpan={isAdmin ? 8 : 6} className="text-center p-6 text-red-500">{error}</td></tr>
            ) : submissions.length > 0 ? (
              submissions.map(s => (
                <tr key={s.reporte_id} className="even:bg-white odd:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{fmtDate(s.fecha)}</td>
                  {isAdmin && <td className="px-4 py-3 text-gray-500">{s.cliente}</td>}
                  {isAdmin && <td className="px-4 py-3 text-gray-500">{s.usuario}</td>}
                  <td className="px-4 py-3 text-gray-500">{fmtKg(s.pesaje_kg)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                    {s.foto_ingreso && (
                      <a href={s.foto_ingreso} target="_blank" rel="noopener noreferrer" title={es.viewIngressPhoto}>
                        <img src={s.foto_ingreso} alt="Ingreso" className="h-12 w-12 object-cover inline-block rounded-md shadow-sm hover:shadow-md transition-shadow" />
                      </a>
                    )}
                    {s.foto_pesaje && (
                      <a href={s.foto_pesaje} target="_blank" rel="noopener noreferrer" title={es.viewWeighingPhoto}>
                        <img src={s.foto_pesaje} alt="Pesaje" className="h-12 w-12 object-cover inline-block rounded-md shadow-sm hover:shadow-md transition-shadow" />
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={s.notas || ''}>{s.notas || '—'}</td>
                  <td className="px-4 py-3">{getStatusBadge(s.estado)}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-sm font-medium">
                      {actionInProgress === s.reporte_id ? (
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      ) : (
                        <select
                          value={s.estado || 'pendiente'}
                          onChange={(e) => handleStatusChange(s.reporte_id, e.target.value as 'validado' | 'rechazado' | 'pendiente')}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="pendiente">{es.statusPending}</option>
                          <option value="validado">{es.statusApproved}</option>
                          <option value="rechazado">{es.statusRejected}</option>
                        </select>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr><td colSpan={isAdmin ? 8 : 6} className="text-center p-6 text-gray-500">{es.noSubmissionsFound}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubmissionsTable;