# Política de seguridad

Este es un sitio **estático**: no procesa datos de usuarios ni tiene backend.
El riesgo principal son los **contenidos aportados por la comunidad**
(especialmente iconos SVG y scripts) y el endurecimiento del contenedor.

## Cómo reportar
No abras un issue público para vulnerabilidades. Escribí a:

> **<CONTACTO>** (completar antes de publicar)

Incluí: descripción, pasos para reproducir, impacto y, si podés, una propuesta de
solución. Respondemos dentro de los 7 días.

## Alcance
- Inyección XSS vía SVG o metadatos inyectados en el DOM.
- Enlaces o recursos externos maliciosos.
- Scripts que hagan algo distinto a lo documentado.
- Fugas de secretos en el repositorio.
- Debilidades de la imagen/imagen de contenedor.

## Medidas aplicadas
- Los SVG se **sanitizan** en el cliente antes de inyectarlos (`js/sanitize.js`).
- Los valores se escapan (`escapeHtml`/`escapeAttr`).
- CI valida los datos, escanea secretos (gitleaks) y la imagen (trivy).
- Revisión por pares antes del merge.

## Fuera de alcance
- El uso que cada usuario haga de los scripts en su propio sistema.
- Ataques de denegación de servicio contra el hosting estático.
