# Kognita

Sistema de organização de estudos com Spring Boot, Angular, PostgreSQL e Docker.

## Stack

- **Backend:** Java 21 + Spring Boot
- **Frontend:** Angular
- **Database:** PostgreSQL
- **Infraestrutura:** Docker / Docker Compose

## Estrutura do Projeto

```ascii
Kognita/
├── backend/              # API REST Spring Boot
├── frontend/             # Aplicação Angular
├── docker/               # Configurações Docker
│   ├── backend/          # Dockerfile do backend
│   ├── frontend/         # Dockerfile do frontend
│   └── postgres/         # Scripts SQL de inicialização
├── docker-compose.yml    # Orquestração dos containers
└── .env.example          # Template de variáveis de ambiente
```

## Pré-requisitos

- Docker e Docker Compose instalados
- Java 21 (para desenvolvimento local)
- Node.js 22 (para desenvolvimento local)

## Como executar

```bash
# 1. Configure as variáveis de ambiente
cp .env.example .env

# 2. Inicie todos os serviços
docker compose up -d

# 3. Acesse:
#    - Frontend: http://localhost
#    - API: http://localhost:8080
#    - PostgreSQL: localhost:5432

# Parar os serviços
docker compose down

# Parar e remover volumes (dados)
docker compose down -v
```
