## Qué cambia

<!-- Describí brevemente el comando/script aportado o modificado. -->

## Tipo

- [ ] Nuevo comando
- [ ] Nuevo script
- [ ] Corrección / mejora
- [ ] Documentación / infraestructura

## Checklist

- [ ] El `id` coincide con el nombre del archivo (minúsculas, `a-z0-9-`).
- [ ] El icono referenciado existe en `svg/`.
- [ ] (Scripts) El archivo existe en `scripts/` y no es destructivo.
- [ ] Los scripts usan `set -euo pipefail` y comentarios claros.
- [ ] Corrí `node tools/validate.mjs` sin errores.
- [ ] Probé localmente con `docker compose up` (http://localhost:8090).
- [ ] No incluí secretos, tokens ni datos personales.
- [ ] El SVG (si aplica) no tiene `<script>`, `on*` ni enlaces externos.

## Notas para quien revisa

<!-- Cosas a tener en cuenta, dudas, links, etc. -->
