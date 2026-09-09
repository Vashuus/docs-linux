import { sanitizeSvg } from "./sanitize.js";

const DEFAULT_ICON =
  '<svg class="section__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>';

/**
 * Devuelve el icono de sección como SVG seguro y con la clase de tamaño.
 * El archivo vive en svg/<nombre>.svg; aquí solo se le añade la clase.
 */
function sectionIcon(name, iconMap) {
  const safe = name ? sanitizeSvg(iconMap[name]) : "";
  if (!safe) return DEFAULT_ICON;
  const head = safe.slice(0, safe.indexOf(">") + 1);
  if (/\sclass=/.test(head)) return safe;
  return safe.replace(/<svg\b/, '<svg class="section__icon"');
}

const CHEVRON =
  '<svg class="section__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

/**
 * Construye la lista de secciones y comandos en el sidebar.
 * @param {HTMLElement} nav  contenedor del sidebar
 * @param {Array} sections   array proveniente de data/sections.json
 * @param {(id:string)=>void} onSelect  callback al elegir un comando
 * @param {Record<string,string>} iconMap  SVG por nombre de icono (svg/<icon>.svg)
 */
export function buildSidebar(nav, sections, onSelect, iconMap = {}) {
  nav.innerHTML = "";

  sections.forEach((section) => {
    const el = document.createElement("div");
    el.className = "section";

    const items = (section.commands || [])
      .map(
        (cmd) =>
          `<li><a href="#" class="command" data-command="${cmd}"><span class="dot"></span>${cmd}</a></li>`
      )
      .join("");

    el.innerHTML = `
      <button class="section__header" type="button">
        ${sectionIcon(section.icon, iconMap)}
        <span class="section__name">${section.name}</span>
        ${CHEVRON}
      </button>
      <ul class="commands">${items}</ul>`;

    nav.appendChild(el);
  });

  nav.addEventListener("click", (e) => {
    const header = e.target.closest(".section__header");
    if (header) {
      header.parentElement.classList.toggle("is-open");
      return;
    }

    const cmd = e.target.closest(".command");
    if (!cmd) return;
    e.preventDefault();

    nav.querySelectorAll(".command.is-active").forEach((c) => c.classList.remove("is-active"));
    cmd.classList.add("is-active");
    onSelect(cmd.dataset.command);
  });
}

/**
 * Marca un comando como activo en el sidebar y abre su sección.
 * @param {HTMLElement} nav  contenedor del sidebar
 * @param {string} id        id del comando
 */
export function setActiveCommand(nav, id) {
  nav.querySelectorAll(".command.is-active").forEach((c) => c.classList.remove("is-active"));
  const link = nav.querySelector(`.command[data-command="${CSS.escape(id)}"]`);
  if (!link) return;
  link.classList.add("is-active");
  link.closest(".section")?.classList.add("is-open");
}

/**
 * Activa el botón para ocultar/mostrar el sidebar.
 */
export function initToggle(sidebar, toggle, content, header, footer) {
  toggle.addEventListener("click", () => {
    const hidden = sidebar.classList.toggle("is-hidden");
    toggle.classList.toggle("is-hidden", hidden);
    content.classList.toggle("is-wide", hidden);
    if (header) header.classList.toggle("is-wide", hidden);
    if (footer) footer.classList.toggle("is-wide", hidden);
    toggle.setAttribute("aria-label", hidden ? "Mostrar menú" : "Ocultar menú");
  });
}
