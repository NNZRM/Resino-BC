# Frontend Documentation

This frontend provides the user interface for the ZRM Solutions Platform. It enables users to log in, upload files, and view business data visualizations, with access and features tailored to their company.

---

## Structure

```
frontend/
  ├── index.html
  ├── login.html
  ├── charts.html
  ├── zrmUserCreation.html
  ├── unauthorized.html
  ├── components/
  │     ├── navbar.html
  │     └── footer.html
  ├── css/
  │     ├── style.css
  │     └── charts.css
  ├── images/
  └── js/
        ├── app.js
        ├── charts.js
        └── login.js
```

---

## Key Pages

- **index.html**  
  Main dashboard for Resino users. Allows uploading of BC data and budget files. Access is restricted to users with the `company_slug` "resino".

- **login.html**  
  Login form for all users. On successful login, users are redirected based on their company.

- **charts.html**  
  Displays business data charts for a specific account, integrating with Zoho CRM and backend chart data endpoints.

- **zrmUserCreation.html**  
  Restricted page for ZRM users only.

- **unauthorized.html**  
  Shown to users who try to access pages without the required permissions.

---

## Components

- **components/navbar.html**  
  Responsive navigation bar, dynamically updated to show login/logout based on authentication state.

- **components/footer.html**  
  Footer with company info and social links.

---

## Styles

- **css/style.css**  
  General styles for layout, backgrounds, and alerts.

- **css/charts.css**  
  Styles specific to the charts page, including chart sizing and loading indicators.

---

## JavaScript Modules

### js/app.js

- Loads navbar and footer components into each page.
- Handles file removal and file upload logic for BC data and budget files.
- Validates file types and sizes before upload.
- Sends files to the backend `/upload` endpoint with JWT authentication.
- Displays upload status messages and handles modal dialogs.
- Manages login/logout state in the navbar.

### js/login.js

- Handles the login form submission.
- Sends credentials to `/auth/login`.
- On success, stores the JWT token and redirects the user based on their `company_slug`:
  - `"resino"` → `index.html`
  - `"zrm"` → `zrmUserCreation.html`
  - Any other → `unauthorized.html`
- Uses the `jwt-decode` library for safe JWT parsing.

### js/charts.js

- Integrates with Zoho CRM's embedded app SDK to get the current account ID.
- Fetches the account's "Konto Nummer" from the backend.
- Requests chart data for the account and renders it using Chart.js.
- Handles errors and displays loading indicators.

---

## Authentication & Access Control

- JWT tokens are stored in `localStorage` after login.
- Each protected page checks for a valid token and the correct `company_slug` before rendering content.
- Unauthorized users are redirected to `login.html` or `unauthorized.html`.

---

## Usage Flow

1. **User visits login page and authenticates.**
2. **On success, user is redirected to their company-specific dashboard.**
3. **Resino users can upload files and view charts.**
4. **ZRM users access their own restricted page.**
5. **Unauthorized access attempts are blocked and redirected.**

---

## Dependencies

- [Bootstrap](https://getbootstrap.com/) for responsive UI.
- [Chart.js](https://www.chartjs.org/) for data visualization.
- [jwt-decode](https://github.com/auth0/jwt-decode) for JWT parsing.
- [Zoho Embedded App SDK](https://www.zoho.com/crm/developer/docs/widgets/sdk.html) for CRM integration.

---

## Security Notes

- All sensitive actions (file upload, data fetch) require a valid JWT.
- File uploads are validated client-side for type and size before sending to the backend.

---

For more details on backend integration and API endpoints, see the backend service documentation in the `docs/`