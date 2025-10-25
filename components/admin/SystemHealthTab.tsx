import React from 'react';
import { SystemHealth } from '../../types';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '../Icons';

interface SystemHealthTabProps {
  health: SystemHealth | null;
  isLoading: boolean;
  error: string | null;
}

const SystemHealthTab: React.FC<SystemHealthTabProps> = ({ health, isLoading, error }) => {

  const HealthCheckItem: React.FC<{
      title: string;
      status: 'ok' | 'warn' | 'error';
      message: string;
  }> = ({ title, status, message }) => {
      const iconMap = {
          ok: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
          warn: <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />,
          error: <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />,
      };
      const colorMap = {
          ok: 'border-green-300',
          warn: 'border-yellow-300',
          error: 'border-red-300',
      }

      return (
          <li className={`flex items-start p-4 border-l-4 rounded ${colorMap[status]} bg-slate-50`}>
              <div className="flex-shrink-0">{iconMap[status]}</div>
              <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800">{title}</p>
                  <p className="text-sm text-gray-600">{message}</p>
              </div>
          </li>
      )
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-slate-800 mb-4">System Health Check</h3>
      {isLoading ? (
        <p className="text-gray-500">Running health checks...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : health ? (
        <ul className="space-y-4">
            <HealthCheckItem title="Site URL Configuration" status={health.siteUrl.status} message={health.siteUrl.message} />
            <HealthCheckItem title="Supabase Auth Redirects" status={health.supabaseRedirects.status} message={health.supabaseRedirects.message} />
            <HealthCheckItem title="SMTP Service" status={health.smtp.status} message={health.smtp.message} />
        </ul>
      ) : (
        <p className="text-gray-500">Could not retrieve system health information.</p>
      )}
    </div>
  );
};

export default SystemHealthTab;
