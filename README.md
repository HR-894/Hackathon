# JugaadBites

JugaadBites is a hostel survival recipe application. It helps you turn whatever random ingredients you have left into a decent meal using limited equipment.

## Repository Structure

This is a monorepo managed with `pnpm` workspaces. It contains the following packages:
- `artifacts/jugaad-bites`: The main frontend application (React/Vite).
- `artifacts/api-server`: The backend Express API server.
- `lib/api-client-react`: React hooks and HTTP client to fetch data from the API.
- `lib/api-zod`: Shared validation schemas.
- `lib/db`: Database schema and connection logic (PostgreSQL/Drizzle).

## Getting Started

### Prerequisites

You will need the following installed:
- Node.js (v18 or higher recommended)
- `pnpm` (install globally via `npm install -g pnpm`)

### Installation

1. Clone this repository.
2. Install dependencies by running:
   ```bash
   pnpm install
   ```

### Running the Development Servers

You can run the entire stack in development mode using the standard commands in each package, or concurrently from the root.

To run the frontend:
```bash
cd artifacts/jugaad-bites
pnpm run dev
```
The frontend will start at `http://localhost:5173`.

To run the backend API server:
```bash
cd artifacts/api-server
pnpm run dev
```
The backend API server defaults to `http://localhost:5000` (or the port specified by the `PORT` environment variable).

### Environment Variables

**Frontend (`artifacts/jugaad-bites`)**:
- Create a `.env` file or provide environment variables for API configuration if required. 
- Example: `VITE_API_URL=http://localhost:5000`

**Backend (`artifacts/api-server`)**:
- `PORT`: Optional. Specifies the port the server listens on (defaults to `5000`).
- `FRONTEND_URL`: Optional. Sets the allowed CORS origin for the frontend (defaults to `http://localhost:5173`).
- `DATABASE_URL`: **Required**. A Postgres connection string for the database (e.g. `postgres://user:password@localhost:5432/jugaadbites`).

*(Note: Ensure you have provisioned a local or remote PostgreSQL database and provided `DATABASE_URL` in your backend environment to avoid startup crashes.)*

## Building for Production

To typecheck and build all packages in the workspace:
```bash
pnpm run build
```

This will invoke the respective `build` scripts inside each workspace project.
