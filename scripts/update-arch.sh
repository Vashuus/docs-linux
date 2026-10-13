#!/usr/bin/env bash
#
# update-arch.sh - Update an Arch Linux system (rolling release).
#
# Usage: sudo ./update-arch.sh
#
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "This script must be run as root (use: sudo ./update-arch.sh)" >&2
  exit 1
fi

echo ">> Syncing repositories..."
pacman -Sy

echo ">> Applying system upgrades..."
pacman -Su --noconfirm

echo ">> Removing orphan packages..."
if orphans=$(pacman -Qtdq 2>/dev/null) && [[ -n "${orphans}" ]]; then
  mapfile -t pkgs <<< "${orphans}"
  pacman -Rns --noconfirm "${pkgs[@]}"
else
  echo "   No orphan packages found."
fi

echo ">> Cleaning the package cache..."
pacman -Sc --noconfirm

echo ">> Arch Linux updated. Done!"
