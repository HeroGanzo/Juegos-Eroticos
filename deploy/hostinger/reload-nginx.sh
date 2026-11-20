#!/bin/sh
# Hook de Certbot: Nginx vuelve a leer el certificado renovado.
set -eu
/usr/sbin/nginx -t
/usr/bin/systemctl reload nginx
