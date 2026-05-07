# 🏃 HalfPace — Guía de instalación paso a paso

## Lo que necesitas (todo gratis excepto Claude API)
- Cuenta en GitHub (gratis)
- Cuenta en Vercel (gratis)
- Cuenta en Supabase (gratis)
- Cuenta en Anthropic para Claude API (~2-5€/mes)
- Cuenta en Strava Developers (gratis)

---

## PASO 1 — Supabase (base de datos)

1. Ve a https://supabase.com y crea una cuenta
2. Crea un nuevo proyecto (elige región Europe West)
3. Ve a **SQL Editor** y pega el contenido de `src/lib/supabase-schema.sql`
4. Pulsa **Run** — esto crea todas las tablas
5. Ve a **Settings → API** y copia:
   - `Project URL` → será tu `VITE_SUPABASE_URL`
   - `anon public key` → será tu `VITE_SUPABASE_ANON_KEY`
   - `service_role key` → será tu `SUPABASE_SERVICE_ROLE_KEY` (solo en servidor, nunca en el cliente)

---

## PASO 2 — Strava Developer App

1. Ve a https://www.strava.com/settings/api
2. Crea una aplicación:
   - **Application Name**: HalfPace
   - **Website**: tu-url.vercel.app (lo tendrás después)
   - **Authorization Callback Domain**: tu-url.vercel.app
3. Copia el **Client ID** y **Client Secret**

---

## PASO 3 — Claude API Key

1. Ve a https://console.anthropic.com
2. Crea una cuenta y añade crédito (5€ te dura meses)
3. Ve a **API Keys** y crea una nueva clave
4. Guárdala — solo se muestra una vez

---

## PASO 4 — Subir a GitHub

```bash
# En tu ordenador, dentro de la carpeta halfpace:
git init
git add .
git commit -m "HalfPace PWA inicial"
# Crea un repo en github.com y sigue las instrucciones para subir
git remote add origin https://github.com/TU_USUARIO/halfpace.git
git push -u origin main
```

---

## PASO 5 — Desplegar en Vercel

1. Ve a https://vercel.com e inicia sesión con tu cuenta de GitHub
2. Pulsa **Add New Project** y selecciona el repo `halfpace`
3. En **Environment Variables** añade todas estas:

| Variable | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | tu URL de Supabase |
| `VITE_SUPABASE_ANON_KEY` | tu anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | tu service role key |
| `VITE_STRAVA_CLIENT_ID` | tu Client ID de Strava |
| `STRAVA_CLIENT_ID` | igual que el anterior |
| `STRAVA_CLIENT_SECRET` | tu Client Secret de Strava |
| `ANTHROPIC_API_KEY` | tu API key de Claude |

4. Pulsa **Deploy** — en 2 minutos tendrás tu URL tipo `halfpace.vercel.app`

---

## PASO 6 — Actualizar Strava con tu URL real

1. Vuelve a https://www.strava.com/settings/api
2. Actualiza **Authorization Callback Domain** con tu URL real de Vercel

---

## PASO 7 — Instalar en iPhone

1. Abre Safari en tu iPhone (debe ser Safari, no Chrome)
2. Ve a tu URL de Vercel
3. Pulsa el botón **Compartir** (el cuadrado con la flecha)
4. Selecciona **Añadir a pantalla de inicio**
5. Ponle el nombre "HalfPace" y pulsa **Añadir**

¡Ya tienes el icono en tu iPhone como una app nativa! 🎉

---

## PASO 8 — Invitar a tus amigos

Simplemente mándales el enlace de Vercel por WhatsApp.
Que hagan lo mismo: Safari → Compartir → Añadir a pantalla de inicio.
Cada uno crea su cuenta y listo.

---

## Para actualizar la app en el futuro

Cuando quieras cambiar algo, edita el código y haz:
```bash
git add .
git commit -m "descripción del cambio"
git push
```
Vercel lo despliega automáticamente en 1-2 minutos. Todos los usuarios reciben la actualización sin hacer nada.
