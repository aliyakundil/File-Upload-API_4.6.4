document.addEventListener("DOMContentLoaded", () => {
    const singleInput = document.getElementById("upload-single");
    const multipleInput = document.getElementById("upload-multiple");
    const submitBtn = document.getElementById("submitBtn");
    const downloadZone = document.getElementById("download-zone");
    const notifications = document.getElementById("notifications");
    const loginBtn = document.getElementById("loginBtn");
    const token = localStorage.getItem("accessToken");
    const logoutBtn = document.getElementById("logoutBtn");
    const usernameDisplay = document.getElementById("usernameDisplay");

    // if (!token) {
    //     window.location.href = "/api/login";
    // }

    if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        usernameDisplay.textContent = payload.username; 
        loginBtn.style.display = 'none';          
        logoutBtn.style.display = "inline-block"; 
    } else {
        usernameDisplay.textContent = "Гость";
        loginBtn.style.display = "inline-block"; 
        logoutBtn.style.display = 'none';        
    }

    // Обработчик кнопки
    submitBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        if (singleInput.files.length > 0) {
            await uploadSingle(singleInput.files[0]);
        }

        if (multipleInput.files.length > 0) {
            await uploadMultiple(multipleInput.files);
        }

        singleInput.value = "";
        multipleInput.value = "";
    });

    // Обработчик входа
    loginBtn.addEventListener("click", () => {
        window.location.href="/api/login";
    });

    // Обработчик выхода
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("accessToken"); // удаляем токен

        // Обновляем отображение кнопок и имени
        usernameDisplay.textContent = "Гость";
        loginBtn.style.display = "inline-block";
        logoutBtn.style.display = "none";
    });

    // Загрузка одного файла 
    async function uploadSingle(file) {
        const token = localStorage.getItem("accessToken");

        console.log("TOKEN:", token); // добавь это

    if (!token) {
        alert("Нет токена!");
        return;
    }

        if (!token) {
            window.location.href = "/login.html";
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload/single", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || "Upload failed");
            showNotification("Single file uploaded successfully", "success");
        } catch (err) {
            showNotification(err.message, "error");
        }
    }

    // Загрузка нескольких файлов
    async function uploadMultiple(files) {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            window.location.href = "/login.html";
            return;
        }

        const formData = new FormData();

        for (let file of files) {
            formData.append("files", file);
        }

        try {
            const res = await fetch("/api/upload/multiple", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Multiple upload failed");
            showNotification("Multiple files uploaded successfully", "success");
        } catch (err) {
            showNotification(err.message, "error");
        }
    }

    // Получение списка файлов
    async function loadFiles() {
        try {
            const res = await fetch("/api/upload/files", {
                headers: { "Authorization": `Bearer ${token}` },
            });
            const files = await res.json();

            renderFiles(files);
        } catch (err) {
            showNotification("Failed to load files", "error");
        }
    }

    // Отображение файлов
    function renderFiles(files) {
        downloadZone.innerHTML = "";

        if (!files.length) {
            downloadZone.innerHTML = "<p>No files uploaded yet</p>";
            return;
        }

        files.forEach(file => {
            const fileDiv = document.createElement("div");
            fileDiv.className = "file-item";

            fileDiv.innerHTML = `
                <span>${file}</span>
                <a href="/api/upload/file/${file}" target="_blank">Download</a>
                <button data-file="${file}">Delete</button>
            `;

            // обработчик удаления
            fileDiv.querySelector("button").addEventListener("click", () => {
                deleteFile(file);
            });

            downloadZone.appendChild(fileDiv);
        });
    }

    // Удаление файла 
    async function deleteFile(filename) {
        try {
            const res = await fetch(`/api/upload/file/${filename}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` },
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Delete failed");

            showNotification("File deleted successfully", "success");
            loadFiles();
        } catch (err) {
            showNotification(err.message, "error");
        }
    }

    // Уведомления 
    function showNotification(message, type) {
        notifications.innerHTML = `
            <p class="notification ${type}">${message}</p>
        `;

        setTimeout(() => {
            notifications.innerHTML = "";
        }, 3000);
    }
});
