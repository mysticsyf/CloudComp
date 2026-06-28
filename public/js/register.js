const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

registerForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const fullName = document.getElementById("fullName").value.trim();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();
  const remember = document.getElementById("remember").checked;

  const selectedRole = document.querySelector('input[name="userRole"]:checked');
  const userRole = selectedRole ? selectedRole.value : "";

  if (
    fullName === "" ||
    username === "" ||
    email === "" ||
    password === "" ||
    confirmPassword === ""
  ) {
    registerMessage.style.color = "red";
    registerMessage.textContent = "Please fill in all fields.";
    return;
  }

  if (userRole === "") {
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

  console.log("Full Name:", fullName);
  console.log("Username:", username);
  console.log("Email:", email);
  console.log("Password:", password);
  console.log("User Role:", userRole);
  console.log("Remember me:", remember);

  registerMessage.style.color = "green";
  registerMessage.textContent = "Registration form submitted successfully.";

});