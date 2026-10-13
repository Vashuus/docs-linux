import { escapeHtml, escapeAttr } from "./doc.js";
import { sanitizeSvg } from "./sanitize.js";

const CMD_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><polyline points="7 9 10 12 7 15"/><line x1="12" y1="15" x2="16" y2="15"/></svg>';

const EMPTY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/><line x1="8.5" y1="8.5" x2="13.5" y2="13.5"/></svg>';

const MAX_RESULTS = 60;

const SECTION_FIELDS = ["section", "seccion"];
const TAG_FIELDS = ["tag", "tags", "etiqueta", "etiquetas"];

function norm(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Aplana un texto igual que norm() (minúsculas, sin acentos) pero conservando
 * el mapeo hacia los caracteres originales, para poder resaltar sin romper
 * entidades HTML ni perder los acentos al mostrar.
 */
function foldText(text) {
  const chars = [...String(text)];
  const folded = [];
  const map = [];
  for (let k = 0; k < chars.length; k++) {
    const f = chars[k].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    for (let j = 0; j < f.length; j++) map.push(k);
    folded.push(f);
  }
  return { chars, folded: folded.join(""), map };
}

/**
 * Resalta los términos dentro de un texto. Escapa carácter por carácter
 * (nunca sobre el texto ya escapado) y busca sobre la versión aplanada, de
 * modo que "codigo" también resalta "código".
 */
export function highlight(text, terms) {
  const raw = String(text);
  const needles = [];
  for (const t of terms || []) {
    const n = norm(t);
    if (n && !needles.includes(n)) needles.push(n);
  }
  if (!needles.length) return escapeHtml(raw);

  const { chars, folded, map } = foldText(raw);
  const re = new RegExp(needles.map(escapeRegExp).join("|"), "g");
  const matched = new Array(chars.length).fill(false);
  let m;
  while ((m = re.exec(folded))) {
    if (!m[0]) {
      re.lastIndex++;
      continue;
    }
    for (let f = m.index; f < m.index + m[0].length; f++) matched[map[f]] = true;
  }
  if (!matched.some(Boolean)) return escapeHtml(raw);

  // Las marcas combinantes no aportan al texto aplanado: si su base coincide,
  // se resaltan junto con ella (ej. "ó" precompuesto o "o" + acento).
  const hasFold = new Set(map);
  for (let k = 1; k < chars.length; k++) {
    if (matched[k - 1] && !hasFold.has(k)) matched[k] = true;
  }

  let html = "";
  let buf = "";
  let inMark = false;
  for (let k = 0; k < chars.length; k++) {
    if (matched[k] !== inMark) {
      html += inMark ? `<mark>${buf}</mark>` : buf;
      buf = "";
      inMark = matched[k];
    }
    buf += escapeHtml(chars[k]);
  }
  html += inMark ? `<mark>${buf}</mark>` : buf;
  return html;
}

/**
 * Separa la consulta en texto libre y filtros con "#".
 * Ej: "actualizar #scripts #lang:bash" ->
 *   terms: ["actualizar"], filters: [{field:null,value:"scripts"},{field:"lang",value:"bash"}]
 */
function parseQuery(raw) {
  const tokens = String(raw).trim().split(/\s+/).filter(Boolean);
  const terms = [];
  const filters = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token.startsWith("#")) {
      terms.push(token.toLowerCase());
      continue;
    }

    const body = token.slice(1);
    if (!body) continue;

    const colon = body.indexOf(":");
    if (colon === -1) {
      filters.push({ field: null, value: body.toLowerCase() });
      continue;
    }

    let value = body.slice(colon + 1);
    if (!value && tokens[i + 1] && !tokens[i + 1].startsWith("#")) value = tokens[++i];
    if (value) filters.push({ field: body.slice(0, colon).toLowerCase(), value: value.toLowerCase() });
  }

  return { terms, filters };
}

function typeMatches(type, value) {
  if (type === "script") return value === "script" || value === "scripts";
  if (type === "command") return ["command", "commands", "comando", "comandos"].includes(value);
  return false;
}

function matchesFilter(item, filter) {
  const value = norm(filter.value);
  const field = filter.field;

  if (field) {
    if (field === "lang") return item._lang === value;
    if (field === "type" || field === "tipo") return typeMatches(item.type, value);
    if (field === "id") return item._id === value;
    if (SECTION_FIELDS.includes(field)) return item._section === value || item._sectionId === value;
    if (TAG_FIELDS.includes(field)) return item._tagsList.some((t) => t === value);
    return false;
  }

  return (
    typeMatches(item.type, value) ||
    item._section === value ||
    item._sectionId === value ||
    item._lang === value ||
    item._id === value ||
    item._tagsList.some((t) => t === value)
  );
}

/**
 * Inicializa el buscador.
 * @param {Object} opts
 * @param {HTMLElement} opts.root   contenedor .search
 * @param {Array} opts.items        índice de items normalizados
 * @param {(item:Object)=>void} opts.onSelect  callback al elegir un resultado
 */
export function initSearch({ root, items, onSelect }) {
  const input = root.querySelector(".search__input");
  const panel = root.querySelector(".search__panel");
  const clear = root.querySelector(".search__clear");
  const kbd = root.querySelector(".search__kbd");
  const header = root.closest(".header");

  const sectionMap = new Map();
  for (const it of items) {
    if (!sectionMap.has(it.sectionId)) {
      sectionMap.set(it.sectionId, { id: it.sectionId, name: it.sectionName });
    }
  }
  const sections = [...sectionMap.values()];

  for (const it of items) {
    it._title = norm(it.title);
    it._desc = norm(it.description);
    it._hay = norm(it.haystack);
    it._id = norm(it.id);
    it._lang = norm(it.lang || "");
    it._section = norm(it.sectionName);
    it._sectionId = norm(it.sectionId);
    it._tagsList = (it.tags || []).map(norm);
  }

  const state = { q: "", section: null, type: "all" };
  let results = [];
  let activeIndex = -1;
  let limit = MAX_RESULTS;
  let lastKey = "";

  function score(item, terms) {
    let total = 0;
    for (const term of terms) {
      let s = 0;
      if (item._title === term) s += 100;
      else if (item._title.startsWith(term)) s += 60;
      else if (item._title.includes(term)) s += 40;
      if (item._tagsList.some((tag) => tag.includes(term))) s += 25;
      if (item._desc.includes(term)) s += 15;
      if (item._hay.includes(term)) s += 8;
      if (s === 0) return -1;
      total += s;
    }
    return total;
  }

  function compute(parsed) {
    const { filters } = parsed;
    let list = items.filter((it) => {
      if (state.section && it.sectionId !== state.section) return false;
      if (state.type !== "all" && it.type !== state.type) return false;
      return filters.every((f) => matchesFilter(it, f));
    });
    const terms = parsed.terms.map(norm).filter(Boolean);
    if (terms.length) {
      list = list
        .map((it) => ({ it, s: score(it, terms) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.it);
    }
    return list;
  }

  function open() {
    if (!panel.hidden) return;
    panel.hidden = false;
    root.classList.add("is-open");
    input.setAttribute("aria-expanded", "true");
  }

  function close() {
    if (panel.hidden) return;
    panel.hidden = true;
    root.classList.remove("is-open");
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    activeIndex = -1;
  }

  function syncAffordance() {
    const hasText = input.value.length > 0;
    clear.hidden = !hasText;
    if (kbd) kbd.style.display = hasText ? "none" : "";
  }

  function renderFilters() {
    const typeChips = [["all", "Todo"], ["command", "Comandos"], ["script", "Scripts"]]
      .map(
        ([v, l]) =>
          `<button type="button" class="chip${state.type === v ? " is-active" : ""}" data-filter="type" data-value="${v}">${l}</button>`
      )
      .join("");

    const secChips = [`<button type="button" class="chip${!state.section ? " is-active" : ""}" data-filter="section" data-value="">Todas</button>`]
      .concat(
        sections.map(
          (s) =>
            `<button type="button" class="chip${state.section === s.id ? " is-active" : ""}" data-filter="section" data-value="${escapeAttr(s.id)}">${escapeHtml(s.name)}</button>`
        )
      )
      .join("");

    return `<div class="search__filters">
      <div class="search__chips">${typeChips}</div>
      <div class="search__chips">${secChips}</div>
    </div>`;
  }

  function resultHTML(item, i, terms) {
    const icon = item.type === "script" ? sanitizeSvg(item.iconSvg) : CMD_ICON;
    const badge = item.type === "script" ? "Script" : "Comando";
    const on = i === activeIndex;
    return `<button type="button" class="search-result${on ? " is-active" : ""}" role="option" id="search-opt-${i}" aria-selected="${on ? "true" : "false"}" data-index="${i}">
      <span class="search-result__icon">${icon}</span>
      <span class="search-result__main">
        <span class="search-result__title">${highlight(item.title, terms)}</span>
        <span class="search-result__desc">${highlight(item.description, terms)}</span>
      </span>
      <span class="search-result__meta">
        <span class="search-result__badge search-result__badge--${item.type}">${badge}</span>
        <span class="search-result__section">${escapeHtml(item.sectionName)}</span>
      </span>
    </button>`;
  }

  function render() {
    const parsed = parseQuery(state.q);
    results = compute(parsed);
    activeIndex = results.length ? 0 : -1;

    const key = `${state.q}\u0000${state.section || ""}\u0000${state.type}`;
    if (key !== lastKey) {
      limit = MAX_RESULTS;
      lastKey = key;
    }

    const shown = results.slice(0, limit);

    let body;
    if (!results.length) {
      const label = state.q.trim()
        ? `Sin resultados para "${escapeHtml(state.q.trim())}"`
        : "No hay resultados con estos filtros";
      body = `<div class="search__empty">${EMPTY_ICON}<span>${label}</span></div>`;
    } else {
      const more =
        results.length > shown.length
          ? `<button type="button" class="search__more" data-more>Mostrar más · restan ${results.length - shown.length}</button>`
          : "";
      body = `<div class="search__results" role="listbox" id="search-results" aria-label="Resultados de búsqueda">${shown
        .map((it, i) => resultHTML(it, i, parsed.terms))
        .join("")}</div>${more}`;
    }

    const footer = results.length
      ? `<div class="search__footer">
          <span class="search__count">${results.length} resultado${results.length === 1 ? "" : "s"}${
            results.length > shown.length ? ` · mostrando ${shown.length}` : ""
          }</span>
          <span class="search__hint"><kbd>#</kbd> filtrar <kbd>↑</kbd><kbd>↓</kbd> <kbd>Enter</kbd> <kbd>Esc</kbd></span>
        </div>`
      : "";

    panel.innerHTML = renderFilters() + body + footer;
    if (results.length) setActive(activeIndex);
    else input.removeAttribute("aria-activedescendant");
    syncAffordance();
  }

  function setActive(i) {
    const nodes = panel.querySelectorAll(".search-result");
    if (!nodes.length) {
      input.removeAttribute("aria-activedescendant");
      return;
    }
    activeIndex = Math.max(0, Math.min(i, nodes.length - 1));
    nodes.forEach((n, idx) => {
      const on = idx === activeIndex;
      n.classList.toggle("is-active", on);
      n.setAttribute("aria-selected", on ? "true" : "false");
    });
    nodes[activeIndex].scrollIntoView({ block: "nearest" });
    input.setAttribute("aria-activedescendant", nodes[activeIndex].id);
  }

  function select(i) {
    const item = results[i];
    if (!item) return;
    close();
    input.blur();
    onSelect(item);
  }

  input.addEventListener("input", () => {
    state.q = input.value;
    open();
    render();
  });

  input.addEventListener("focus", () => {
    open();
    render();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      open();
      if (!results.length) render();
      setActive(activeIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(activeIndex - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      open();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      open();
      setActive(Number.MAX_SAFE_INTEGER);
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(activeIndex);
    } else if (e.key === "Escape") {
      close();
      input.blur();
    }
  });

  clear.addEventListener("click", () => {
    input.value = "";
    state.q = "";
    input.focus();
    render();
  });

  panel.addEventListener("mousedown", (e) => {
    if (e.target.closest("[data-filter], [data-more]")) e.preventDefault();
  });

  panel.addEventListener("click", (e) => {
    const more = e.target.closest("[data-more]");
    if (more) {
      const list = panel.querySelector(".search__results");
      const top = list ? list.scrollTop : 0;
      limit += MAX_RESULTS;
      render();
      const after = panel.querySelector(".search__results");
      if (after) after.scrollTop = top;
      if (document.activeElement !== input) input.focus();
      return;
    }

    const chip = e.target.closest("[data-filter]");
    if (chip) {
      const { filter, value } = chip.dataset;
      if (filter === "section") state.section = value || null;
      else if (filter === "type") state.type = value;
      render();
      if (document.activeElement !== input) input.focus();
      return;
    }

    const result = e.target.closest(".search-result");
    if (result) select(Number(result.dataset.index));
  });

  document.addEventListener("click", (e) => {
    if (!root.contains(e.target)) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "/" || input.disabled) return;
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) return;
    if (header && header.classList.contains("is-hidden")) return;
    if (document.body.classList.contains("modal-open")) return;
    e.preventDefault();
    input.focus();
  });
}
