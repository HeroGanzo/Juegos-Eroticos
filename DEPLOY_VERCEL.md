# Desplegar "Juegos Eróticos" en Vercel

Si querés migrar el sitio a un VPS de Hostinger, consultá la [guía del README](README.md).

El sitio necesita una base de datos **PostgreSQL en la nube**. La base de datos de la vista
previa (`127.0.0.1`) solo existe en el entorno de desarrollo, no en Vercel.

> El proyecto ya está preparado: el **build funciona aunque no haya base de datos**, y en la
> **primera visita se crean solas las tablas**, el administrador y el contenido de ejemplo.

## 1. Sube el código a GitHub

Sube la versión actual del proyecto a tu repositorio (por ejemplo `HeroGanzo/Juegos-Eroticos`).
Vercel lo desplegará automáticamente con cada cambio.

## 2. Crea la base de datos (Neon, gratis)

1. Abre tu proyecto en [vercel.com](https://vercel.com) → pestaña **Storage**.
2. **Create Database** → elige **Neon** (Serverless Postgres) → **Continue**.
3. Región: **Washington, D.C., USA (East) – iad1** (la misma que tus funciones de Vercel).
4. Plan **Free** → **Create** → en "Connect project" marca *Production*, *Preview* y *Development* → **Connect**.

Esto crea automáticamente la variable `DATABASE_URL` en tu proyecto.

**¿Otro proveedor?** (Supabase, Railway, Render, un VPS...) Ve a **Settings → Environment Variables**
y crea `DATABASE_URL` con la cadena de conexión, por ejemplo:

```
postgresql://usuario:contraseña@servidor:5432/basededatos?sslmode=require
```

## 3. Define tu contraseña de administrador (muy recomendado)

En **Settings → Environment Variables** añade:

| Variable         | Valor de ejemplo         |
| ---------------- | ------------------------ |
| `ADMIN_USERNAME` | `admin`                  |
| `ADMIN_EMAIL`    | `tu@correo.com`          |
| `ADMIN_PASSWORD` | una contraseña segura    |

Si no las defines, el administrador inicial será `admin` / `admin123`. Cámbiala enseguida en
**Panel → Seguridad**, porque el sitio será público.

> Estas variables solo se usan la **primera vez** (cuando la base de datos está vacía).

## 4. (Opcional) Activa Vercel Blob para subir videos y archivos grandes

Las funciones de Vercel solo aceptan peticiones de hasta **4,5 MB**. Sin Blob:

- Las imágenes grandes se **reducen automáticamente** en el navegador antes de subirlas.
- Los videos de más de 4 MB no se pueden subir: usa enlaces de **YouTube** o **Vimeo**.

Para subir videos grandes: **Storage → Create Database → Blob** → **Connect** al proyecto.
Se crea la variable `BLOB_READ_WRITE_TOKEN` y el panel empieza a subir los archivos directamente
a Vercel Blob (el escritorio del panel muestra "Vercel Blob activo").

## 5. Vuelve a desplegar

Las variables de entorno solo se aplican a los despliegues nuevos:
**Deployments** → menú **⋯** del último despliegue → **Redeploy**.

Abre tu sitio: la primera carga tarda unos segundos mientras se crean las tablas.
Entra en `/login` con tu usuario administrador y ve a `/admin`.

## Solución de problemas

Si falta la base de datos o no se puede conectar, el sitio muestra una pantalla
**"Configuración pendiente"** con el motivo:

| Mensaje                               | Qué hacer                                                                  |
| ------------------------------------- | -------------------------------------------------------------------------- |
| Falta conectar la base de datos       | Crea `DATABASE_URL` (paso 2) y haz **Redeploy**.                          |
| La base de datos apunta a localhost   | Has copiado la URL local; usa la de Neon/Supabase.                         |
| No se puede conectar                  | Revisa la dirección del servidor y que la base de datos esté activa.      |
| Usuario o contraseña incorrectos      | Copia de nuevo la cadena de conexión completa.                             |
| Error de conexión segura (SSL)        | Añade `DATABASE_SSL=no-verify` (o `disable` si tu servidor no usa SSL).    |

También puedes comprobar el estado en `https://tu-sitio.vercel.app/api/health`.

## Variables de entorno

Consulta `.env.example` para ver todas las variables disponibles.
