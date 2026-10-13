import { escapeHtml, escapeAttr } from "./doc.js";
import { highlight } from "./highlight.js";
import { sanitizeSvg } from "./sanitize.js";

let isOpen = false;
let current = null;

const modal = document.getElementById("modal");
const left = document.getElementById("modal-left");
const pathEl = document.getElementById("modal-path");
const linesEl = document.getElementById("modal-lines");
const codeEl = document.getElementById("modal-code");
const copyBtn = document.getElementById("modal-copy");
const downloadBtn = document.getElementById("modal-download");

/**
 * Inicializa el modal: cierre por overlay, botones y tecla Escape.
 */
export function initModal() {
  modal.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) {
      closeScriptModal();
      return;
    }

    const copy = e.target.closest(".copy");
    if (copy) {
      copyText(copy.dataset.copy);
      flash(copy, "copiar", "copiado");
    }
  });

  copyBtn.addEventListener("click", () => {
    if (!current) return;
    copyText(current.code);
    flash(copyBtn, "Copiar código", "Copiado!");
  });

  downloadBtn.addEventListener("click", () => {
    if (!current) return;
    const name = current.script.split("/").pop() || "script.sh";
    const blob = new Blob([current.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) closeScriptModal();
  });
}

/**
 * Abre el modal con los datos de un script.
 * @param {Object} script  { title, description, iconSvg, type, version, tags, requires, usage, script, code, lang }
 */
export function openScriptModal(script) {
  current = script;
  isOpen = true;

  left.innerHTML = buildLeft(script);

  const lines = codeLines(script.code);
  pathEl.textContent = script.script || "";
  linesEl.textContent = `${lines} líneas`;

  const numbers = Array.from({ length: lines }, (_, i) => i + 1).join("\n");
  codeEl.innerHTML = `<pre class="code-gutter">${numbers}</pre><pre class="code-pre"><code>${highlight(script.code.replace(/\n$/, ""), script.lang)}</code></pre>`;

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

export function closeScriptModal() {
  if (!isOpen) return;
  isOpen = false;
  current = null;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function buildLeft(s) {
  const tags = (s.tags || [])
    .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
    .join("");

  const reqs = (s.requires || [])
    .map((r) => `<li>${escapeHtml(r)}</li>`)
    .join("");

  const usage = (s.usage || [])
    .map(
      (u) => `
        <div class="usage">
          <code>${escapeHtml(u)}</code>
          <button class="copy copy--mini" type="button" data-copy="${escapeAttr(u)}">copiar</button>
        </div>`
    )
    .join("");

  const rel = typeof s.reliability === "number" ? reliabilityBadge(s.reliability) : "";

  return `
    <div class="modal__icon">${sanitizeSvg(s.iconSvg)}</div>
    <h2 class="modal__title" id="modal-title">${escapeHtml(s.title)}</h2>
    <p class="modal__desc">${escapeHtml(s.description)}</p>

    <div class="modal__details">
      <span class="tag tag--accent">v${escapeHtml(s.version || "1.0.0")}</span>
      <span class="tag">${escapeHtml(s.type || s.lang || "Script")}</span>
      ${rel}
    </div>

    ${s.tags && s.tags.length ? `<h3 class="modal__h">Etiquetas</h3><div class="modal__tags">${tags}</div>` : ""}
    ${s.requires && s.requires.length ? `<h3 class="modal__h">Requisitos</h3><ul class="modal__reqs">${reqs}</ul>` : ""}
    ${s.usage && s.usage.length ? `<h3 class="modal__h">Formas de uso</h3><div class="modal__usage">${usage}</div>` : ""}
  `;
}

function reliabilityBadge(pct) {
  const level = pct >= 90 ? "high" : pct >= 80 ? "mid" : "low";
  return `<span class="tag tag--rel tag--rel-${level}" title="Confiabilidad estimada de funcionar correctamente en distintos entornos">Confiabilidad ~${pct}%</span>`;
}

function codeLines(code) {
  const clean = code.replace(/\n$/, "");
  return clean.split("\n").length;
}

function copyText(text) {
  if (navigator.clipboard) navigator.clipboard.writeText(text);
}

function flash(el, original, done) {
  el.textContent = done;
  setTimeout(() => (el.textContent = original), 1200);
}
