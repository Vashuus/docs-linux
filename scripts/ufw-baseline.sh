#!/usr/bin/env bash
#
# ufw-baseline.sh — Configura UFW con una base segura (deny incoming, allow SSH).
#
# Requisitos: ufw, root
# Confiabilidad estimada de funcionar correctamente en todos los entornos (Debian/Ubuntu): 86%
# Nota: el nombre del servicio SSH puede variar (OpenSSH vs ssh); se detecta el
#       puerto desde sshd_config. Verificá la consola antes de perder el acceso.
# Por defecto SIMULA; pasá --apply para aplicar (pide confirmación).
#
set -euo pipefail

APPLY=0
SSH_PORT=""

usage() {
  cat <<'EOF'
Uso: ufw-baseline.sh [opciones]

Deja UFW con política deny incoming / allow outgoing y permite SSH.

Opciones:
  --apply        Aplica los cambios (pide confirmación).
  --ssh-port N   Puerto SSH a permitir (por defecto se detecta en sshd_config).
  -h, --help     Muestra esta ayuda

Ejemplos:
  ./ufw-baseline.sh                 # simulacion
  sudo ./ufw-baseline.sh --apply
  sudo ./ufw-baseline.sh --apply --ssh-port 2222
EOF
}

have() { command -v "$1" >/dev/null 2>&1; }

while [ $# -gt 0 ]; do
  case "$1" in
    --apply) APPLY=1 ;;
    --ssh-port) SSH_PORT="${2:?falta el puerto}"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opción desconocida: $1" >&2; usage; exit 2 ;;
  esac
  shift
done

have ufw || { echo "Error: falta 'ufw' (apt install ufw)." >&2; exit 1; }

# Detectar el puerto SSH si no se indicó.
if [ -z "$SSH_PORT" ]; then
  SSH_PORT="$(grep -hiE '^[[:space:]]*Port[[:space:]]' /etc/ssh/sshd_config /etc/ssh/sshd_config.d/*.conf 2>/dev/null | tail -n1 | awk '{print $2}')"
  SSH_PORT="${SSH_PORT:-22}"
fi

echo ">> Puerto SSH detectado: ${SSH_PORT}"
echo

if [ "$APPLY" -eq 0 ]; then
  echo ">> MODO SIMULACIÓN. Se ejecutaría:"
  echo "   ufw default deny incoming"
  echo "   ufw default allow outgoing"
  echo "   ufw allow ${SSH_PORT}/tcp"
  echo "   ufw --force enable"
  echo
  echo ">> Estado actual:"
  ufw status verbose 2>/dev/null || true
  echo
  echo "   Volvé a correr con --apply para aplicarlo."
  exit 0
fi

[ "$(id -u)" -eq 0 ] || { echo "Error: --apply requiere root." >&2; exit 1; }

echo ">> ATENCIÓN: si no permitís el puerto SSH correcto podés perder el acceso remoto."
read -r -p "¿Aplicar el baseline de UFW permitiendo el puerto ${SSH_PORT}? [s/N] " ans
case "$ans" in
  s|S|y|Y) ;;
  *) echo ">> Cancelado."; exit 0 ;;
esac

ufw default deny incoming
ufw default allow outgoing
ufw allow "${SSH_PORT}/tcp"
ufw --force enable

echo
ufw status verbose || true
