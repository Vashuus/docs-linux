#!/usr/bin/env node
/**
 * Validador del repositorio docs-linux (sin dependencias).
 *
 * Comprueba:
 *  - data/sections.json contra su schema
 *  - cada comando (data/commands/*.json) contra su schema
 *  - cada script (data/scripts/*.json) contra su schema
 *  - que existan los archivos referenciados (iconos y scripts), sin ".."
 *  - que los SVG no contengan elementos/atributos peligrosos
 *
 * Uso: node tools/validate.mjs
 * Sale con codigo 1 si hay errores.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, relative } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warn = [];

const readJSON = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const err = (m) => errors.push(m);
const warnf = (m) => warn.push(m);

/* ---------- mini validador JSON Schema (subconjunto) ---------- */
function validate(value, schema, path) {
  if (!schema || typeof schema !== "object") return;

  if (schema.type) {
    const t = schema.type;
    const ok =
      (t === "array" && Array.isArray(value)) ||
      (t === "object" && value !== null && typeof value === "object" && !Array.isArray(value)) ||
      (t === "string" && typeof value === "string") ||
      (t === "integer" && Number.isInteger(value)) ||
      (t === "number" && typeof value === "number") ||
      (t === "boolean" && typeof value === "boolean");
    if (!ok) {
      err(`${path}: se esperaba ${t}, se encontro ${Array.isArray(value) ? "array" : typeof value}`);
      return;
    }
  }

  if (schema.enum && !schema.enum.includes(value)) {
    err(`${path}: valor "${value}" no permitido (${schema.enum.join(", ")})`);
  }

  if (typeof value === "string") {
    if (schema.minLength && value.length < schema.minLength) {
      err(`${path}: cadena vacia o demasiado corta`);
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      err(`${path}: "${value}" no cumple el patron ${schema.pattern}`);
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems && value.length < schema.minItems) {
      err(`${path}: se requieren al menos ${schema.minItems} elementos`);
    }
    if (schema.items) value.forEach((v, i) => validate(v, schema.items, `${path}[${i}]`));
  }

  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const key of schema.required || []) {
      if (!(key in value)) err(`${path}: falta el campo obligatorio "${key}"`);
    }
    if (schema.additionalProperties === false && schema.properties) {
      for (const key of Object.keys(value)) {
        if (!(key in schema.properties)) err(`${path}: campo no permitido "${key}"`);
      }
    }
    for (const [key, sub] of Object.entries(schema.properties || {})) {
      if (key in value) validate(value[key], sub, `${path}.${key}`);
    }
  }
}

/* ---------- rutas seguras ---------- */
function safePath(p, label) {
  if (typeof p !== "string" || !p) return null;
  if (p.includes("..") || p.startsWith("/") || p.includes("\\")) {
    err(`${label}: ruta no permitida "${p}"`);
    return null;
  }
  const abs = join(ROOT, p);
  if (!existsSync(abs)) {
    err(`${label}: no existe el archivo "${p}"`);
    return null;
  }
  return abs;
}

/* ---------- SVG peligrosos ---------- */
const SVG_DIR = join(ROOT, "svg");
function scanSvg(name) {
  const content = readFileSync(join(SVG_DIR, name), "utf8");
  const file = `svg/${name}`;
  if (/<script[\s>]/i.test(content)) err(`${file}: contiene <script>`);
  if (/<foreignObject[\s>]/i.test(content)) err(`${file}: contiene <foreignObject>`);
  if (/\son[a-z]+\s*=/i.test(content)) err(`${file}: contiene atributo on* (evento)`);
  if (/javascript:/i.test(content)) err(`${file}: contiene "javascript:"`);
  if (/(href|src)\s*=\s*["']?\s*(https?:)?\/\//i.test(content)) {
    err(`${file}: contiene un enlace/URL externa`);
  }
}

/* ---------- programa principal ---------- */
function main() {
  const sectionsSchema = readJSON("tools/schemas/sections.schema.json");
  const commandSchema = readJSON("tools/schemas/command.schema.json");
  const scriptSchema = readJSON("tools/schemas/script.schema.json");

  const sections = readJSON("data/sections.json");
  validate(sections, sectionsSchema, "sections");

  const seenIds = new Set();

  sections.forEach((section, i) => {
    const base = `sections[${i}]`;
    const dir = section.dir || "commands";

    if (section.type === "scripts") {
      if (!section.dir) warnf(`${base}: seccion de scripts sin "dir"`);
    } else if (section.icon && !readdirSync(SVG_DIR).some((f) => f.startsWith(section.icon))) {
      warnf(`${base}: icono de seccion "${section.icon}" no esta en svg/ (puede usar el mapa interno)`);
    }

    (section.commands || []).forEach((id) => {
      const key = `${dir}/${id}`;
      if (seenIds.has(key)) err(`${base}: id duplicado "${key}"`);
      seenIds.add(key);

      const rel = `data/${dir}/${id}.json`;
      const abs = join(ROOT, rel);
      if (!existsSync(abs)) {
        err(`${base}: falta el archivo ${rel}`);
        return;
      }

      let data;
      try {
        data = JSON.parse(readFileSync(abs, "utf8"));
      } catch (e) {
        err(`${rel}: JSON invalido (${e.message})`);
        return;
      }

      if (data.id !== id) err(`${rel}: el "id" ("${data.id}") no coincide con el nombre del archivo`);

      if (section.type === "scripts") {
        validate(data, scriptSchema, rel);
        safePath(data.icon, `${rel}.icon`);
        safePath(data.script, `${rel}.script`);
      } else {
        validate(data, commandSchema, rel);
      }
    });
  });

  readdirSync(SVG_DIR)
    .filter((f) => f.endsWith(".svg"))
    .forEach((f) => scanSvg(f));
}

try {
  main();
} catch (e) {
  err(`Error inesperado: ${e.message}`);
}

if (warn.length) {
  console.log("\nAvisos:");
  warn.forEach((w) => console.log("  - " + w));
}

if (errors.length) {
  console.error(`\n${errors.length} error(es):`);
  errors.forEach((e) => console.error("  x " + e));
  process.exit(1);
}

console.log("\nOK: datos y SVG validos.");
