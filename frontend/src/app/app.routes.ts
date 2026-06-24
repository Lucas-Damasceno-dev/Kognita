import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { canDeactivateGuard } from './guards/can-deactivate.guard';
import { Layout } from './layout/layout';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Dashboard } from './dashboard/dashboard';
import { Subjects } from './subjects/subjects';
import { Tasks } from './tasks/tasks';
import { Sessions } from './sessions/sessions';
import { Goals } from './goals/goals';
import { Profile } from './profile/profile';
import { Pomodoro } from './pomodoro/pomodoro';
import { History } from './history/history';
import { Practice } from './practice/practice';
import { ErrorDiary } from './error-diary/error-diary';
import { JobAnalyzer } from './job-analyzer/job-analyzer';
import { Importer } from './importer/importer';
import { ChallengeGoals } from './challenge-goals/challenge-goals';
import { Analytics } from './analytics/analytics';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'subjects', component: Subjects, canDeactivate: [canDeactivateGuard] },
      { path: 'tasks', component: Tasks, canDeactivate: [canDeactivateGuard] },
      { path: 'practice', component: Practice },
      { path: 'sessions', component: Sessions, canDeactivate: [canDeactivateGuard] },
      { path: 'goals', component: Goals, canDeactivate: [canDeactivateGuard] },
      { path: 'profile', component: Profile, canDeactivate: [canDeactivateGuard] },
      { path: 'pomodoro', component: Pomodoro },
      { path: 'history', component: History },
      { path: 'challenge-goals', component: ChallengeGoals, canDeactivate: [canDeactivateGuard] },
      { path: 'analytics', component: Analytics },
      { path: 'error-diary', component: ErrorDiary, canDeactivate: [canDeactivateGuard] },
      { path: 'job-analyzer', component: JobAnalyzer },
      { path: 'importer', component: Importer },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    ],
  },
];
