const token = localStorage.getItem("token");
const role = localStorage.getItem("role"); // 🔥 GET ROLE

if (!token) {
  window.location.href = "login.html";
}

// Initial Load
document.addEventListener("DOMContentLoaded", () => {
  loadStats();
  loadPage("dashboard");
  startNotificationCheck();
});

async function loadStats() {
  try {
    const eRes = await fetch("/api/events");
    const events = await eRes.json();
    if (document.getElementById("activeEventsCount")) {
      document.getElementById("activeEventsCount").innerText = events.length;
    }

    // 🔥 FETCH UNREAD COUNT
    const aRes = await fetch("/api/notifications/unread-count", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const { count } = await aRes.json();
    if (document.getElementById("unreadNoticesCount")) {
      document.getElementById("unreadNoticesCount").innerText = count || 0;
    }

    // 🔥 FETCH ANNOUNCEMENTS COUNT
    const annRes = await fetch("/api/announcements", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const announcements = await annRes.json();
    if (document.getElementById("totalAnnouncementsCount")) {
      document.getElementById("totalAnnouncementsCount").innerText = announcements.length;
    }
  } catch (err) {
    console.error("Failed to load stats", err);
  }
}

async function markNotificationsRead() {
  try {
    await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    loadStats(); // Refresh count to 0
  } catch (err) {
    console.error("Failed to mark notifications read", err);
  }
}

async function loadPage(page) {
  const container = document.getElementById("feedList");
  container.innerHTML = `<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;

  try {
    let data = [];
    if (page === "announcements" || page === "dashboard") {
      const res = await fetch("/api/announcements", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const announcements = await res.json();
      data = data.concat(announcements.map(a => ({ ...a, type: 'announcement' })));
    }

    if (page === "events" || page === "dashboard") {
      const res = await fetch("/api/events");
      const events = await res.json();
      data = data.concat(events.map(e => ({ ...e, type: 'event' })));
    }

    // Sort by date (newest first)
    data.sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));

    renderFeed(data);
  } catch (err) {
    container.innerHTML = `<p style="color: #f87171;">Failed to load content. Please try again.</p>`;
  }
}

function renderFeed(items) {
  const container = document.getElementById("feedList");
  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = `<p style="text-align: center; padding: 2rem; color: var(--text-muted);">No activity found.</p>`;
    return;
  }

  items.forEach(item => {
    const facultyName = item.postedBy?.name || 'Faculty';

    // 🔥 ADMIN REMOVE BUTTON
    let adminButtons = "";
    if (role === "admin") {
      adminButtons = `
        <button onclick="deletePost('${item.type}', '${item._id}')" class="delete-hub-btn" 
          style="background: rgba(248, 113, 113, 0.1); color: #f87171; border: 1px solid #f87171; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; cursor: pointer;">
          <i class="fas fa-trash-alt"></i> Remove
        </button>
      `;
    }

    const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric'
    });

    const html = `
      <div class="event-item clickable" onclick="showItemDetail(${JSON.stringify(item).replace(/"/g, '&quot;')})">
        <div class="event-info">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <span class="tag ${item.type}">${item.type}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${dateStr}</span>
          </div>
          <h4 style="margin-top: 8px;">${item.title}</h4>
          <p style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 400px;">
            ${item.description}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
            <small style="color: var(--text-muted);">
              <i class="fas fa-user-circle"></i> Posted by ${facultyName}
            </small>
            ${adminButtons}
          </div>
        </div>
      </div>
    `;
    container.innerHTML += html;
  });
}

function showItemDetail(item) {
  const modal = document.getElementById("itemModal");
  const facultyName = item.postedBy?.name || 'Faculty';
  const dateStr = new Date(item.createdAt).toLocaleString();

  document.getElementById("modalTag").className = `tag ${item.type}`;
  document.getElementById("modalTag").innerText = item.type;
  document.getElementById("modalTitle").innerText = item.title;
  document.getElementById("modalDescription").innerText = item.description;
  document.getElementById("modalAuthor").innerHTML = `<i class="fas fa-user-circle"></i> Posted by ${facultyName}`;
  document.getElementById("modalDate").innerHTML = `<i class="fas fa-calendar"></i> ${dateStr}`;

  modal.style.display = "block";
}

function closeModal() {
  document.getElementById("itemModal").style.display = "none";
}

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("itemModal");
  if (event.target == modal) {
    closeModal();
  }
}

// 🔥 ADD DELETE POST LOGIC TO STUDENT.JS
async function deletePost(type, id) {
  if (!confirm(`Delete this ${type}?`)) return;
  const endpoint = type === 'event' ? `/api/events/${id}` : `/api/announcements/${id}`;
  try {
    const res = await fetch(endpoint, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      alert(`${type} removed`);
      // Refresh current view
      const activeSection = document.querySelector('.nav-link.active')?.innerText.toLowerCase() || 'dashboard';
      if (activeSection.includes('announcement')) loadPage('announcements');
      else if (activeSection.includes('event')) loadPage('events');
      else loadPage('dashboard');
      loadStats();
    } else {
      const err = await res.json();
      alert("Error: " + err.message);
    }
  } catch (err) {
    console.error("Remove failed", err);
  }
}

// Notification Logic
let lastNotificationTime = Date.now();
function startNotificationCheck() {
  setInterval(async () => {
    try {
      const res = await fetch("/api/notifications", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const notifications = await res.json();

      if (notifications.length > 0) {
        const latest = notifications[0];
        const noteTime = new Date(latest.createdAt).getTime();

        if (noteTime > lastNotificationTime) {
          showToast(latest.title, latest.message);
          lastNotificationTime = noteTime;
          loadStats(); // Refresh unread count
          // If on dashboard, refresh feed
          const activeSection = document.querySelector('.nav-link.active')?.innerText.toLowerCase();
          if (activeSection && activeSection.includes('dashboard')) loadPage('dashboard');
        }
      }
    } catch (err) {
      console.error("Notification check failed", err);
    }
  }, 10000); // Check every 10 seconds
}

function showToast(title, message) {
  const toast = document.createElement("div");
  toast.style = `
        position: fixed; top: 20px; right: 20px; 
        background: var(--bg-sidebar); border: 1px solid var(--primary-light);
        padding: 1rem; border-radius: 8px; z-index: 1000;
        box-shadow: var(--shadow); color: white;
        animation: slideIn 0.5s ease;
    `;
  toast.innerHTML = `<strong>${title}</strong><p style="font-size: 0.8rem; margin-top: 5px;">${message}</p>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

// Add animation to CSS
const style = document.createElement('style');
style.innerHTML = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);