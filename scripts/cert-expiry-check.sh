#!/usr/bin/env bash
#
# cert-expiry-check.sh — Avisa sobre certificados SSL próximos a vencer.
#
# Requisitos: openssl, find, coreutils
# Confiabilidad estimada de funcionar correctamente en todos los entornos (Debian/Ubuntu): 90%
# Revisa certificados .crt/.pem en un directorio y/o hosts remotos.
# Solo lectura: no modifica el sistema.
#
set -euo pipefail

WARN_DAYS=30
DIR="/etc/ssl/certs"
REMOTE=""

usage() {
  cat <<'EOF'
Uso: cert-expiry-check.sh [opciones]

Revisa la fecha de vencimiento de certificados locales y/o remotos HTTPS.

Opciones:
  -d, --dir RUTA     Directorio con certificados (por defecto /etc/ssl/certs)
  -h, --host HOST    También revisar un host remoto (ej: ejemplo.com:443)
  -w, --warn N       Días de aviso previo (por defecto 30)
      --help         Muestra esta ayuda

Ejemplos:
  ./cert-expiry-check.sh
  ./cert-expiry-check.sh -d /etc/nginx/ssl -w 15
  ./cert-expiry-check.sh --host github.com:443
EOF
}

have() { command -v "$1" >/dev/null 2>&1; }

while [ $# -gt 0 ]; do
  case "$1" in
    -d|--dir) DIR="${2:?falta la ruta}"; shift ;;
    -h|--host) REMOTE="${2:?falta el host}"; shift ;;
    -w|--warn) WARN_DAYS="${2:?falta N}"; shift ;;
    --help) usage; exit 0 ;;
    *) echo "Opción desconocida: $1" >&2; usage; exit 2 ;;
  esac
  shift
done

have openssl || { echo "Error: falta 'openssl'." >&2; exit 1; }

now="$(date +%s)"
alert=0

check_end() {
  local label="$1" end="$2"
  local end_s days
  end_s="$(date -d "$end" +%s 2>/dev/null || echo 0)"
  [ "$end_s" -eq 0 ] && { echo "  $label: fecha inválida ($end)"; return; }
  days=$(( (end_s - now) / 86400 ))
  if [ "$days" -lt 0 ]; then
    printf '  %-40s VENCIDO hace %d días\n' "$label" "$((-days))"
    alert=1
  elif [ "$days" -lt "$WARN_DAYS" ]; then
    printf '  %-40s vence en %d días (%s)\n' "$label" "$days" "$end"
    alert=1
  else
    printf '  %-40s vence en %d días\n' "$label" "$days"
  fi
}

if [ -n "$REMOTE" ]; then
  echo ">> Certificado remoto ${REMOTE}:"
  end="$(echo | openssl s_client -servername "${REMOTE%%:*}" -connect "$REMOTE" 2>/dev/null \
        | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || true)"
  if [ -n "$end" ]; then
    check_end "$REMOTE" "$end"
  else
    echo "  No se pudo obtener el certificado de $REMOTE (¿puerto/host/timeout?)."
    alert=1
  fi
  echo
fi

if [ -d "$DIR" ]; then
  echo ">> Certificados locales en ${DIR}:"
  found=0
  while IFS= read -r crt; do
    found=$((found + 1))
    end="$(openssl x509 -in "$crt" -noout -enddate 2>/dev/null | cut -d= -f2 || true)"
    [ -n "$end" ] && check_end "$(basename "$crt")" "$end"
  done < <(find "$DIR" -maxdepth 2 -type f \( -name '*.crt' -o -name '*.pem' \) 2>/dev/null | head -n 200)
  [ "$found" -eq 0 ] && echo "  (no se encontraron certificados .crt/.pem)"
else
  [ -z "$REMOTE" ] && { echo "Error: '$DIR' no es un directorio." >&2; exit 1; }
fi

echo
if [ "$alert" -eq 0 ]; then
  echo ">> Ningún certificado vence en los próximos ${WARN_DAYS} días."
  exit 0
fi
echo ">> ATENCIÓN: hay certificados por vencer o vencidos."
exit 1
