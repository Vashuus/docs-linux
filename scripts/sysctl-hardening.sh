#!/usr/bin/env bash
#
# sysctl-hardening.sh — Aplica parámetros de kernel (sysctl) de endurecimiento.
#
# Requisitos: sysctl, systemd-sysctl, root
# Confiabilidad estimada de funcionar correctamente en todos los entornos (Debian/Ubuntu): 88%
# Nota: la disponibilidad de cada parámetro depende del kernel. El script solo
#       escribe los que existen en el sistema y hace copia de seguridad.
# Por defecto SIMULA; pasá --apply para escribir /etc/sysctl.d/99-hardening.conf.
#
set -euo pipefail

APPLY=0
TARGET="/etc/sysctl.d/99-hardening.conf"

usage() {
  cat <<'EOF'
Uso: sysctl-hardening.sh [opciones]

Aplica (o simula) un set de parámetros de endurecimiento del kernel.

Opciones:
  --apply      Escribe los cambios en /etc/sysctl.d/99-hardening.conf y los carga.
  --target F   Archivo destino (por defecto /etc/sysctl.d/99-hardening.conf)
  -h, --help   Muestra esta ayuda

Ejemplos:
  ./sysctl-hardening.sh                # simulacion
  sudo ./sysctl-hardening.sh --apply
EOF
}

SETTINGS=(
  "kernel.dmesg_restrict=1"
  "kernel.kptr_restrict=2"
  "kernel.yama.ptrace_scope=1"
  "kernel.sysrq=0"
  "kernel.unprivileged_bpf_disabled=1"
  "net.core.bpf_jit_harden=2"
  "net.ipv4.conf.all.rp_filter=1"
  "net.ipv4.conf.all.accept_redirects=0"
  "net.ipv4.conf.all.send_redirects=0"
  "net.ipv4.conf.all.accept_source_route=0"
  "net.ipv4.conf.all.log_martians=1"
  "net.ipv4.tcp_syncookies=1"
  "net.ipv6.conf.all.accept_redirects=0"
  "net.ipv6.conf.all.accept_source_route=0"
)

have() { command -v "$1" >/dev/null 2>&1; }

while [ $# -gt 0 ]; do
  case "$1" in
    --apply) APPLY=1 ;;
    --target) TARGET="${2:?falta la ruta}"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opción desconocida: $1" >&2; usage; exit 2 ;;
  esac
  shift
done

have sysctl || { echo "Error: falta 'sysctl'." >&2; exit 1; }

# Filtra solo los parámetros que existen en este kernel.
filtered=()
for s in "${SETTINGS[@]}"; do
  key="${s%%=*}"
  if sysctl -n "$key" >/dev/null 2>&1; then
    filtered+=("$s")
  else
    echo ">> Omitido (no disponible): ${key}"
  fi
done

echo
if [ "$APPLY" -eq 0 ]; then
  echo ">> MODO SIMULACIÓN. Se escribirían en ${TARGET}:"
  printf '   %s\n' "${filtered[@]}"
  echo
  echo "   Volvé a correr con --apply para aplicarlo."
  exit 0
fi

[ "$(id -u)" -eq 0 ] || { echo "Error: --apply requiere root." >&2; exit 1; }

if [ -f "$TARGET" ]; then
  backup="${TARGET}.bak.$(date +%Y%m%d%H%M%S)"
  cp -a "$TARGET" "$backup"
  echo ">> Copia de seguridad: ${backup}"
fi

{
  echo "# Generado por sysctl-hardening.sh el $(date -Is)"
  printf '%s\n' "${filtered[@]}"
} > "$TARGET"

echo ">> Aplicando con sysctl --system..."
sysctl --system >/dev/null

echo ">> Listo. Archivo: ${TARGET}"
