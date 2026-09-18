import { buildSidebar, initToggle, setActiveCommand } from "./sidebar.js";
import { initHeaderToggle } from "./header.js";
import { initTheme } from "./theme.js";
import { renderSection, initContent } from "./doc.js";
import { renderScripts } from "./scripts.js";
import { initModal, openScriptModal } from "./modal.js";
import { initSearch } from "./search.js";

const DATA_URL = "data";
const nav = document.getElementById("nav");
const content = document.getElementById("content");
const sidebar = document.getElementById("sidebar");
const toggle = document.getElementById("toggle");
const header = document.getElementById("header");
const headerToggle = document.getElementById("header-toggle");
const footer = document.getElementById("footer");
const themeGroup = document.getElementById("theme");
const searchRoot = document.getElementById("search");

let sectionsData = [];
let currentScripts = [];

initTheme(document.documentElement, themeGroup);
initContent(content);
initToggle(sidebar, toggle, content, header, footer);
initHeaderToggle(header, headerToggle, content);
initModal();

content.addEventListener("click", (e) => {
  const card = e.target.closest(".script-card");
  if (!card) return;
  const script = currentScripts.find((s) => s.id === card.dataset.id);
  if (script) openScriptModal(script);
});

async function loadJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo cargar ${url} (${res.status})`);
  return res.json();
}

async function loadText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo cargar ${url} (${res.status})`);
  return res.text();
}

async function loadSectionIcons(sections) {
  const names = [...new Set(sections.map((s) => s.icon).filter(Boolean))];
  const map = {};
  await Promise.all(
    names.map(async (name) => {
      try {
        map[name] = await loadText(`svg/${name}.svg`);
      } catch {
        map[name] = "";
      }
    })
  );
  return map;
}

async function loadSectionItems(section) {
  const dir = section.dir || "commands";

  if (section.type === "scripts") {
    return Promise.all(
      section.commands.map(async (sId) => {
        const meta = await loadJSON(`${DATA_URL}/${dir}/${sId}.json`);
        const [code, iconSvg] = await Promise.all([
          meta.script ? loadText(meta.script) : Promise.resolve(""),
          meta.icon ? loadText(meta.icon) : Promise.resolve("")
        ]);
        return { ...meta, code: code.replace(/\r\n?/g, "\n"), iconSvg };
      })
    );
  }

  return Promise.all(section.commands.map((c) => loadJSON(`${DATA_URL}/${dir}/${c}.json`)));
}

function buildSearchItems(sections, bySection) {
  const items = [];
  for (const section of sections) {
    for (const raw of bySection[section.id] || []) {
      if (section.type === "scripts") {
        const tags = raw.tags || [];
        items.push({
          type: "script",
          id: raw.id,
          title: raw.title,
          description: raw.description,
          sectionId: section.id,
          sectionName: section.name,
          tags,
          lang: raw.lang,
          iconSvg: raw.iconSvg,
          haystack: [
            raw.id, section.id, section.name, raw.title, raw.description, tags.join(" "),
            raw.lang || "", (raw.requires || []).join(" "), (raw.usage || []).join(" "), raw.code || ""
          ].join(" ").toLowerCase(),
          data: raw
        });
      } else {
        items.push({
          type: "command",
          id: raw.id,
          title: raw.title,
          description: raw.description,
          sectionId: section.id,
          sectionName: section.name,
          tags: [],
          haystack: [
            raw.id, section.id, section.name, raw.title, raw.description, raw.syntax || "",
            (raw.examples || []).map((e) => `${e.cmd} ${e.desc}`).join(" "),
            (raw.options || []).map((o) => `${o.flag} ${o.desc}`).join(" ")
          ].join(" ").toLowerCase()
        });
      }
    }
  }
  return items;
}

async function showCommand(id) {
  const section = sectionsData.find((s) => s.commands.includes(id));
  if (!section) {
    content.innerHTML = `<div class="content__empty"><p>No se encontró "${id}".</p></div>`;
    return;
  }

  try {
    const items = await loadSectionItems(section);
    if (section.type === "scripts") {
      renderScripts(content, section.name, items, id);
      currentScripts = items;
      return;
    }
    renderSection(content, section.name, items, id);
  } catch (err) {
    console.error(err);
    content.innerHTML = `<div class="content__empty"><p>No se pudo cargar la sección.</p></div>`;
  }
}

function onSearchSelect(item) {
  if (item.type === "script") {
    openScriptModal(item.data);
    return;
  }
  setActiveCommand(nav, item.id);
  showCommand(item.id);
}

async function init() {
  try {
    sectionsData = await loadJSON(`${DATA_URL}/sections.json`);
  } catch (err) {
    console.error(err);
    return;
  }

  const sectionIcons = await loadSectionIcons(sectionsData);
  buildSidebar(nav, sectionsData, showCommand, sectionIcons);

  const all = await Promise.all(sectionsData.map((s) => loadSectionItems(s)));
  const bySection = {};
  sectionsData.forEach((s, i) => (bySection[s.id] = all[i]));

  currentScripts = sectionsData
    .filter((s) => s.type === "scripts")
    .flatMap((s) => bySection[s.id]);

  initSearch({ root: searchRoot, items: buildSearchItems(sectionsData, bySection), onSelect: onSearchSelect });

  const firstSection = nav.querySelector(".section");
  if (firstSection) firstSection.classList.add("is-open");

  const firstCommand = nav.querySelector(".command");
  if (firstCommand) {
    firstCommand.classList.add("is-active");
    showCommand(firstCommand.dataset.command);
  }
}

init();
