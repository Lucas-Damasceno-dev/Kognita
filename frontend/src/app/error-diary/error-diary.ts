import { Component, OnInit, inject, DestroyRef, signal, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, of, tap, EMPTY } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Loading } from '../loading/loading';
import { Confirm } from '../confirm/confirm';
import { ErrorLog } from '../models/error-log';

@Component({
  selector: 'app-error-diary',
  imports: [FormsModule, Loading, CommonModule, Confirm],
  templateUrl: './error-diary.html',
  styleUrl: './error-diary.css',
})
export class ErrorDiary implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  errorLogs = signal<ErrorLog[]>([]);
  searchQuery = signal('');

  filteredLogs = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const logs = this.errorLogs();
    if (!query) return logs;
    return logs.filter(log => 
      log.title.toLowerCase().includes(query) || 
      (log.description && log.description.toLowerCase().includes(query)) ||
      (log.solution && log.solution.toLowerCase().includes(query))
    );
  });

  title = '';
  description = '';
  solution = '';
  showForm = signal(false);
  editingId: string | null = null;
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
    const user = this.auth.user();
    if (!user) return;

    this.loading.set(true);
    this.api
      .getErrorLogs()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (logs) => {
          this.errorLogs.set(logs);
        },
        error: () => {},
      });
  }

  toggleForm(): void {
    this.showForm.update((v) => !v);
    if (!this.showForm()) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.editingId = null;
    this.title = '';
    this.description = '';
    this.solution = '';
    this.saving.set(false);
  }

  edit(log: ErrorLog): void {
    this.editingId = log.id;
    this.title = log.title;
    this.description = log.description || '';
    this.solution = log.solution || '';
    this.showForm.set(true);
  }

  save(): void {
    if (!this.title.trim()) return;
    this.saving.set(true);

    const req = {
      title: this.title,
      description: this.description,
      solution: this.solution,
    };

    const obs = this.editingId
      ? this.api.updateErrorLog(this.editingId, req)
      : this.api.createErrorLog(req, this.auth.user()!.id);

    obs.subscribe({
      next: () => {
        this.toast.success(this.editingId ? 'Erro atualizado' : 'Erro registrado');
        this.toggleForm();
        this.load();
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  confirmDelete(id: string): void {
    this.pendingDeleteId = id;
    this.confirmMessage = 'Excluir este registro de erro?';
    this.showConfirm.set(true);
  }

  handleConfirm(): void {
    if (!this.pendingDeleteId) return;
    this.savingDelete.set(true);
    this.api.deleteErrorLog(this.pendingDeleteId).subscribe({
      next: () => {
        this.toast.success('Erro excluído');
        this.showConfirm.set(false);
        this.pendingDeleteId = null;
        this.savingDelete.set(false);
        this.load();
      },
      error: () => {
        this.showConfirm.set(false);
        this.pendingDeleteId = null;
        this.savingDelete.set(false);
      },
    });
  }

  handleCancel(): void {
    this.showConfirm.set(false);
    this.pendingDeleteId = null;
  }

  hasUnsavedChanges(): boolean {
    return (
      this.showForm() &&
      (this.title.trim() !== '' || this.description.trim() !== '' || this.solution.trim() !== '')
    );
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }

  rechallenge(id: string): void {
    this.api.rechallengeErrorLog(id).subscribe({
      next: () => {
        this.toast.success('Re-desafio criado e agendado no Kanban!');
      },
      error: () => {
        this.toast.error('Erro ao agendar re-desafio.');
      }
    });
  }
}
