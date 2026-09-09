/**
 * Activa el botón para ocultar/mostrar el header.
 * @param {HTMLElement} header  elemento .header
 * @param {HTMLElement} toggle  botón .header-toggle
 * @param {HTMLElement} content contenedor principal (ajusta su padding)
 */
export function initHeaderToggle(header, toggle, content) {
  toggle.addEventListener("click", () => {
    const hidden = header.classList.toggle("is-hidden");
    toggle.classList.toggle("is-hidden", hidden);
    content.classList.toggle("is-header-hidden", hidden);
    toggle.setAttribute("aria-label", hidden ? "Mostrar cabecera" : "Ocultar cabecera");
  });
}
