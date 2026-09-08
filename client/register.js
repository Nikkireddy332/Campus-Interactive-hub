// 🚀 Auto-select role based on home page choice
document.addEventListener("DOMContentLoaded", () => {
  const savedRole = localStorage.getItem("selectedRole");
  if (savedRole) {
    const roleSelect = document.getElementById("role");
    if (roleSelect) {
      roleSelect.value = savedRole;
    }
  }
});

document.getElementById("registerForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;
  const department = document.getElementById("department").value;
  const studyYear = document.getElementById("studyYear").value;

  if (!name || !email || !password || !role) {
    alert("Please fill all required fields");
    return;
  }

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        department,
        studyYear
      })
    });

    const data = await response.json();
    console.log("Register response:", data);

    if (!response.ok) {
      alert(data.message);
      return;
    }

    alert("Registration successful");
    window.location.href = "login.html";

  } catch (error) {
    console.error("Register error:", error);
    alert("Registration failed");
  }
});
