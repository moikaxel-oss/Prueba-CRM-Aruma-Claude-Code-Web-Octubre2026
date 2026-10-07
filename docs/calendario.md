# Calendario de contenido (Aruma y Soft Line)

Ruta: `/calendario`. Misma sesión y mismo Supabase que el pipeline del CRM.

## Puesta en marcha (una sola vez)
En Supabase > SQL Editor, en este orden:
1. `supabase/calendar.sql` (tablas, historial automático, permisos y tiempo real)
2. `supabase/calendar-seed.sql` (carga junio a diciembre 2026; si la tabla ya tiene datos, no hace nada)

## Cómo funciona
- Cada cambio (estado, formato, texto, alta, baja) se guarda en `cal_posts` y le llega al resto del equipo al instante.
- Un trigger anota en `cal_log` quién lo hizo, cuándo y qué cambió (antes → después). Se ve en el botón **Historial**.
- El texto se guarda cuando se deja de tipear (~1 s), para que el historial no se llene de letras sueltas.
- Sin las claves de Supabase funciona en modo local (datos en el navegador, sin historial).
