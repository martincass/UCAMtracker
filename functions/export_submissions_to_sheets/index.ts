// functions/export_submissions_to_sheets/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleAuth } from "https://esm.sh/google-auth-library@9";
import { google } from "https://esm.sh/googleapis@140";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- ENVIRONMENT VARIABLES ---
// These must be set in the Supabase Edge Function settings
// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// @ts-ignore
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// @ts-ignore
const SHEETS_CLIENT_EMAIL = Deno.env.get("SHEETS_CLIENT_EMAIL");
// @ts-ignore
const SHEETS_PRIVATE_KEY = Deno.env.get("SHEETS_PRIVATE_KEY");
// @ts-ignore
const SHEET_ID = Deno.env.get("SHEET_ID");
// @ts-ignore
const SHEET_TAB = Deno.env.get("SHEET_TAB");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authorization: Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user || user.app_metadata?.role !== 'admin') {
      return new Response(JSON.stringify({ error: "Forbidden: Not an admin" }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Fetch all submissions using the RPC
    const { data: submissions, error: rpcError } = await supabaseClient.rpc('get_all_submissions');
    if (rpcError) {
      throw new Error(`Failed to fetch submissions: ${rpcError.message}`);
    }
    if (!submissions || submissions.length === 0) {
      return new Response(JSON.stringify({ ok: true, appended: 0, message: "No new submissions to export." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // 3. Authenticate with Google Sheets
    if (!SHEETS_CLIENT_EMAIL || !SHEETS_PRIVATE_KEY || !SHEET_ID || !SHEET_TAB) {
        throw new Error("Google Sheets environment variables are not fully configured.");
    }
    const auth = new GoogleAuth({
      credentials: {
        client_email: SHEETS_CLIENT_EMAIL,
        private_key: SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 4. Format data for the sheet
    const rows = submissions.map(s => [
      s.fecha,
      s.cliente,
      s.usuario,
      s.foto_ingreso || '',
      s.pesaje_kg,
      s.foto_pesaje || '',
      s.status,
      s.reporte_id,
    ]);

    // 5. Append data to the sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rows,
      },
    });

    const appendedCount = response.data.updates?.updatedRows || 0;
    
    // 6. Return success response
    return new Response(JSON.stringify({ ok: true, appended: appendedCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});