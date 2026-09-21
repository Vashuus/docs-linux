/**
 * Saneador de SVG para iconos aportados por la comunidad.
 * Se inyectan inline con innerHTML, así que hay que neutralizar
 * <script>, <foreignObject>, atributos on* y URLs javascript:.
 */

const ALLOWED_TAGS = new Set([
  "svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline",
  "polygon", "defs", "lineargradient", "radialgradient", "stop", "title",
  "desc", "text", "tspan", "clippath", "mask"
]);

const ALLOWED_ATTRS = new Set([
  "xmlns", "viewbox", "width", "height", "x", "y", "x1", "y1", "x2", "y2",
  "cx", "cy", "r", "rx", "ry", "d", "points", "transform", "offset",
  "fill", "fill-rule", "fill-opacity", "stroke", "stroke-width",
  "stroke-linecap", "stroke-linejoin", "stroke-dasharray", "stroke-opacity",
  "opacity", "class", "id", "stop-color", "stop-opacity", "gradientunits",
  "gradienttransform", "clip-path", "mask", "preserveaspectratio"
]);

function cleanAttributes(el) {
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    const value = attr.value || "";

    if (name.startsWith("on")) {
      el.removeAttribute(attr.name);
    } else if (name === "href" || name === "xlink:href" || name === "src") {
      if (!value.trim().startsWith("#")) el.removeAttribute(attr.name);
    } else if (name === "style") {
      if (/(url\s*\(|expression|javascript:)/i.test(value)) el.removeAttribute(attr.name);
    } else if (!ALLOWED_ATTRS.has(name)) {
      el.removeAttribute(attr.name);
    }
  }
}

function cleanElement(el) {
  cleanAttributes(el);
  for (const child of Array.from(el.children)) {
    if (!ALLOWED_TAGS.has(child.tagName.toLowerCase())) {
      child.remove();
      continue;
    }
    cleanElement(child);
  }
}

/**
 * Devuelve un SVG seguro para innerHTML o "" si es inválido.
 * @param {string} text
 * @returns {string}
 */
export function sanitizeSvg(text) {
  const input = String(text || "").trim();
  if (!input) return "";
  if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") return "";

  const doc = new DOMParser().parseFromString(input, "image/svg+xml");
  if (!doc || doc.querySelector("parsererror")) return "";

  const svg = doc.documentElement;
  if (!svg || svg.tagName.toLowerCase() !== "svg") return "";

  cleanElement(svg);
  return new XMLSerializer().serializeToString(svg);
}
