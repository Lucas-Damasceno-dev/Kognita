import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, DestroyRef, signal, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, of, tap, EMPTY } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Loading } from '../loading/loading';
import { Confirm } from '../confirm/confirm';
import { EmptyState } from '../empty-state/empty-state';
import { ChallengeGoal } from '../models/challenge-goal';

@Component({
  selector: 'app-challenge-goals',
  imports: [FormsModule, Loading, CommonModule, Confirm, EmptyState],
  templateUrl: './challenge-goals.html',
  styleUrl: './challenge-goals.css',
})
export class ChallengeGoals implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  goals: ChallengeGoal[] = [];
  targetCount = 5;
  deadlineDate = '';
  showForm = signal(false);
  loading = signal(false);
  saving = signal(false);
  showConfirm = signal(false);
  confirmMessage = '';
  pendingDeleteId: string | null = null;
  savingDelete = signal(false);

  ngOnInit(): void {
    this.auth
      .waitForUser()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((user) => {
          if (!user) return;
          this.load();
        }),
      )
      .subscribe();
  }

  private load(): void {
    this.loading.set(true);
    this.api
      .getChallengeGoals()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (goals) => {
          this.goals = Array.isArray(goals) ? goals : [];
        },
        error: () => {},
      });
  }

  toggleForm(): void {
    this.showForm.update((v) => !v);
    if (!this.showForm()) this.resetForm();
  }

  resetForm(): void {
    this.targetCount = 5;
    this.deadlineDate = '';
    this.saving.set(false);
  }

  save(): void {
    if (!this.targetCount || !this.deadlineDate) return;
    this.saving.set(true);

    this.api
      .createChallengeGoal({
        targetCount: this.targetCount,
        deadlineDate: this.deadlineDate,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Meta de desafio criada');
          this.toggleForm();
          this.load();
        },
        error: () => {
          this.saving.set(false);
        },
      });
  }

  confirmDelete(id: string, target: number): void {
    this.pendingDeleteId = id;
    this.confirmMessage = `Excluir meta de ${target} desafios?`;
    this.showConfirm.set(true);
  }

  handleConfirm(): void {
    if (!this.pendingDeleteId) return;
    this.savingDelete.set(true);
    this.api
      .deleteChallengeGoal(this.pendingDeleteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Meta excluída');
          this.showConfirm.set(false);
          this.pendingDeleteId = null;
          this.savingDelete.set(false);
          this.load();
        },
        error: () => {
          this.showConfirm.set(false);
          this.savingDelete.set(false);
        },
      });
  }

  handleCancel(): void {
    this.showConfirm.set(false);
    this.pendingDeleteId = null;
  }

  progressPercent(goal: ChallengeGoal): number {
    if (goal.targetCount <= 0) return 0;
    return Math.min(100, Math.round((goal.currentCount / goal.targetCount) * 100));
  }

  daysRemaining(deadline: string): number {
    const now = new Date();
    const end = new Date(deadline);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  hasUnsavedChanges(): boolean {
    return this.showForm() && (this.targetCount !== 5 || this.deadlineDate !== '');
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }
}
