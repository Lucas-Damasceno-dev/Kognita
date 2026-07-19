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

### Calendário / Calendar (`/calendar`)
Visão mensal dos estudos em formato de calendário.
- Grid mensal com dias do mês e cabeçalho de dias da semana
- Sessões de estudo exibidas como pills com duração e nome da matéria
- Tarefas clicáveis com link direto para `/tasks`
- Navegação entre meses (anterior/próximo)
- Destaque visual para dias com atividade
- Suporte a skeleton loading

### Metas de Horas / Goals (`/goals`)
Metas de horas de estudo por matéria.
- CRUD completo
- Barra de progresso visual (horas atuais / horas alvo)
- Botão +1 hora para incremento rápido
- Porcentagem calculada automaticamente
- Ordenação por título/horas/prazo
- Paginação (20 por página)
- Guard de alterações não salvas
- **Metas Recorrentes:** suporte a recorrência semanal ou mensal com rollover automático e streak count

### Perfil / Profile (`/profile`)
Gerenciamento de perfil do usuário.
- Avatar com URL, fallback para inicial do nome
- Nome e email editáveis
- Alteração de senha (opcional)
- Envio apenas de campos alterados (diff contra dados salvos)
- Preview de avatar com tratamento de erro de carga
- Guard de alterações não salvas

### Leaderboard (`/leaderboard`)
Ranking global de usuários gamificado.
- Filtros: **XP** (total de experiência) e **Streak** (dias consecutivos)
- Pódio para top 3 com cards dourado/prata/bronze, coroas e avatares
- Lista tabular para ranks 4+ com avatar, nome, título, badge de nível
- Cálculo de nível: `floor(xp / 100) + 1`
- Destaque visual para o usuário atual na tabela
- Skeleton loading durante carregamento

### Loja / Shop (`/shop`)
Loja de recompensas por XP.
- **Streak Freeze:** congela a sequência se perder um dia (200 XP)
- **Títulos:** "Sobrevivente do Código", "Destruidor de Bugs", "Codificador de Elite", "Mestre da Resiliência", "Lendário Sem IA"
- **Bordas de Avatar:** Bronze, Prata, Ouro, Rainbow Neon
- **Temas:** Cyberpunk Neon, Tokyo Night, Nordic Slate
- Saldo de XP exibido no cabeçalho, badge "Equipado" em itens ativos

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

### Simulador de Prova / Exam Simulator (`/exam-simulator`)
Simulado de prova técnica com perguntas de múltipla escolha.
- Configuração: matéria, número de questões (5/10/15), tempo limite (5–30 min)
- Banco de questões técnicas: SQL, OOP, redes, Angular, git, Docker, algoritmos
- Timer regressivo com alerta visual em menos de 2min
- Navegação entre questões e seleção de alternativas (A/B/C/D)
- Resultado com nota (/10), badge de aprovação (corte 7.0), confete ao passar
- Precisão percentual e gauge visual

### Duelos de Estudo / Study Duels (`/study-duels`)
Modo batalha de quiz 1v1 contra bot IA.
- **Lobby:** "Duelo Rápido vs IA Bot" e "Multiplayer Online" (travado até level 5)
- **Batalha:** 5 perguntas com timer de 10s cada, placar jogador vs bot
- **Combo:** multiplicador aumenta 0.5 por acerto consecutivo (máx 3x), reseta ao errar
- **Pontuação:** 100 pontos base + bônus de tempo (10/s restante) × combo
- **Resultado:** tela de vitória/derrota com confete, replay
- Perguntas de SQL, OOP, estruturas de dados, HTTP, Angular

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

### Flashcards (`/flashcards`)
Sistema de flashcards com repetição espaçada (algoritmo SM-2).
- **Gerenciar:** criar, editar e excluir flashcards com tipo TEXT, CODE ou MULTIPLE_CHOICE
- **Revisar:** flashcards devidos para revisão com autoavaliação (Errei/Bom/Fácil)
- **SM-2:** cálculo automático de intervalo, fator de facilidade e próxima data de revisão
- **Associação:** vínculo opcional com matéria
- **Progresso:** contador de repetições e evolução ao longo do tempo

### Analytics (`/analytics`)
Estatísticas e gráficos de atividade.
- Cartões de resumo: total de horas, sessões, média
- Gráfico de horas semanal/mensal (toggle)
- Gráfico de desafios nos últimos 7 dias
- CSS puro (sem biblioteca de gráficos)

### Relatórios / Reports (`/reports`)
Gerador de relatório semanal de competência técnica.
- Carrega dados da semana atual: horas estudadas, desafios sem IA, bugs documentados, streak ativo
- Cartões de resumo com estatísticas da semana
- Geração de relatório em **Markdown** com nome, nível, horas, matérias, desafios autônomos, erros resolvidos
- Botão "Copiar Markdown" para compartilhar no LinkedIn/GitHub
- Skeleton loading durante carregamento dos dados

### Diário de Erros / Error Diary (`/error-diary`)
Registro de erros, falhas e soluções.
- CRUD completo (título, descrição, solução)
- Cartões com timestamp
- Guard de alterações não salvas

### Notas de Estudo / Study Notes (`/notes`)
Editor de anotações de estudo com suporte a Markdown.
- Painel duplo: sidebar com lista de notas + editor
- Criação com template Markdown padrão
- Edição de título, conteúdo (Markdown), tags e matéria associada
- Sistema de tags: adicionar/remover tags inline
- Busca por título, conteúdo ou nome da matéria
- Persistência em localStorage
- Formatação de data (dd/MM HH:mm)

### Analisador de Vagas / Job Analyzer (`/job-analyzer`)
Análise de gap técnico contra vagas de emprego.
- Input de descrição da vaga
- Análise via backend
- Relatório: nível de prontidão, skills encontradas, skills faltando

### Importador / Importer (`/importer`)
Importação em massa de matérias e tarefas.
- **Estrutura de Arquivos:** criação dinâmica de categorias com tarefas, validação, importação em lote
- **Roadmap.sh:** seleção de roadmap (Backend, Frontend, DevOps), carrega JSON, editor manual, importa para backend

### Exportação de Dados (`/api/export`)
Exporta todos os dados do usuário em formato JSON para portabilidade e backup.
- Perfil, matérias, tarefas, sessões de estudo, metas, challenge attempts, error logs
- Útil para migração ou backup dos dados

### Cofre de Conhecimento / Vault (`/vault`)
Arquivo permanente de snapshots de estudo ("Knowledge Vault").
- Cada snapshot registra: matéria, duração, tipo (pomodoro/note), título, conteúdo, accuracy, tags
- Busca por palavra-chave em título, conteúdo e matéria
- Filtragem por tags (clicar em chips)
- Linha do tempo com cards de snapshot
- Exportação como Markdown (`.md`) ou JSON (`.json`)
- Persistência em localStorage

### Autenticação
- Login e registro com JWT
- Token e usuário persistidos em `localStorage`
- Interceptor HTTP adiciona Bearer token automaticamente
- Guard de rota redireciona para `/login` quando não autenticado
- Timeout de 30s em requisições com mensagens de erro amigáveis

### Trilhas de Aprendizado / Learning Paths (`/learning-paths`)
Roadmaps lineares sequenciais com desafios interligados.
- Dois painéis: sidebar com lista de trilhas + visão principal do roadmap
- Trilha demo padrão: "Rota de Engenharia de Software & Banco de Dados"
- Criação de trilhas personalizadas selecionando tarefas existentes
- Cada nó mostra: ordem, título, tag da matéria, status (trancado/disponível/concluído)
- Desbloqueio sequencial: só libera o próximo nó ao concluir o anterior
- Alternar conclusão com confete e toast de sucesso
- Persistência em localStorage

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

### Paleta de Comandos / Command Palette
Paleta de comandos estilo Spotlight/Alfred, ativada por **Ctrl+K** (ou Cmd+K).
- Busca por ações e navegação
- **Ações:** criar tarefa, iniciar pomodoro, revisar flashcards, alternar tema, etc.
- **Navegação:** todas as rotas principais do sistema
- Navegação por teclado (setas + Enter), fechar com Escape
- Destaque do termo buscado nos resultados
- Feedback tátil (haptic) ao navegar/selecionar
- Badges de atalhos e ícones nos comandos

### Sistema de Conquistas / Achievements
Sistema de conquistas que recompensa marcos do usuário.
- Overlay full-screen com confete ao desbloquear uma conquista
- Ícone de troféu, nome da conquista, descrição e recompensa em XP
- Integrado com AchievementService para notificar em qualquer página

### Componentes Reutilizáveis
- `<app-checkin>` — modal de check-in de honestidade com stats
- `<app-confirm>` — modal de confirmação genérico
- `<app-toast>` — container de notificações flutuantes
- `<app-loading>` — spinner inline
- `<app-skeleton>` — shimmer placeholder (modos: dashboard, kanban, list, text)
- `<app-empty-state>` — placeholder vazio com ilustrações SVG temáticas
- `<app-animated-number>` — animação de contagem numérica com cubic ease-out
- `<app-contribution-heatmap>` — grid de contribuição estilo GitHub (52 semanas, tooltip, temas de cor)

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

### Flashcards (`/api/flashcards`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar flashcards do usuário |
| GET | `/due` | Flashcards devidos para revisão |
| POST | `/` | Criar flashcard |
| PUT | `/{id}` | Atualizar flashcard |
| DELETE | `/{id}` | Excluir flashcard |
| POST | `/{id}/review` | Revisar flashcard (rating 1–5, algoritmo SM-2) |

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

### Export (`/api/export`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Exportar todos os dados do usuário (JSON) |

### Webhooks (`/api/webhooks`)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/github` | Webhook GitHub: auto-completa tarefas via commit messages |

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
│   │   ├── controller/      # 15 controllers (REST endpoints)
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
│       ├── achievement/     # Sistema de conquistas (overlay)
│       ├── analytics/       # Estatísticas e gráficos
│       ├── animated-number/ # Animação de contagem numérica
│       ├── calendar/        # Visão mensal de estudos
│       ├── challenge-goals/ # Metas de desafio
│       ├── checkin/         # Modal check-in
│       ├── command-palette/ # Paleta Ctrl+K
│       ├── components/      # Login, Register
│       ├── confirm/         # Modal confirmação
│       ├── contribution-heatmap/ # Grid estilo GitHub
│       ├── dashboard/       # Dashboard page
│       ├── empty-state/     # Placeholder vazio
│       ├── error-diary/     # Diário de erros
│       ├── exam-simulator/  # Simulador de prova
│       ├── flashcards/      # Flashcards SM-2
│       ├── goals/           # CRUD metas
│       ├── guards/          # authGuard, canDeactivateGuard
│       ├── history/         # Histórico de desafios
│       ├── importer/        # Importador
│       ├── interceptors/    # authInterceptor
│       ├── job-analyzer/    # Análise de vagas
│       ├── layout/          # Sidebar + main outlet
│       ├── leaderboard/     # Ranking global
│       ├── learning-paths/  # Trilhas de aprendizado
│       ├── loading/         # Spinner loading
│       ├── models/          # TypeScript interfaces
│       ├── notes/           # Notas de estudo Markdown
│       ├── pomodoro/        # Timer Pomodoro
│       ├── practice/        # Simulado cronometrado
│       ├── profile/         # Perfil do usuário
│       ├── reports/         # Relatório semanal
│       ├── services/        # ApiService, AuthService, ToastService, ConfigService
│       ├── sessions/        # CRUD sessões
│       ├── shop/            # Loja de recompensas XP
│       ├── skeleton/        # Skeleton shimmer
│       ├── study-duels/     # Duelos 1v1
│       ├── subjects/        # CRUD matérias
│       ├── tasks/           # Kanban com drag-and-drop
│       ├── toast/           # Notificações flutuantes
│       └── vault/           # Cofre de conhecimento
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
