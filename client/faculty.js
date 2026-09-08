const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  loadGlobalStats();
  loadRecentActivity();
});

// Post Form Handling
document.getElementById("postForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const type = document.getElementById("postType").value;
  const title = document.getElementById("postTitle").value;
  const description = document.getElementById("postDescription").value;

  const endpoint = type === "event" ? "/api/events" : "/api/announcements";

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ title, description })
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message || "Posted successfully!");
      document.getElementById("postForm").reset();
      showSection('dashboard');
      loadGlobalStats();
      loadRecentActivity();
    } else {
      alert(data.message || "Failed to post.");
    }
  } catch (err) {
    console.error("Error posting content", err);
    alert("Server error. Try again later.");
  }
});

async function loadGlobalStats() {
  try {
    const [eRes, aRes] = await Promise.all([
      fetch("/api/events"),
      fetch("/api/announcements", { headers: { "Authorization": `Bearer ${token}` } })
    ]);

    const events = await eRes.json();
    const announcements = await aRes.json();

    document.getElementById("globalEventsCount").innerText = events.length;
    document.getElementById("globalAnnouncementsCount").innerText = announcements.length;
  } catch (err) {
    console.error("Stats loading failed", err);
  }
}

async function loadRecentActivity() {
  const list = document.getElementById("recentActivityList");
  list.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading recent activity...`;

  try {
    const [eRes, aRes] = await Promise.all([
      fetch("/api/events"),
      fetch("/api/announcements", { headers: { "Authorization": `Bearer ${token}` } })
    ]);

    const events = await eRes.json();
    const announcements = await aRes.json();

    const combined = [
      ...events.map(e => ({ ...e, type: 'event' })),
      ...announcements.map(a => ({ ...a, type: 'announcement' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    list.innerHTML = "";
    if (combined.length === 0) {
      list.innerHTML = `<p style="color: var(--text-muted);">No activity yet.</p>`;
      return;
    }

    combined.forEach(item => {
      const facultyName = item.postedBy?.name || 'Faculty';
      const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric'
      });
      list.innerHTML += `
                <div class="event-item clickable" onclick="showItemDetail(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                    <div class="event-info">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                          <span class="tag ${item.type}">${item.type}</span>
                          <span style="font-size: 0.75rem; color: var(--text-muted);">${dateStr}</span>
                        </div>
                        <h4 style="margin-top: 8px;">${item.title}</h4>
                        <p style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 450px;">
                          ${item.description}
                        </p>
                        <small style="color: var(--text-muted); display: block; margin-top: 5px;">
                            <i class="fas fa-user-circle"></i> Posted by ${facultyName}
                        </small>
                    </div>
                </div>
            `;
    });
  } catch (err) {
    list.innerHTML = "Error loading activity.";
  }
}

async function loadMyUploads() {
  const list = document.getElementById("myUploadsList");
  list.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading your posts...`;

  try {
    const [eRes, aRes] = await Promise.all([
      fetch("/api/events"),
      fetch("/api/announcements", { headers: { "Authorization": `Bearer ${token}` } })
    ]);

    const events = await eRes.json();
    const announcements = await aRes.json();

    const combined = [
      ...events.map(e => ({ ...e, type: 'event' })),
      ...announcements.map(a => ({ ...a, type: 'announcement' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    document.getElementById("myPostsCount").innerText = combined.length;

    list.innerHTML = "";
    combined.forEach(item => {
      const facultyName = item.postedBy?.name || 'Faculty';
      const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric'
      });
      list.innerHTML += `
                <div class="event-item clickable" onclick="showItemDetail(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                    <div class="event-info">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                          <span class="tag ${item.type}">${item.type}</span>
                          <span style="font-size: 0.75rem; color: var(--text-muted);">${dateStr}</span>
                        </div>
                        <h4 style="margin-top: 8px;">${item.title}</h4>
                        <p style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 450px;">
                          ${item.description}
                        </p>
                        <small style="color: var(--text-muted); display: block; margin-top: 5px;">
                            <i class="fas fa-user-circle"></i> Posted by ${facultyName}
                        </small>
                    </div>
                </div>
            `;
    });
  } catch (err) {
    list.innerHTML = "Error loading uploads.";
  }
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