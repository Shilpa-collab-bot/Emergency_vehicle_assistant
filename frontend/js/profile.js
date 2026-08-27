document.addEventListener("DOMContentLoaded", () => {
    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("role");
    if (!userId || !role) {
        window.location.href = "index2.html";
        return;
    }

    document.getElementById("profileRole").textContent = role;
    document.getElementById("backButton").addEventListener("click", () => {
        window.location.href = role === "mechanic" ?
            "mechanic-dashboard.html" : "user-dashboard.html";
    });
    document.getElementById("profileForm").addEventListener("submit", saveProfile);
    loadProfile();
});

async function loadProfile() {
    const result = await apiRequest(
        `/profile?user_id=${encodeURIComponent(localStorage.getItem("userId"))}`
    );
    const message = document.getElementById("profileMessage");
    if (!result || !result.ok) {
        message.textContent = result?.data?.detail || "Unable to load profile.";
        return;
    }
    const user = result.data.user;
    document.getElementById("fullName").value = user.full_name || "";
    document.getElementById("phone").value = user.phone || "";
    document.getElementById("email").value = user.email || "";
}

async function saveProfile(event) {
    event.preventDefault();
    const message = document.getElementById("profileMessage");
    const data = {
        full_name: document.getElementById("fullName").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim()
    };
    const result = await apiRequest(
        `/profile?user_id=${encodeURIComponent(localStorage.getItem("userId"))}`,
        { method: "PUT", body: JSON.stringify(data) }
    );
    message.textContent = result?.data?.message || "Unable to update profile.";
    if (result?.ok) {
        localStorage.setItem("name", data.full_name);
        localStorage.setItem("email", data.email);
        localStorage.setItem("phone", data.phone);
    }
}
