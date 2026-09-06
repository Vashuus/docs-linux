/**
 * Cambia entre tema claro y oscuro, guardando la preferencia.
 * @param {HTMLElement} root  elemento raíz (<html>)
 * @param {HTMLElement} group contenedor de botones con [data-theme]
 */
export function initTheme(root, group) {
  const buttons = group.querySelectorAll("[data-theme]");

  const apply = (theme) => {
    root.setAttribute("data-theme", theme);
    buttons.forEach((btn) =>
      btn.classList.toggle("is-active", btn.dataset.theme === theme)
    );
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {}
  };

  const saved = (() => {
    try {
      return localStorage.getItem("theme");
    } catch (e) {
      return null;
    }
  })();

  apply(saved || root.getAttribute("data-theme") || "dark");

  group.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-theme]");
    if (btn) apply(btn.dataset.theme);
  });
}
