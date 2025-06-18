# Auth Service Documentation

The `auth_service` is a Node.js Express microservice responsible for user authentication and issuing JWT tokens for our ZRM Solutions system. It connects to a MariaDB database to validate users and their associated companies.

---

## Key Functionalities

### 1. User Login (`/auth/login`)
- **Endpoint:** `POST /auth/login`
- **Purpose:** Authenticates users by verifying their username and password.
- **Process:**
  1. Receives `username` and `password` in the request body.
  2. Looks up the user in the `users` table.
  3. Compares the provided password with the hashed password using `bcrypt`.
  4. Fetches the user's company slug from the `companies` table.
  5. If authentication is successful, generates a JWT token containing:
     - `id` (user ID)
     - `username`
     - `company_id`
     - `company_slug`
  6. Returns the JWT token to the client.

### 2. JWT Authentication Middleware
- **Function:** `authenticateToken`
- **Purpose:** Protects routes by verifying the JWT token in the `Authorization` header.
- **Process:**
  1. Extracts the token from the header.
  2. Verifies the token using the secret from `.env`.
  3. Attaches the decoded user info to `req.user` if valid.

### 3. User and Company Creation (Scripts)
- **Files:** `create-user.js`, `create-company.js`
- **Purpose:** For server-side creation of users and companies (not exposed via API).
- **Usage:** Run manually to add new users or companies to the database.

### 4. Database Connection
- Uses a connection pool (`mysql2/promise`) for efficient database access.
- Reads credentials and settings from environment variables.

---

## Important Files

- `auth.js`: Main Express router with login logic and JWT middleware.
- `server.js`: Starts the Express server and mounts the auth routes.
- `create-user.js`: Script to add new users.
- `create-company.js`: Script to add new companies.

---

## Security Notes

- Passwords are hashed with `bcrypt`.
- JWT tokens are signed with a secret and include company information for frontend access control.
- Sensitive configuration is managed via environment variables.

---

## Example Login Flow

1. User submits login form.
2. Frontend sends credentials to `/auth/login`.
3. Auth service validates and responds with a JWT.
4. Frontend decodes JWT to determine user’s company and redirects accordingly.

---

Let me know if you want a more detailed breakdown of any specific function or file!