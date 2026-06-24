document.addEventListener("DOMContentLoaded", async () => {
  const components = document.querySelectorAll("[data-component]");

  for (const el of components) {
    const name = el.getAttribute("data-component");

    const res = await fetch(`/layout/${name}.html`);
    const html = await res.text();

    el.innerHTML = html;

    if (name === "sidebar") {
      highlightSidebar();
    }
  }
});

function highlightSidebar() {
  const currentPath = window.location.pathname; // 获取当前页面的路由（例如：/reviews）
  const currentUrl = window.location.href;     // 获取当前页面的完整完整 URL

  // 拿到侧边栏里所有的菜单项
  const menuItems = document.querySelectorAll(".sidebar .menu-item, [data-component='sidebar'] .menu-item");

  menuItems.forEach(item => {
    // 先干净利落地移除原本死在 HTML 里的 active
    item.classList.remove("active");

    const href = item.getAttribute("href");

    // 开始精确匹配：
    // 1. 如果当前的相对路径等于 href (例如：href="/reviews")
    // 2. 或者当前的完整 URL 包含写死的绝对路径 (例如：href="http://localhost:3000/reviews")
    if (
      currentPath === href || 
      (href !== "#" && currentPath.includes(href)) || 
      item.href === currentUrl
    ) {
      item.classList.add("active"); // 符合条件的加上橙色高亮
    }
  });
}

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