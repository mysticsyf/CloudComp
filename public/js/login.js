const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const remember = document.getElementById("remember").checked;

  if (email === "" || password === "") {
    loginMessage.style.color = "red";
    loginMessage.textContent = "Please enter your email and password.";
    return;
  }

  console.log("Email:", email);
  console.log("Password:", password);
  console.log("Remember me:", remember);

  loginMessage.style.color = "green";
  loginMessage.textContent = "Login form submitted successfully.";

});