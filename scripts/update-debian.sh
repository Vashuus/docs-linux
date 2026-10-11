#!/usr/bin/env bash
#
# update-debian.sh - Actualiza un sistema Debian/Ubuntu.
#
set -e

echo "Holita, aqui actualizando Debian."

echo ">> Actualizando indices de paquetes..."
sudo apt update

echo ">> Instalando actualizaciones..."
sudo apt upgrade -y
sudo apt full-upgrade -y

echo ">> Limpiando paquetes obsoletos..."
sudo apt autoremove -y
sudo apt autoclean

echo ">> Debian actualizado. Listo!"
