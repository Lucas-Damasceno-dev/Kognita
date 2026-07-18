# ==============================================================================
# Makefile para desenvolvimento local do Kognita
# ==============================================================================
# Permite rodar o banco de dados no Docker e a aplicação (backend/frontend) 
# localmente para facilitar o desenvolvimento e testes rápidos.

ifneq (,$(wildcard ./.env))
    include .env
    export
endif

# Mapeia as variáveis do .env para o formato esperado pelo Spring Boot local
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:$(POSTGRES_PORT)/$(POSTGRES_DB)
export SPRING_DATASOURCE_USERNAME=$(POSTGRES_USER)
export SPRING_DATASOURCE_PASSWORD=$(POSTGRES_PASSWORD)

.DEFAULT_GOAL := help

.PHONY: help
help: ## Exibe a lista de comandos disponíveis
	@echo "Comandos disponíveis:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

.PHONY: db-start
db-start: ## Inicia apenas o container do banco de dados (PostgreSQL)
	@echo "Iniciando o banco de dados PostgreSQL via Docker..."
	docker compose up -d postgres

.PHONY: db-stop
db-stop: ## Interrompe o container do banco de dados
	@echo "Interrompendo o banco de dados PostgreSQL..."
	docker compose stop postgres

.PHONY: db-reset
db-reset: ## Recria o banco de dados do zero (limpa todos os dados)
	@echo "Limpando e recriando o banco de dados PostgreSQL..."
	docker compose down -v
	docker compose up -d postgres


.PHONY: db-logs
db-logs: ## Exibe os logs do container de banco de dados
	docker compose logs -f postgres

.PHONY: backend-run
backend-run: ## Executa o backend Spring Boot localmente (requer JDK 21)
	@echo "Iniciando o backend localmente..."
	cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

.PHONY: backend-test
backend-test: ## Executa os testes automatizados do backend
	cd backend && ./mvnw test

.PHONY: frontend-run
frontend-run: ## Instala dependências e executa o frontend Angular localmente
	@echo "Instalando dependências e iniciando o frontend localmente..."
	cd frontend && npm install && npm start

.PHONY: frontend-test
frontend-test: ## Executa os testes unitários do frontend via Vitest
	cd frontend && npm install && npm run test

.PHONY: dev
dev: db-start ## Inicia o banco no Docker e roda o backend + frontend concorrentemente
	@echo "Iniciando ambiente de desenvolvimento (Postgres no Docker + App local)..."
	@npx -y concurrently -k -p "[{name}]" -n "Backend,Frontend" -c "blue,green" \
		"cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev" \
		"cd frontend && npm install && npm start"

.PHONY: clean
clean: ## Limpa os artefatos gerados pelo build e dependências locais
	@echo "Limpando artefatos de compilação..."
	cd backend && ./mvnw clean
	rm -rf frontend/dist frontend/node_modules
