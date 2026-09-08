const API = "http://localhost:5000";

function saveToken(token) {
    localStorage.setItem("token", token);
}

async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!data.token) {
        alert(data.message);
        return;
    }

    localStorage.setItem("token", data.token);

    // Decode token to get role
    const payload = JSON.parse(atob(data.token.split('.')[1]));

    if (payload.role === "admin") {
        window.location.href = "admin.html";
    } else {
        window.location.href = "dashboard.html";
    }
}

async function addEvent() {
    const token = localStorage.getItem("token");

    await fetch(`${API}/api/events/add`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        },
        body: JSON.stringify({
            title: title.value,
            description: description.value,
            date: date.value
        })
    });

    alert("Event Added");
}

async function loadEvents() {
    const res = await fetch(`${API}/api/events/all`);
    const events = await res.json();

    let output = "";
    events.forEach(e => {
        output += `<p>${e.title} - ${e.date}</p>`;
    });

    document.getElementById("events").innerHTML = output;
}