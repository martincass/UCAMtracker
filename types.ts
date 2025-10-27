// types.ts

// User object for authenticated users
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  client_id: string;
  client_name: string;
  mustResetPassword?: boolean;
}

// Defines the current view/page in the application
export type View =
  | 'login'
  | 'signup'
  | 'dashboard'
  | 'admin-dashboard'
  | 'forgot-password'
  | 'reset-password'
  | 'request-access'
  | 'force-reset-password';

// For toast notifications
export interface ToastNotification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Status for the signup process
export type SignupStatus = 'idle' | 'PENDING_REVIEW' | 'CONFIRMATION_SENT';

// Extended user object for admin management
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

// Response from the admin_create_user edge function
export interface CreateUserResponse {
  ok: boolean;
  user_id: string;
  email: string;
  client_id: string;
  client_name: string;
  email_sent: boolean;
  email_error?: string;
  password?: string;
}

// Represents a client in the allowlist
export interface AllowlistClient {
  id: string;
  email: string;
  client_id: string;
  client_name: string;
  active: boolean;
}

// Represents a user's request for access
export interface AccessRequest {
  id: string;
  email: string;
  company: string;
  client_id: string | null;
  note: string;
  created_at: string;
}

// Represents the system health check results
export interface SystemHealth {
  siteUrl: { status: 'ok' | 'warn' | 'error'; message: string };
  supabaseRedirects: { status: 'ok' | 'warn' | 'error'; message: string };
  smtp: { status: 'ok' | 'warn' | 'error'; message: string };
}

// Represents a single production submission record, matching the new `submissions_view`
export interface Submission {
  id: string;
  user_id: string;
  client_id: string;
  client_name: string;
  email: string;
  date: string;
  plant: string;
  part_id: string;
  weighing_kg: number;
  notes: string | null;
  ingress_photo_url: string | null;
  weighing_photo_url: string | null;
  status: 'pendiente' | 'validado' | 'rechazado';
  created_at: string;
}
