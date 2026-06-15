import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { Layout } from './layout/layout';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Dashboard } from './dashboard/dashboard';
import { Subjects } from './subjects/subjects';
import { Tasks } from './tasks/tasks';
import { Sessions } from './sessions/sessions';
import { Goals } from './goals/goals';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'subjects', component: Subjects },
      { path: 'tasks', component: Tasks },
      { path: 'sessions', component: Sessions },
      { path: 'goals', component: Goals },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    ],
  },
];
