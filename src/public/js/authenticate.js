
const passwordInput = document.querySelector('.password');
const togglePassword = document.getElementById('togglePassword');

togglePassword.addEventListener('click', function() {
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    togglePassword.className = 'bx bx-hide';
  } else {
    passwordInput.type = 'password';
    togglePassword.className = 'bx bx-show'
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("btn");
  const registerBtn = document.getElementById("registerBtn")

    // Обработчик кнопки
    if (loginBtn) {
      loginBtn.addEventListener("click", async (e) => {
          e.preventDefault();

          const username = document.getElementById("username").value;
          const password = document.getElementById("password").value;

          try {
              const res = await fetch("/api/auth/login", {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json"
                  },
                  body: JSON.stringify({ username, password })
              })
              const data = await res.json();

              if (res.ok) {
                localStorage.setItem("accessToken", data.accessToken);
                window.location.href = "/api/upload";
              } else {
                alert(data.error || "Login failed");
              }
          } catch(err) {
              alert(err.message, 'error', "Ошибка сервера, попробуйте позже")
          }
      });
    }

    if (registerBtn) {
      registerBtn.addEventListener('click', async(e) => {
        e.preventDefault();

          const email = document.getElementById("email").value;
          const username = document.getElementById("username").value;
          const password = document.getElementById("password").value;

          try {
              const res = await fetch("/api/auth/register", {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json"
                  },
                  body: JSON.stringify({ email, username, password })
              })
              const data = await res.json();

              if (res.ok) {
                localStorage.setItem("accessToken", data.accessToken);
                window.location.href = "/api/login";
              } else {
                alert(data.error || "Register failed");
              }
          } catch(err) {
              alert(err.message, 'error', "Ошибка сервера, попробуйте позже")
          }
      })
    }
});
