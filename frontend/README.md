# Kognita — Frontend

Frontend Angular 22 do Kognita, seu diário de competência técnica.

## Stack

- **Angular 22** (standalone components, Signals, OnPush, new control flow)
- **TypeScript 6.0**
- **Vitest 4.0** (testes unitários)
- **ESLint + Prettier** (lint e formatação)
- **Angular Service Worker** (PWA)

## Development server

```bash
ng serve
```

Navegue para `http://localhost:4200/`. O aplicativo recarrega automaticamente ao modificar arquivos. Requisições para `/api` são proxyadas para `http://localhost:8080` via `proxy.conf.json`.

## Build

```bash
ng build
```

Os artefatos de build são gerados em `dist/`.

## Testes

```bash
ng test        # Vitest
```

## Estrutura

```
src/app/
├── achievement/          # Sistema de conquistas
├── analytics/            # Estatísticas e gráficos
├── animated-number/      # Animação de contagem
├── calendar/             # Calendário de estudos
├── challenge-goals/      # Metas de desafio
├── checkin/              # Modal de check-in de honestidade
├── command-palette/      # Paleta de comandos (Ctrl+K)
├── components/           # Login, Register
├── confirm/              # Modal de confirmação
├── contribution-heatmap/ # Grid de contribuição
├── dashboard/            # Dashboard principal
├── empty-state/          # Placeholder vazio
├── error-diary/          # Diário de erros
├── exam-simulator/       # Simulador de prova
├── flashcards/           # Flashcards SM-2
├── goals/                # Metas de horas
├── guards/               # Guards de navegação
├── history/              # Histórico de desafios
├── importer/             # Importador de dados
├── interceptors/         # Interceptores HTTP
├── job-analyzer/         # Analisador de vagas
├── layout/               # Sidebar + main outlet
├── leaderboard/          # Ranking global
├── learning-paths/       # Trilhas de aprendizado
├── loading/              # Spinner de carregamento
├── models/               # Interfaces TypeScript
├── notes/                # Notas de estudo Markdown
├── pomodoro/             # Timer Pomodoro
├── practice/             # Simulado cronometrado
├── profile/              # Perfil do usuário
├── reports/              # Relatório semanal
├── services/             # Serviços (Api, Auth, Toast, Config)
├── sessions/             # Sessões de estudo
├── shop/                 # Loja de recompensas XP
├── skeleton/             # Skeleton shimmer
├── study-duels/          # Duelos de estudo 1v1
├── subjects/             # CRUD matérias
├── tasks/                # Kanban drag-and-drop
├── toast/                # Notificações flutuantes
└── vault/                # Cofre de conhecimento
```
