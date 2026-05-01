# QuickBooks MERN Practical

## 1. Clone from Git

```bash
git clone https://github.com/nishantbhavasar/quickbook-integration.git
cd quickbook-integration
```

Replace `https://github.com/nishantbhavasar/quickbook-integration.git` with the HTTPS or SSH URL of this repository (for example from GitHub or GitLab).

---

## 2. Install dependencies

Install **server** and **client** dependencies separately (from the project root):

```bash
cd server && npm install && cd ..
cd client && npm install && cd ..
```

Or run each `npm install` inside `server/` and `client/` in two terminals if you prefer.

---

## 3. Run the project

### Environment variables

**Server** — create `server/.env` (see `server` folder). Required variables:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `QB_CLIENT_ID` | Intuit app Client ID |
| `QB_CLIENT_SECRET` | Intuit app Client Secret |
| `QB_REDIRECT_URI` | OAuth redirect URL (must match the app settings in Intuit), e.g. `http://localhost:5000/api/auth/callback` |
| `QB_API_BASE` | QuickBooks API host, e.g. `https://sandbox-quickbooks.api.intuit.com` (sandbox) or `https://quickbooks.api.intuit.com` (production) |
| `CLIENT_URL` | Frontend origin for CORS and redirects (default `http://localhost:5173` if omitted) |

**Client** — optional `client/.env`:

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend base URL (default `http://localhost:5000` if omitted) |

### Start MongoDB

Ensure MongoDB is reachable using the URI in `MONGODB_URI`.

### Start backend and frontend

Terminal 1 — API (default port **5000**):

```bash
cd server
npm run dev
```

Terminal 2 — React app (Vite, default port **5173**):

```bash
cd client
npm run dev
```

Open the app in the browser at the URL Vite prints (typically `http://localhost:5173`). Complete QuickBooks sign-in from the login screen; after a successful OAuth callback you are redirected to the home screen.

**Production build (client only):**

```bash
cd client
npm run build
npm run preview
```

---

## 4. Project summary

This application connects a React frontend to an Express API and MongoDB to complete **QuickBooks Online OAuth 2.0** (REST, no Intuit SDK), stores **tokens and company metadata**, and supports **full and delta sync** of **customers** and **invoices** into MongoDB, with **paginated** listing in the UI. The backend refreshes access tokens when they are close to expiry, and the frontend uses Redux only for the current QuickBooks connection snapshot after status checks.

Note : As Of now this project i have developed using the sendbox environment you can update the credentials into the env to use the production environment

**This is only for single User authentication as of now we can not loging with multiple account to connect with new account needs to logout first we can manage multiple authentication using proper authentication flow with jwt but as of now not managed**
---

## 5. Tools used

### Frontend

- React, TypeScript, Vite  
- React Router  
- Redux Toolkit, React Redux  
- Tailwind CSS v4 (`@tailwindcss/vite`)  
- TanStack Table (`@tanstack/react-table`)  
- ESLint, TypeScript ESLint  

### Backend

- Node.js (ES modules), Express  
- Mongoose / MongoDB  
- Axios (QuickBooks and Intuit token HTTP calls)  
- dotenv, cors  
- nodemon (development)

### Reference

- **Postman — QuickBooks Online Accounting API (Intuit):** [Intuit Developer collection on Postman](https://www.postman.com/intuit-developer/intuit-developer-quickbooks-online-accounting-api/collection/4884662-e6c576f1-f6d3-440f-b090-da9ff1ac519d?sideView=agentMode)