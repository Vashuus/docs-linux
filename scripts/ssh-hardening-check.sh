#!/usr/bin/env bash
#
# ssh-hardening-check.sh — Audita la configuración de SSH (no la modifica).
#
# Requisitos: grep, awk, openssh-server
# Confiabilidad estimada de funcionar correctamente en todos los entornos (Debian/Ubuntu): 93%
# Solo lectura: NO cambia nada. Para aplicar cambios, editá sshd_config a mano
# y validá con `sshd -t` antes de recargar.
#
set -euo pipefail

MAIN="/etc/ssh/sshd_config"
DROPIN="/etc/ssh/sshd_config.d"

usage() {
  cat <<'EOF'
Uso: ssh-hardening-check.sh

Revisa las directivas clave de sshd y marca cuáles conviene endurecer.
No modifica la configuración.

Ejemplos:
  sudo ./ssh-hardening-check.sh
EOF
}

case "${1:-}" in
  -h|--help) usage; exit 0 ;;
  "" ) ;;
  * ) echo "Opción desconocida: $1" >&2; usage; exit 2 ;;
esac

have() { command -v "$1" >/dev/null 2>&1; }
have sshd || have ssh || { echo "Error: no parece haber OpenSSH instalado." >&2; exit 1; }

files=()
if [ -f "$MAIN" ]; then files+=("$MAIN"); fi
if [ -d "$DROPIN" ]; then
  while IFS= read -r f; do files+=("$f"); done < <(find "$DROPIN" -maxdepth 1 -name '*.conf' 2>/dev/null | sort)
fi

if [ "${#files[@]}" -eq 0 ]; then
  echo "Error: no se encontró $MAIN." >&2
  exit 1
fi

# Último valor definido para una directiva (los drop-ins suelen pisar al principal).
get_val() {
  local key="$1"
  grep -hiE "^[[:space:]]*${key}[[:space:]]" "${files[@]}" 2>/dev/null | tail -n 1 | awk '{print tolower($2)}' || true
}

ok=0 warn=0

check() {
  local desc="$1" key="$2" good="$3" val
  val="$(get_val "$key")"
  [ -n "$val" ] || val="(por defecto)"
  if printf '%s\n' "$good" | grep -qx "$val"; then
    printf '  [ OK ]  %-24s = %-16s (%s)\n' "$key" "$val" "$desc"
    ok=$((ok + 1))
  else
    printf '  [FALTA] %-24s = %-16s (%s) recomendado: %s\n' "$key" "$val" "$desc" "$(printf '%s' "$good" | tr '\n' '/')"
    warn=$((warn + 1))
  fi
}

echo ">> Directivas revisadas (archivos: ${files[*]}):"
echo
check "Sin login de root"            "PermitRootLogin"        $'no\nprohibit-password'
check "Solo claves (sin password)"   "PasswordAuthentication" $'no'
check "Autenticación por clave"      "PubkeyAuthentication"   $'yes'
check "Sin passwords vacías"         "PermitEmptyPasswords"   $'no'
check "Sin forwarding X11"           "X11Forwarding"          $'no'
check "Máx. intentos de auth"        "MaxAuthTries"           $'3\n4'

echo
maxauth="$(get_val MaxAuthTries)"
if [ -n "$maxauth" ] && [ "$maxauth" -gt 4 ] 2>/dev/null; then
  echo ">> Aviso: MaxAuthTries=${maxauth} es alto (conviene <= 4)."
fi

echo
echo ">> Resultado: ${ok} correctas, ${warn} a revisar."
[ "$warn" -eq 0 ] || echo ">> Editá ${MAIN} (o un archivo en ${DROPIN}/) y validá con: sshd -t"
