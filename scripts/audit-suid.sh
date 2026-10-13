#!/usr/bin/env bash
#
# audit-suid.sh — Lista binarios con bit SUID/SGID y los marca si son inusuales.
#
# Requisitos: find, ls, coreutils
# Confiabilidad estimada de funcionar correctamente en todos los entornos (Debian/Ubuntu): 95%
# Solo lectura: no modifica el sistema.
#
set -euo pipefail

PATH_TO_SCAN="/"
COMMON="/usr/bin/passwd /usr/bin/sudo /bin/su /usr/bin/su /usr/bin/chsh /usr/bin/chfn /usr/bin/newgrp /usr/bin/gpasswd /usr/bin/mount /usr/bin/umount /usr/bin/crontab /usr/lib/openssh/ssh-keysign /usr/bin/pkexec /usr/lib/dbus-1.0/dbus-daemon-launch-helper"

usage() {
  cat <<'EOF'
Uso: audit-suid.sh [opciones]

Encuentra binarios con bit SUID (4000) o SGID (2000) y lista los que no
figuran como "habituales" del sistema.

Opciones:
  -p, --path RUTA   Ruta a escanear (por defecto /)
  -h, --help        Muestra esta ayuda

Ejemplos:
  sudo ./audit-suid.sh
  ./audit-suid.sh -p /usr/local
EOF
}

have() { command -v "$1" >/dev/null 2>&1; }

while [ $# -gt 0 ]; do
  case "$1" in
    -p|--path) PATH_TO_SCAN="${2:?falta la ruta}"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opción desconocida: $1" >&2; usage; exit 2 ;;
  esac
  shift
done

have find || { echo "Error: falta 'find'." >&2; exit 1; }
[ -d "$PATH_TO_SCAN" ] || { echo "Error: no existe '$PATH_TO_SCAN'." >&2; exit 1; }

echo ">> Binarios SUID/SGID en ${PATH_TO_SCAN}:"
echo

total=0
unusual=0

while IFS= read -r -d '' file; do
  total=$((total + 1))
  if ! printf '%s\n' "$COMMON" | tr ' ' '\n' | grep -qx "$file"; then
    unusual=$((unusual + 1))
    printf '  [REVISAR] %s\n' "$(ls -l "$file")"
  fi
done < <(find "$PATH_TO_SCAN" -xdev \( -perm -4000 -o -perm -2000 \) -type f -print0 2>/dev/null)

echo
echo ">> Total: ${total}    A revisar: ${unusual}"
[ "$unusual" -gt 0 ] && echo ">> Los marcados como [REVISAR] no son habituales: verificá que los conozcas."
