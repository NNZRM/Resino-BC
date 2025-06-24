function chartsRenderChart(data) {
  // Revenue Chart
  const ctx = document.getElementById("charts-revenueChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Current Year",
          data: data.values,
          borderColor: "blue",
          backgroundColor: "lightblue",
          fill: false,
          tension: 0.2
        },
        {
          label: "Last Year",
          data: data.valuesLastYear,
          borderColor: "gray",
          backgroundColor: "lightgray",
          fill: false,
          tension: 0.2
        },
        {
          label: "Budget",
          data: data.valuesBudget,
          borderColor: "green",
          backgroundColor: "lightgreen",
          fill: false,
          tension: 0.2
        }
      ]
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

  // Volume Chart
  const ctxBudget = document.getElementById("charts-budgetChart").getContext("2d");
  new Chart(ctxBudget, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Budget Only",
          data: data.valuesBudget,
          borderColor: "green",
          backgroundColor: "lightgreen",
          fill: false,
          tension: 0.2
        }
      ]
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

  //Load Charts to HTML
  document.getElementById("charts-loading").style.display = "none";
  document.getElementById("charts-revenueChart").style.display = "block";
  document.getElementById("charts-budgetChart").style.display = "block";
}

function chartsShowError(message) {
  document.getElementById("charts-loading").textContent = "⚠️ " + message;
}

// Retrieve KontoNummer from Zoho CRM when the page loads and render charts
// Zoho CRM Embedded JS SDK - Loads the embedded app and listens for page load events
ZOHO.embeddedApp.on("PageLoad", function(data) {
  console.log("PageLoad data from Zoho CRM:", data);

  const accountId = data.EntityId;
  console.log("Account ID YO:", accountId);
  document.getElementById("charts-header").textContent = `Business Central Charts (Budget Shows 2023, data had no 2025)`;
  //Get KontoNummer from Zoho CRM using the accountId
  fetch("/get-kontonummer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ accountId })
  })
    .then(res => res.json())
    .then(data => {
      // Use "Konto Nummer" to fetch chart data from SFTP server
      fetch(`/get-chart-data?konto=${data.kontoNummer}`)
        .then(res => res.json())
        .then(chartData => {
          console.log("Chart data received:", chartData); 

          if (!chartData || !chartData.labels) {
            chartsShowError("No chart data found.");
            return;
          }
          // Render the charts with the fetched data
          chartsRenderChart({
            labels: chartData.labels,
            values: chartData.values,
            valuesLastYear: chartData.valuesLastYear,
            valuesBudget: chartData.valuesBudget
          });
        })
        .catch(err => {
          console.error("Chart fetch error:", err);
          chartsShowError("Could not load chart data.");
        });
    })
    .catch(err => {
      console.error("Fetch error:", err);
      chartsShowError("Could not fetch account details.");
    });
});

ZOHO.embeddedApp.init();
