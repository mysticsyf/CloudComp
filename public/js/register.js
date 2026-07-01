const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

registerForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const fullName = document.getElementById("fullName").value.trim();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();
  const userRole = document.querySelector('input[name="userRole"]:checked')?.value;

  // =========================
  // VALIDATION
  // =========================
  if (!fullName || !username || !email || !password || !confirmPassword) {
    registerMessage.style.color = "red";
    registerMessage.textContent = "Please fill in all fields.";
    return;
  }

  if (!userRole) {
    registerMessage.style.color = "red";
    registerMessage.textContent = "Please select a user role.";
    return;
  }

  if (password.length < 6) {
    registerMessage.style.color = "red";
    registerMessage.textContent = "Password must be at least 6 characters.";
    return;
  }

  if (password !== confirmPassword) {
    registerMessage.style.color = "red";
    registerMessage.textContent = "Passwords do not match.";
    return;
  }

  try {
    const res = await fetch("/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: fullName,
        username: username,
        email: email,
        password: password,
        role: userRole
      })
    });

    const data = await res.json();

    if (data.success) {
      registerMessage.style.color = "green";
      registerMessage.textContent = data.message;

      // =========================
      // REDIRECT AFTER LOGIN
      // =========================
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);

    } else {
      registerMessage.style.color = "red";
      registerMessage.textContent = data.message;
    }

  } catch (error) {
    registerMessage.style.color = "red";
    registerMessage.textContent = "Server error. Please try again.";
    console.error(error);
  }
});