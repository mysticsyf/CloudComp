document.addEventListener("DOMContentLoaded", () => {
    loadProfile();
});

async function loadProfile() {

    try {

        const res = await fetch("/auth/current");
        const data = await res.json();

        if (!data.loggedIn) {
            window.location.href = "/login";
            return;
        }

        const user = data.user;

        document.getElementById("profileUsername").textContent = user.username;
        document.getElementById("profileRole").textContent = user.role;
        document.getElementById("username").value = user.username;
        document.getElementById("email").value = user.email || "";
        document.getElementById("phone").value = user.phone || "";
        document.getElementById("role").value = user.role;

        if (user.avatar) {
            document.getElementById("profileImage").src = user.avatar;
        }

        // Show role-specific section
        if (user.role.toLowerCase() === "vendor") {

            document.querySelector(".buyer-section").style.display = "none";

        } else {

            document.querySelector(".vendor-section").style.display = "none";

        }

    } catch (err) {

        console.error(err);
        window.location.href = "/login";

    }

}