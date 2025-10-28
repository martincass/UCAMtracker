import { supabase } from './supabaseClient';
import {
    User,
    Submission,
    AllowlistClient,
    CreateUserResponse,
    AccessRequest,
    SystemHealth,
    ManagedUser
} from '../types';

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper to handle Supabase errors
const handleSupabaseError = (error: any, context: string) => {
  if (error) {
    console.error(`ApiService Error in ${context}:`, error);
    // Use a more detailed error message if available
    const message = error.details || error.message || `An unknown error occurred in ${context}.`;
    throw new ApiError(message, error.code);
  }
};

const mapRowToSubmission = (r: any): Submission => ({
  reporte_id: r.id,
  fecha: r.date,
  pesaje_kg: r.weighing_kg != null ? Number(r.weighing_kg) : 0,
  notas: r.notes ?? null,
  foto_ingreso: r.ingress_photo_url ?? undefined,
  foto_pesaje: r.weighing_photo_url ?? undefined,
  estado: r.status as 'pendiente' | 'validado' | 'rechazado' | undefined,
  // admin-only convenience fields:
  cliente: r.client_id,
  usuario: r.user_email ?? r.user_id
});

export const apiService = {
    // AUTH
    async login(email: string, password: string): Promise<User> {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        handleSupabaseError(error, 'login (auth)');
        if (!data.user) throw new ApiError('Login failed: No user data returned.');

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

        if (profileError?.code === 'PGRST116') { // "PGRST116" means no rows found
             throw new ApiError('Error de inicio de sesión: Perfil de usuario no encontrado.', 404);
        }
        handleSupabaseError(profileError, 'login (fetch profile)');

        return {
            id: profile.user_id,
            email: profile.email,
            role: profile.role,
            client_id: profile.client_id,
            client_name: profile.client_name,
            must_reset_password: profile.must_reset_password,
        };
    },

    async logout(): Promise<void> {
        await supabase.auth.signOut();
    },

    async getSession(): Promise<User | null> {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
        
        if (profileError || !profile) {
            console.warn('User session exists but profile is missing. Logging out.', profileError);
            await this.logout();
            return null;
        }

        return {
            id: profile.user_id,
            email: profile.email,
            role: profile.role,
            client_id: profile.client_id,
            client_name: profile.client_name,
            must_reset_password: profile.must_reset_password,
        };
    },
    
    async signup(email: string, password: string): Promise<{ status: 'PENDING_REVIEW' | 'CONFIRMATION_SENT' }> {
        // Implementation remains unchanged
        const { data: allowlistEntry } = await supabase.from('allowlist_clients').select('active').eq('email', email).single();
        if (!allowlistEntry) {
            return { status: 'PENDING_REVIEW' };
        }
        if (!allowlistEntry.active) {
            throw new ApiError('Your account is currently disabled. Please contact support.');
        }
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        handleSupabaseError(error, 'Signup');
        return { status: 'CONFIRMATION_SENT' };
    },
    
    async requestPasswordReset(email: string): Promise<void> {
        await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    },
    
    async updatePassword(password: string): Promise<void> {
        const { error } = await supabase.auth.updateUser({ password });
        handleSupabaseError(error, 'Update password');
    },
    
    async forceResetPassword(password: string): Promise<User> {
        const { data: { user }, error: userError } = await supabase.auth.updateUser({ password });
        handleSupabaseError(userError, 'Force password update (auth)');
        if (!user) throw new ApiError('Failed to update password.');

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .update({ must_reset_password: false })
            .eq('user_id', user.id)
            .select()
            .single();
        handleSupabaseError(profileError, 'Force password update (profile)');
        
        return {
            id: profile.user_id,
            email: profile.email,
            role: profile.role,
            client_id: profile.client_id,
            client_name: profile.client_name,
            must_reset_password: profile.must_reset_password,
        };
    },

    // SUBMISSIONS
    async createSubmission(
        metadata: { fecha: string; pesaje_kg: number | string; notas?: string | null },
        ingressPhoto: File,
        weighingPhoto: File
    ): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new ApiError('No autenticado', 401);

        const { data: profile, error: pErr } = await supabase
            .from('profiles')
            .select('client_id')
            .eq('user_id', user.id)
            .single();
        if (pErr || !profile?.client_id) throw new ApiError('Perfil incompleto: falta client_id', 400);

        const submissionId = crypto.randomUUID();
        const bucket = 'submission-photos';
        const basePath = `${profile.client_id}/${submissionId}`;

        const { error: ingressError } = await supabase.storage.from(bucket).upload(`${basePath}/ingress.jpg`, ingressPhoto);
        if (ingressError) throw new ApiError(`Carga foto ingreso: ${ingressError.message}`, 500);

        const { error: weighingError } = await supabase.storage.from(bucket).upload(`${basePath}/weighing.jpg`, weighingPhoto);
        if (weighingError) throw new ApiError(`Carga foto pesaje: ${weighingError.message}`, 500);

        const { data: ingressUrlData } = supabase.storage.from(bucket).getPublicUrl(`${basePath}/ingress.jpg`);
        const { data: weighingUrlData } = supabase.storage.from(bucket).getPublicUrl(`${basePath}/weighing.jpg`);

        const { error: dbError } = await supabase.from('submissions').insert({
            id: submissionId,
            date: metadata.fecha,
            weighing_kg: Number(metadata.pesaje_kg),
            notes: metadata.notas ?? null,
            ingress_photo_url: ingressUrlData.publicUrl,
            weighing_photo_url: weighingUrlData.publicUrl,
        });
        if (dbError) throw new ApiError(`DB insert: ${dbError.message}`, 500);
    },
    
    async clientGetSubmissions(): Promise<Submission[]> {
        const { data, error } = await supabase.rpc('get_client_submissions');
        handleSupabaseError(error, 'Get client submissions');
        return (data ?? []).map(mapRowToSubmission);
    },
    
    async getSubmissionPhotoUrl(publicUrl: string): Promise<string> {
        // Since the bucket is public, we can just return the public URL directly
        return Promise.resolve(publicUrl);
    },

    // ADMIN
    async adminGetSubmissions(): Promise<Submission[]> {
        const { data, error } = await supabase.rpc('get_all_submissions');
        handleSupabaseError(error, 'Admin get submissions');
        return (data ?? []).map(mapRowToSubmission);
    },

    async updateSubmissionStatus(submissionId: string, status: 'validado' | 'rechazado' | 'pendiente'): Promise<void> {
        const { error } = await supabase
            .from('submissions')
            .update({ status: status })
            .eq('id', submissionId)
            .select(); // To avoid PostgREST 406 error
        handleSupabaseError(error, 'Update submission status');
    },

    async adminGetUsers(): Promise<ManagedUser[]> {
        const { data, error } = await supabase.rpc('get_all_users_with_details');
        handleSupabaseError(error, 'Admin get users');
        return data || [];
    },

    async adminCreateUser(email: string, clientId: string, clientName: string): Promise<CreateUserResponse> {
        const { data, error } = await supabase.functions.invoke('admin_create_auth_user', {
            body: { email, client_id: clientId, client_name: clientName },
        });
        if (error) handleSupabaseError(error, 'adminCreateUser function');
        if (data.error) throw new ApiError(data.error);
        return data;
    },

    async adminResetPassword(userId: string): Promise<{ password_cleartext: string }> {
        const { data, error } = await supabase.functions.invoke('admin_reset_user_password', {
            body: { user_id: userId },
        });
        if (error) handleSupabaseError(error, 'adminResetPassword function');
        if (data.error) throw new ApiError(data.error);
        return data;
    },

    async adminDeactivateUser(userId: string): Promise<void> {
         const { error } = await supabase.rpc('admin_deactivate_user', { p_user_id: userId });
         handleSupabaseError(error, 'Admin deactivate user');
    },
    
    async adminArchiveUser(userId: string): Promise<void> {
         const { error } = await supabase.rpc('admin_archive_user', { p_user_id: userId });
         handleSupabaseError(error, 'Admin archive user');
    },

    async adminGetClients(): Promise<AllowlistClient[]> {
        const { data, error } = await supabase.from('allowlist_clients').select('*').order('client_name');
        handleSupabaseError(error, 'Admin get clients');
        return data || [];
    },

    async updateClient(clientId: string, updates: Partial<AllowlistClient>): Promise<AllowlistClient> {
        const { data, error } = await supabase.from('allowlist_clients').update(updates).eq('id', clientId).select().single();
        handleSupabaseError(error, 'Update client');
        return data;
    },
    
    async adminDeleteClient(clientId: string): Promise<void> {
        const { error } = await supabase.from('allowlist_clients').delete().eq('id', clientId);
        handleSupabaseError(error, 'Admin delete client');
    },
    
    async adminInviteUser(email: string, clientId: string, clientName: string): Promise<void> {
        const { error } = await supabase.from('allowlist_clients').upsert({ email, client_id: clientId, client_name: clientName, active: true }, { onConflict: 'email' });
        handleSupabaseError(error, 'Admin invite user');
    },
    
    async adminGetAccessRequests(): Promise<AccessRequest[]> {
        const { data, error } = await supabase.from('access_requests').select('*').order('created_at');
        handleSupabaseError(error, 'Admin get access requests');
        return data || [];
    },
    
    async adminHandleAccessRequest(requestId: string, approve: boolean): Promise<void> {
        if (approve) {
            const { data: request } = await supabase.from('access_requests').select('*').eq('id', requestId).single();
            if (request) {
                await this.adminInviteUser(request.email, request.client_id, request.company);
            }
        }
        await supabase.from('access_requests').delete().eq('id', requestId);
    },
    
    async requestAccess(details: { email: string, company: string, client_id: string, note: string }): Promise<void> {
        const { error } = await supabase.from('access_requests').insert(details);
        handleSupabaseError(error, 'Submit access request');
    },

    async getSystemHealth(): Promise<SystemHealth> {
        const { data, error } = await supabase.functions.invoke('get_system_health');
        if (error) handleSupabaseError(error, 'getSystemHealth function');
        if (data.error) throw new ApiError(data.error);
        return data.health;
    },
    
    async exportToSheets(): Promise<{ appended: number }> {
        const { data, error } = await supabase.functions.invoke('export_submissions_to_sheets');
        if (error) handleSupabaseError(error, 'exportToSheets function');
        if (data.error) throw new ApiError(data.error);
        return data;
    }
};
