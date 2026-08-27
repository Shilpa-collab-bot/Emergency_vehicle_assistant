document.addEventListener("DOMContentLoaded", () => {
    const userId = localStorage.getItem("userId");
    if (!userId || localStorage.getItem("role") !== "user") {
        window.location.href = "index2.html";
        return;
    }
    document.getElementById("backButton").addEventListener("click", () => {
        window.location.href = "user-dashboard.html";
    });
    loadStatus();
    setInterval(loadStatus, 10000);
});

async function loadStatus() {
    const message = document.getElementById("statusMessage");
    const list = document.getElementById("statusList");
    try {
        const result = await apiRequest(
            `/requests/my?user_id=${encodeURIComponent(localStorage.getItem("userId"))}`
        );
        if (!result || !result.ok) {
            message.textContent = result?.data?.detail || "Unable to load request status.";
            return;
        }
        const requests = result.data.requests || [];
        list.innerHTML = requests.length ? requests.map(request => `
            <article class="request-history-item">
                <div><strong>Request #${request.id}</strong>
                <span class="request-status status-${request.status}">${(request.status || "pending").replace("_", " ")}</span></div>
                <p>${request.issue_type || "Vehicle assistance"} | ${request.vehicle_number || "N/A"}</p>
                <p>${request.mechanic ? `Mechanic: ${request.mechanic.shop_name || "Assigned"}` : "Finding a mechanic..."}</p>
                ${request.mechanic?.phone ? `<p><a class="contact-link" href="tel:${request.mechanic.phone}">Call mechanic: ${request.mechanic.phone}</a></p>` : ""}
                ${request.mechanic?.latitude != null && request.mechanic?.longitude != null && ["pending", "accepted"].includes(request.status) ? `<p><a class="location-link" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps?q=${request.mechanic.latitude},${request.mechanic.longitude}">View mechanic live location</a></p>` : ""}
                ${["pending", "accepted"].includes(request.status) ? `<button type="button" class="cancel-request-btn" onclick="cancelRequest(${request.id})">Cancel Request</button>` : ""}
                ${request.rating != null ? `<p>Your rating: ${request.rating}/5</p>` : ""}
            </article>
        `).join("") : "<p>No requests created yet.</p>";
        message.textContent = `${requests.length} request${requests.length === 1 ? "" : "s"} found.`;
    } catch (error) {
        console.error("STATUS ERROR:", error);
        message.textContent = "Unable to connect to the server.";
    }
}

async function cancelRequest(requestId) {
    if (!confirm(`Cancel request #${requestId}?`)) {
        return;
    }
    const userId = localStorage.getItem("userId");
    const message = document.getElementById("statusMessage");
    const result = await apiRequest(
        `/requests/${requestId}/cancel?user_id=${encodeURIComponent(userId)}`,
        { method: "PUT" }
    );
    message.textContent = result?.data?.message || "Unable to cancel request.";
    if (result?.ok) {
        await loadStatus();
    }
}
