const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

// Decode JWT token
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

const user = parseJwt(token);

if (!user) {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// Show user name and role
document.getElementById("welcome").innerText =
  `Welcome ${user.name} (${user.role.toUpperCase()})`;

// Show Add Event section only for faculty/admin
if (user.role === "faculty" || user.role === "admin") {
  document.getElementById("eventSection").style.display = "block";
}

// Load events
async function loadEvents() {
  const res = await fetch("http://localhost:5000/api/events");
  const events = await res.json();

  const container = document.getElementById("events");
  container.innerHTML = "";

  events.forEach(event => {
    container.innerHTML += `
      <div class="event">
        <h4>${event.title}</h4>
        <p>${event.description}</p>
      </div>
    `;
  });
}

// Add event
async function addEvent() {
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;

  const res = await fetch("http://localhost:5000/api/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({ title, description })
  });

  const data = await res.json();
  alert(data.message);
  loadEvents();
}

// Logout
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

loadEvents();