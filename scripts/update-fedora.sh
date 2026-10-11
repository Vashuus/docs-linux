#!/usr/bin/env bash
#
# update-fedora.sh - Actualiza un sistema Fedora.
#
set -e

echo "Actualizando Fedora..."

echo ">> Refrescando metadatos y aplicando actualizaciones..."
sudo dnf upgrade --refresh -y

echo ">> Limpiando paquetes huerfanos..."
sudo dnf autoremove -y

echo "Fedora actualizado. Listo!"
