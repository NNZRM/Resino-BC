window.addEventListener("DOMContentLoaded", () => {
  loadComponent("navbar.html", "navbar-container");
  loadComponent("footer.html", "footer-container");
});

function loadComponent(file, containerId) {
  fetch(file)
    .then(response => response.text())
    .then(html => {
      document.getElementById(containerId).innerHTML = html;
    })
    .catch(err => console.error(`Failed to load ${file}:`, err));
}


function uploadFiles() {
  const messageBox = document.getElementById("message");
  messageBox.classList.add("d-none");
  messageBox.textContent = "";

  const fileInputA = document.getElementById("fileA");
  const fileInputB = document.getElementById("fileB");

  if (fileInputA.files.length === 0 && fileInputB.files.length === 0) {
    showMessage("Please choose one or more files to upload.", "danger");
    return;
  }

  const formData = new FormData();
  const allowedTypes = [
    "text/csv",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ];

  for (const file of fileInputA.files) {
    if (!allowedTypes.includes(file.type)) {
      showMessage("Invalid file in BC data udtræk. Only CSV or XLSX allowed.", "danger");
      return;
    }
    formData.append("files", file);
  }

  for (const file of fileInputB.files) {
    if (!allowedTypes.includes(file.type)) {
      showMessage("Invalid file in Budget. Only CSV or XLSX allowed.", "danger");
      return;
    }
    formData.append("files", file);
  }

  fetch("/upload", {
  method: "POST",
  body: formData,
})
  .then(response => response.json())
  .then(data => {
    showMessage("Files uploaded successfully!", "success");
    const successModal = new bootstrap.Modal(document.getElementById("successModal"));
    successModal.show();
  })
  .catch(error => {
    console.error(error);
    showMessage("Failed to upload files. Please try again.", "danger");
  });

}

function showMessage(text, type) {
  const messageBox = document.getElementById("message");
  messageBox.className = `alert alert-${type}`;
  messageBox.textContent = text;
}