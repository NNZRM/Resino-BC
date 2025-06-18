function handleLogin() {
  const username = document.getElementById("form2Example18").value;
  const password = document.getElementById("form2Example28").value;

  fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then(response => response.json().then(data => ({ ok: response.ok, data })))
    .then(({ ok, data }) => {
      if (ok) {
        localStorage.setItem("token", data.token);

        //Redirect based on company slug
        const payload = jwt_decode(data.token);
        //Resino
        if (payload.company_slug === "resino") {
          window.location.href = "index.html";
        } else if (payload.company_slug === "zrm") {
          //ZRM
          window.location.href = "zrmUserCreation.html";
        } else {
          //No company page
          window.location.href = "unauthorized.html";
        }
      } else {
        alert("Login failed: " + data.error);
      }
    })
    .catch(err => {
      console.error("Login error:", err);
      alert("An error occurred during login.");
    });
}