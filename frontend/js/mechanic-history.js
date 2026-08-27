document.addEventListener("DOMContentLoaded", () => {
    const mechanicId = localStorage.getItem("mechanicId");
    const role = localStorage.getItem("role");

    if (!mechanicId || role !== "mechanic") {
        window.location.href = "index2.html";
        return;
    }

    document.getElementById("welcomeMechanic").textContent =
        `Welcome, ${localStorage.getItem("name") || "Mechanic"}`;
    document.getElementById("backButton").addEventListener("click", () => {
        window.location.href = "mechanic-dashboard.html";
    });
    document.getElementById("refreshHistoryButton").addEventListener(
        "click",
        loadHistory
    );
    loadHistory();
});

async function loadHistory() {
    const mechanicId = localStorage.getItem("mechanicId");
    const list = document.getElementById("historyList");
    const message = document.getElementById("historyMessage");

    try {
        const result = await apiRequest(
            `/requests/mechanic?mechanic_id=${encodeURIComponent(mechanicId)}`
        );

        if (!result || !result.ok) {
            message.textContent = result?.data?.detail ||
                "Unable to load job history.";
            return;
        }

        const requests = result.data.requests || [];
        list.innerHTML = requests.length ? requests.map(request => {
            const status = request.status || "pending";
            return `
                <article class="request-card history-item">
                    <div class="request-header">
                        <h3>Request #${request.id}</h3>
                        <span class="status-badge status-${status}">${status.replace("_", " ")}</span>
                    </div>
                    <div class="request-details">
                        <div class="detail"><strong>Vehicle:</strong> ${request.vehicle_type || "N/A"}</div>
                        <div class="detail"><strong>Number:</strong> ${request.vehicle_number || "N/A"}</div>
                        <div class="detail"><strong>Issue:</strong> ${request.issue_type || "N/A"}</div>
                        <div class="detail"><strong>User ID:</strong> ${request.user_id || "N/A"}</div>
                    </div>
                    <p class="request-description">${request.issue_description || "No description"}</p>
                    ${request.rating != null ? `
                        <div class="customer-feedback">
                            <strong>Customer Feedback:</strong>
                            <span>${request.rating}/5</span>
                            ${request.comment ? `<p>${request.comment}</p>` : ""}
                        </div>
                    ` : ""}
                </article>
            `;
        }).join("") : "<p>No job history found.</p>";
        message.textContent = `${requests.length} request${requests.length === 1 ? "" : "s"} found.`;
    } catch (error) {
        console.error("HISTORY ERROR:", error);
        message.textContent = "Unable to connect to the server.";
    }
}