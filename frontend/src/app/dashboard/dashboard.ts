import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of, timeout, tap, EMPTY } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';
import { Loading } from '../loading/loading';
import { Subject } from '../models/subject';
import { Task } from '../models/task';
import { StudyGoal } from '../models/study-goal';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, Loading],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  subjects: Subject[] = [];
  pendingTasks: Task[] = [];
  goals: StudyGoal[] = [];
  loading = signal(true);

  ngOnInit(): void {
    this.auth.waitForUser().pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout(20_000),
      catchError(() => {
        this.loading.set(false);
        return EMPTY;
      }),
      tap(user => {
        if (!user) {
          this.loading.set(false);
          return;
        }
        this.loadDashboard(user);
      }),
    ).subscribe();
  }

  private loadDashboard(user: { id: string }): void {
    forkJoin({
      subjects: this.api.getSubjects(user.id).pipe(
        timeout(15_000),
        catchError(() => of([] as Subject[])),
      ),
      tasks: this.api.getTasks(user.id).pipe(
        timeout(15_000),
        catchError(() => of([] as Task[])),
      ),
      goals: this.api.getGoals(user.id).pipe(
        timeout(15_000),
        catchError(() => of([] as StudyGoal[])),
      ),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (r) => {
        this.subjects = Array.isArray(r.subjects) ? r.subjects : [];
        const tasks = Array.isArray(r.tasks) ? r.tasks : [];
        this.pendingTasks = tasks.filter((x) => x && x.status !== 'completed');
        this.goals = Array.isArray(r.goals) ? r.goals : [];
      },
      error: () => {
        this.toast.error('Failed to load dashboard');
      },
    });
  }
}
