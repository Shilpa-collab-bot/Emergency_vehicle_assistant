document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("role") !== "admin") {
        window.location.href = "index2.html";
        return;
    }

    document.getElementById("refreshButton").addEventListener("click", loadAllData);
    document.getElementById("logoutButton").addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "index2.html";
    });
    document.querySelectorAll(".tab-button").forEach(button => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".tab-button").forEach(item => item.classList.remove("active"));
            document.querySelectorAll(".admin-view").forEach(view => view.classList.remove("active-view"));
            button.classList.add("active");
            document.getElementById(button.dataset.view).classList.add("active-view");
        });
    });
    loadAllData();
});

async function loadAllData() {
    await Promise.all([loadUsers(), loadMechanics(), loadAdmins(), loadRequests()]);
}

async function loadUsers() {
    const list = document.getElementById("usersList");
    const result = await apiRequest("/display");
    const users = result?.data?.records || [];
    document.getElementById("usersCount").textContent = `${users.length} user${users.length === 1 ? "" : "s"}`;
    list.innerHTML = users.length ? users.map(user => `<article class="data-row">
        <strong>#${user.id} ${user.full_name || "Unnamed"}</strong>
        <span>${user.email || "No email"}</span>
        <span>${user.phone || "No phone"}</span>
        <span class="role">${user.role || "user"}</span>
    </article>`).join("") : "<p>No users found.</p>";
}

async function loadMechanics() {
    const list = document.getElementById("mechanicsList");
    const result = await apiRequest("/mechanics");
    const mechanics = result?.data?.records || [];
    document.getElementById("mechanicsCount").textContent = `${mechanics.length} mechanic${mechanics.length === 1 ? "" : "s"}`;
    list.innerHTML = mechanics.length ? mechanics.map(mechanic => `<article class="data-row">
        <strong>#${mechanic.id} ${mechanic.shop_name || "Unnamed shop"}</strong>
        <span>${mechanic.email || "No email"}</span>
        <span>${mechanic.phone || "No phone"}</span>
        <span>${mechanic.specialization || "No specialization"}</span>
        <span>${mechanic.availability ? "Available" : "Busy"} | Rating: ${mechanic.rating || 0}</span>
    </article>`).join("") : "<p>No mechanics found.</p>";
}

async function loadAdmins() {
    const list = document.getElementById("adminsList");
    const result = await apiRequest("/admins");
    const admins = result?.data?.records || [];
    document.getElementById("adminsCount").textContent = `${admins.length} admin${admins.length === 1 ? "" : "s"}`;
    list.innerHTML = admins.length ? admins.map(admin => `<article class="data-row">
        <strong>#${admin.id} ${admin.full_name || "Unnamed"}</strong>
        <span>${admin.email || "No email"}</span>
        <span>${admin.phone || "No phone"}</span>
        <span class="role">Administrator</span>
    </article>`).join("") : "<p>No admins found.</p>";
}

async function loadRequests() {
    const message = document.getElementById("message");
    const list = document.getElementById("requestList");

    try {
        const result = await apiRequest("/all/requests");
        if (!result || !result.ok) {
            message.textContent = result?.data?.detail || "Unable to load requests.";
            return;
        }

        const requests = result.data.requests || [];
        const counts = { pending: 0, active: 0, completed: 0 };
        requests.forEach(request => {
            if (request.status === "pending") counts.pending++;
            else if (["accepted", "in_progress"].includes(request.status)) counts.active++;
            else if (request.status === "completed") counts.completed++;
        });
        document.getElementById("totalCount").textContent = requests.length;
        document.getElementById("pendingCount").textContent = counts.pending;
        document.getElementById("activeCount").textContent = counts.active;
        document.getElementById("completedCount").textContent = counts.completed;

        list.innerHTML = requests.length ? requests.map(request => {
            const status = request.status || "pending";
            const mechanic = request.mechanic;
            return `<article class="request-row">
                <div class="row-top">
                    <strong>Request #${request.request_id}</strong>
                    <span class="status status-${status}">${status.replace("_", " ")}</span>
                </div>
                <p><b>User:</b> ${request.user?.full_name || "Unknown"} (${request.user?.phone || "No phone"})</p>
                <p><b>Mechanic:</b> ${mechanic?.shop_name || "Not assigned"}${mechanic?.phone ? ` (${mechanic.phone})` : ""}</p>
                <p><b>Vehicle:</b> ${request.vehicle_type || "N/A"} | ${request.vehicle_number || "N/A"}</p>
                <p><b>Issue:</b> ${request.issue_type || "N/A"} - ${request.issue_description || "No description"}</p>
                ${request.rating != null ? `<p class="feedback"><b>Feedback:</b> ${request.rating}/5${request.comment ? ` - ${request.comment}` : ""}</p>` : ""}
            </article>`;
        }).join("") : "<p>No requests found.</p>";
        message.textContent = `${requests.length} request${requests.length === 1 ? "" : "s"} found.`;
    } catch (error) {
        console.error("ADMIN REQUEST ERROR:", error);
        message.textContent = "Unable to connect to the server.";
    }
}
