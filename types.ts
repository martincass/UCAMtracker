

export enum Shift {
  Morning = 'Morning',
  Afternoon = 'Afternoon',
  Night = 'Night',
}

export interface Photo {
  path: string;
  url: string;
}

export interface Submission {
  id: string;
  part_id: string;
  client_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  plant: string;
  shift: Shift;
  product: string;
  produced_qty: number;
  scrap_qty: number;
  notes: string;
  photos: Photo[];
  created_at: string; // ISO 8601
  created_by: string;
  status: 'received' | 'processing' | 'completed';
}

export interface AllowlistClient {
  id: string;
  email: string;
  client_id: string;
  client_name: string;
  active: boolean;
  created_at?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'client' | 'admin';
  clientId: string;
  clientName: string;
  last_sign_in_at?: string;
  created_at?: string;
  must_change_password?: boolean;
  email_confirmed_at?: string; 
}

export type UserStatus = 'ACTIVE' | 'INVITED' | 'CONFIRMATION_SENT' | 'INACTIVE' | 'PENDING_RESET';

// For the admin panel to display a richer user object
export interface ManagedUser extends User {
    active_on_allowlist: boolean;
    status: UserStatus;
}

export type View = 'login' | 'signup' | 'dashboard' | 'admin' | 'forgot-password' | 'reset-password' | 'force-reset-password' | 'request-access';

export interface ToastNotification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface AdminAuditLog {
    id: string;
    actor_user_id: string;
    action: string;
    target_email: string | null;
    payload: Record<string, any>;
    created_at: string;
}

export interface AccessRequest {
    id: string;
    email: string;
    company: string;
    client_id?: string;
    note: string;
    created_at: string;
    status: 'pending' | 'approved' | 'denied';
}

export interface SystemHealth {
    siteUrl: { status: 'ok' | 'error', message: string };
    supabaseRedirects: { status: 'ok' | 'error', message: string };
    smtp: { status: 'ok' | 'warn', message: string };
}
