# Checklist para mañana: Meta, Supabase y Vercel

Objetivo del día: dejar las cuentas creadas y los datos guardados. El CRM todavía no tiene que estar publicado.

## Reglas de oro
- Guardá cada dato en un **gestor de contraseñas** o en una nota privada. No los pegues en el chat, en el repo ni en capturas.
- **No registres tu número real de ventas.** Usá el número de prueba que da Meta.
- Si una pantalla te muestra algo distinto a lo que dice acá, frená y mandame una captura (tapando los datos secretos).

---

## 1. Meta Developers (developers.facebook.com)

### 1.1 Crear la app
- [ ] Mis apps → Crear app → tipo **Business**
- [ ] Nombre sugerido: `CRM Aruma`
- [ ] Agregar producto **WhatsApp** → Configurar
- [ ] Verificar que la app esté asociada a tu **Business Manager** de Aruma (el mismo que usa tus anuncios)

### 1.2 Número de prueba
- [ ] WhatsApp → Configuración de la API
- [ ] Usar el **número de prueba** que ofrece Meta
- [ ] Agregar **tu celular personal** como destinatario de prueba (te llega un código)
- [ ] Copiar y guardar: **Phone Number ID**
- [ ] Copiar y guardar: **WhatsApp Business Account ID**

### 1.3 Token
- [ ] Hoy: el token temporal (dura 24 h) alcanza para probar
- [ ] Para el token permanente: business.facebook.com → Configuración del negocio → Usuarios del sistema → crear usuario administrador → asignarle la app → generar token con los permisos `whatsapp_business_messaging` y `whatsapp_business_management`
- [ ] Guardar: **Access Token** (se muestra una sola vez)

### 1.4 Datos extra que me van a servir para las campañas
- [ ] Anotar el **ID de tu cuenta publicitaria** (Administrador de anuncios)
- [ ] Anotar el nombre exacto de **2 o 3 campañas activas** de clic a WhatsApp, para probar la atribución

### 1.5 Webhook: NO hoy
El webhook necesita que el CRM ya esté publicado en Vercel. Lo hacemos cuando esté listo.
- [ ] Inventar y guardar un **token de verificación** (una frase larga y rara, sin espacios). Lo vamos a usar después.

---

## 2. Supabase (supabase.com)
- [ ] Crear cuenta y un proyecto nuevo, nombre sugerido: `crm-aruma`
- [ ] Elegir la región más cercana (São Paulo para Argentina)
- [ ] Guardar la **contraseña de la base de datos** que se genera al crear el proyecto
- [ ] Guardar: **Project URL**
- [ ] Guardar: **anon key** (esta es pública)
- [ ] Guardar: **service_role key** (esta es **secreta**: da acceso total a los datos)

---

## 3. Vercel (vercel.com)
- [ ] Crear cuenta (conviene entrar con GitHub, que es donde vive este proyecto)
- [ ] Todavía no hace falta importar nada

---

## 4. Lo que me traés a la sesión
No me pases ninguno de los datos secretos de arriba. Yo te voy a decir **dónde cargarlos** (en Vercel, en la parte privada) cuando llegue el momento.

Sí quiero que me traigas:
- [ ] Las **etapas de tu pipeline** de Kommo
- [ ] El **look and feel** que querés
- [ ] Los **nombres de las campañas** de Meta
- [ ] Cuántos vendedores van a usar el CRM y cómo se llaman
