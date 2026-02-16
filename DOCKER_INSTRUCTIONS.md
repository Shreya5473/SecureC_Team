# SecureC Docker Deployment Guide

This guide explains how to build and run the SecureC application (Frontend + Backend) using Docker and Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed and running.
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop).

## Quick Start

1.  **Navigate to the project root:**
    ```bash
    cd SecureC_Team
    ```

2.  **Configure Environment Variables:**
    Create a `.env` file in the `backend` directory based on the example.
    
    ```bash
    cp backend/.env.example backend/.env
    # OR if you are using the root one
    cp .env.example .env
    ```
    
    Edit the `.env` file and add your API keys:
    - `OPENROUTER_API_KEY`: Required for AI analysis.
    - `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`: Required for database.
    - `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID`, `SLACK_USER_ID`: Optional for Slack alerts.

    **Note:** The `docker-compose.yml` is configured to read from `backend/.env` by default. You can also place a `.env` in the root directory if you prefer, but make sure variables are passed correctly.

3.  **Build and Run:**
    ```bash
    docker-compose up --build
    ```
    
    This command will:
    - Build the backend image (Python/FastAPI).
    - Build the frontend image (Node/React -> Static files -> Nginx).
    - Start both services.

4.  **Access the Application:**
    - **Frontend:** [http://localhost:3000](http://localhost:3000)
    - **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

## Architecture

- **Frontend Container:** Serves the built React application using Nginx on port 80 (mapped to host 3000). It also proxies API requests (`/api/*`) to the backend.
- **Backend Container:** Runs the FastAPI application on port 8000.

## Development

To run in development mode (with hot reloading), it's recommended to run locally without Docker, or use Docker only for backing services (like a local database if you had one).

However, you can still edit code and rebuild:

```bash
# Rebuild containers after code changes
docker-compose up --build
```

## Troubleshooting

### Port Conflicts
If port 3000 or 8000 is already in use, you can modify `docker-compose.yml`:
```yaml
ports:
  - "3001:80"  # Change host port to 3001
```

### Environment Variables Not Picked Up
Ensure your `.env` file is in the `backend/` directory or properly referenced in `docker-compose.yml`.

### API Connection Issues
The frontend is configured to proxy requests to `/api` which Nginx forwards to the backend. If API calls fail:
1. Check if backend is healthy: `curl http://localhost:8000/`
2. Check Nginx logs: `docker-compose logs frontend`
3. Check Browser Console for network errors.

### Database Connection Issues
Ensure your Supabase credentials in `.env` are correct. The container needs internet access to reach Supabase.
