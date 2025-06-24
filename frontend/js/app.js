document.addEventListener("DOMContentLoaded", () => {
  loadComponent("components/navbar.html", "navbar-container", renderAuthNav);
  loadComponent("components/footer.html", "footer-container");
});

//Load HTML components dynamically
function loadComponent(file, containerId, callback) {
  fetch(file)
    .then(response => response.text())
    .then(html => {
      document.getElementById(containerId).innerHTML = html;
      if (typeof callback === "function") {
        callback();
      }
    })
    .catch(err => console.error(`Failed to load ${file}:`, err));
}

//Remove file button
function removeFile(inputId) {
    const input = document.getElementById(inputId);
    input.value = "";
  }

//Upload files to the server
function uploadFiles() {
  const messageBox = document.getElementById("message");
  messageBox.classList.add("d-none");
  messageBox.textContent = "";

  const fileInputA = document.getElementById("fileA"); // BC data
  const fileInputB = document.getElementById("fileB"); // Budget

  const formData = new FormData();
  const allowedTypes = [
    "text/csv",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ];

  let hasFiles = false;

  for (const file of fileInputA.files) {
    if (!allowedTypes.includes(file.type)) {
      showMessage("Invalid file in BC data udtræk. Only CSV or XLSX allowed.", "danger");
      return;
    }
    formData.append("files", file);
    formData.append("types", "bcdata");
    hasFiles = true;
  }

  for (const file of fileInputB.files) {
    if (!allowedTypes.includes(file.type)) {
      showMessage("Invalid file in Budget. Only CSV or XLSX allowed.", "danger");
      return;
    }
    formData.append("files", file);
    formData.append("types", "budget");
    hasFiles = true;
  }

  if (!hasFiles) {
    showMessage("Please choose one or more files to upload.", "danger");
    return;
  }

  // Get JWT token
  const token = localStorage.getItem("token");

  //Upload files to the server
  fetch("/upload", {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      return response.json();
    })
    .then(data => {
      showMessage("Files uploaded successfully!", "success");
      const successModal = new bootstrap.Modal(document.getElementById("successModal"));
      successModal.show();

      fileInputA.value = "";
      fileInputB.value = "";
    })
    .catch(error => {
      console.error("Upload error:", error);
      showMessage("Failed to upload files. Please try again.", "danger");
    });

}


function showMessage(text, type) {
  const messageBox = document.getElementById("message");
  messageBox.className = `alert alert-${type}`;
  messageBox.textContent = text;
}

//Render login or logout in navbar
function renderAuthNav() {
  const nav = document.getElementById("auth-nav");
  if (!nav) return;

  const token = localStorage.getItem("token");
  if (token) {
    nav.innerHTML = `
      <li class="nav-item">
        <a class="nav-link text-white" href="#" onclick="logout()">
          <span class="fas fa-sign-out-alt"></span> Logout
        </a>
      </li>
    `;
  } else {
    nav.innerHTML = `
      <li class="nav-item">
        <a class="nav-link text-white" href="login.html">
          <span class="fas fa-sign-in-alt"></span> Login
        </a>
      </li>
    `;
  }
}

//Log out - JWT token is removed from localStorage
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}