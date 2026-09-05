# Mobility-App

A full-stack application for managing university Erasmus/mobility exchange applications, with an Angular frontend, an Express/Node.js + TypeScript backend, and a MongoDB database.

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose (recommended, easiest way to run everything)
- Alternatively, for running services manually without Docker:
  - [Node.js](https://nodejs.org/) (v18+) and npm
  - A running [MongoDB](https://www.mongodb.com/) instance (local or remote)

## Option 1: Run with Docker Compose (recommended)

This starts the backend and MongoDB together on a shared Docker network.

1. From the repository root, start the backend and database:
   ```bash
   docker compose up --build
   ```
2. To also build and start the Angular frontend container, include the `frontend` profile:
   ```bash
   docker compose --profile frontend up --build
   ```

Once running, the services are available at:

- Frontend: [http://localhost:4200](http://localhost:4200)
- Backend API: [http://localhost:8080/api](http://localhost:8080/api)
- MongoDB: `localhost:27017`

To stop everything:

```bash
docker compose down
```

To also remove the persisted database volume:

```bash
docker compose down -v
```

### Environment variables

The backend container reads `MONGODB_URI` (already set in `docker-compose.yml`). You should also provide a `JWT_SECRET` used to sign authentication tokens, for example by adding it under the `backend` service's `environment` section in `docker-compose.yml`:

```yaml
environment:
  MONGODB_URI: mongodb://mongo_mobility:27017/mydatabase
  JWT_SECRET: some-long-random-secret
  FRONTEND_URL: http://localhost:4200
```

## Option 2: Run manually (without Docker)

### 1. Start MongoDB

Make sure a MongoDB instance is running and reachable, e.g. locally on `mongodb://localhost:27017`.

### 2. Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with at least:

```
MONGODB_URI=mongodb://localhost:27017/mydatabase
JWT_SECRET=some-long-random-secret
FRONTEND_URL=http://localhost:4200
```

Then run the backend in development mode (auto-reload via `tsx watch`):

```bash
npm run dev
```

Or build and run the compiled version:

```bash
npm run build
npm start
```

The API will be available at [http://localhost:8080/api](http://localhost:8080/api).

### 3. Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm start
```

This runs `ng serve`, and the app will be available at [http://localhost:4200](http://localhost:4200).

## Seeded test accounts

On first startup, if the database is empty, the backend automatically seeds sample data (universities, courses, students, professors) along with one test account per role, all using the password `Password123!`:

| Role         | Email                  | Password       |
| ------------ | ---------------------- | -------------- |
| Student      | `907785@stud.unive.it` | `Password123!` |
| Professor    | `melonio@unive.it`     | `Password123!` |
| Office staff | `office@unive.it`      | `Password123!` |
