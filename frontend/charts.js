function chartsRenderChart(data) {
  const ctx = document.getElementById("charts-myChart").getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [{
        label: data.label || "Activity",
        data: data.values,
        borderColor: "blue",
        backgroundColor: "lightblue",
        fill: false,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  document.getElementById("charts-loading").style.display = "none";
  document.getElementById("charts-myChart").style.display = "block";
}

function chartsShowError(message) {
  document.getElementById("charts-loading").textContent = "⚠️ " + message;
}

console.log("YOOOOOO");

// ✅ Attach listener first
ZOHO.embeddedApp.on("PageLoad", function(data) {
  console.log("🔍 PageLoad data from Zoho CRM:", data);

  const accountId = data.EntityId;
  document.getElementById("charts-header").textContent = `Business Central Graph (ID: ${accountId})`;

  fetch("/get-kontonummer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ accountId })
  })
    .then(res => res.json())
    .then(data => {
      console.log("✅ KontoNummer received:", data.kontoNummer);

      const testData = {
        label: `Konto ${data.kontoNummer} Sales`,
        labels: ["Jan", "Feb", "Mar", "Apr"],
        values: [100, 200, 150, 180]
      };

      chartsRenderChart(testData);
    })
    .catch(err => {
      console.error("❌ Fetch error:", err);
      chartsShowError("Could not fetch account details.");
    });
});

ZOHO.embeddedApp.init();
