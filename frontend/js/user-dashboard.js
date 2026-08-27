// ==========================================
// EVA - USER DASHBOARD
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const requestForm =
        document.getElementById("requestForm");

    const locationButton =
        document.getElementById("locationButton");

    // ==========================================
    // CHECK LOGIN
    // ==========================================

    const userId =
        localStorage.getItem("userId");

    const userName =
        localStorage.getItem("name");

    if (!userId) {

        window.location.href =
            "index2.html";

        return;
    }

    // Show username
    const welcomeUser =
        document.getElementById("welcomeUser");

    if (welcomeUser && userName) {

        welcomeUser.textContent =
            `Welcome, ${userName}`;
    }


    // ==========================================
    // GET LOCATION
    // ==========================================

    locationButton.addEventListener(
        "click",
        getCurrentLocation
    );


    // ==========================================
    // REQUEST FORM
    // ==========================================

    requestForm.addEventListener(
        "submit",
        createEmergencyRequest
    );


    // Automatically try to get location
    getCurrentLocation();

    loadMyRequests();
    document.getElementById("refreshRequestsButton").addEventListener(
        "click",
        loadMyRequests
    );
    setInterval(loadMyRequests, 10000);
});


// ==========================================
// GET CURRENT GPS LOCATION
// ==========================================

function getCurrentLocation() {

    const latitudeInput =
        document.getElementById("latitude");

    const longitudeInput =
        document.getElementById("longitude");

    const locationStatus =
        document.getElementById("locationStatus");

    locationStatus.textContent =
        "Getting your location...";

    locationStatus.style.color =
        "#1976d2";


    if (!navigator.geolocation) {

        locationStatus.textContent =
            "Geolocation is not supported by this browser.";

        locationStatus.style.color =
            "red";

        return;
    }


    navigator.geolocation.getCurrentPosition(

        (position) => {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            latitudeInput.value =
                latitude;

            longitudeInput.value =
                longitude;


            locationStatus.textContent =
                "✓ Location detected successfully";

            locationStatus.style.color =
                "green";


            console.log(
                "USER LATITUDE:",
                latitude
            );

            console.log(
                "USER LONGITUDE:",
                longitude
            );
        },


        (error) => {

            console.error(
                "LOCATION ERROR:",
                error
            );


            locationStatus.textContent =
                "Unable to get location. Please allow location access.";

            locationStatus.style.color =
                "red";
        },


        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}


// ==========================================
// CREATE EMERGENCY REQUEST
// ==========================================

async function createEmergencyRequest(event) {

    event.preventDefault();


    const button =
        document.getElementById(
            "requestButton"
        );

    const message =
        document.getElementById(
            "requestMessage"
        );


    // ==========================================
    // GET TOKEN
    // ==========================================

    const userId =
        localStorage.getItem("userId");

    const token =
        localStorage.getItem("token");


    if (!userId || !token) {

        message.textContent =
            "Please login first.";

        message.style.color =
            "red";

        return;
    }


    // ==========================================
    // GET FORM VALUES
    // ==========================================

    const vehicleType =
        document.getElementById(
            "vehicleType"
        ).value;

    const vehicleNumber =
        document.getElementById(
            "vehicleNumber"
        ).value.trim();

    const issueType =
        document.getElementById(
            "issueType"
        ).value;

    const issueDescription =
        document.getElementById(
            "issueDescription"
        ).value.trim();

    const latitude =
        document.getElementById(
            "latitude"
        ).value;

    const longitude =
        document.getElementById(
            "longitude"
        ).value;


    // ==========================================
    // VALIDATION
    // ==========================================

    if (
        !vehicleType ||
        !vehicleNumber ||
        !issueType ||
        !issueDescription
    ) {

        message.textContent =
            "Please fill all request details.";

        message.style.color =
            "red";

        return;
    }


    if (!latitude || !longitude) {

        message.textContent =
            "Please get your current location first.";

        message.style.color =
            "red";

        return;
    }


    // ==========================================
    // REQUEST BODY
    // ==========================================

    const requestData = {

        vehicle_type:
            vehicleType,

        vehicle_number:
            vehicleNumber,

        issue_type:
            issueType,

        issue_description:
            issueDescription,

        latitude:
            Number(latitude),

        longitude:
            Number(longitude)
    };


    console.log(
        "EMERGENCY REQUEST:",
        requestData
    );


    // ==========================================
    // DISABLE BUTTON
    // ==========================================

    button.disabled = true;

    button.textContent =
        "Finding Mechanic...";

    message.textContent = "";


    try {

        // ==========================================
        // SEND REQUEST TO FASTAPI
        // ==========================================

        const response = await fetch(

            `${API_BASE_URL}/requests?user_id=${encodeURIComponent(userId)}`,

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${token}`

                },

                body:
                    JSON.stringify(requestData)
            }
        );


        const data =
            await response.json();


        console.log(
            "REQUEST RESPONSE:",
            data
        );


        // ==========================================
        // SUCCESS
        // ==========================================

        if (response.ok) {

            message.textContent =
                data.message ||
                "Mechanic found successfully!";

            message.style.color =
                "green";


            displayRequestResult(data);


            // Clear form
            document.getElementById(
                "requestForm"
            ).reset();


            // Keep location
            getCurrentLocation();

        }


        // ==========================================
        // NO MECHANIC
        // ==========================================

        else {

            message.textContent =
                data.detail ||
                data.message ||
                "No nearby mechanic available.";

            message.style.color =
                "red";
        }

    }


    // ==========================================
    // CONNECTION ERROR
    // ==========================================

    catch (error) {

        console.error(
            "REQUEST ERROR:",
            error
        );


        message.textContent =
            "Unable to connect to the server.";

        message.style.color =
            "red";
    }


    finally {

        button.disabled = false;

        button.textContent =
            "🚨 Find Nearby Mechanic";
    }
}


// ==========================================
// DISPLAY MECHANIC RESULT
// ==========================================

function displayRequestResult(data) {

    const resultCard =
        document.getElementById(
            "requestResult"
        );

    const mechanicResult =
        document.getElementById(
            "mechanicResult"
        );


    resultCard.style.display =
        "block";


    // Your backend may return mechanic
    // directly or inside data.mechanic

    const mechanic =
        data.mechanic ||
        data.data?.mechanic ||
        null;


    if (!mechanic) {

        mechanicResult.innerHTML = `

            <div class="mechanic-info">

                <p>
                    Emergency request created successfully.
                </p>

                <p>
                    Request ID:
                    ${data.request_id || data.id || "N/A"}
                </p>

            </div>

        `;

        return;
    }


    mechanicResult.innerHTML = `

        <div class="mechanic-info">

            <h3>
                🔧 ${mechanic.shop_name || "Nearby Mechanic"}
            </h3>

            <p>
                <strong>Address:</strong>
                ${mechanic.address || "N/A"}
            </p>

            <p>
                <strong>Phone:</strong>
                ${mechanic.phone || "N/A"}
            </p>

            <p>
                <strong>Specialization:</strong>
                ${mechanic.specialization || "N/A"}
            </p>

            <p>
                <strong>Experience:</strong>
                ${mechanic.experience_year || 0}
                years
            </p>

            <p>
                <strong>Rating:</strong>
                ${mechanic.rating || 0}
            </p>

        </div>
    `;
}

async function loadMyRequests() {
    const userId = localStorage.getItem("userId");
    const list = document.getElementById("myRequestsList");
    const message = document.getElementById("requestHistoryMessage");

    if (!userId || !list || !message) {
        return;
    }

    try {
        const result = await apiRequest(
            `/requests/my?user_id=${encodeURIComponent(userId)}`
        );

        if (!result || !result.ok) {
            message.textContent = result?.data?.detail ||
                "Unable to load your requests.";
            return;
        }

        const requests = result.data.requests || [];
        list.innerHTML = requests.length ? requests.map(request => {
            const mechanic = request.mechanic;
            const status = (request.status || "pending").replace("_", " ");
            return `
                <article class="request-history-item">
                    <div>
                        <strong>Request #${request.id}</strong>
                        <span class="request-status status-${request.status}">${status}</span>
                    </div>
                    <p>${request.issue_type || "Vehicle assistance"} | ${request.vehicle_number || "No vehicle number"}</p>
                    <p>${mechanic ? `Mechanic: ${mechanic.shop_name || "Assigned mechanic"}` : "Finding a mechanic..."}</p>
                    ${mechanic?.phone ? `<p><a class="contact-link" href="tel:${mechanic.phone}">Call mechanic: ${mechanic.phone}</a></p>` : ""}
                    ${mechanic?.latitude != null && mechanic?.longitude != null && ["pending", "accepted"].includes(request.status) ? `<p><a class="location-link" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps?q=${mechanic.latitude},${mechanic.longitude}">View mechanic live location</a></p>` : ""}
                    ${["pending", "accepted"].includes(request.status) ? `
                        <button type="button" class="cancel-request-btn" onclick="cancelRequest(${request.id})">Cancel Request</button>
                    ` : ""}
                    ${request.status === "completed" && request.rating == null ? `
                        <div class="feedback-form">
                            <label for="rating-${request.id}">Rate this service</label>
                            <select id="rating-${request.id}">
                                <option value="">Choose rating</option>
                                <option value="5">5 - Excellent</option>
                                <option value="4">4 - Good</option>
                                <option value="3">3 - Average</option>
                                <option value="2">2 - Poor</option>
                                <option value="1">1 - Very poor</option>
                            </select>
                            <input id="comment-${request.id}" type="text" placeholder="Optional comment">
                            <button type="button" onclick="submitFeedback(${request.id})">Submit Feedback</button>
                        </div>
                    ` : request.rating != null ? `<p> Your rating: ${request.rating}/5${request.comment ? ` - ${request.comment}` : ""}</p>` : ""}
                </article>
            `;
        }).join("") : "<p>No requests created yet.</p>";
        message.textContent = `Showing ${requests.length} request${requests.length === 1 ? "" : "s"}.`;
    } catch (error) {
        console.error("REQUEST HISTORY ERROR:", error);
        message.textContent = "Unable to connect to the server.";
    }
}

async function submitFeedback(requestId) {
    const userId = localStorage.getItem("userId");
    const rating = document.getElementById(`rating-${requestId}`).value;
    const comment = document.getElementById(`comment-${requestId}`).value.trim();
    const message = document.getElementById("requestHistoryMessage");

    if (!rating) {
        message.textContent = "Please choose a rating first.";
        return;
    }

    const result = await apiRequest(
        `/requests/${requestId}/feedback?user_id=${encodeURIComponent(userId)}`,
        {
            method: "POST",
            body: JSON.stringify({ rating: Number(rating), comment })
        }
    );
    message.textContent = result?.data?.message ||
        "Unable to submit feedback.";
    if (result?.ok) {
        await loadMyRequests();
    }
}

async function cancelRequest(requestId) {
    if (!confirm(`Cancel request #${requestId}?`)) {
        return;
    }
    const userId = localStorage.getItem("userId");
    const message = document.getElementById("requestHistoryMessage");
    const result = await apiRequest(
        `/requests/${requestId}/cancel?user_id=${encodeURIComponent(userId)}`,
        { method: "PUT" }
    );
    message.textContent = result?.data?.message || "Unable to cancel request.";
    if (result?.ok) {
        await loadMyRequests();
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

    window.location.href =
        "index2.html";
}
