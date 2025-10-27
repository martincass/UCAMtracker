import React from 'react';
import { AccessRequest } from '../../types';
import { apiService } from '../../services/apiService';

interface RequestsTabProps {
  requests: AccessRequest[];
  setRequests: React.Dispatch<React.SetStateAction<AccessRequest[]>>;
  isLoading: boolean;
  error: string | null;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const RequestsTab: React.FC<RequestsTabProps> = ({ requests, setRequests, isLoading, error, addNotification }) => {
    
  const handleRequest = async (requestId: string, approve: boolean) => {
    try {
        // FIX: Call the correct adminHandleAccessRequest method
        await apiService.adminHandleAccessRequest(requestId, approve);
        setRequests(prev => prev.filter(r => r.id !== requestId));
        addNotification(`La solicitud ha sido ${approve ? 'aprobada' : 'denegada'}.`, 'success');
    } catch(err: any) {
        addNotification(err.message, 'error');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-slate-800 mb-4">Solicitudes de Acceso Pendientes</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correo</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nota</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enviado</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center p-6 text-gray-500">Cargando solicitudes...</td></tr>
            ) : error ? (
              <tr><td colSpan={5} className="text-center p-6 text-red-500">{error}</td></tr>
            ) : requests.length > 0 ? (
              requests.map(req => (
                <tr key={req.id} className="even:bg-white odd:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{req.email}</td>
                  <td className="px-4 py-3 text-gray-500">{req.company} {req.client_id && `(${req.client_id})`}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-sm truncate">{req.note}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(req.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-medium space-x-2">
                     <button onClick={() => handleRequest(req.id, true)} className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Aprobar</button>
                     <button onClick={() => handleRequest(req.id, false)} className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Denegar</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="text-center p-6 text-gray-500">No hay solicitudes de acceso pendientes.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequestsTab;