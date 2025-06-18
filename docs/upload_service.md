# Upload Service Documentation

The `upload_service` is a Node.js Express microservice responsible for securely uploading files to a remote SFTP server. It is designed to be used by authenticated users and supports uploading both business central data and budget files for the Resino company.

---

## Key Functionalities

### 1. File Upload Endpoint

- **POST `/upload`** ([server.js](backend/services/upload_service/server.js))
  - **Purpose:** Allows authenticated users to upload files to the SFTP server.
  - **Authentication:** Requires a valid JWT token in the `Authorization` header.
  - **File Handling:** Uses `multer` with in-memory storage to handle file uploads (up to 20 MB per file).
  - **Input:** 
    - Files sent as `multipart/form-data` under the field name `files`.
    - Each file should have an associated `type` (e.g., `budget` or `bcdata`).
  - **Output:** JSON response with upload status and details of uploaded files.

### 2. SFTP Upload Logic

- **Function:** `handleUpload` ([sftpUpload.js](backend/services/upload_service/sftpUpload.js))
  - **Purpose:** Handles the logic for connecting to the SFTP server and uploading files.
  - **Process:**
    1. Connects to the SFTP server using credentials from environment variables.
    2. For each file:
       - Determines the target folder (`budget` or `bcdata`) based on the file type.
       - Ensures the target directory exists on the SFTP server.
       - Cleans the target directory by deleting existing `.csv` and `.xlsx` files (only once per folder per upload session).
       - Uploads the new file to the appropriate folder.
    3. Disconnects from the SFTP server after all files are uploaded.
    4. Returns a response with the list of uploaded files.

### 3. JWT Authentication Middleware

- **Function:** `authenticateToken` ([server.js](backend/services/upload_service/server.js))
  - **Purpose:** Protects the upload endpoint by verifying JWT tokens.
  - **Process:**
    1. Extracts the token from the `Authorization` header.
    2. Verifies the token using the secret from environment variables.
    3. Attaches the decoded user info to `req.user` if valid.

---

## Important Files

- `server.js`: Main Express server, defines the `/upload` endpoint, sets up middleware, and starts the service.
- `sftpUpload.js`: Contains the logic for connecting to the SFTP server and handling file uploads.
- `package.json`: Lists dependencies and service metadata.
- `Dockerfile`: Containerizes the service for deployment.

---

## Security Notes

- All SFTP and JWT credentials are managed via environment variables.
- Only authenticated users (with a valid JWT) can upload files.
- Uploaded files are stored only in memory during the upload process and are not written to disk on the server.

---

## Example Upload Flow

1. Client sends a POST request to `/upload` with files and their types, including a valid JWT token in the `Authorization` header.
2. The service authenticates the user.
3. The service connects to the SFTP server, cleans the target directories, and uploads the files.
4. The service responds with a summary of the uploaded files.

---

Let me know if you need a more detailed breakdown of any specific function or file!