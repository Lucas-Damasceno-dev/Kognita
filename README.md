# Kognita

Study organization system with Spring Boot, Angular, PostgreSQL, and Docker.

## Stack

- **Backend:** Java 21 + Spring Boot
- **Frontend:** Angular
- **Database:** PostgreSQL
- **Infrastructure:** Docker / Docker Compose

## Project Structure

```ascii
Kognita/
├── backend/              # Spring Boot REST API
├── frontend/             # Angular application
├── docker/               # Docker configuration
│   ├── backend/          # Backend Dockerfile
│   ├── frontend/         # Frontend Dockerfile
│   └── postgres/         # SQL initialization scripts
├── docker-compose.yml    # Container orchestration
└── .env.example          # Environment variables template
```

## Prerequisites

- Docker and Docker Compose installed
- Java 21 (for local development)
- Node.js 22 (for local development)

## How to Run

```bash
# 1. Set up environment variables
cp .env.example .env

# 2. Start all services
docker compose up -d

# 3. Access:
#    - Frontend: http://localhost
#    - API: http://localhost:8080
#    - PostgreSQL: localhost:5432

# Stop services
docker compose down

# Stop and remove volumes (data)
docker compose down -v
```
