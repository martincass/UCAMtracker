// types.ts

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  client_id: string;
  client_name: string;
  must_reset_password: boolean;
}

export type View =
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'reset-password'
  | 'force-reset-password'
  | 'request-access'
  | 'dashboard'
  | 'admin-dashboard';

export interface ToastNotification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface Submission {
  reporte_id: string;
  fecha: string; // YYYY-MM-DD
  pesaje_kg: number;
  notas?: string | null;
  foto_ingreso?: string;
  foto_pesaje?: string;
  estado?: 'pendiente' | 'validado' | 'rechazado';
  cliente?: string;
  usuario?: string;
}

export interface ManagedUser {
    id: string;
    email: string;
    role: 'admin' | 'user';
    client_id: string;
    client_name: string;
    status: 'active' | 'inactive' | 'pending_reset';
    last_sign_in_at: string | null;
    created_at: string;
    is_confirmed: boolean;
}

export interface AllowlistClient {
    id: string;
    email: string;
    client_id: string;
    client_name: string;
    active: boolean;
}

export interface CreateUserResponse {
    ok: boolean;
    user_id: string;
    email: string;
    client_id: string;
    client_name: string;
    password?: string;
    email_sent: boolean;
    email_error?: string;
}

export interface AccessRequest {
    id: string;
    email: string;
    company: string;
    client_id: string;
    note: string;
    created_at: string;
}

export interface HealthCheck {
    status: 'ok' | 'warn' | 'error';
    message: string;
}

export interface SystemHealth {
    siteUrl: HealthCheck;
    supabaseRedirects: HealthCheck;
    smtp: HealthCheck;
}
