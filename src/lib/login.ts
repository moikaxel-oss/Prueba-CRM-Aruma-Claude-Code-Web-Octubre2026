// Supabase identifica a cada persona por email. Para que el equipo entre con un
// usuario corto, el CRM lo convierte en email por detrás:
// - si hay un atajo en ALIASES, se usa el email indicado
// - si se escribe un email completo, se usa tal cual
// - si no, se le agrega LOGIN_DOMAIN (ej: "ventas1" -> ventas1@colchonesaruma.com.ar)
const LOGIN_DOMAIN =
  process.env.NEXT_PUBLIC_LOGIN_DOMAIN ?? "colchonesaruma.com.ar";

const ALIASES: Record<string, string> = {
  aruma: "aruma.colchonesysommier@gmail.com",
};

export function usernameToEmail(input: string): string {
  const value = input.trim().toLowerCase();
  if (ALIASES[value]) return ALIASES[value];
  return value.includes("@") ? value : `${value}@${LOGIN_DOMAIN}`;
}
