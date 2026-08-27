// // EVA Authentication
// document.addEventListener("DOMContentLoaded", () => {
//   const loginForm = document.getElementById("loginForm");
//   if (!loginForm) {
//     return;
//   }
//   loginForm.addEventListener("submit", loginUser);
// });

// // login user

// async function loginUser(event) {
//   event.preventDefault();
//   const email = document.getElementById("email").value.trim();
//   const password = document.getElementById("password").value.trim();
//   const message = document.getElementById("message");
//   const loginButton = document.getElementById("loginButton");
//   message.textContent = "";
//   if (!email || !password) {
//     message.textContent = "Please enter email and password";
//     message.style.color = "red";
//     return;
//   }

//   loginButton.disabled = true;
//   loginButton.textContent = "Logging in...";
//   try {
//     console.log("Login Email:", email);
//     const response = await fetch(`${API_BASE_URL}/auth/login`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         email: email,
//         password: password,
//       }),
//     });
//     console.log("LOGIN STATUS:", response.status);
//     const data = await response.json();
//     console.log("LOGIN RESPONSE:", data);

//     if (response.ok && data.success === true && data.token) {
//       // Save JWT
//       saveToken(data.token);
//       // Your FastAPI response uses "data"
//       const user = data.data || data.user;
//       if (!user) {
//         message.textContent = "Login successful, but user data is missing.";
//         message.style.color = "red";
//         return;
//       }
//       // Save user information
//       saveUser(user);
//       console.log("TOKEN SAVED:", getToken());
//       console.log("USER:", user);
//       message.textContent = "Login successful!";
//       message.style.color = "green";
//       // ==========================================
//       // REDIRECT BASED ON ROLE
//       // ==========================================
//       if (user.role === "user") {
//         window.location.href = "user-dashboard.html";
//       } else if (user.role === "mechanic") {
//         window.location.href = "mechanic-dashboard.html";
//       } else if (user.role === "admin") {
//         window.location.href = "admin-dashboard.html";
//       } else {
//         message.textContent = "Unknown user role.";
//         message.style.color = "red";
//       }
//     } else {
//       const errorMessage =
//         data.detail || data.message || "Invalid email or password.";
//       message.textContent = errorMessage;
//       message.style.color = "red";
//     }
//   } catch (error) {
//     console.error("LOGIN ERROR:", error);
//     message.textContent = "Cannot connect to the server.";
//     message.style.color = "red";
//   } finally {
//     loginButton.disabled = false;
//     loginButton.textContent = "Login";
//   }
// }

// ==========================================
// EVA - AUTHENTICATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const loginForm =
        document.getElementById("loginForm");

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener(
        "submit",
        login
    );
});


// ==========================================
// LOGIN
// ==========================================

async function login(event) {

    event.preventDefault();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value.trim();

    const message =
        document.getElementById("message");

    const button =
        document.getElementById("loginButton");


    // ==========================================
    // VALIDATION
    // ==========================================

    if (!email || !password) {

        message.textContent =
            "Please enter email and password.";

        message.style.color = "red";

        return;
    }


    button.disabled = true;

    button.textContent =
        "Logging in...";

    message.textContent = "";


    try {

        // ==========================================
        // SEND LOGIN REQUEST
        // ==========================================

        const response = await fetch(

            `${API_BASE_URL}/login`,

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    email: email,

                    password: password
                })
            }
        );


        const data =
            await response.json();


        console.log(
            "LOGIN RESPONSE:",
            data
        );


        // ==========================================
        // LOGIN SUCCESS
        // ==========================================

        if (response.ok && data.success) {

            const user =
                data.user || data.data;

            if (!user || !user.id || !user.role) {
                message.textContent =
                    "Login response is missing user details.";
                message.style.color = "red";
                return;
            }


            // ==========================================
            // SAVE AUTH DATA
            // ==========================================

            if (data.token) {
                localStorage.setItem(
                    "token",
                    data.token
                );
            }

            localStorage.setItem(
                "userId",
                user.id
            );

            localStorage.setItem(
                "role",
                user.role
            );

            localStorage.setItem(
                "name",
                user.full_name
            );

            localStorage.setItem(
                "email",
                user.email
            );

            localStorage.setItem(
                "phone",
                user.phone || ""
            );

            if (data.mechanic_id) {
                localStorage.setItem(
                    "mechanicId",
                    data.mechanic_id
                );
            }


            // DEBUG
            console.log(
                "TOKEN SAVED:",
                localStorage.getItem("token")
            );

            console.log(
                "USER ID:",
                localStorage.getItem("userId")
            );

            console.log(
                "ROLE:",
                localStorage.getItem("role")
            );


            message.textContent =
                "Login successful!";

            message.style.color =
                "green";


            // ==========================================
            // REDIRECT BASED ON ROLE
            // ==========================================

            setTimeout(() => {

                if (String(user.role).toLowerCase() === "mechanic") {

                    window.location.href =
                        "mechanic-dashboard.html";

                } else if (String(user.role).toLowerCase() === "user") {

                    window.location.href =
                        "user-dashboard.html";

                } else if (String(user.role).toLowerCase() === "admin") {

                    window.location.href =
                        "admin-dashboard.html";

                } else {

                    window.location.href =
                        "index2.html";
                }

            }, 700);

        }


        // ==========================================
        // LOGIN FAILED
        // ==========================================

        else {

            message.textContent =
                data.detail ||
                data.message ||
                "Invalid email or password.";

            message.style.color =
                "red";
        }

    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        message.textContent =
            "Cannot connect to FastAPI server.";

        message.style.color =
            "red";

    } finally {

        button.disabled = false;

        button.textContent =
            "Login";
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
