import { Component, OnInit, inject, DestroyRef, signal, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, forkJoin, of, timeout, tap, EMPTY } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Skeleton } from '../skeleton/skeleton';
import { Confirm } from '../confirm/confirm';
import { StudySession } from '../models/study-session';
import { Subject } from '../models/subject';
import { PageResponse } from '../models/page-response';

@Component({
  selector: 'app-sessions',
  imports: [FormsModule, Skeleton, Confirm],
  templateUrl: './sessions.html',
  styleUrl: './sessions.css',
})
export class Sessions implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  sessions: StudySession[] = [];
  subjects: Subject[] = [];
  subjectId = '';
  durationMinutes = 0;
  notes = '';
  date = new Date().toISOString().split('T')[0];
  showForm = signal(false);
  editingId: string | null = null;
  loading = signal(false);
  saving = signal(false);
  showConfirm = signal(false);
  confirmMessage = '';
  pendingDeleteId: string | null = null;

  filterSubjectId = '';
  startDate = '';
  endDate = '';

  sortBy = '';
  sortDir: 'asc' | 'desc' = 'asc';

  page = 0;
  pageSize = 20;
  totalPages = 0;

  setSort(field: string): void {
    if (this.sortBy === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDir = 'asc';
    }
  }

  get sortedSessions(): StudySession[] {
    const arr = [...this.sessions];
    if (!this.sortBy) return arr;
    arr.sort((a, b) => {
      const aVal = a[this.sortBy as keyof StudySession];
      const bVal = b[this.sortBy as keyof StudySession];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string') {
        return this.sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      }
      const aNum = aVal as number;
      const bNum = bVal as number;
      return this.sortDir === 'asc' ? (aNum < bNum ? -1 : 1) : (bNum < aNum ? -1 : 1);
    });
    return arr;
  }

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
    forkJoin({
      subjects: this.api.getSubjects(user.id).pipe(
        timeout(15_000),
        catchError(() => of([] as Subject[])),
      ),
      sessions: this.api.getSessionsPage(user.id, this.page, this.pageSize, this.filterSubjectId || undefined, this.startDate || undefined, this.endDate || undefined).pipe(
        timeout(15_000),
        catchError(() => of({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, last: true, first: true } as PageResponse<StudySession>)),
      ),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (r) => {
        this.subjects = Array.isArray(r.subjects) ? r.subjects : [];
        this.sessions = r.sessions.content || [];
        this.totalPages = r.sessions.totalPages;
      },
      error: () => {},
    });
  }

  nextPage() {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.load();
    }
  }

  prevPage() {
    if (this.page > 0) {
      this.page--;
      this.load();
    }
  }

  edit(item: StudySession): void {
    this.editingId = item.id;
    this.subjectId = item.subjectId;
    this.durationMinutes = item.durationMinutes;
    this.notes = item.notes || '';
    this.date = item.date;
    this.showForm.set(true);
  }

  applyFilter(): void {
    this.page = 0;
    this.load();
  }

  cancel(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.editingId = null;
    this.subjectId = '';
    this.durationMinutes = 0;
    this.notes = '';
    this.date = new Date().toISOString().split('T')[0];
    this.showForm.set(false);
    this.saving.set(false);
  }

  save(): void {
    if (!this.subjectId || !this.durationMinutes) return;
    this.saving.set(true);

    const req = {
      subjectId: this.subjectId,
      durationMinutes: this.durationMinutes,
      notes: this.notes || undefined,
    };
    const obs = this.editingId
      ? this.api.updateSession(this.editingId, req)
      : this.api.createSession(req, this.auth.user()!.id);

    obs.subscribe({
      next: () => {
        this.toast.success(this.editingId ? 'Sessão atualizada' : 'Sessão criada');
        this.resetForm();
        this.load();
      },
      error: () => { this.saving.set(false); },
    });
  }

  confirmDelete(id: string, name: string): void {
    this.pendingDeleteId = id;
    this.confirmMessage = `Delete session "${name}"? This action cannot be undone.`;
    this.showConfirm.set(true);
  }

  savingDelete = signal(false);

  handleConfirm(): void {
    if (this.pendingDeleteId) {
      this.savingDelete.set(true);
      this.api.deleteSession(this.pendingDeleteId).subscribe({
        next: () => {
          this.toast.success('Sessão excluída');
          this.sessions = this.sessions.filter(s => s.id !== this.pendingDeleteId);
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
    return this.showForm() && (this.subjectId !== '' || this.durationMinutes > 0 || this.notes.trim() !== '');
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }
}
