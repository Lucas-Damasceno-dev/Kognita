import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, of, timeout, tap, EMPTY } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Loading } from '../loading/loading';
import { StudyGoal } from '../models/study-goal';

@Component({
  selector: 'app-goals',
  imports: [FormsModule, Loading],
  templateUrl: './goals.html',
  styleUrl: './goals.css',
})
export class Goals implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  goals: StudyGoal[] = [];
  title = '';
  description = '';
  targetHours: number = 100;
  deadline = '';
  showForm = false;
  loading = signal(false);
  saving = false;

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
        this.load();
      }),
    ).subscribe();
  }

  private load(): void {
    const user = this.auth.user();
    if (!user) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.api.getGoals(user.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout(15_000),
      catchError(() => { this.toast.error('Failed to load goals'); return of([] as StudyGoal[]); }),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: g => { 
        this.goals = Array.isArray(g) ? g : []; 
      },
    });
  }

  create(): void {
    if (!this.title.trim() || !this.targetHours) return;
    this.saving = true;
    this.api.createGoal({
      title: this.title,
      description: this.description || undefined,
      targetHours: this.targetHours,
      deadline: this.deadline || undefined,
    }, this.auth.user()!.id).subscribe({
      next: () => {
        this.toast.success('Goal created');
        this.title = '';
        this.description = '';
        this.targetHours = 100;
        this.deadline = '';
        this.showForm = false;
        this.saving = false;
        this.load();
      },
      error: () => {
        this.toast.error('Failed to create goal');
        this.saving = false;
      },
    });
  }

  addHour(id: string): void {
    this.api.updateGoalProgress(id, 1).subscribe({
      next: () => {
        this.toast.success('Progress updated');
        this.load();
      },
      error: () => this.toast.error('Failed to update progress'),
    });
  }

  remove(id: string): void {
    this.api.deleteGoal(id).subscribe({
      next: () => {
        this.toast.success('Goal deleted');
        this.goals = this.goals.filter(g => g.id !== id);
      },
      error: () => this.toast.error('Failed to delete goal'),
    });
  }

  progressPercent(g: StudyGoal): number {
    return g.targetHours > 0 ? Math.min(100, Math.round((g.currentHours / g.targetHours) * 100)) : 0;
  }
}
