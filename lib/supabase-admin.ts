import { createClient } from "@supabase/supabase-js";

// Cliente privilegiado do blog: uso exclusivo nas rotas administrativas existentes.
// A ausência de configuração não deve derrubar a compilação dos módulos independentes.
// Os consumidores devem responder 503, nunca simular uma operação bem-sucedida.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
