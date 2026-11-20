# Juegos Eróticos — migración de Vercel a Hostinger VPS

La aplicación usa **Next.js, Node.js 22 y PostgreSQL**. En el VPS, **systemd** mantiene la aplicación activa en `127.0.0.1:3000` y **Nginx** la publica con HTTPS. No hace falta comprar `juegosparaelganso.com` para instalar ni probar el sitio: podés usar un túnel SSH hasta que tengas el dominio. El nombre solo figura en las plantillas de Nginx y se puede cambiar.

## 1. Elegí qué hacer con los datos

| Opción | Cuándo conviene | Qué se conserva |
| --- | --- | --- |
| **Mantener el PostgreSQL actual** | La forma más simple de salir de Vercel sin mover la base. | Los datos siguen en el mismo servidor (Neon, Supabase u otro). Copiá la URL de producción desde tu proveedor al archivo privado del VPS. Confirmá que la base seguirá activa sin el proyecto de Vercel. |
| **Copiar PostgreSQL al VPS** | Querés mover también la base a Hostinger. | Un volcado completo incluye usuarios, contraseñas ya hasheadas, publicaciones, ajustes, VIP y archivos servidos por `/api/media/...`. Antes del corte hay que pausar escrituras y restaurar el último volcado. |
| **Empezar de cero** | No necesitás conservar datos. | Una base vacía crea tablas, administrador y ejemplos en la primera petición. No restaures un volcado encima de esa base ya inicializada. |

**Vercel Blob va aparte.** PostgreSQL guarda las URL de Blob, no los archivos detrás de esas URL. Mantené el almacén original activo mientras haya referencias. Si querés dejar de depender de Vercel, descargá los archivos, subilos desde el panel a PostgreSQL o a otro almacenamiento y reemplazá las URL en publicaciones, galerías, páginas y configuración. Verificá los enlaces antes de borrar nada. No hace falta copiar `BLOB_READ_WRITE_TOKEN` para mostrar los Blob públicos que ya existen. Sin ese token, las nuevas subidas van a PostgreSQL (hasta **15 MiB** por imagen y **150 MiB** por video). Para muchos videos o archivos más grandes conviene almacenamiento externo: la aplicación carga la subida en memoria y los archivos hacen crecer la base y sus backups.

## 2. Prepará el VPS

Usá un VPS con **Ubuntu 24.04 LTS**, acceso SSH y un usuario con `sudo`. Como punto de partida, considerá **4 GB de RAM** si vas a compilar y alojar PostgreSQL en el mismo VPS. Revisá los términos vigentes de los proveedores para el tipo de contenido que vas a publicar.

```bash
sudo apt update
sudo apt install -y ca-certificates curl xz-utils git nginx certbot openssl ufw postgresql-client
# Solo si PostgreSQL también va a estar en este VPS:
sudo apt install -y postgresql
```

Instalá Node.js 22 desde la distribución oficial (el servicio espera `/opt/node22/bin/node`):

```bash
(
  set -eu
  case "$(dpkg --print-architecture)" in
    amd64) arch=x64 ;;
    arm64) arch=arm64 ;;
    *) echo 'Arquitectura no contemplada en esta guía'; exit 1 ;;
  esac
  tmp=$(mktemp -d)
  trap 'rm -rf "$tmp"' EXIT
  cd "$tmp"
  base=https://nodejs.org/dist/latest-v22.x
  curl -fsSLO "$base/SHASUMS256.txt"
  awk -v suffix="linux-$arch.tar.xz" '$2 ~ ("-" suffix "$") {print}' SHASUMS256.txt > node.sha256
  archive=$(awk '{print $2}' node.sha256)
  test -n "$archive"
  curl -fsSLO "$base/$archive"
  sha256sum -c node.sha256
  sudo install -d /opt/node22
  sudo tar -xJf "$archive" -C /opt/node22 --strip-components=1
)
/opt/node22/bin/node --version
```

Si usás el firewall de Hostinger (hPanel) y/o UFW, dejá permitido **SSH** antes de activarlos o cambiar reglas (si usa un puerto distinto de 22, permití ese puerto). No abras **3000** ni **5432**. Abrí **80/443** recién al publicar el dominio. En un VPS nuevo podés desactivar el sitio por defecto de Nginx con `sudo rm -f /etc/nginx/sites-enabled/default` y `sudo systemctl reload nginx`.

## 3. Instalá el código y configurá PostgreSQL

Cloná la rama que contiene estos archivos. Si el repositorio es privado, configurá una [clave de despliegue de solo lectura](https://docs.github.com/es/authentication/connecting-to-github-with-ssh/managing-deploy-keys) para el usuario `juegos` y usá la URL SSH del repositorio.

```bash
sudo useradd --system --user-group --create-home --shell /usr/sbin/nologin juegos
sudo install -d -o juegos -g juegos /opt/juegos-eroticos
sudo -Hu juegos git clone https://github.com/HeroGanzo/Juegos-Eroticos.git /opt/juegos-eroticos
cd /opt/juegos-eroticos
# Si la preparación aún no está en la rama predeterminada, seleccioná la rama publicada:
# sudo -Hu juegos git switch NOMBRE_DE_LA_RAMA
sudo -Hu juegos env PATH=/opt/node22/bin:/usr/bin:/bin npm ci --include=dev
sudo -Hu juegos env PATH=/opt/node22/bin:/usr/bin:/bin NEXT_TELEMETRY_DISABLED=1 npm run build
sudo -Hu juegos mkdir -p .next/cache
```

**Si usás PostgreSQL local**, creá una base dedicada. En la consola de `psql` ejecutá lo siguiente; `\password` solicita la contraseña sin incluirla en el comando. Usá una contraseña aleatoria (por ejemplo, generada con `openssl rand -hex 32`, fácil de poner en una URL). Verificá que PostgreSQL escuche solo en loopback.

```bash
sudo systemctl enable --now postgresql
sudo -u postgres psql
```

```sql
CREATE ROLE juegos LOGIN;
\password juegos
CREATE DATABASE juegos_eroticos OWNER juegos;
\q
```

**Si vas a copiar tu base**, hacé una restauración de prueba **antes de iniciar la app** contra el destino. Usá la conexión **directa, sin pooler** del origen. El cliente `pg_dump` debe ser de versión mayor o igual que el servidor origen; procurá que PostgreSQL de destino sea de la misma versión mayor que el origen o más nuevo. Ubuntu 24.04 instala PostgreSQL 16 por defecto: si el origen es posterior, instalá antes una versión compatible o mantené la base administrada. Si usás extensiones, verificá que también existan en el destino.

```bash
# En el VPS; reemplazá los valores ORIGEN_* y el puerto por los de tu base de producción.
# -W pide la contraseña de cada base sin ponerla en el comando.
umask 077
PGSSLMODE=verify-full PGSSLROOTCERT=system pg_dump -h ORIGEN_HOST -p 5432 \
  -U ORIGEN_USUARIO -d ORIGEN_BASE -W --format=custom --file=origen.dump
pg_restore -h 127.0.0.1 -U juegos -d juegos_eroticos -W \
  --no-owner --no-privileges --exit-on-error --single-transaction origen.dump
```

Si tu cliente no admite `PGSSLROOTCERT=system`, usá la ruta a un certificado CA de confianza que indique tu proveedor. El volcado contiene datos privados: guardalo cifrado y fuera del repositorio. Para el corte usá un volcado nuevo y una **base vacía**, no vuelvas a restaurar sobre la copia de prueba. Podés crear otra base, por ejemplo `juegos_eroticos_final`, de la que `juegos` sea dueño, y actualizar `DATABASE_URL` para apuntar a ella.

Creá el archivo de entorno que leerá systemd. No se necesita conexión a la base para ejecutar el build.

```bash
sudo install -d -m 0750 /etc/juegos-eroticos
sudo install -m 0600 .env.example /etc/juegos-eroticos/app.env
sudoedit /etc/juegos-eroticos/app.env
```

- **Base local:** completá `DATABASE_URL=postgresql://juegos:TU_PASSWORD@127.0.0.1:5432/juegos_eroticos` con el nombre de la base elegida. Si la contraseña contiene caracteres especiales, codificalos para la URL.
- **Base remota:** usá la URL de producción y `DATABASE_SSL=verify-full` si el proveedor tiene un certificado de confianza. Permití la IP del VPS en el proveedor si hay una lista de IP autorizadas. No copies `VERCEL` ni variables internas del despliegue de Vercel.
- **Base nueva:** completá `ADMIN_USERNAME`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` con una contraseña aleatoria de al menos 16 caracteres. El servicio no permite crear el administrador con la contraseña de ejemplo. Podés quitar `ADMIN_PASSWORD` del archivo después de inicializar y verificar el acceso.
- **Base existente:** `ADMIN_*` no modifica el administrador que viene de Vercel. Usá sus credenciales actuales y cambialas antes de abrir el sitio si todavía son las predeterminadas.

## 4. Iniciá y probá sin dominio

```bash
sudo install -m 0644 deploy/hostinger/juegos-eroticos.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now juegos-eroticos
curl -fsS http://127.0.0.1:3000/api/health
sudo journalctl -u juegos-eroticos -n 60 --no-pager
```

El chequeo debería devolver `{"ok":true}`. Si lo corrés apenas arrancó y aún no responde, revisá con `sudo systemctl status juegos-eroticos` y volvé a probar. **Desde tu computadora**, dejá este túnel abierto:

```bash
ssh -N -L 127.0.0.1:3000:127.0.0.1:3000 TU_USUARIO@IP_DEL_VPS
```

Abrí `http://127.0.0.1:3000` en tu navegador. Probá portadas, `/login`, `/admin`, secciones VIP, imágenes ya subidas y reproducción de un video. Hacé pruebas de escritura (registro, edición y nuevas subidas) **solo en una copia de prueba** si Vercel sigue usando la base de producción. El túnel cifra el tráfico sin exponer un login por HTTP a Internet. Si el puerto local 3000 está ocupado, usá `127.0.0.1:3001:127.0.0.1:3000` y abrí el puerto 3001 en tu navegador.

## 5. Cuando tengas `juegosparaelganso.com`: DNS y HTTPS

1. En el panel que administra el DNS del dominio, creá un registro **A** para `@` con la IPv4 pública del VPS. Eliminá los registros conflictivos de ese nombre. Agregá un **AAAA** solo si tu VPS tiene IPv6 pública funcional; un AAAA antiguo puede romper el acceso y la emisión del certificado. Estas plantillas publican solo el dominio raíz, no `www`.
2. Permití TCP **80 y 443** tanto en el firewall de Hostinger como en UFW si lo activaste (`sudo ufw allow 'Nginx Full'`). Mantené el acceso SSH. Para otro dominio, reemplazá `juegosparaelganso.com` en ambos archivos de Nginx y en los comandos siguientes.
3. Instalá la configuración HTTP temporal. Solo sirve el desafío de Let's Encrypt; el sitio aún no publica el login.

```bash
sudo install -d -m 0755 /var/www/letsencrypt
sudo install -m 0644 deploy/hostinger/nginx-http.conf /etc/nginx/sites-available/juegos-eroticos
sudo ln -sfn /etc/nginx/sites-available/juegos-eroticos /etc/nginx/sites-enabled/juegos-eroticos
sudo nginx -t && sudo systemctl reload nginx
```

4. Cuando el DNS público resuelva al VPS, emití el certificado. Después activá la configuración HTTPS y la recarga automática al renovar.

```bash
sudo certbot certonly --webroot -w /var/www/letsencrypt -d juegosparaelganso.com
# Continuá solo si Certbot emitió el certificado correctamente.
sudo install -m 0644 deploy/hostinger/nginx-https.conf /etc/nginx/sites-available/juegos-eroticos
sudo nginx -t && sudo systemctl reload nginx
sudo install -m 0755 deploy/hostinger/reload-nginx.sh /etc/letsencrypt/renewal-hooks/deploy/reload-nginx
sudo systemctl enable --now certbot.timer
sudo certbot renew --dry-run
curl -fsS https://juegosparaelganso.com/api/health
```

Si moviste la base, **pausá las escrituras en Vercel antes del volcado final** (por ejemplo, restringí el acceso a todos los despliegues que la usan si tu plan lo permite). Restaurá en la base definitiva, actualizá el archivo de entorno, reiniciá el servicio y verificá por el túnel **antes de activar HTTPS público**. Si no podés asegurar la pausa, mantené temporalmente PostgreSQL en su proveedor actual y programá el traslado de datos para otra ventana.

## 6. Validación, vuelta atrás y mantenimiento

- Entrá desde el dominio por HTTPS y repetí la prueba de `/login`, `/admin`, catálogo, VIP y archivos. Si el dominio cambió, es normal que los usuarios tengan que volver a iniciar sesión: las cookies no se transfieren entre dominios.
- La URL `*.vercel.app` no puede apuntar al VPS. Actualizá los enlaces compartidos; cuando confirmes el corte, restringí o retirá la app anterior para que no acepte escrituras por separado. No elimines el proyecto, la base ni Blob hasta revisar sus dependencias y respaldos.
- **Vuelta atrás:** conservá el despliegue anterior. Si ambos comparten PostgreSQL, podés volver a dirigir tráfico a Vercel (o difundir su URL anterior) sin mover datos, siempre que el esquema siga siendo compatible. Si usaste una copia local y ya hubo escrituras nuevas en Hostinger, poné el sitio en mantenimiento y exportá o reconciliá esos cambios antes de reabrir Vercel. Cambiar el DNS no vuelve a sincronizar bases.
- **Backups:** programá volcados de PostgreSQL y conservá copias cifradas fuera del VPS. Respaldá aparte los Blob y el archivo de entorno (contiene secretos). Probá restaurar en una base aislada; una copia sin probar no alcanza para garantizar la recuperación.
- **Actualizar el código:** desde `/opt/juegos-eroticos`, respaldá la base y, para evitar servir un `.next` incompleto, pará el servicio antes de compilar en el mismo directorio. Ejecutá `sudo -Hu juegos git pull --ff-only`, repetí los comandos de `npm ci` y `npm run build` del paso 3 y volvé a iniciar con `sudo systemctl start juegos-eroticos`. Si actualizaste la unidad systemd, reinstalala y hacé `daemon-reload`. No vuelvas a copiar `.env.example` encima de la configuración productiva.
- **Diagnóstico:** `sudo journalctl -u juegos-eroticos -f` para la app; `sudo nginx -t` y `sudo tail -n 50 /var/log/nginx/error.log` para el proxy. Un `502` normalmente indica que Next.js no está escuchando; un `503` en `/api/health` indica que el sitio no pudo preparar o consultar la base. Si Nginx aún tiene la plantilla HTTP temporal, un `503` por HTTP fuera del desafío es intencional.

Para seguir desplegando en Vercel, consultá [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md).
