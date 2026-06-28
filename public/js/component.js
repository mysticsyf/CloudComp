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

// Highlight the active sidebar menu item based on the current URL
function highlightSidebar() {
  const currentPath = window.location.pathname; 
  const currentUrl = window.location.href;     

  const menuItems = document.querySelectorAll(".sidebar .menu-item, [data-component='sidebar'] .menu-item");

  menuItems.forEach(item => {
    item.classList.remove("active");

    const href = item.getAttribute("href");


    if (
      currentPath === href || 
      (href !== "#" && currentPath.includes(href)) || 
      item.href === currentUrl
    ) {
      item.classList.add("active"); 
    }
  });
}

// Toggle sidebar collapse
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

// Load user profile information from localStorage
const user = JSON.parse(localStorage.getItem("user"));

const profileImg = document.getElementById("profileImg");
const profileName = document.getElementById("profileName");

if (user) {
  profileImg.src = user.avatar || "/images/default-avatar.png";
  profileName.textContent = user.name || "User";
} else {
  profileImg.src = "/images/default-avatar.png";
  profileName.textContent = "Guest";
}