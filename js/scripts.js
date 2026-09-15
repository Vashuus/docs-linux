import { escapeHtml, escapeAttr } from "./doc.js";
import { sanitizeSvg } from "./sanitize.js";

/**
 * Renderiza la sección de scripts como tarjetas acordeón.
 * Cada script ya trae el código (code) y el icono inline (iconSvg).
 * @param {HTMLElement} content   contenedor principal
 * @param {string} sectionName    nombre de la sección
 * @param {Array}  scripts        [{ id, title, description, lang, code, iconSvg }]
 * @param {string} activeId       id del script que debe abrirse
 */
export function renderScripts(content, sectionName, scripts, activeId) {
  const cards = scripts.map((s) => renderScriptCard(s, s.id === activeId)).join("");

  content.innerHTML = `
    <section class="section-view">
      <header class="section-view__head">
        <h1>${escapeHtml(sectionName)}</h1>
        <span class="section-view__count">${scripts.length} scripts</span>
      </header>
      <div class="cmd-list">${cards}</div>
    </section>`;

  const active = content.querySelector(".cmd-card.is-open");
  if (active) active.scrollIntoView({ behavior: "smooth", block: "center" });
}

function renderScriptCard(s, open) {
  return `
    <article class="cmd-card script-card${open ? " is-open" : ""}" data-id="${escapeAttr(s.id)}">
      <button class="cmd-card__header" type="button">
        <span class="cmd-card__icon">${sanitizeSvg(s.iconSvg)}</span>
        <div class="cmd-card__main">
          <h3 class="cmd-card__title">${escapeHtml(s.title)}</h3>
          <p class="cmd-card__desc">${escapeHtml(s.description)}</p>
        </div>
      </button>
    </article>`;
}
