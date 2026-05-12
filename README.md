# Sustainable Box Trivia

Sustainable Box Trivia is a Dockerized web app for sustainable-packaging trivia.
It includes a Node/Express backend, MariaDB database, static HTML/CSS/JavaScript
frontend pages, REST APIs, and WebSocket-based game sessions.

## Current Features

- Landing page with student and teacher entry points.
- Student dashboard for joining a game or starting study mode.
- Teacher dashboard for hosting games and managing questions/users.
- Question management page backed by question CRUD API routes.
- User management page backed by user CRUD API routes.
- Teaching game host and player pages.
- Study game page.
- Game session creation and lookup API routes.
- WebSocket protocol for game communication.
- MariaDB schema and seed data for users and questions.
- Gemini endpoint for generating formatted trivia questions.
- Jest tests for backend APIs, validation, WebSocket helpers, sessions, and game
  logic.

## Tech Stack

- Node.js
- Express
- MariaDB
- Static HTML/CSS/JavaScript
- WebSockets with `ws`
- Docker Compose
- Jest and Supertest

## Project Structure

```text
app/backend/              Express server, APIs, game logic, tests
app/backend/templates/    HTML pages served by Express
app/frontend/public/      CSS, browser JS, images, manifest
shared/ws-api.js          Shared WebSocket protocol code
database/schema/          Database setup and seed SQL
docker-compose.yml        Local Docker services
.env.template             Environment variable template
```

## Setup

Create a local environment file:

```bash
cp .env.template .env
```

Fill in the values in `.env`. For local Docker usage, the important defaults
are:

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

Also set:

```text
MYSQL_ROOT_PASSWORD=
MYSQL_DATABASE=trivia
MYSQL_USER=user
MYSQL_PASSWORD=password
ADMIN_PASSWORD=
GEMINI_KEY=
```

Start the app:

```bash
docker compose up --build
```

Open:

- `http://localhost:8080` for the backend-served app
- `https://localhost` for the proxy-served app
- `localhost:3307` for MariaDB access from host database tools

## Routes

Page routes:

- `GET /`
- `GET /student/home`
- `GET /teacher/home`
- `GET /teacher/questions`
- `GET /teacher/users`
- `GET /play/teaching/host`
- `GET /play/teaching/player`
- `GET /play/multi/host`
- `GET /play/study`

API routes:

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

The database initializes from:

```text
database/schema/1-setup.sql
database/schema/2-data.sql
```

Current tables:

- `users`
- `questions`

Docker Compose persists database files under `database/data`.

## Tests

Run backend tests:

```bash
cd app/backend
npm test
```

## Development Notes

- `docker compose up --build` runs the full local stack.
- The backend container runs `nodemon`.
- Frontend assets are bind-mounted and served from `/public`.
- If static files return MIME errors after Docker changes, recreate the API
  container:

```bash
docker compose up -d --build api
```
