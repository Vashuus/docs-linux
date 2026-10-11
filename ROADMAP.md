# Roadmap — ShellLinux

Ampliación de contenido: prioridad 1 (núcleo Linux) y prioridad 2 (gestores de
paquetes) completadas, más extras (shell y editores). OSINT/seguridad quedan para
después.

Leyenda: `[x]` hecho · `[~]` en progreso · `[ ]` pendiente

## Prioridad 1 — Núcleo Linux (uso diario y sysadmin) — COMPLETADA

- [x] **Archivos y directorios** (`archivos`, 18): ls, cd, pwd, cp, mv, rm, mkdir, rmdir, touch, ln, tree, file, stat, basename, dirname, realpath, readlink, rename
- [x] **Procesamiento de texto** (`texto`, 25): cat, tac, head, tail, less, more, grep, sed, awk, cut, sort, uniq, tr, wc, diff, comm, paste, tee, xargs, printf, echo, fold, column, rev, strings
- [x] **Permisos y propietarios** (`permisos`, 11): chmod, chown, chgrp, umask, getfacl, setfacl, chattr, lsattr, su, sudo, visudo
- [x] **Usuarios y grupos** (`usuarios`, 17): useradd, adduser, usermod, userdel, groupadd, groupmod, groupdel, passwd, chage, id, groups, who, w, last, lastlog, whoami, gpasswd
- [x] **Procesos y recursos** (`procesos`, 25): ps, top, htop, kill, killall, pkill, pgrep, nice, renice, jobs, fg, bg, nohup, watch, time, timeout, lsof, strace, ltrace, at, crontab, screen, tmux, pstree, pidof
- [x] **Sistema e información** (`sistema`, 29): uname, hostname, uptime, free, vmstat, iostat, sar, date, cal, timedatectl, locale, localectl, dmesg, sysctl, lsmod, modprobe, insmod, rmmod, modinfo, lscpu, lspci, lsusb, lshw, dmidecode, nproc, ulimit, reboot, shutdown, poweroff
- [x] **Discos y almacenamiento** (`disco`, 22): df, du, mount, umount, lsblk, blkid, fdisk, parted, mkfs, mkswap, swapon, swapoff, fsck, e2fsck, tune2fs, findmnt, dd, sync, pvcreate, vgcreate, lvcreate, mdadm
- [x] **Compresión y empaquetado** (`compresion`, 12): tar, gzip, gunzip, bzip2, xz, zstd, zip, unzip, 7z, zcat, zless, unrar
- [x] **Redes** (`redes`, 32): ip, ifconfig, ping, traceroute, mtr, ss, netstat, dig, nslookup, host, whois, curl, wget, nc, telnet, ssh, scp, sftp, rsync, ssh-keygen, ssh-copy-id, arp, ethtool, nmcli, nmtui, socat, openssl, firewall-cmd, ufw, iptables, nft, tcpdump
- [x] **Servicios y systemd** (`servicios`, 8): systemctl, service, journalctl, systemd-analyze, systemd-run, loginctl, chkconfig, update-rc.d

## Prioridad 2 — Gestión de paquetes — COMPLETADA

- [x] **Gestión de paquetes** (`paquetes`, 18)
  - [x] Debian/Ubuntu: apt, apt-get, apt-cache, dpkg, add-apt-repository
  - [x] RHEL/Fedora/CentOS: dnf, yum, rpm
  - [x] Arch: pacman, yay (AUR)
  - [x] openSUSE: zypper
  - [x] Alpine: apk
  - [x] Gentoo: emerge
  - [x] Void: xbps-install
  - [x] NixOS: nix-env
  - [x] Universales: flatpak, snap, pip

## Extras — COMPLETADOS

- [x] **Shell y scripting** (`shell`, 18): bash, sh, source, export, env, read, test, eval, exec, trap, set, unset, alias, unalias, history, seq, yes, getopts
- [x] **Editores de texto** (`editores`, 5): nano, vim, vi, emacs, micro

## Prioridad 3 — OSINT y ciberseguridad — COMPLETADA

- [x] **Reconocimiento y escaneo** (`recon`, 37): nmap, masscan, netdiscover, arp-scan, fping, hping3, dnsenum, dnsrecon, fierce, theharvester, sublist3r, amass, subfinder, assetfinder, dnsx, httpx, gau, waybackurls, whatweb, wafw00f, nikto, dirb, gobuster, ffuf, wfuzz, dirsearch, feroxbuster, wpscan, enum4linux, smbclient, smbmap, ldapsearch, snmpwalk, onesixtyone, showmount, nbtscan, eyewitness
- [x] **Fuerza bruta y cracking** (`passwords`, 21): john, hashcat, hydra, medusa, ncrack, patator, crunch, cewl, cupp, hash-identifier, hashid, unshadow, ophcrack, fcrackzip, pdfcrack, rarcrack, zip2john, ssh2john, keepass2john, findmyhash, samdump2
- [x] **Explotación y post-explotación** (`explotacion`, 24): msfconsole, msfvenom, searchsploit, sqlmap, commix, xsser, beef-xss, setoolkit, veil, routersploit, responder, crackmapexec, impacket, psexec, wmiexec, evil-winrm, bloodhound, mimikatz, meterpreter, chisel, ligolo-ng, nishang, empire, sliver
- [x] **Análisis forense** (`forense`, 21): volatility, autopsy, sleuthkit, foremost, scalpel, binwalk, exiftool, steghide, zsteg, bulk-extractor, photorec, testdisk, dc3dd, ewfacquire, radare2, ghidra, objdump, readelf, nm, hexdump, xxd
- [x] **Redes inalámbricas y MITM** (`wireless`, 20): aircrack-ng, airmon-ng, airodump-ng, aireplay-ng, airbase-ng, wifite, reaver, bully, wash, pixiewps, bettercap, ettercap, mitmproxy, arpspoof, macchanger, kismet, wifiphisher, hostapd-wpe, cowpatty, hcxdumptool
- [x] **Anonimato y OSINT** (`osint`, 21): tor, torsocks, proxychains, anonsurf, dnscrypt-proxy, openvpn, wg, sherlock, maigret, holehe, recon-ng, spiderfoot, maltego, shodan, censys, metagoofil, ghunt, snscrape, h8mail, blackbird, whatsmyname

## Infraestructura

- [x] Buscador con filtros por campo (`#`)
- [x] Validación de datos y CI
- [x] Endurecimiento de Docker
- [x] Deploy a GitHub Pages
- [x] Iconos de sección unificados en `svg/` (sin mapa inline duplicado)
- [x] `tools/validate.mjs` en verde tras el lote de contenido
