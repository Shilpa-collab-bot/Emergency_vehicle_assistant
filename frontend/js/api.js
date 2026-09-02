// ==========================================
// EVA - API CONFIGURATION
// ==========================================

// FastAPI backend URL
// const API_BASE_URL = "http://127.0.0.1:8000";

const API_BASE_URL = "https://your-backend.onrender.com";
// ==========================================
// GET SAVED TOKEN
// ==========================================

function getToken() {

    return localStorage.getItem("token");
}


// ==========================================
// COMMON HEADERS
// ==========================================

function getAuthHeaders() {

    const token = getToken();

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}


// ==========================================
// API REQUEST HELPER
// ==========================================

async function apiRequest(
    endpoint,
    options = {}
) {

    const token = getToken();

    const headers = {

        "Content-Type":
            "application/json",

        ...(options.headers || {})
    };


    // Add JWT automatically
    if (token) {

        headers["Authorization"] =
            `Bearer ${token}`;
    }


    const response = await fetch(

        `${API_BASE_URL}${endpoint}`,

        {
            ...options,
            headers: headers
        }
    );


    let data;

    try {

        data = await response.json();

    } catch (error) {

        data = {};
    }


    // ==========================================
    // TOKEN EXPIRED / UNAUTHORIZED
    // ==========================================

    if (response.status === 401) {

        localStorage.clear();

        window.location.href =
            "index2.html";

        return;
    }


    return {

        ok: response.ok,

        status: response.status,

        data: data
    };
}
