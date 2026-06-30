const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  // =========================
  // VALIDATION
  // =========================
  if (email === "" || password === "") {
    loginMessage.style.color = "red";
    loginMessage.textContent = "Please enter your email and password.";
    return;
  }

  try {
    // =========================
    // SEND TO BACKEND
    // =========================
    const res = await fetch("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await res.json();

    // =========================
    // HANDLE RESPONSE
    // =========================
    if (data.success) {
      loginMessage.style.color = "green";
      loginMessage.textContent = data.message;

      // =========================
      // REMEMBER ME (simple version)
      // =========================
      if (remember) {
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        sessionStorage.setItem("user", JSON.stringify(data.user));
      }

      // =========================
      // REDIRECT AFTER LOGIN
      // =========================
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);

    } else {
      loginMessage.style.color = "red";
      loginMessage.textContent = data.message;
    }

  } catch (error) {
    console.error(error);
    loginMessage.style.color = "red";
    loginMessage.textContent = "Server error. Please try again.";
  }
});