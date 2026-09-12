const COPY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const CHECK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

/**
 * Renderiza todos los comandos de una sección como una lista de tarjetas
 * acordeón. La tarjeta activa arranca abierta.
 */
export function renderSection(content, sectionName, commands, activeId) {
  const cards = commands.map((cmd) => renderCard(cmd, cmd.id === activeId)).join("");

  content.innerHTML = `
    <section class="section-view">
      <header class="section-view__head">
        <h1>${sectionName}</h1>
        <span class="section-view__count">${commands.length} comandos</span>
      </header>
      <div class="cmd-list">${cards}</div>
    </section>`;

  const active = content.querySelector(".cmd-card.is-open");
  if (active) active.scrollIntoView({ behavior: "smooth", block: "center" });
}

function renderCard(data, open) {
  const blocks = [];

  if (data.syntax) {
    blocks.push(`
      <div class="cmd-block">
        <h4>Sintaxis</h4>
        <div class="syntax">
          <pre><code>${colorizeSyntax(data.syntax)}</code></pre>
          <button class="copy copy--corner" data-copy="${escapeAttr(data.syntax)}">copiar</button>
        </div>
      </div>`);
  }

  if (data.options && data.options.length) {
    const options = data.options
      .map(
        (op) =>
          `<div class="option"><code>${escapeHtml(op.flag)}</code><span>${escapeHtml(op.desc)}</span></div>`
      )
      .join("");
    blocks.push(`
      <div class="cmd-block">
        <h4>Opciones comunes</h4>
        <div class="options">${options}</div>
      </div>`);
  }

  if (data.script) {
    blocks.push(`
      <div class="cmd-block">
        <h4>Script</h4>
        <div class="script">
          <pre><code>${escapeHtml(data.script)}</code></pre>
          <button class="copy copy--corner" data-copy="${escapeAttr(data.script)}">copiar</button>
        </div>
      </div>`);
  }

  if (data.examples && data.examples.length) {
    const examples = data.examples
      .map(
        (ex) => `
        <div class="example" data-copy="${escapeAttr(ex.cmd)}" title="Clic para copiar">
          <div class="example__head">
            <code>${escapeHtml(ex.cmd)}</code>
            <span class="example__copy">${COPY_ICON}</span>
          </div>
          <p>${escapeHtml(ex.desc)}</p>
        </div>`
      )
      .join("");
    blocks.push(`
      <div class="cmd-block">
        <h4>Ejemplos</h4>
        <div class="examples">${examples}</div>
      </div>`);
  }

  return `
    <article class="cmd-card${open ? " is-open" : ""}" data-id="${data.id}">
      <button class="cmd-card__header" type="button">
        <div class="cmd-card__main">
          <h3 class="cmd-card__title">${escapeHtml(data.title)}</h3>
          <p class="cmd-card__desc">${escapeHtml(data.description)}</p>
        </div>
        <svg class="cmd-card__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="cmd-card__body">
        <div class="cmd-card__inner">
          <div class="cmd-card__content">${blocks.join("")}</div>
        </div>
      </div>
    </article>`;
}

/**
 * Colorea cada parte de la sintaxis para que sea más intuitiva.
 * comando | -flags | [..] y <..> (placeholders) | argumentos
 */
function colorizeSyntax(syntax) {
  return String(syntax)
    .split(" ")
    .map((word, i) => {
      let cls = "syn-arg";
      if (i === 0) cls = "syn-cmd";
      else if (/^-/.test(word)) cls = "syn-flag";
      else if (/^[<\[]/.test(word)) cls = "syn-opt";
      return `<span class="${cls}">${escapeHtml(word)}</span>`;
    })
    .join(" ");
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

/**
 * Registra (una sola vez) el acordeón, el copiado de ejemplos y de sintaxis.
 */
export function initContent(content) {
  content.addEventListener("click", (e) => {
    const copy = e.target.closest(".copy");
    if (copy) {
      copyText(copy.dataset.copy);
      const original = copy.textContent;
      copy.textContent = "copiado";
      setTimeout(() => (copy.textContent = original), 1200);
      return;
    }

    const example = e.target.closest(".example");
    if (example) {
      copyText(example.dataset.copy);
      const badge = example.querySelector(".example__copy");
      if (badge) {
        badge.innerHTML = CHECK_ICON;
        badge.classList.add("is-done");
        setTimeout(() => {
          badge.innerHTML = COPY_ICON;
          badge.classList.remove("is-done");
        }, 1100);
      }
      return;
    }

    const header = e.target.closest(".cmd-card__header");
    if (header) {
      const card = header.parentElement;
      if (card.classList.contains("script-card")) return;
      card.classList.toggle("is-open");
    }
  });
}

function copyText(text) {
  if (navigator.clipboard) navigator.clipboard.writeText(text);
}
