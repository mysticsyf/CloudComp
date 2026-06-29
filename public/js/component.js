document.addEventListener("DOMContentLoaded", async () => {
  const components = document.querySelectorAll("[data-component]");

  for (const el of components) {
    const name = el.getAttribute("data-component");

    const res = await fetch(`/layout/${name}.html`);
    const html = await res.text();

    el.innerHTML = html;

    if (name === "sidebar") {
      highlightSidebar();
      setupSidebarToggle(); // move toggle here (IMPORTANT)
    }
  }

  loadUserProfile(); // run AFTER everything loads
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
function setupSidebarToggle() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("#toggleSidebar");
    if (!btn) return;

    const sidebar = document.getElementById("sidebar");
    const rightSide = document.querySelector(".right-side");
    const topbar = document.querySelector(".topbar");

    if (!sidebar) return;

    sidebar.classList.toggle("collapsed");

    if (rightSide) rightSide.classList.toggle("collapsed");
    if (topbar) topbar.classList.toggle("collapsed");
  });
}

// Load user profile information from localStorage
const user = JSON.parse(localStorage.getItem("user"));

const profileName = document.getElementById("profileName");
const profileRole = document.getElementById("profile-role");
const profileImg = document.getElementById("profileImg");

if (user) {
  // logged in user
  profileName.textContent = user.name;
  profileRole.textContent = user.role || "User";
  profileImg.src = user.avatar || "/images/default-avatar.png";
} else {
  // NOT logged in → show guest only
  profileName.textContent = "Guest";
  profileRole.textContent = ""; // hide role
  profileImg.src = "/images/default-avatar.png";
}