# Guía de contribución

¡Gracias por querer aportar! Este repositorio es una documentación de comandos
de Linux y una colección de scripts. Hay dos formas de ayudar.

## 1. Pedir un comando o un script que falte

Abrí un *issue* usando las plantillas:
- **Solicitud de comando**: pediste un comando que no está documentado.
- **Solicitud de script**: pediste un script que no existe.

Un mantenedor lo revisa y, si corresponde, lo agrega.

## 2. Enviar un comando o un script

### Estructura de datos
- Los comandos viven en `data/commands/<id>.json`.
- Los scripts viven en `data/scripts/<id>.json` + el archivo en `scripts/<id>.sh`.
- Las secciones y su orden están en `data/sections.json`.
- Los iconos están en `svg/` (ver `svg/icons.txt` para los disponibles).

### Reglas
- Un `id` = nombre del archivo: minúsculas, sin espacios ni acentos (`a-z0-9-`).
- Referenciá solo archivos que existan en el repo (icono y script).
- Los scripts deben ser **Bash compatible** cuando apliquen, con `set -euo pipefail`
  y sin comandos destructivos sin confirmación.
- Los scripts se sirven **solo para lectura** en el contenedor: no necesitan permiso
  de ejecución en el repo.
- Nada de secretos, tokens ni datos personales.
- Los iconos SVG deben respetar lo descrito en `svg/icons.txt`
  (sin `<script>`, sin `on*`, sin enlaces externos).

### Antes de abrir el PR
1. Ejecutá el validador: `node tools/validate.mjs`
2. Verificá localmente: `docker compose up` y abrí http://localhost:8090
3. Completá la plantilla del PR.

### Revisión
- Los scripts son revisados por otros usuarios contribuidores antes de aceptarse.
- Un mantenedor hace la revisión final y el merge.

## Estilo e idioma
- Documentación de cara al usuario: **español**, tono claro y directo.
- Código, comentarios de scripts y **mensajes de commit: inglés**.
- Nada de contenido ofensivo, malicioso ni ilegal.
- Aportes bajo la licencia del repositorio (GPL-3.0-or-later).

## Código de conducta
Sé respetuoso. No se tolera acoso ni discriminación de ningún tipo.
