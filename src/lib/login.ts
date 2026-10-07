// Supabase identifica a cada persona por email. Para que el equipo entre con un
// usuario corto ("jose"), se le agrega este dominio por detrás.
// Si se escribe un email completo, se usa tal cual.
const LOGIN_DOMAIN =
  process.env.NEXT_PUBLIC_LOGIN_DOMAIN ?? "colchonessoftline.com.ar";

export function usernameToEmail(input: string): string {
  const value = input.trim().toLowerCase();
  return value.includes("@") ? value : `${value}@${LOGIN_DOMAIN}`;
}
