#!/usr/bin/env node
/**
 * Smoke test del sitio (jsdom, sin navegador real).
 *
 * Arma una copia temporal del sitio, carga js/app.js y comprueba que:
 *  - el contenido se renderiza,
 *  - cada sección tiene su icono,
 *  - el buscador filtra por texto, sección y lenguajes.
 *
 * Uso: npm test   (o node tools/smoke.test.mjs)
 * Requiere la dependencia de desarrollo "jsdom".
 */
import { JSDOM } from "jsdom";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = fs.mkdtempSync(path.join(os.tmpdir(), "docs-linux-smoke-"));

for (const dir of ["css", "js", "data", "svg", "scripts"]) {
  fs.cpSync(path.join(ROOT, dir), path.join(SITE, dir), { recursive: true });
}
fs.copyFileSync(path.join(ROOT, "html/index.html"), path.join(SITE, "index.html"));

const sectionsData = JSON.parse(fs.readFileSync(path.join(SITE, "data/sections.json"), "utf8"));
const scriptsSection = sectionsData.find((s) => s.type === "scripts");
const scriptsCount = scriptsSection ? scriptsSection.commands.length : 0;

const html = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
const dom = new JSDOM(html, { url: "http://localhost/", pretendToBeVisual: true });
const { window } = dom;

globalThis.window = window;
globalThis.document = window.document;
globalThis.DOMParser = window.DOMParser;
globalThis.XMLSerializer = window.XMLSerializer;
globalThis.CSS = window.CSS || { escape: (s) => String(s).replace(/[^a-zA-Z0-9_-]/g, (c) => "\\" + c) };
globalThis.navigator = window.navigator;
globalThis.HTMLElement = window.HTMLElement;
globalThis.Node = window.Node;
window.Element.prototype.scrollIntoView = function () {};

globalThis.fetch = async (url) => {
  const clean = String(url).replace(/^https?:\/\/[^/]+\//, "").replace(/^\//, "");
  const p = path.join(SITE, clean);
  if (!fs.existsSync(p)) return { ok: false, status: 404, json: async () => ({}), text: async () => "" };
  const text = fs.readFileSync(p, "utf8");
  return { ok: true, status: 200, json: async () => JSON.parse(text), text: async () => text };
};

let failures = 0;
const check = (name, cond) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) failures++;
};
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));

await import(pathToFileURL(path.join(SITE, "js/app.js")).href);
await new Promise((r) => setTimeout(r, 1500));

const doc = window.document;
const input = doc.getElementById("search-input");
const panel = doc.getElementById("search-panel");

const setQuery = (q) => {
  input.value = q;
  fire(input, "input");
};
const allScripts = () => [...panel.querySelectorAll(".search-result__badge")].every((b) => b.textContent === "Script");
const allCommands = () => [...panel.querySelectorAll(".search-result__badge")].every((b) => b.textContent === "Comando");

check("contenido cargado", !!doc.querySelector("#content .section-view"));

const headers = doc.querySelectorAll(".section__header");
const icons = doc.querySelectorAll(".section__header svg.section__icon");
check("todas las secciones tienen icono con clase", headers.length === sectionsData.length && icons.length === headers.length);
check("no hay chips de etiquetas", panel.querySelector('.chip[data-filter="tag"]') === null);

setQuery("#scripts");
check("#scripts filtra a la sección Scripts", panel.querySelectorAll(".search-result").length === scriptsCount && allScripts());

setQuery("#comandos");
check("#comandos filtra a comandos", panel.querySelectorAll(".search-result").length > 0 && allCommands());

setQuery("#lang:bash");
check("#lang:bash devuelve solo scripts", panel.querySelectorAll(".search-result").length > 0 && allScripts());

setQuery("#lang: bash");
check("#lang: bash (con espacio) funciona igual", panel.querySelectorAll(".search-result").length > 0 && allScripts());

setQuery("actualizar #scripts #lang:bash");
check("consulta combinada devuelve resultados", panel.querySelectorAll(".search-result").length > 0 && allScripts());

setQuery("#actualizacion");
check("#tag por etiqueta trae scripts", panel.querySelectorAll(".search-result").length > 0 && allScripts());

setQuery("nmap #seccion:recon");
check("#seccion:recon filtra a la sección", panel.querySelectorAll(".search-result").length > 0 && allCommands());

setQuery("sqlmap");
check("texto libre encuentra comandos", panel.querySelectorAll(".search-result").length > 0 && allCommands());

setQuery("#noexiste");
check("#desconocido sin coincidencias", panel.querySelector(".search__empty") !== null);

setQuery("");
check("consulta vacía muestra resultados (cap 60)", panel.querySelectorAll(".search-result").length === 60);

console.log(`\n${failures === 0 ? "TODO OK" : failures + " fallo(s)"}`);
process.exit(failures === 0 ? 0 : 1);
