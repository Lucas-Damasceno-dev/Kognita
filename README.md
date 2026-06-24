# Kognita

**Seu Diário de Competência Técnica.**

Kognita não é um organizador de estudos tradicional. É um sistema para construir e provar — para você mesmo — a sua capacidade técnica.

## Propósito

### O Problema
Você consome teoria, sabe os conceitos, mas não confia na sua capacidade prática. A IA virou muleta. Você não forma as conexões neurais que só vêm da prática sem rede de segurança.

### A Solução
Kognita te força a praticar **sem rede de segurança**, registra cada "prova de capacidade" que você venceu e te mostra, com dados, que você *consegue* fazer as coisas sozinho.

## Stack

- **Backend:** Java 21 + Spring Boot 4.1.0 (REST API, JWT auth, JPA/Hibernate, Flyway)
- **Frontend:** Angular 22 (standalone components, signals, OnPush)
- **Database:** PostgreSQL 16
- **Infrastructure:** Docker / Docker Compose

## Conceitos Centrais

### Desafio (antiga Task)
Cada atividade prática que exige entrega real. Um desafio pertence a uma **Skill Category** (Teoria, Prática, Memorização, Problemas, Revisão, Projeto) e pode exigir ou não uma prova de conclusão.

### Challenge Attempt
Registra cada tentativa sua de resolver um desafio. O campo mais importante: `used_ai`.

- `used_ai = false` → conta como **próprio**, sobe o nível de confiança da skill
- `used_ai = true` → conta como **assistido**, não altera a confiança

### Check-in de Honestidade
Ao concluir um desafio, o app pergunta: *"Usou IA para completar isso?"*
- **Modo Livre:** pergunta sim/não
- **Zona de Prova:** trava `used_ai = false` automaticamente

### Nível de Confiança (por Skill)
Métrica que só sobe com desafios concluídos **sem IA**. O dashboard exibe gráfico de barras por skill.

### Streak (Sequência)
Dias consecutivos com pelo menos um desafio próprio (sem IA). Exibido no dashboard e no check-in.

## Todas as Funcionalidades

### Dashboard (`/dashboard`)
Visão geral completa da vida de estudos.
- Cartões de resumo: total de matérias, tarefas pendentes, metas
- Sequência atual (streak de dias com desafios próprios)
- Gráfico de confiança por skill (barras horizontais)
- Metas semanais de desafios (progresso)
- Horas por matéria (barras horizontais coloridas)
- Progresso semanal (gráfico de barras vertical, dom–sáb)
- Rosca de conclusão de tarefas (completadas vs pendentes)
- Tarefas com vencimento em 3 dias
- Lista de tarefas pendentes com toggle "Ver todas"
- Adição rápida de sessão de estudo (matéria + duração)
- Conclusão rápida de tarefa com refresh otimista
- Lembretes de metas de desafio próximas do prazo
- Onboarding para novos usuários (4 passos)
- Skeleton loading enquanto carrega

### Matérias / Subjects (`/subjects`)
CRUD completo de matérias de estudo.
- Criar com nome, descrição, seletor de cor
- Editar inline com formulário preenchido
- Excluir com modal de confirmação (`<app-confirm>`)
- Ordenação por nome/cor (asc/desc)
- Paginação (20 por página)
- Indicador visual de cor por matéria
- Guard de alterações não salvas

### Tarefas / Tasks (`/tasks`)
Kanban de tarefas com drag-and-drop e operações em lote.
- **Kanban:** 3 colunas (Pendente, Em Andamento, Concluído)
- **Drag-and-drop nativo:** arrasta entre colunas, gatilho de status
- **CRUD:** criar, editar, excluir
- **Status:** botões Iniciar, Concluir, Reabrir, Voltar
- **Check-in de Honestidade** ao concluir (modal `<app-checkin>`)
- **Operações em lote:** modo seleção, checkbox por tarefa, selecionar tudo por coluna, concluir/excluir em lote com `forkJoin`
- **Filtros:** busca por texto, status, prioridade
- **Paginação:** 10 por página
- **Atalhos de teclado:** `N` nova tarefa, `Escape` fechar form
- **Tarefas atrasadas:** destaque vermelho
- **Link rápido para Pomodoro** com `subjectId`
- Tags de matéria e skill category, badges de prioridade
- Guard de alterações não salvas

### Sessões de Estudo / Sessions (`/sessions`)
Registro de tempo estudado por matéria.
- CRUD completo (criar, editar, excluir)
- Filtros: matéria, data inicial, data final
- Ordenação por matéria/data/duração
- Paginação (20 por página)
- Guard de alterações não salvas

### Metas de Horas / Goals (`/goals`)
Metas de horas de estudo por matéria.
- CRUD completo
- Barra de progresso visual (horas atuais / horas alvo)
- Botão +1 hora para incremento rápido
- Porcentagem calculada automaticamente
- Ordenação por título/horas/prazo
- Paginação (20 por página)
- Guard de alterações não salvas

### Perfil / Profile (`/profile`)
Gerenciamento de perfil do usuário.
- Avatar com URL, fallback para inicial do nome
- Nome e email editáveis
- Alteração de senha (opcional)
- Envio apenas de campos alterados (diff contra dados salvos)
- Preview de avatar com tratamento de erro de carga
- Guard de alterações não salvas

### Pomodoro (`/pomodoro`)
Timer Pomodoro com logging automático de sessões.
- Seletor de matéria e tarefa (opcional, filtrada por matéria)
- Timer configurável (trabalho: 25min, pausa: 5min)
- Anel SVG de progresso circular
- Controles: Iniciar, Pausar, Resetar
- Criação automática de sessão de estudo ao completar foco
- Modo pausa após foco
- Notificações via `Notification` API (com permissão)
- Beep sonoro (Web Audio API) ao finalizar
- Atalhos de teclado: `Space` pausa/inicia, `R` reseta
- Aceita `subjectId` via query param (integrado com dashboard e tasks)

### Prática / Practice (`/practice`)
Simulado cronometrado de resolução de tarefas sem IA.
- Filtro opcional por matéria
- Timer de 30 minutos com anel SVG
- Navegação entre tarefas (anterior/próxima)
- Indicador de progresso por pontos
- Criação automática de ChallengeAttempt com `usedAi: false`
- Tela de resultados ao finalizar
- Modo pausa
- Estado de warning (<5min, timer vermelho)
- Atalho para criar tarefas se não houver nenhuma

### Histórico / History (`/history`)
Histórico de desafios concluídos sem IA.
- Cartões com título, data, skill category, anotações
- Edição inline de anotações
- Mentoria ("Refatorar"): modal para adicionar reflexão de mentoria nas notas
- Exibe campo `howISolved`
- Estado vazio com link para prática

### Metas de Desafio / Challenge Goals (`/challenge-goals`)
Metas semanais de desafios sem IA.
- Criar com contagem alvo e data limite
- Barra de progresso com porcentagem
- Dias restantes calculados; metas expiradas destacadas
- Guard de alterações não salvas

### Analytics (`/analytics`)
Estatísticas e gráficos de atividade.
- Cartões de resumo: total de horas, sessões, média
- Gráfico de horas semanal/mensal (toggle)
- Gráfico de desafios nos últimos 7 dias
- CSS puro (sem biblioteca de gráficos)

### Diário de Erros / Error Diary (`/error-diary`)
Registro de erros, falhas e soluções.
- CRUD completo (título, descrição, solução)
- Cartões com timestamp
- Guard de alterações não salvas

### Analisador de Vagas / Job Analyzer (`/job-analyzer`)
Análise de gap técnico contra vagas de emprego.
- Input de descrição da vaga
- Análise via backend
- Relatório: nível de prontidão, skills encontradas, skills faltando

### Importador / Importer (`/importer`)
Importação em massa de matérias e tarefas.
- **Estrutura de Arquivos:** criação dinâmica de categorias com tarefas, validação, importação em lote
- **Roadmap.sh:** seleção de roadmap (Backend, Frontend, DevOps), carrega JSON, editor manual, importa para backend

### Autenticação
- Login e registro com JWT
- Token e usuário persistidos em `localStorage`
- Interceptor HTTP adiciona Bearer token automaticamente
- Guard de rota redireciona para `/login` quando não autenticado
- Timeout de 30s em requisições com mensagens de erro amigáveis

### Tema / Tema Escuro
- Alternância claro/escuro no sidebar
- Persistido em `localStorage('kognita_theme')`
- Variáveis CSS com `data-theme` no `<html>`

### Modo Desafio
- "Zona de Prova" vs "Modo Livre" no sidebar
- Controla comportamento do check-in de honestidade
- Persistido em `localStorage('kognita_challenge_mode')`

### Layout Responsivo
- Sidebar colapsável em mobile (hamburger menu)
- Kanban empilha verticalmente em telas pequenas
- Overlay de fundo quando sidebar aberto em mobile

### Sistema de Notificações
- **Toast:** notificações flutuantes (success/error/info/warning), auto-dismiss 3s
- **Notificações nativas:** `Notification` API no Pomodoro
- **Beep sonoro:** Web Audio API no Pomodoro
- **Lembretes:** dashboard alerta sobre metas próximas do prazo

### Guards de Navegação
- `authGuard`: protege rotas autenticadas
- `canDeactivateGuard`: `confirm()` em formulários com alterações não salvas
- `@HostListener('window:beforeunload')`: aviso ao fechar/recarregar aba

### Paginação Servidor-Side
Matérias (20/página), Tarefas (10/página), Sessões (20/página), Metas (20/página).

### Componentes Reutilizáveis
- `<app-checkin>` — modal de check-in de honestidade com stats
- `<app-confirm>` — modal de confirmação genérico
- `<app-toast>` — container de notificações flutuantes
- `<app-loading>` — spinner inline
- `<app-skeleton>` — shimmer placeholder (modos: dashboard, kanban, list, text)

## API Endpoints

### Auth (`/api/auth`)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/register` | Criar conta → JWT + user |
| POST | `/login` | Autenticar → JWT + user |

### Users (`/api/users`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar usuários |
| GET | `/{id}` | Buscar usuário |
| POST | `/` | Criar usuário |
| PUT | `/{id}` | Atualizar perfil |
| DELETE | `/{id}` | Excluir conta |

### Subjects (`/api/subjects`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar matérias |
| GET | `/page` | Matérias paginadas |
| GET | `/{id}` | Buscar matéria |
| POST | `/` | Criar matéria |
| PUT | `/{id}` | Atualizar matéria |
| DELETE | `/{id}` | Excluir matéria |

### Tasks (`/api/tasks`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Tarefas filtradas e paginadas |
| GET | `/practice` | Tarefas para o simulado |
| GET | `/{id}` | Buscar tarefa |
| POST | `/` | Criar tarefa |
| PUT | `/{id}` | Atualizar tarefa |
| PATCH | `/{id}/status` | Atualizar status |
| DELETE | `/{id}` | Excluir tarefa |

### Study Sessions (`/api/study-sessions`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar sessões |
| GET | `/page` | Sessões paginadas/filtradas |
| POST | `/` | Criar sessão |
| PUT | `/{id}` | Atualizar sessão |
| DELETE | `/{id}` | Excluir sessão |

### Goals (`/api/goals`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar metas |
| GET | `/page` | Metas paginadas |
| POST | `/` | Criar meta |
| PUT | `/{id}` | Atualizar meta |
| PATCH | `/{id}/progress` | Atualizar progresso |
| DELETE | `/{id}` | Excluir meta |

### Challenge Goals (`/api/challenge-goals`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar metas de desafio |
| POST | `/` | Criar meta de desafio |
| DELETE | `/{id}` | Excluir meta |

### Challenge Attempts (`/api/challenge-attempts`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar attempts |
| GET | `/stats` | Estatísticas (skills, streak, etc.) |
| GET | `/history` | Histórico filtrado |
| POST | `/` | Criar attempt |
| PUT | `/{id}` | Atualizar attempt |
| DELETE | `/{id}` | Excluir attempt |

### Error Logs (`/api/error-logs`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar logs |
| GET | `/count` | Total de logs |
| POST | `/` | Criar log |
| PUT | `/{id}` | Atualizar log |
| DELETE | `/{id}` | Excluir log |

### Jobs (`/api/jobs`)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/analyze` | Analisar descrição de vaga |

### Import (`/api/import`)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/file-structure` | Importar categorias com tarefas |
| POST | `/roadmap` | Importar roadmap JSON |

## Roadmap (Fases de Desenvolvimento)

### Fase 1 — Diário de Confiança (MVP)
- [x] Skill category e requires_proof nas tarefas
- [x] Entidade ChallengeAttempt com used_ai
- [x] Check-in de Honestidade
- [x] Termômetro de confiança por skill no dashboard
- [x] Streak de dias com desafios próprios

### Fase 2 — Sem Rede de Segurança
- [x] Modo "Zona de Prova" (bloqueia used_ai)
- [x] Histórico de provas com busca e filtros
- [x] Registro de passo a passo próprio

### Fase 3 — Ritmo e Consistência
- [x] Metas semanais de desafios próprios
- [x] Notificações para não quebrar o streak

### Fase 4 — Blindagem Técnica (Diário de Erros e Mentoria)
- [x] Diário de Erros (`/error-diary`)
- [x] Mentoria de Código / Refatoração no histórico

### Fase 5 — Prontidão para o Mercado
- [x] Simulador cronometrado (`/practice`)
- [x] Analisador de Vagas (`/job-analyzer`)
- [x] Analytics com gráficos (`/analytics`)

### Fase 6 — Integração com Ecossistema
- [x] Importador de Learning (`/importer`)
- [x] Integração roadmap.sh

### Fase 7 — Qualidade e UX
- [x] Tema claro/escuro
- [x] Drag-and-drop no Kanban
- [x] Operações em lote nas tarefas
- [x] Paginação servidor-side
- [x] Atalhos de teclado
- [x] Notificações nativas + som
- [x] Guard de alterações não salvas
- [x] Skeleton loading

## Project Structure

```ascii
Kognita/
├── backend/                 # Spring Boot REST API
│   ├── src/main/java/.../
│   │   ├── controller/      # 10 controllers (REST endpoints)
│   │   ├── service/         # Business logic
│   │   ├── repository/      # JPA repositories
│   │   ├── model/           # JPA entities
│   │   ├── dto/             # Request/response records
│   │   └── config/          # Security, JWT, Jackson
│   └── src/main/resources/
│       ├── application.yml  # Config principal
│       ├── application-dev.yml
│       └── db/migration/    # Flyway migrations
├── frontend/                # Angular application
│   └── src/app/
│       ├── components/      # Login, Register
│       ├── services/        # ApiService, AuthService, ToastService, ConfigService
│       ├── guards/          # authGuard, canDeactivateGuard
│       ├── interceptors/    # authInterceptor
│       ├── models/          # TypeScript interfaces
│       ├── dashboard/       # Dashboard page
│       ├── subjects/        # CRUD matérias
│       ├── tasks/           # Kanban com drag-and-drop
│       ├── sessions/        # CRUD sessões
│       ├── goals/           # CRUD metas
│       ├── profile/         # Perfil do usuário
│       ├── pomodoro/        # Timer Pomodoro
│       ├── practice/        # Simulado cronometrado
│       ├── history/         # Histórico de desafios
│       ├── challenge-goals/ # Metas de desafio
│       ├── analytics/       # Estatísticas e gráficos
│       ├── error-diary/     # Diário de erros
│       ├── job-analyzer/    # Análise de vagas
│       ├── importer/        # Importador
│       ├── checkin/         # Modal check-in
│       ├── confirm/         # Modal confirmação
│       ├── toast/           # Notificações flutuantes
│       ├── loading/         # Spinner loading
│       ├── skeleton/        # Skeleton shimmer
│       └── layout/          # Sidebar + main outlet
├── docker/
│   ├── backend/             # Backend Dockerfile
│   ├── frontend/            # Frontend Dockerfile
│   └── postgres/            # Init SQL scripts
├── docker-compose.yml       # Orquestração de containers
└── .env.example             # Template de variáveis de ambiente
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

## Desenvolvimento Local

```bash
# Backend
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Frontend
cd frontend
npm install
ng serve
```

O frontend em dev (`ng serve`) faz proxy de `/api` para `http://localhost:8080` via `proxy.conf.json`.
