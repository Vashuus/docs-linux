# ShellLinux — Documentación de comandos de Linux

Sitio estático para consultar comandos de Linux y una colección de scripts de
mantenimiento. Tema claro/oscuro, resaltado de sintaxis, copiado rápido y visor
de scripts con descarga.

> English version: [README-en.md](README-en.md)

## Características

- Catálogo de comandos por secciones (sintaxis, opciones y ejemplos).
- Sección de **Scripts** con visor modal, resaltado de sintaxis, copiar y descargar.
- Tema claro/oscuro persistente.
- Diseño responsive y liviano, sin backend.
- Contenido en archivos JSON fáciles de ampliar.
- Validación de datos y CI (lint, secretos, contenedor).

## Cómo ejecutarlo

### Con Docker (recomendado)

```bash
docker compose up -d
# Abrir http://localhost:8090
```

Al editar `html/`, `css/`, `js/`, `data/`, `svg/` o `scripts/`, el sitio se
recarga solo (browser-sync con volúmenes de solo lectura).

### Sin Docker

Requiere Node.js 20+.

```bash
npm install -g browser-sync@2.29.3
browser-sync start --config browser-sync.config.js
# Abrir http://localhost:8080
```

## Estructura del proyecto

```
html/      index.html (página)
css/       estilos (tema, layout, modal...)
js/        lógica del sitio (módulos ES)
data/      contenido: sections.json, commands/, scripts/
svg/       iconos (ver svg/icons.txt)
scripts/   scripts de shell publicados
tools/     validador y schemas JSON
```

## Agregar contenido

Todo el contenido vive en `data/`:

- **Sección**: añadir una entrada en `data/sections.json`.
- **Comando**: crear `data/commands/<id>.json`.
- **Script**: crear `data/scripts/<id>.json` y el archivo en `scripts/<id>.sh`.
- **Icono**: ver los disponibles en `svg/icons.txt`.

Reglas: el `id` debe coincidir con el nombre del archivo (`a-z0-9-`), y solo se
pueden referenciar archivos que existan en el repositorio.

Antes de enviar cambios:

```bash
node tools/validate.mjs
```

## Publicación

El sitio se publica en GitHub Pages mediante `.github/workflows/pages.yml`, que
arma el contenido y lo despliega. Para activarlo: **Settings → Pages → Source:
GitHub Actions**.

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md). Las ideas y pedidos de comandos/scripts
se reciben por *issues*.

## Seguridad

Ver [SECURITY.md](SECURITY.md). Los iconos SVG se sanean en el cliente antes de
mostrarse.

## Licencia

[GPL-3.0](LICENSE).

## Convenciones

- Documentación de cara al usuario: **español**.
- Código, comentarios de scripts y mensajes de commit: **inglés**.
