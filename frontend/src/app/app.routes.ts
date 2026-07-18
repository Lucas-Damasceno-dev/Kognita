import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { canDeactivateGuard } from './guards/can-deactivate.guard';
import { Layout } from './layout/layout';
import { Login } from './components/login/login';
import { Register } from './components/register/register';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
      },
      {
        path: 'subjects',
        loadComponent: () => import('./subjects/subjects').then(m => m.Subjects),
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: 'tasks',
        loadComponent: () => import('./tasks/tasks').then(m => m.Tasks),
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: 'practice',
        loadComponent: () => import('./practice/practice').then(m => m.Practice),
      },
      {
        path: 'sessions',
        loadComponent: () => import('./sessions/sessions').then(m => m.Sessions),
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: 'goals',
        loadComponent: () => import('./goals/goals').then(m => m.Goals),
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile').then(m => m.Profile),
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: 'pomodoro',
        loadComponent: () => import('./pomodoro/pomodoro').then(m => m.Pomodoro),
      },
      {
        path: 'flashcards',
        loadComponent: () => import('./flashcards/flashcards').then(m => m.Flashcards),
      },
      {
        path: 'history',
        loadComponent: () => import('./history/history').then(m => m.History),
      },
      {
        path: 'challenge-goals',
        loadComponent: () => import('./challenge-goals/challenge-goals').then(m => m.ChallengeGoals),
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: 'analytics',
        loadComponent: () => import('./analytics/analytics').then(m => m.Analytics),
      },
      {
        path: 'calendar',
        loadComponent: () => import('./calendar/calendar').then(m => m.CalendarView),
      },
      {
        path: 'error-diary',
        loadComponent: () => import('./error-diary/error-diary').then(m => m.ErrorDiary),
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: 'job-analyzer',
        loadComponent: () => import('./job-analyzer/job-analyzer').then(m => m.JobAnalyzer),
      },
      {
        path: 'importer',
        loadComponent: () => import('./importer/importer').then(m => m.Importer),
      },
      {
        path: 'leaderboard',
        loadComponent: () => import('./leaderboard/leaderboard').then(m => m.Leaderboard),
      },
      {
        path: 'shop',
        loadComponent: () => import('./shop/shop').then(m => m.Shop),
      },
      {
        path: 'reports',
        loadComponent: () => import('./reports/reports').then(m => m.Reports),
      },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
      { path: '**', loadComponent: () => import('./not-found/not-found').then(m => m.NotFound) },
    ],
  },
];
