# ZRM Solutions Platform

## Overview

This project is a platform for customer solutions, designed to streamline the integration and management of business data between customers, internal systems, and third-party services. It provides secure authentication, file upload, and data visualization features tailored for companies such as Resino and ZRM.

## Features

- **User Authentication:** Secure login system with JWT-based authentication and company-based access control.
- **File Upload:** Authenticated users can upload business data and budget files (CSV/XLSX) to a secure SFTP server.
- **Data Visualization:** Integration with Zoho CRM and Business Central data for generating customer-specific charts and reports.
- **Role-Based Access:** Different user experiences and permissions based on company affiliation (e.g., Resino, ZRM).
- **Modern Frontend:** Responsive web interface built with Bootstrap.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript, Bootstrap, Charts.js
- **Backend:** Node.js, Express.js
- **Database:** MariaDB
- **Authentication:** JWT (JSON Web Tokens)
- **File Storage:** SFTP (via Dockerized SFTP server)
- **CRM Integration:** Zoho CRM API
- **Containerization:** Docker, Docker Compose

## Repository Structure

```
frontend/
  ├── index.html
  ├── login.html
  ├── charts.html
  ├── zrmUserCreation.html
  ├── unauthorized.html
  ├── js/
  ├── css/
  └── components/
backend/
  ├── .env
  ├── docker-compose.yml
  └── services/
      ├── auth_service/
      ├── upload_service/
      └── resino_service/
```

## Services

- **Auth Service:** Handles user login, JWT issuance, and user/company management.
- **Upload Service:** Handles secure file uploads to SFTP, with per-company folder structure and cleanup.
- **Resino Service:** Integrates with Zoho CRM, processes uploaded data, and serves chart data for visualization.

## Getting Started

1. **Clone the repository**
2. **Configure environment variables** in `backend/.env`
3. **Start the system** using Docker Compose:
   ```sh
   docker-compose up --build
   ```
4. **Access the frontend** via your browser (typically at `http://localhost:PORT`)

## Usage

- **Login:** Users log in with their credentials. Access is restricted based on company.
- **Upload Files:** After login, users can upload business data and budget files.
- **View Charts:** For Resino, charts are generated based on uploaded data and Zoho CRM information.

## Security

- All sensitive credentials are managed via environment variables.
- Passwords are hashed using bcrypt.
- JWT tokens are used for authentication and authorization.
- File uploads are validated and securely transferred to the SFTP server.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the ISC License.

---

*For more details, see the documentation in each service folder* 