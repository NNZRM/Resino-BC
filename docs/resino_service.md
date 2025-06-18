# Resino Service Documentation

The `resino_service` is a Node.js Express microservice responsible for integrating with Zoho CRM, retrieving account and budget data from SFTP, and serving processed chart data for the Resino company. It is designed to run in a containerized environment and uses environment variables for configuration.

---

## Key Functionalities

### 1. Fetching Account Data from Zoho CRM

- **Function:** `fetchAccount(id)` ([zoho.js](backend/services/resino_service/zoho.js))
- **Purpose:** Retrieves account information (including `Konto_Nummer1`) from Zoho CRM using the Zoho API.
- **Process:**
  1. Sends a GET request to Zoho CRM for the specified account ID.
  2. Uses an in-memory access token for authentication.
  3. If the token is expired, automatically refreshes it using the refresh token and retries the request.
  4. Returns the `Konto_Nummer1` field for use in further data processing.

### 2. Chart Data Extraction

- **Function:** `extractChartData(konto, bcDataDir, budgetDir)` ([chartData.js](backend/services/resino_service/chartData.js))
- **Purpose:** Aggregates and processes business central (BC) and budget data for a given account number.
- **Process:**
  1. Connects to an SFTP server using credentials from environment variables.
  2. Locates the latest CSV or XLSX file in the specified BC data directory.
  3. Extracts annual revenue and last year's revenue for the given account.
  4. Calculates cumulative monthly values for both current and previous years.
  5. Retrieves and processes budget data for the account from the budget directory, supporting both CSV and XLSX formats.
  6. Returns an object containing labels (months), values, last year’s values, and budget values.

### 3. API Endpoints

- **POST `/get-kontonummer`** ([server.js](backend/services/resino_service/server.js))
  - **Purpose:** Given a Zoho account ID, returns the corresponding `Konto_Nummer1`.
  - **Input:** `{ accountId }` in the request body.
  - **Output:** `{ kontoNummer }` in the response.

- **GET `/get-chart-data`** ([server.js](backend/services/resino_service/server.js))
  - **Purpose:** Returns processed chart data for a given account number.
  - **Input:** `konto` as a query parameter.
  - **Output:** JSON object with chart data (labels, values, last year’s values, budget).

### 4. Authentication Middleware

- **Function:** `authenticateToken` ([auth.js](backend/services/resino_service/auth.js))
- **Purpose:** Verifies JWT tokens for protected routes.
- **Process:**
  1. Extracts the token from the `Authorization` header.
  2. Verifies the token using the secret from environment variables.
  3. Attaches the decoded user info to `req.user` if valid.

---

## Important Files

- `server.js`: Main Express server, defines API endpoints and starts the service.
- `zoho.js`: Handles Zoho CRM API integration and token refresh logic.
- `chartData.js`: Contains logic for connecting to SFTP, reading files, and processing chart/budget data.
- `auth.js`: JWT authentication middleware.
- `Dockerfile`: Containerizes the service for deployment.
- `package.json`: Lists dependencies and service metadata.

---

## Security Notes

- All sensitive credentials (SFTP, Zoho API, JWT secret) are managed via environment variables.
- Access tokens for Zoho are refreshed in-memory and not persisted to disk.
- SFTP credentials are not hardcoded and are only loaded at runtime.

---

## Example Data Flow

1. Client requests chart data for a specific account.
2. Service fetches the account number from Zoho CRM (if needed).
3. Service connects to SFTP, retrieves and processes the latest BC and budget files.
4. Service returns aggregated chart data to the client.

---

Let me know if you need a more detailed breakdown of any specific function