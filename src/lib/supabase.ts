import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Supabase llama a esta clave "anon" (clásica) o "publishable" (nueva); sirven igual
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Sin las claves, el CRM funciona en modo local (datos en el navegador)
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
