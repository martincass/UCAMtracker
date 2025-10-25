import { supabase } from './supabaseClient';
import { AllowlistClient, Submission, User, Photo, ManagedUser, AdminAuditLog, AccessRequest, SystemHealth, UserStatus } from '../types';

/**
 * NOTE ON BACKEND ASSUMPTIONS:
 * This service layer assumes a Supabase backend has been set up with:
 * 1.  TABLES: `profiles`, `submissions`, `allowlist_clients`, `access_requests`.
 * 2.  RLS POLICIES: Row Level Security is enabled and policies are in place to
 *     protect data access (e.g., users can only see their own submissions,
 *     admins can see all data).
 * 3.  STORAGE: A storage bucket named 'submissions' exists and is configured with
 *     appropriate access policies for photo uploads.
 * 4.  RPC FUNCTIONS: For security, sensitive admin actions (like listing all users
 *     or changing roles) are handled by PostgreSQL functions exposed via RPC.
 *     - `get_managed_users()`: A function that joins `auth.users` and `allowlist_clients`
 *       to return a comprehensive user list.
 *     - `update_managed_user(user_id, updates)`: A SECURITY DEFINER function to
 *       safely update user roles, status, etc.
 * 5.  TRIGGERS: A trigger on `auth.users` that creates a corresponding public `profiles`
 *     entry for new users, pulling initial data from `allowlist_clients`.
 */

class ApiService {
  
  /**
   * Fetches the user's profile from the 'profiles' table.
   * This is a helper function to enrich the auth user with app-specific data.
   */
  private async getUserProfile(userId: string, userEmail: string): Promise<Omit<User, 'id' | 'email'>> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, client_id, client_name, must_change_password')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      throw new Error("Could not retrieve user profile.");
    }

    if (!profile) {
      throw new Error("User profile not found.");
    }
     // Final check: ensure user is still active on the allowlist
    const { data: allowlistEntry } = await supabase.from('allowlist_clients').select('active').eq('email', userEmail).single();
    if (!allowlistEntry?.active) {
      await this.logout();
      throw new Error("This user account is inactive.");
    }

    return profile;
  }

  // --- AUTH ---
  async checkSession(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    try {
      const profile = await this.getUserProfile(session.user.id, session.user.email!);
      return {
        id: session.user.id,
        email: session.user.email!,
        ...profile,
      };
    } catch (error) {
        console.error("Session check failed:", error);
        await this.logout();
        return null;
    }
  }
  
  async signup(email: string, password_hash: string): Promise<{ status: 'CONFIRMATION_SENT' | 'PENDING_REVIEW' }> {
    const normalizedEmail = email.trim().toLowerCase();

    const { data: allowedClient, error: allowlistError } = await supabase
        .from('allowlist_clients').select('*').eq('email', normalizedEmail).single();
    
    // Handle case where select returns an error but it's just "no rows found"
    if (allowlistError && allowlistError.code !== 'PGRST116') throw allowlistError;
    
    if (!allowedClient || !allowedClient.active) {
        return { status: 'PENDING_REVIEW' };
    }

    const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: password_hash,
    });

    if (error) throw error;
    if (data.user && !data.session) {
        return { status: 'CONFIRMATION_SENT' };
    }
    
    throw new Error('An unexpected signup scenario occurred.');
  }

  async login(email: string, password_hash: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: password_hash });
    if (error) throw error;
    if (!data.user) throw new Error("Login failed unexpectedly.");
    
    const profile = await this.getUserProfile(data.user.id, data.user.email!);
    return { id: data.user.id, email: data.user.email!, ...profile };
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Logout error:", error);
  }
  
  // --- PASSWORD RECOVERY ---
  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin, // Supabase needs to know where to send the user back
    });
    // For security, never reveal if an email exists or not.
    if (error) console.error("Password reset request error:", error.message);
    return;
  }
  
  async resetPassword(token: string, newPassword_hash: string): Promise<void> {
    // The Supabase client should automatically detect the session from the URL hash.
    // The token from the component is therefore not needed.
    // This relies on `detectSessionInUrl: true` in the client options.
    const { error } = await supabase.auth.updateUser({ password: newPassword_hash });
    if (error) throw error;
  }

  async forceResetPassword(newPassword_hash: string): Promise<void> {
    if (!(await this.checkSession())) throw new Error("You must be logged in to change your password.");
    
    const { data, error } = await supabase.auth.updateUser({ password: newPassword_hash });
    if (error) throw error;
    
    // After successful password change, update the 'must_change_password' flag in the profile.
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', data.user.id);
    if (profileError) throw profileError;
  }

  // --- ACCESS REQUESTS ---
  async requestAccess(data: Omit<AccessRequest, 'id' | 'created_at' | 'status'>): Promise<void> {
    const { error } = await supabase.from('access_requests').insert(data);
    if (error) throw error;
  }

  // --- SUBMISSIONS ---
  async getSubmissions(user: User): Promise<Submission[]> {
    let query = supabase.from('submissions').select('*').order('created_at', { ascending: false });
    if (user.role !== 'admin') {
      query = query.eq('user_id', user.id);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async createSubmission(data: Omit<Submission, 'id' | 'part_id' | 'photos' | 'created_at' | 'status'>, photos: File[]): Promise<Submission> {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[-:T]/g, '');
    const part_id = `P-${data.client_id}-${timestamp}`;

    const uploadedPhotos: Photo[] = [];
    for (const file of photos) {
        const filePath = `evidence/${data.client_id}/${part_id}/${file.name}-${Date.now()}`;
        const { error: uploadError } = await supabase.storage.from('submissions').upload(filePath, file);
        if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        
        const { data: { publicUrl } } = supabase.storage.from('submissions').getPublicUrl(filePath);
        uploadedPhotos.push({ path: filePath, url: publicUrl });
    }

    const submissionData = { ...data, part_id, photos: uploadedPhotos, status: 'received' as const };
    const { data: newSubmission, error } = await supabase.from('submissions').insert(submissionData).select().single();
    if (error) throw error;
    return newSubmission;
  }

  // --- ADMIN: USER MANAGEMENT ---
  async getUsers(): Promise<ManagedUser[]> {
    // This is a security-sensitive operation and MUST be a call to a secure backend function.
    const { data, error } = await supabase.rpc('get_managed_users');
    if (error) throw error;
    return data;
  }

  async updateUser(userId: string, updates: Partial<{ role: 'client' | 'admin', active: boolean, must_change_password?: boolean }>): Promise<ManagedUser> {
    // This is a security-sensitive operation and MUST be a call to a secure backend function.
    const { data, error } = await supabase.rpc('update_managed_user', { user_id: userId, updates });
    if (error) throw error;
    return data;
  }
  
  async resendConfirmation(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
  }

  // --- ADMIN: CLIENT/ALLOWLIST MANAGEMENT ---
  async getClients(): Promise<AllowlistClient[]> {
    const { data, error } = await supabase.from('allowlist_clients').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async inviteUser(email: string, clientId: string, clientName: string): Promise<AllowlistClient> {
    const { data, error } = await supabase.from('allowlist_clients').insert({ email, client_id: clientId, client_name: clientName, active: true }).select().single();
    if (error) throw error;
    // Note: This only adds the user to the allowlist. Supabase doesn't send an email here.
    // A custom solution (e.g., another Edge Function) would be needed to send a "You've been invited" email.
    return data;
  }

  async updateClient(clientId: string, updates: Partial<AllowlistClient>): Promise<AllowlistClient> {
    const { data, error } = await supabase.from('allowlist_clients').update(updates).eq('id', clientId).select().single();
    if (error) throw error;
    return data;
  }

  async deleteClient(clientId: string): Promise<void> {
    const { error } = await supabase.from('allowlist_clients').delete().eq('id', clientId);
    if (error) throw error;
  }
  
  // --- ADMIN: SYSTEM HEALTH & REQUESTS ---
  async getSystemHealth(): Promise<SystemHealth> {
      // This is a client-side approximation of system health.
      // FIX: Cast `import.meta` to `any` to access `env` and resolve TypeScript error.
      const siteUrl = (import.meta as any).env.VITE_SUPABASE_URL ? `ok` : `error`;
      return {
          siteUrl: { status: siteUrl, message: siteUrl === 'ok' ? `Supabase URL is set.` : `VITE_SUPABASE_URL env var is missing.`},
          supabaseRedirects: { status: 'ok', message: 'Verify auth redirect URLs in your Supabase project settings.'},
          smtp: { status: 'warn', message: 'Ensure your Supabase project SMTP settings are configured for production.'}
      };
  }

  async getAccessRequests(): Promise<AccessRequest[]> {
      const { data, error } = await supabase.from('access_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
  }
  
  async handleAccessRequest(requestId: string, approve: boolean): Promise<void> {
      const { data: request, error: fetchError } = await supabase.from('access_requests').select('*').eq('id', requestId).single();
      if (fetchError || !request) throw new Error("Request not found.");

      if (approve) {
          await this.inviteUser(request.email, request.client_id || request.company.toUpperCase().slice(0, 6), request.company);
          const { error } = await supabase.from('access_requests').update({ status: 'approved' }).eq('id', requestId);
          if (error) throw error;
      } else {
          const { error } = await supabase.from('access_requests').update({ status: 'denied' }).eq('id', requestId);
          if (error) throw error;
      }
  }
}

export const apiService = new ApiService();