import { Component, OnInit, inject, DestroyRef, signal, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, of, timeout, tap, EMPTY } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Loading } from '../loading/loading';
import { Confirm } from '../confirm/confirm';
import { EmptyState } from '../empty-state/empty-state';
import { StudyGoal } from '../models/study-goal';
import { PageResponse } from '../models/page-response';

@Component({
  selector: 'app-goals',
  imports: [FormsModule, Loading, Confirm, EmptyState],
  templateUrl: './goals.html',
  styleUrl: './goals.css',
})
export class Goals implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  goals: StudyGoal[] = [];
  sortBy = '';
  sortDir: 'asc' | 'desc' = 'asc';

  setSort(field: string): void {
    if (this.sortBy === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDir = 'asc';
    }
  }

  get sortedGoals(): StudyGoal[] {
    const arr = [...this.goals];
    if (!this.sortBy) return arr;
    arr.sort((a, b) => {
      const aVal = a[this.sortBy as keyof StudyGoal];
      const bVal = b[this.sortBy as keyof StudyGoal];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string') {
        return this.sortDir === 'asc'
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }
      const aNum = aVal as number;
      const bNum = bVal as number;
      return this.sortDir === 'asc' ? (aNum < bNum ? -1 : 1) : bNum < aNum ? -1 : 1;
    });
    return arr;
  }

  title = '';
  description = '';
  targetHours: number = 100;
  deadline = '';
  showForm = signal(false);
  editingId: string | null = null;
  loading = signal(false);
  saving = signal(false);
  showConfirm = signal(false);
  confirmMessage = '';
  pendingDeleteId: string | null = null;
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;

  ngOnInit(): void {
    this.auth
      .waitForUser()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        timeout(20_000),
        catchError(() => {
          this.loading.set(false);
          return EMPTY;
        }),
        tap((user) => {
          if (!user) {
            this.loading.set(false);
            return;
          }
          this.load();
        }),
      )
      .subscribe();
  }

  private load(): void {
    const user = this.auth.user();
    if (!user) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.api
      .getGoalsPage(user.id, this.currentPage, this.pageSize)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        timeout(15_000),
        catchError(() => of({ content: [], totalPages: 0 } as any)),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (r) => {
          this.goals = Array.isArray(r.content) ? r.content : [];
          this.totalPages = r.totalPages;
        },
      });
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.load();
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.load();
    }
  }

  edit(item: StudyGoal): void {
    this.editingId = item.id;
    this.title = item.title;
    this.description = item.description || '';
    this.targetHours = item.targetHours;
    this.deadline = item.deadline || '';
    this.showForm.set(true);
  }

  cancel(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.editingId = null;
    this.title = '';
    this.description = '';
    this.targetHours = 100;
    this.deadline = '';
    this.showForm.set(false);
    this.saving.set(false);
  }

  save(): void {
    if (!this.title.trim() || !this.targetHours) return;
    this.saving.set(true);

    const req = {
      title: this.title,
      description: this.description || undefined,
      targetHours: this.targetHours,
      deadline: this.deadline || undefined,
    };
    const obs = this.editingId
      ? this.api.updateGoal(this.editingId, req)
      : this.api.createGoal(req, this.auth.user()!.id);

    obs.subscribe({
      next: () => {
        this.toast.success(this.editingId ? 'Meta atualizada' : 'Meta criada');
        this.resetForm();
        this.currentPage = 0;
        this.load();
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  addHour(id: string): void {
    this.api.updateGoalProgress(id, 1).subscribe({
      next: () => {
        this.toast.success('Progresso atualizado');
        this.load();
      },
    });
  }

  confirmDelete(id: string, name: string): void {
    this.pendingDeleteId = id;
    this.confirmMessage = `Delete goal "${name}"? This action cannot be undone.`;
    this.showConfirm.set(true);
  }

  savingDelete = signal(false);

  handleConfirm(): void {
    if (this.pendingDeleteId) {
      this.savingDelete.set(true);
      this.api.deleteGoal(this.pendingDeleteId).subscribe({
        next: () => {
          this.toast.success('Meta excluída');
          this.goals = this.goals.filter((g) => g.id !== this.pendingDeleteId);
          this.showConfirm.set(false);
          this.pendingDeleteId = null;
          this.savingDelete.set(false);
        },
        error: () => {
          this.showConfirm.set(false);
          this.pendingDeleteId = null;
          this.savingDelete.set(false);
        },
      });
    }
  }

  handleCancel(): void {
    this.showConfirm.set(false);
    this.pendingDeleteId = null;
  }

  progressPercent(g: StudyGoal): number {
    return g.targetHours > 0
      ? Math.min(100, Math.round((g.currentHours / g.targetHours) * 100))
      : 0;
  }

  hasUnsavedChanges(): boolean {
    return this.showForm() && (this.title.trim() !== '' || this.description.trim() !== '');
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }
}
