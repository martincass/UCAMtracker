import { supabase } from './supabaseClient';
import { User, SignupStatus, ManagedUser, AllowlistClient, AccessRequest, SystemHealth, CreateUserResponse, Submission } from '../types';
import type { Session, User as SupabaseUser, AuthChangeEvent } from '@supabase/supabase-js';

// A simple in-memory cache for the user object to avoid repeated session checks.
let cachedUser: User | null = null;

const apiService = {
  
  mapSupabaseUserToUser(supabaseUser: SupabaseUser): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      role: supabaseUser.app_metadata?.role || 'user',
      client_id: supabaseUser.user_metadata?.client_id || '',
      client_name: supabaseUser.user_metadata?.client_name || '',
      mustResetPassword: supabaseUser.user_metadata?.must_reset_password || false
    };
  },

  async getSession(): Promise<User | null> {
    if (cachedUser) return cachedUser;

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      cachedUser = null;
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('must_reset_password, client_id, client_name, role')
      .eq('user_id', session.user.id)
      .single();

    if (profileError) {
        console.error("Error fetching user profile:", profileError);
    }
    
    const user = this.mapSupabaseUserToUser(session.user);
    user.mustResetPassword = profile?.must_reset_password || false;
    user.role = profile?.role || user.role;
    user.client_id = profile?.client_id || user.client_id;
    user.client_name = profile?.client_name || user.client_name;

    cachedUser = user;
    return user;
  },

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('Login successful but no user data returned.');
    
    cachedUser = null; 
    const user = await this.getSession();
    if (!user) throw new Error("Could not retrieve user profile after login.");

    return user;
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    cachedUser = null;
    if (error) throw error;
  },

  async signup(email: string, password: string): Promise<{ status: SignupStatus }> {
    const { data: allowlistEntry, error: allowlistError } = await supabase
        .from('allowlist_clients')
        .select('*')
        .eq('email', email)
        .single();
    
    if (allowlistError || !allowlistEntry) {
        return { status: 'PENDING_REVIEW' };
    }

    if (!allowlistEntry.active) {
        throw new Error("This account is currently disabled. Please contact support.");
    }
    
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return { status: 'CONFIRMATION_SENT' };
  },
  
  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/` });
    if (error) throw error;
  },
  
  async updatePassword(password: string): Promise<void> {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
  },

  async forceResetPassword(password: string): Promise<User> {
    const user = await this.getSession();
    if (!user) throw new Error("No active session found.");
    
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) throw updateError;
    
    const { error: profileError } = await supabase.from('profiles').update({ must_reset_password: false }).eq('user_id', user.id);
    if (profileError) console.error("Failed to update must_reset_password flag:", profileError);
    
    const updatedUser: User = { ...user, mustResetPassword: false };
    cachedUser = updatedUser;
    return updatedUser;
  },
  
  async requestAccess(details: { email: string; company: string; client_id: string; note: string }): Promise<void> {
      const { error } = await supabase.from('access_requests').insert(details);
      if (error) throw error;
  },

  // --- SUBMISSION METHODS ---
  async createSubmission(
    submissionData: {
      weighing_kg: number;
      notes: string | null;
      ingress_photo: File;
      weighing_photo: File;
    }
  ): Promise<Submission> {
    const user = await this.getSession();
    if (!user) throw new Error("User not authenticated.");

    const submissionId = crypto.randomUUID();
    const bucket = 'submission-photos';
    const rootPath = `${user.client_id}/${submissionId}`;

    const uploadFile = async (file: File, name: string) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${rootPath}/${name}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file);
      if (error) throw new Error(`Upload failed for ${name}: ${error.message}`);
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    };

    const ingress_photo_url = await uploadFile(submissionData.ingress_photo, 'ingress');
    const weighing_photo_url = await uploadFile(submissionData.weighing_photo, 'weighing');

    const { data: newSubmission, error: insertError } = await supabase
      .from('submissions')
      .insert({
        id: submissionId,
        user_id: user.id,
        client_id: user.client_id,
        weighing_kg: submissionData.weighing_kg,
        notes: submissionData.notes,
        ingress_photo_url,
        weighing_photo_url,
      })
      .select('*, profiles(client_name, email)')
      .single();

    if (insertError) throw insertError;
    
    // Remap to match Submission type
    return {
      ...newSubmission,
      client_name: newSubmission.profiles?.client_name || user.client_name,
      email: newSubmission.profiles?.email || user.email,
    };
  },
  
  async getClientSubmissions(): Promise<Submission[]> {
    const { data, error } = await supabase.rpc('get_client_submissions');
    if (error) throw error;
    return data;
  },
  
  // --- ADMIN METHODS ---
  async _getAuthHeaders() {
      const { data: { session }} = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated.");
      return {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
      }
  },

  async adminGetUsers(): Promise<ManagedUser[]> {
    const { data, error } = await supabase.rpc('get_all_users_with_details');
    if (error) throw error;
    return data;
  },

  async adminGetSubmissions(): Promise<Submission[]> {
    const { data, error } = await supabase.rpc('get_all_submissions');
    if (error) throw error;
    return data;
  },
  
  async adminGetClients(): Promise<AllowlistClient[]> {
    const { data, error } = await supabase.from('allowlist_clients').select('*');
    if (error) throw error;
    return data;
  },

  async adminGetRequests(): Promise<AccessRequest[]> {
     const { data, error } = await supabase.from('access_requests').select('*');
     if (error) throw error;
     return data;
  },
  
  // FIX: Implement missing handleAccessRequest function
  async adminHandleAccessRequest(requestId: string, approve: boolean): Promise<void> {
    if (approve) {
        const { data: request, error: fetchError } = await supabase
            .from('access_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (fetchError || !request) {
            throw new Error(`Access request not found: ${requestId}`);
        }

        const { error: insertError } = await supabase.from('allowlist_clients').insert({
            email: request.email,
            client_name: request.company,
            client_id: request.client_id || request.company.toUpperCase().replace(/\s/g, '_'),
            active: true,
        });

        if (insertError) {
            throw new Error(`Failed to add approved user to allowlist: ${insertError.message}`);
        }
    }

    const { error: deleteError } = await supabase.from('access_requests').delete().eq('id', requestId);
    if (deleteError) {
        throw new Error(`Failed to delete access request: ${deleteError.message}`);
    }
  },

  async adminCreateUser(email: string, clientId: string, clientName: string): Promise<CreateUserResponse> {
      const { data, error } = await supabase.functions.invoke('admin_create_auth_user', {
          body: { email, client_id: clientId, client_name: clientName },
      });
      if (error) throw error;
      if (!data.ok) throw new Error(data.error || 'Failed to create user in Edge Function.');
      return data;
  },

  // FIX: Implement missing inviteUser function
  async adminInviteUser(email: string, clientId: string, clientName: string): Promise<void> {
    const { error } = await supabase.from('allowlist_clients').insert({
        email,
        client_id: clientId,
        client_name: clientName,
        active: true
    });
    if (error) throw error;
  },

  async adminResetPassword(userId: string): Promise<{ password_cleartext: string }> {
      console.warn("adminResetPassword should be an edge function. Mocking response.");
      return { password_cleartext: 'TEMP_PASS_12345' };
  },

  async adminDeactivateUser(userId: string): Promise<void> {
      const { error } = await supabase.rpc('admin_deactivate_user', { p_user_id: userId });
      if (error) throw error;
  },
  
  async adminArchiveUser(userId: string): Promise<void> {
    const { error } = await supabase.rpc('admin_archive_user', { p_user_id: userId });
    if (error) throw error;
  },

  // FIX: Implement missing adminDeleteClient function
  async adminDeleteClient(clientId: string): Promise<void> {
    const { error } = await supabase.from('allowlist_clients').delete().eq('id', clientId);
    if (error) throw error;
  },

  async updateClient(clientId: string, updates: Partial<AllowlistClient>): Promise<AllowlistClient> {
      const { data, error } = await supabase.from('allowlist_clients').update(updates).eq('id', clientId).select().single();
      if (error) throw error;
      return data;
  },

  async updateSubmissionStatus(id: string, status: Submission['status']): Promise<Submission> {
    const { data, error } = await supabase
        .from('submissions')
        .update({ status })
        .eq('id', id)
        .select('*, profiles(client_name, email)')
        .single();
    if (error) throw error;
    return {
      ...data,
      client_name: data.profiles?.client_name || 'N/A',
      email: data.profiles?.email || 'N/A',
    };
  },
};

export { apiService };