
// ==========================================
// EVA - MECHANIC DASHBOARD
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // CHECK LOGIN
    // ==========================================

    const mechanicId = localStorage.getItem("mechanicId");
    const role = localStorage.getItem("role");

    if (!mechanicId) {
        window.location.href = "index2.html";
        return;
    }

    if (role !== "mechanic") {
        window.location.href = "index2.html";
        return;
    }


    // ==========================================
    // ELEMENTS
    // ==========================================

    const welcomeMechanic =
        document.getElementById("welcomeMechanic");

    const refreshButton =
        document.getElementById("refreshButton");

    const logoutButton =
        document.getElementById("logoutButton");

    const availabilityButton =
        document.getElementById("availabilityButton");

    const historyButton =
        document.getElementById("historyButton");

    setAvailabilityUI(true);
    startLocationSharing();


    // ==========================================
    // DISPLAY MECHANIC NAME
    // ==========================================

    const name =
        localStorage.getItem("name");

    if (name) {
        welcomeMechanic.textContent =
            `Welcome, ${name}`;
    }


    // ==========================================
    // LOAD REQUESTS
    // ==========================================

    loadMechanicRequests();


    // ==========================================
    // BUTTON EVENTS
    // ==========================================

    refreshButton.addEventListener(
        "click",
        loadMechanicRequests
    );

    logoutButton.addEventListener(
        "click",
        logout
    );

    availabilityButton.addEventListener(
        "click",
        toggleAvailability
    );

    historyButton.addEventListener(
        "click",
        () => {
            window.location.href =
                "mechanic-history.html";
        }
    );

});


// ==========================================
// LOAD MECHANIC REQUESTS
// ==========================================

async function loadMechanicRequests() {

    const loading =
        document.getElementById("loading");

    const noRequests =
        document.getElementById("noRequests");

    const requestsList =
        document.getElementById("requestsList");

    const requestCount =
        document.getElementById("requestCount");

    const message =
        document.getElementById("dashboardMessage");


    loading.style.display = "block";

    noRequests.style.display = "none";

    requestsList.innerHTML = "";

    message.textContent = "";


    try {

        const result = await apiRequest(
            `/requests/mechanic?mechanic_id=${encodeURIComponent(localStorage.getItem("mechanicId"))}`,
            {
                method: "GET"
            }
        );


        if (!result) {
            return;
        }


        console.log(
            "MECHANIC REQUESTS:",
            result.data
        );


        // ==========================================
        // SUCCESS
        // ==========================================

        if (result.ok) {

            const requests =
                result.data.requests || [];


            requestCount.textContent =
                `${requests.length} Request${requests.length !== 1 ? "s" : ""}`;


            loading.style.display = "none";


            if (requests.length === 0) {

                noRequests.style.display =
                    "block";

                return;
            }


            requests.forEach(
                request => {

                    requestsList.appendChild(
                        createRequestCard(request)
                    );
                }
            );

        }


        // ==========================================
        // ERROR
        // ==========================================

        else {

            loading.style.display =
                "none";

            message.textContent =
                result.data.detail ||
                result.data.message ||
                "Unable to load requests.";

            message.style.color =
                "red";
        }

    }

    catch (error) {

        console.error(
            "LOAD REQUESTS ERROR:",
            error
        );

        loading.style.display =
            "none";

        message.textContent =
            "Unable to connect to the server.";

        message.style.color =
            "red";
    }
}

function startLocationSharing() {
    if (!navigator.geolocation) {
        return;
    }
    navigator.geolocation.watchPosition(async position => {
        await apiRequest(
            `/mechanic/location?mechanic_id=${encodeURIComponent(localStorage.getItem("mechanicId"))}`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                })
            }
        );
    }, error => console.error("LOCATION SHARING ERROR:", error), {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000
    });
}


// ==========================================
// CREATE REQUEST CARD
// ==========================================

function createRequestCard(request) {

    const card =
        document.createElement("div");

    card.className =
        "request-card";


    const status =
        request.status || "pending";


    const formattedStatus =
        status.replace(
            "_",
            " "
        );


    // ==========================================
    // GOOGLE MAPS LOCATION
    // ==========================================

    let locationHTML = "";

    if (
        request.latitude !== null &&
        request.latitude !== undefined &&
        request.longitude !== null &&
        request.longitude !== undefined
    ) {

        const mapURL =
            `https://www.google.com/maps?q=${request.latitude},${request.longitude}`;

        locationHTML = `

            <div class="location-info">

                📍
                <strong>Customer Location:</strong>

                ${request.latitude},
                ${request.longitude}

                <br>

                <a
                    href="${mapURL}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Open Location in Google Maps
                </a>

            </div>
        `;
    }


    // ==========================================
    // ACTION BUTTONS
    // ==========================================

    let actionButtons = "";


    if (status === "pending") {

        actionButtons = `

            <button
                class="accept-btn"
                onclick="updateRequestStatus(
                    ${request.id},
                    'accepted'
                )"
            >
                ✅ Accept
            </button>

            <button
                class="reject-btn"
                onclick="updateRequestStatus(
                    ${request.id},
                    'rejected'
                )"
            >
                ❌ Reject
            </button>
        `;
    }


    else if (
        status === "accepted"
    ) {

        actionButtons = `

            <button
                class="complete-btn"
                onclick="updateRequestStatus(
                    ${request.id},
                    'completed'
                )"
            >
                🏁 Complete
            </button>
        `;
    }


    else if (
        status === "in_progress"
    ) {

        actionButtons = `

            <button
                class="complete-btn"
                onclick="updateRequestStatus(
                    ${request.id},
                    'completed'
                )"
            >
                🏁 Complete
            </button>
        `;
    }


    // ==========================================
    // CARD HTML
    // ==========================================

    card.innerHTML = `

        <div class="request-header">

            <h3>
                🚨 Request #${request.id}
            </h3>

            <span
                class="status-badge status-${status}"
            >
                ${formattedStatus}
            </span>

        </div>


        <div class="request-details">

            <div class="detail">
                <strong>Vehicle:</strong>
                ${request.vehicle_type || "N/A"}
            </div>

            <div class="detail">
                <strong>Vehicle Number:</strong>
                ${request.vehicle_number || "N/A"}
            </div>

            <div class="detail">
                <strong>Issue:</strong>
                ${request.issue_type || "N/A"}
            </div>

            <div class="detail">
                <strong>User ID:</strong>
                ${request.user_id || "N/A"}
            </div>

        </div>


        <div class="request-description">

            <strong>
                Problem Description
            </strong>

            <p>
                ${request.issue_description || "No description"}
            </p>

        </div>

        ${request.rating != null ? `
            <div class="customer-feedback">
                <strong>Customer Feedback:</strong>
                <span>${request.rating}/5</span>
                ${request.comment ? `<p>${request.comment}</p>` : ""}
            </div>
        ` : ""}


        ${locationHTML}


        <div class="request-actions">

            ${actionButtons}

        </div>
    `;


    return card;
}


// ==========================================
// UPDATE REQUEST STATUS
// ==========================================

async function updateRequestStatus(
    requestId,
    newStatus
) {

    const message =
        document.getElementById(
            "dashboardMessage"
        );


    const confirmMessage =
        `Are you sure you want to mark request #${requestId} as ${newStatus}?`;


    if (!confirm(confirmMessage)) {
        return;
    }


    try {

        /*
         * IMPORTANT:
         *
         * This endpoint must match your
         * FastAPI backend.
         *
         * Example:
         *
         * PATCH /requests/{request_id}/status
         */

        const action = newStatus === "accepted" ? "accept" :
            newStatus === "rejected" ? "reject" : "complete";
        const result = await apiRequest(
            `/requests/${requestId}/${action}?mechanic_id=${encodeURIComponent(localStorage.getItem("mechanicId"))}`,
            { method: "PUT" }
        );


        if (!result) {
            return;
        }


        console.log(
            "STATUS RESPONSE:",
            result.data
        );


        if (result.ok) {

            message.textContent =
                result.data.message ||
                `Request ${newStatus} successfully.`;

            message.style.color =
                "green";


            // Reload requests
            await loadMechanicRequests();

        }

        else {

            message.textContent =
                result.data.detail ||
                result.data.message ||
                "Unable to update request.";

            message.style.color =
                "red";
        }

    }

    catch (error) {

        console.error(
            "UPDATE STATUS ERROR:",
            error
        );

        message.textContent =
            "Unable to connect to server.";

        message.style.color =
            "red";
    }
}


// ==========================================
// TOGGLE AVAILABILITY
// ==========================================

async function toggleAvailability() {

    const button =
        document.getElementById(
            "availabilityButton"
        );

    const text =
        document.getElementById(
            "availabilityText"
        );

    const message =
        document.getElementById(
            "dashboardMessage"
        );


    /*
     * This assumes your backend has:
     *
     * PATCH /mechanic/availability
     *
     * Body:
     *
     * {
     *     "availability": true/false
     * }
     *
     * If your backend uses a different endpoint,
     * change only the URL below.
     */


    const currentAvailability =
        button.dataset.available === "true";


    const newAvailability =
        !currentAvailability;


    button.disabled = true;


    try {

        const result = await apiRequest(

            `/mechanic/availability?mechanic_id=${encodeURIComponent(localStorage.getItem("mechanicId"))}`,

            {

                method: "PATCH",

                body: JSON.stringify({

                    availability:
                        newAvailability
                })
            }
        );


        if (!result) {
            return;
        }


        if (result.ok) {

            setAvailabilityUI(
                newAvailability
            );

            message.textContent =
                "Availability updated successfully.";

            message.style.color =
                "green";
        }

        else {

            message.textContent =
                result.data.detail ||
                result.data.message ||
                "Unable to update availability.";

            message.style.color =
                "red";
        }

    }

    catch (error) {

        console.error(
            "AVAILABILITY ERROR:",
            error
        );

        message.textContent =
            "Unable to connect to server.";

        message.style.color =
            "red";
    }

    finally {

        button.disabled = false;
    }
}


// ==========================================
// AVAILABILITY UI
// ==========================================

function setAvailabilityUI(
    available
) {

    const button =
        document.getElementById(
            "availabilityButton"
        );

    const text =
        document.getElementById(
            "availabilityText"
        );


    button.dataset.available =
        available;


    if (available) {

        text.textContent =
            "You are currently available for emergency requests.";

        button.textContent =
            "🟢 Available";

        button.classList.remove(
            "unavailable"
        );

    }

    else {

        text.textContent =
            "You are currently unavailable.";

        button.textContent =
            "⚪ Unavailable";

        button.classList.add(
            "unavailable"
        );
    }
}


// ==========================================
// LOGOUT
// ==========================================

function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    localStorage.removeItem("phone");
    localStorage.removeItem("mechanicId");

    window.location.href =
        "index2.html";
}
