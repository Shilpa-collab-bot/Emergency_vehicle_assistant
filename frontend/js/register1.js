// ==========================================
// EVA - REGISTRATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const roleSelect = document.getElementById("role");
  const mechanicFields = document.getElementById("mechanicFields");

  if (!registerForm) {
    return;
  }

  // ==========================================
  // SHOW / HIDE MECHANIC FIELDS
  // ==========================================

  roleSelect.addEventListener("change", () => {
    if (roleSelect.value === "mechanic") {
      mechanicFields.style.display = "block";

      // Automatically get location
      getCurrentLocation();
    } else {
      mechanicFields.style.display = "none";
    }
  });

  // ==========================================
  // REGISTER FORM
  // ==========================================

  registerForm.addEventListener("submit", registerUser);
});

// ==========================================
// GET CURRENT GPS LOCATION
// ==========================================

function getCurrentLocation() {
  const latitudeInput = document.getElementById("latitude");

  const longitudeInput = document.getElementById("longitude");

  if (!navigator.geolocation) {
    console.log("Geolocation is not supported by this browser.");

    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude = position.coords.latitude;

      const longitude = position.coords.longitude;

      latitudeInput.value = latitude;
      longitudeInput.value = longitude;

      console.log("Latitude:", latitude);
      console.log("Longitude:", longitude);
    },

    (error) => {
      console.error("Location error:", error.message);

      document.getElementById("registerMessage").textContent =
        "Please allow location access for mechanic registration.";

      document.getElementById("registerMessage").style.color = "red";
    },
  );
}

// ==========================================
// REGISTER USER / MECHANIC
// ==========================================

async function registerUser(event) {
  event.preventDefault();

  const message = document.getElementById("registerMessage");

  const button = document.getElementById("registerButton");

  // ==========================================
  // BASIC DETAILS
  // ==========================================

  const fullName = document.getElementById("fullName").value.trim();

  const phone = document.getElementById("phone").value.trim();

  const email = document.getElementById("registerEmail").value.trim();

  const password = document.getElementById("registerPassword").value.trim();

  const role = document.getElementById("role").value;

  // ==========================================
  // VALIDATION
  // ==========================================

  if (!fullName || !phone || !email || !password || !role) {
    message.textContent = "Please fill all required fields.";

    message.style.color = "red";

    return;
  }

  // ==========================================
  // MECHANIC DETAILS
  // ==========================================

  let mechanicData = {};

  if (role === "mechanic") {
    const shopName = document.getElementById("shopName").value.trim();

    const address = document.getElementById("address").value.trim();

    const specialization = document
      .getElementById("specialization")
      .value.trim();

    const experienceYear = document.getElementById("experienceYear").value;

    const latitude = document.getElementById("latitude").value;

    const longitude = document.getElementById("longitude").value;

    if (
      !shopName ||
      !address ||
      !specialization ||
      !experienceYear ||
      !latitude ||
      !longitude
    ) {
      message.textContent = "Please complete all mechanic details.";

      message.style.color = "red";

      return;
    }

    mechanicData = {
      shop_name: shopName,

      address: address,

      specialization: specialization,

      experience_year: Number(experienceYear),

      latitude: Number(latitude),

      longitude: Number(longitude),
    };
  }

  // ==========================================
  // DISABLE BUTTON
  // ==========================================

  button.disabled = true;

  button.textContent = "Registering...";

  message.textContent = "";

  // ==========================================
  // CREATE REQUEST BODY
  // ==========================================

  const requestBody = {
    full_name: fullName,

    phone: phone,

    email: email,

    password: password,

    role: role,

    ...mechanicData,
  };

  console.log("REGISTER DATA:", requestBody);

  try {
    // ==========================================
    // USER REGISTRATION
    // ==========================================

    if (role === "user") {
      const response = await fetch(
        `${API_BASE_URL}/users/register`,

        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(requestBody),
        },
      );

      const data = await response.json();

      console.log("USER REGISTER RESPONSE:", data);

      if (response.ok) {
        message.textContent =
          "Registration successful! Redirecting to login...";

        message.style.color = "green";

        setTimeout(() => {
          window.location.href = "index2.html";
        }, 1500);
      } else {
        message.textContent =
          data.detail || data.message || "Registration failed.";

        message.style.color = "red";
      }
    }

    // ==========================================
    // MECHANIC REGISTRATION
    // ==========================================
    else if (role === "mechanic") {
      const response = await fetch(
        `${API_BASE_URL}/mechanic/register`,

        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(requestBody),
        },
      );

      const data = await response.json();

      console.log("MECHANIC REGISTER RESPONSE:", data);

      if (response.ok) {
        message.textContent =
          "Mechanic registration successful! Redirecting to login...";

        message.style.color = "green";

        setTimeout(() => {
          window.location.href = "index2.html";
        }, 1500);
      } else {
        message.textContent =
          data.detail || data.message || "Mechanic registration failed.";

        message.style.color = "red";
      }
    }
  } catch (error) {
    console.error("REGISTRATION ERROR:", error);

    message.textContent = "Cannot connect to FastAPI server.";

    message.style.color = "red";
  } finally {
    button.disabled = false;

    button.textContent = "Register";
  }
}
