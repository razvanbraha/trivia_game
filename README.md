# Sustainable Box Trivia

Sustainable Box Trivia is a full-stack trivia application for sustainable
packaging education. It provides instructor-managed question and user workflows,
live hosted game sessions, individual study mode, and WebSocket-driven gameplay.

## Highlights

- Dockerized Node.js/Express backend with MariaDB persistence.
- Static HTML/CSS/JavaScript frontend served by Express and an Nginx frontend
  container.
- REST APIs for questions, users, game sessions, and AI-assisted question
  generation.
- WebSocket protocol shared by the browser and backend for live game events.
- Instructor pages for managing question banks and authorized users.
- Player pages for joining hosted sessions and running study mode.
- Seeded sustainable-packaging question data.
- Jest/Supertest coverage for API routes, validation, sessions, WebSocket
  helpers, and game logic.

## Tech Stack

- Node.js
- Express
- MariaDB
- WebSockets with `ws`
- HTML, CSS, and browser JavaScript modules
- Docker Compose
- Jest and Supertest
- Google Gemini API

## Repository Structure

```text
app/backend/              Express server, APIs, game/session logic, tests
app/backend/templates/    HTML pages served by the backend
app/frontend/public/      Static CSS, browser JavaScript, images, manifest
database/schema/          Database schema and seed data
shared/ws-api.js          Shared browser/backend WebSocket protocol helper
docker-compose.yml        Local service orchestration
.env.template             Local environment variable template
```

## Requirements

- Docker Desktop or Docker Engine with Docker Compose
- A `.env` file based on `.env.template`
- A Gemini API key only if AI question generation is used

## Local Setup

Create the environment file:

```bash
cp .env.template .env
```

For local Docker usage, use these service values:

```text
SERVER_NAME=localhost
BACKEND_HOST=api
BACKEND_PORT=8080
BACKEND_PATH=/api
FRONTEND_HOST=frontend
FRONTEND_PORT=80
DB_HOST=db
DB_PORT=3306
```

Set local credentials and optional AI configuration:

```text
MYSQL_ROOT_PASSWORD=<root password>
MYSQL_DATABASE=trivia
MYSQL_USER=user
MYSQL_PASSWORD=password
ADMIN_PASSWORD=<admin password>
GEMINI_KEY=<Gemini API key>
```

Start the stack:

```bash
docker compose up --build
```

Open the app:

- Backend-served app: `http://localhost:8080`
- Proxy-served app: `https://localhost`
- MariaDB host port: `localhost:3307`

## Main Routes

Pages:

- `GET /`
- `GET /student/home`
- `GET /teacher/home`
- `GET /teacher/questions`
- `GET /teacher/users`
- `GET /play/teaching/host`
- `GET /play/teaching/player`
- `GET /play/multi/host`
- `GET /play/study`

APIs:

- `GET /questions`
- `POST /questions`
- `PUT /questions`
- `DELETE /questions`
- `GET /users`
- `POST /users`
- `PUT /users`
- `DELETE /users`
- `POST /games`
- `GET /games/:code`
- `POST /ai/gemini`

## Database

MariaDB initializes from:

```text
database/schema/1-setup.sql
database/schema/2-data.sql
```

The current schema defines:

- `users`
- `questions`

Docker Compose persists local database files under `database/data`.

## Tests

Run backend tests:

```bash
cd app/backend
npm test
```

## Development Notes

- The backend container runs with `nodemon`.
- Frontend assets are bind-mounted and served from `/public`.
- If Docker changes cause stale static-file behavior, rebuild the API service:

```bash
docker compose up -d --build api
```
