document.addEventListener("DOMContentLoaded", async () => {
  const components = document.querySelectorAll("[data-component]");

  for (const el of components) {
    const name = el.getAttribute("data-component");

    const res = await fetch(`/layout/${name}.html`);
    const html = await res.text();

    el.innerHTML = html;
  }
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest("#toggleSidebar");
  if (!btn) return;

  const sidebar = document.getElementById("sidebar");

  if (!sidebar) {
    console.error("Sidebar still not loaded");
    return;
  }

  sidebar.classList.toggle("collapsed");
});