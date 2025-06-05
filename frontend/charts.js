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

ZOHO.embeddedApp.on("PageLoad", function(data) {
  console.log("🔍 PageLoad data from Zoho CRM:", data);

  const accountId = data.EntityId;
  document.getElementById("charts-header").textContent = `Business Central Graph (ID: ${accountId})`;

  // Test chart data
  const testData = {
    label: "Sales Over Time",
    labels: ["Jan", "Feb", "Mar", "Apr"],
    values: [120, 140, 180, 200]
  };

  chartsRenderChart(testData);
});

ZOHO.embeddedApp.init();
