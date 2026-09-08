const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    loadOverviewStats();
});

async function loadOverviewStats() {
    try {
        const [eRes, aRes, uRes] = await Promise.all([
            fetch("/api/events"),
            fetch("/api/announcements", { headers: { "Authorization": `Bearer ${token}` } }),
            fetch("/api/auth/users", { headers: { "Authorization": `Bearer ${token}` } })
        ]);

        const events = await eRes.json();
        const announcements = await aRes.json();
        const users = await uRes.json();

        if (document.getElementById("totalEventsCount")) document.getElementById("totalEventsCount").innerText = events.length;
        if (document.getElementById("totalAnnouncementsCount")) document.getElementById("totalAnnouncementsCount").innerText = announcements.length;
        if (document.getElementById("totalUsersCount")) document.getElementById("totalUsersCount").innerText = users.length;

        // 🔥 POPULATE HUB ACTIVITY FEED ON OVERVIEW
        const hubList = document.getElementById("overviewActivityList");
        if (hubList) {
            const combined = [
                ...events.map(e => ({ ...e, type: 'event' })),
                ...announcements.map(a => ({ ...a, type: 'announcement' }))
            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

            hubList.innerHTML = "";
            if (combined.length === 0) {
                hubList.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 1rem;">No recent activity.</p>`;
            } else {
                combined.forEach(item => {
                    const facultyName = item.postedBy?.name || 'Faculty';
                    const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric'
                    });
                    hubList.innerHTML += `
                        <div class="event-item clickable" onclick="showItemDetail(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                            <div class="event-info">
                                <div style="display: flex; justify-content: space-between; align-items: start;">
                                    <div>
                                        <span class="tag ${item.type}">${item.type}</span>
                                        <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 10px;">${dateStr}</span>
                                    </div>
                                    <button onclick="event.stopPropagation(); deletePost('${item.type}', '${item._id}')" class="delete-hub-btn" 
                                        style="background: rgba(248, 113, 113, 0.1); color: #f87171; border: 1px solid #f87171; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; cursor: pointer;">
                                        <i class="fas fa-trash-alt"></i> Remove
                                    </button>
                                </div>
                                <h4 style="margin-top: 8px;">${item.title}</h4>
                                <p style="font-size: 0.9rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 500px;">
                                    ${item.description}
                                </p>
                                <small style="display: block; margin-top: 5px; color: var(--text-muted);">
                                    <i class="fas fa-user-circle"></i> Posted by ${facultyName}
                                </small>
                            </div>
                        </div>
                    `;
                });
            }
        }
    } catch (err) {
        console.error("Overview stats failed", err);
    }
}

async function loadUsers() {
    const list = document.getElementById("usersList");
    if (!list) return;
    list.innerHTML = `<tr><td colspan="4" style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading users...</td></tr>`;

    try {
        const res = await fetch("/api/auth/users", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Unauthorized or Not Found");

        const users = await res.json();

        if (document.getElementById("totalUsersCount")) document.getElementById("totalUsersCount").innerText = users.length;

        list.innerHTML = "";
        users.forEach(user => {
            list.innerHTML += `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td><span class="badge ${user.role}">${user.role}</span></td>
                    <td>
                        <button onclick="deleteUser('${user._id}')" class="delete-btn" title="Delete User" style="color: #f87171; background: none; border: none; cursor: pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        list.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Failed to load users.</td></tr>`;
    }
}

async function deleteUser(id) {
    const skipConfirm = window.ADMIN_NO_CONFIRM === true;
    if (!skipConfirm && !confirm("Are you sure you want to delete this user?")) return;

    try {
        const res = await fetch(`/api/auth/users/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            alert("User deleted successfully");
            loadUsers();
            loadOverviewStats();
        }
    } catch (err) {
        console.error("Delete failed", err);
    }
}

async function loadModerationContent() {
    const list = document.getElementById("moderationList");
    if (!list) return;
    list.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading content...`;

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
                            <div>
                                <span class="tag ${item.type}">${item.type}</span>
                                <span style="font-size: 0.75rem; color: var(--text-muted); margin-left:10px;">${dateStr}</span>
                            </div>
                            <button onclick="event.stopPropagation(); deletePost('${item.type}', '${item._id}')" class="delete-hub-btn" 
                                style="background: rgba(248, 113, 113, 0.1); color: #f87171; border: 1px solid #f87171; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; cursor: pointer;">
                                <i class="fas fa-trash-alt"></i> Remove
                            </button>
                        </div>
                        <h4 style="margin-top: 8px;">${item.title}</h4>
                        <p style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 500px;">
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
        list.innerHTML = "Error loading content.";
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

async function deletePost(type, id) {
    const skipConfirm = window.ADMIN_NO_CONFIRM === true;
    if (!skipConfirm && !confirm(`Delete this ${type}?`)) return;

    const endpoint = type === 'event' ? `/api/events/${id}` : `/api/announcements/${id}`;
    try {
        const res = await fetch(endpoint, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            alert(`${type} removed successfully`);
            // Refresh wherever we are
            loadOverviewStats();
            if (document.getElementById("moderationList")) loadModerationContent();
        }
    } catch (err) {
        console.error("Remove failed", err);
    }
}
