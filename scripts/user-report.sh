#!/usr/bin/env bash
#
# user-report.sh — Reporte de cuentas de usuario del sistema.
#
# Requisitos: awk, grep, coreutils (opcional: passwd, lastlog)
# Confiabilidad estimada de funcionar correctamente en todos los entornos (Debian/Ubuntu): 95%
# Algunos datos (estado de contraseña) requieren root.
# Solo lectura: no modifica el sistema.
#
set -euo pipefail

usage() {
  cat <<'EOF'
Uso: user-report.sh

Lista las cuentas humanas (UID >= 1000), sus shells, su home y:
  - último acceso (si hay lastlog/last)
  - estado de la contraseña (requiere root)
  - cuentas SIN contraseña (requiere root)

Ejemplos:
  sudo ./user-report.sh
  ./user-report.sh
EOF
}

case "${1:-}" in
  -h|--help) usage; exit 0 ;;
  "" ) ;;
  * ) echo "Opción desconocida: $1" >&2; usage; exit 2 ;;
esac

have() { command -v "$1" >/dev/null 2>&1; }

echo ">> Cuentas humanas (UID >= 1000):"
printf '%-16s %-6s %-22s %s\n' "USUARIO" "UID" "HOME" "SHELL"
awk -F: '$3>=1000 && $3<65534 { printf "%-16s %-6s %-22s %s\n", $1, $3, $6, $7 }' /etc/passwd

echo
echo ">> Último acceso (si está disponible):"
if have lastlog; then
  lastlog 2>/dev/null | awk 'NR==1 || $2!="**Never logged in**"' || true
elif have last; then
  last -n 10 2>/dev/null || true
else
  echo "  (ni lastlog ni last disponibles)"
fi

if [ "$(id -u)" -eq 0 ]; then
  echo
  echo ">> Estado de contraseñas (passwd -S):"
  awk -F: '$3>=1000 && $3<65534 { print $1 }' /etc/passwd | while read -r user; do
    passwd -S "$user" 2>/dev/null || true
  done

  echo
  echo ">> Cuentas SIN contraseña (según /etc/shadow):"
  awk -F: '$2=="" { print "  " $1 }' /etc/shadow 2>/dev/null || echo "  (no se pudo leer /etc/shadow)"
  echo "  (una cuenta sin contraseña puede ingresar sin autenticarse: revisar)"
else
  echo
  echo ">> Saltando estado de contraseñas: se requiere root (sudo)."
fi
