document.addEventListener("DOMContentLoaded", async () => {
  const components = document.querySelectorAll("[data-component]");

  for (const el of components) {
    const name = el.getAttribute("data-component");

    try {
      const res = await fetch(`/layout/${name}.html`);
      if (!res.ok) continue;

      const html = await res.text();
      el.innerHTML = html;

      if (name === "sidebar") {
        highlightSidebar();
        setupSidebarToggle();
      }
    } catch (err) {
      console.error(`Failed to load component ${name}:`, err);
    }
  }

  loadUserProfile();
  initializeProfileBox();
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

//load user profile
async function loadUserProfile() {
  try {
    const res = await fetch("/auth/current");
    const data = await res.json();

    const profileName = document.getElementById("profileName");
    const profileRole = document.getElementById("profile-role");
    const profileImg = document.getElementById("profileImg");

    if (!data.loggedIn) {
      profileName.textContent = "Guest";
      profileRole.textContent = "";
      profileImg.src = "/images/default-avatar.png";
      return;
    }

    const user = data.user;

    profileName.textContent = user.username;
    profileRole.textContent = user.role || "User";
    profileImg.src = user.avatar || "/images/default-avatar.png";

  } catch (err) {
    console.error("Error loading session user:", err);
  }
}

//ProfileBox
function initializeProfileBox() {
  if (document.body.dataset.profileBoxBound === "true") return;
  document.body.dataset.profileBoxBound = "true";

  document.addEventListener("click", async (event) => {
    const profileBox = event.target.closest("#profileBox");
    if (!profileBox) return;

    event.preventDefault();

    try {
      const res = await fetch("/auth/current");
      const data = await res.json();

      if (data.loggedIn) {
        window.location.href = "/profile";
      } else {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Session check failed:", err);
      window.location.href = "/login";
    }
  });
}