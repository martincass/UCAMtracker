# Production Tracker MVP

This is a client-only MVP for submitting and tracking production data. It features a secure, allowlist-based authentication system, a detailed submission form with photo uploads, a dashboard for clients to view their submission history, and a comprehensive admin panel for user and data management.

The application is built with React, TypeScript, and Tailwind CSS, and is designed to connect to a Supabase backend (Auth, Postgres, Storage).

## Features

- **Secure Authentication**: Email/password login via Supabase Auth.
- **Closed Access**: User registration is restricted to an admin-managed allowlist.
- **Invitation System**: Admins can invite new client users.
- **Production Submission Form**: Clients can submit detailed production reports, including photo evidence.
- **Client Dashboard**: Clients can view a history of their own submissions.
- **Admin Dashboard**: A protected area for administrators with three main sections:
  - **Submissions**: View and filter all submissions from all clients.
  - **Users**: Manage user accounts, invite new users, and control roles/permissions.
  - **Clients**: Manage the `allowlist_clients` table, including bulk CSV import.
- **Audit Logging**: All administrative actions are logged for security and tracking.

## Getting Started

### Prerequisites

- Node.js (LTS version)
- `pnpm` package manager (`npm install -g pnpm`)

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file by copying the example file:
    ```bash
    cp .env.example .env
    ```
    Populate the `.env` file with your credentials from your Supabase project and other configurations. See the `.env.example` section for details.

4.  **Set up Supabase Database:**
    Connect to your Supabase project and run the SQL scripts located in `supabase/migrations/` to set up the necessary tables and policies.

5.  **Seed the Admin User:**
    To create the initial admin account, run the seed script. This will use the `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` from your `.env` file.
    ```bash
    pnpm seed:admin
    ```

6.  **Run the application:**
    ```bash
    pnpm dev
    ```
    The application will be available at `http://localhost:5173`.

## Available Scripts

-   `pnpm dev`: Starts the development server.
-   `pnpm build`: Builds the application for production.
-   `pnpm preview`: Serves the production build locally.
-   `pnpm seed:admin`: Creates the initial admin user in your Supabase instance based on your `.env` configuration. This is idempotent and safe to run multiple times.

## Environment Variables (.env.example)

This file documents all the necessary environment variables for the application to run correctly. For client-side variables in Vite, they **must** be prefixed with `VITE_`.

```
# Supabase Public URL (must be prefixed with VITE_ for client-side access)
VITE_SUPABASE_URL=your_supabase_project_url

# Supabase Anonymous Key (must be prefixed with VITE_ for client-side access)
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Service Role Key (secret, for admin actions on the backend/scripts)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Initial Admin User Credentials for Seeding
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=a_strong_password

# Webhook URL for Google Apps Script (for submission notifications)
GOOGLE_APPS_SCRIPT_WEBHOOK_URL=your_google_apps_script_webhook_url
```

## Architectural Assumptions

-   **Backend Logic**: All backend logic is handled by Supabase (Auth, Database, Storage, Edge Functions). The client communicates with Supabase via `src/services/apiService.ts`.
-   **Routing**: The application uses a state-based router in `App.tsx` (`view` state) to function as a single-page application.
-   **Scripts**: The `seed` script is an `.mjs` file that runs in a Node.js environment to securely interact with the Supabase Admin API.
