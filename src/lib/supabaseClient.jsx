
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL o Anon Key están ausentes. Asegúrate de configurar el archivo .env.local correctamente.");
  throw new Error("Supabase URL o Anon Key están ausentes.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log(`[Supabase] Cliente creado con la URL: ${supabaseUrl}`);
