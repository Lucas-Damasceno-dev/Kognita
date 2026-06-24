import { Component, OnInit, inject, DestroyRef, signal, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, of, timeout, tap, EMPTY } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Skeleton } from '../skeleton/skeleton';
import { Confirm } from '../confirm/confirm';
import { EmptyState } from '../empty-state/empty-state';
import { Subject } from '../models/subject';
import { PageResponse } from '../models/page-response';

@Component({
  selector: 'app-subjects',
  imports: [FormsModule, Skeleton, Confirm, EmptyState],
  templateUrl: './subjects.html',
  styleUrl: './subjects.css',
})
export class Subjects implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  subjects: Subject[] = [];
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

  get sortedSubjects(): Subject[] {
    const arr = [...this.subjects];
    if (!this.sortBy) return arr;
    arr.sort((a, b) => {
      const aVal = a[this.sortBy as keyof Subject];
      const bVal = b[this.sortBy as keyof Subject];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string') {
        return this.sortDir === 'asc'
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }
      const aNum = aVal as any as number;
      const bNum = bVal as any as number;
      return this.sortDir === 'asc' ? (aNum < bNum ? -1 : 1) : bNum < aNum ? -1 : 1;
    });
    return arr;
  }

  name = '';
  description = '';
  color = '#3B82F6';
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
      .getSubjectsPage(user.id, this.currentPage, this.pageSize)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        timeout(15_000),
        catchError(() => of({ content: [], totalPages: 0 } as any)),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (r) => {
          this.subjects = Array.isArray(r.content) ? r.content : [];
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

  edit(item: Subject): void {
    this.editingId = item.id;
    this.name = item.name;
    this.description = item.description || '';
    this.color = item.color;
    this.showForm.set(true);
  }

  cancel(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.editingId = null;
    this.name = '';
    this.description = '';
    this.color = '#3B82F6';
    this.showForm.set(false);
    this.saving.set(false);
  }

  save(): void {
    if (!this.name.trim()) return;
    this.saving.set(true);

    const req = { name: this.name, description: this.description, color: this.color };
    const obs = this.editingId
      ? this.api.updateSubject(this.editingId, req)
      : this.api.createSubject(req);

    obs.subscribe({
      next: () => {
        this.toast.success(this.editingId ? 'Matéria atualizada' : 'Matéria criada');
        this.resetForm();
        this.currentPage = 0;
        this.load();
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  confirmDelete(id: string, name: string): void {
    this.pendingDeleteId = id;
    this.confirmMessage = `Delete subject "${name}"? This action cannot be undone.`;
    this.showConfirm.set(true);
  }

  savingDelete = signal(false);

  handleConfirm(): void {
    if (this.pendingDeleteId) {
      this.savingDelete.set(true);
      this.api.deleteSubject(this.pendingDeleteId).subscribe({
        next: () => {
          this.toast.success('Matéria excluída');
          this.load();
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

  hasUnsavedChanges(): boolean {
    return this.showForm() && (this.name.trim() !== '' || this.description.trim() !== '');
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }
}
