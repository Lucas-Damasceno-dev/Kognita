const fs = require('fs');
let html = fs.readFileSync('frontend/src/app/layout/layout.html', 'utf8');

const newNav = `
  <div class="sidebar-nav">
    <div class="nav-group-label">PRINCIPAL</div>

    <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" #rlaDashboard="routerLinkActive" [attr.aria-current]="rlaDashboard.isActive ? 'page' : null" (click)="closeSidebar()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
      Dashboard
    </a>
    <a routerLink="/tasks" routerLinkActive="active" #rlaTasks="routerLinkActive" [attr.aria-current]="rlaTasks.isActive ? 'page' : null" (click)="closeSidebar()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
      Desafios
    </a>
    <a routerLink="/pomodoro" routerLinkActive="active" #rlaPomodoro="routerLinkActive" [attr.aria-current]="rlaPomodoro.isActive ? 'page' : null" (click)="closeSidebar()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
      Foco (Timer)
    </a>
    <a routerLink="/practice" routerLinkActive="active" #rlaPractice="routerLinkActive" [attr.aria-current]="rlaPractice.isActive ? 'page' : null" (click)="closeSidebar()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
      Prática
    </a>
    <a routerLink="/subjects" routerLinkActive="active" #rlaSubjects="routerLinkActive" [attr.aria-current]="rlaSubjects.isActive ? 'page' : null" (click)="closeSidebar()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
      Matérias
    </a>

    <div class="nav-group-label">PROGRESSO</div>

    <a routerLink="/analytics" routerLinkActive="active" #rlaAnalytics="routerLinkActive" [attr.aria-current]="rlaAnalytics.isActive ? 'page' : null" (click)="closeSidebar()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>
      Analytics
    </a>
    <a routerLink="/history" routerLinkActive="active" #rlaHistory="routerLinkActive" [attr.aria-current]="rlaHistory.isActive ? 'page' : null" (click)="closeSidebar()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
      Histórico
    </a>
    <a routerLink="/leaderboard" routerLinkActive="active" #rlaLeaderboard="routerLinkActive" [attr.aria-current]="rlaLeaderboard.isActive ? 'page' : null" (click)="closeSidebar()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" /><path d="M12 2a5 5 0 0 0-5 5v2h10V7a5 5 0 0 0-5-5z" /></svg>
      Ranking
    </a>

    <div class="nav-group-label">FERRAMENTAS</div>

    <a routerLink="/error-diary" routerLinkActive="active" #rlaErrorDiary="routerLinkActive" [attr.aria-current]="rlaErrorDiary.isActive ? 'page' : null" (click)="closeSidebar()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
      Diário de Erros
    </a>
    <a routerLink="/job-analyzer" routerLinkActive="active" #rlaJobAnalyzer="routerLinkActive" [attr.aria-current]="rlaJobAnalyzer.isActive ? 'page' : null" (click)="closeSidebar()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
      Analisador de Vagas
    </a>
    <a routerLink="/importer" routerLinkActive="active" #rlaImporter="routerLinkActive" [attr.aria-current]="rlaImporter.isActive ? 'page' : null" (click)="closeSidebar()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
      Importar
    </a>
    <a routerLink="/profile" routerLinkActive="active" #rlaProfile="routerLinkActive" [attr.aria-current]="rlaProfile.isActive ? 'page' : null" (click)="closeSidebar()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
      Perfil
    </a>
  </div>`;

const startIdx = html.indexOf('<div class="sidebar-nav">');
const endIdx = html.indexOf('<div class="sidebar-footer">');
const finalHtml = html.substring(0, startIdx) + newNav + '\n\n  ' + html.substring(endIdx);

fs.writeFileSync('frontend/src/app/layout/layout.html', finalHtml);
