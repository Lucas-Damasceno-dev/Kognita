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
  activeNotesSubjectId: string | null = null;
  notesContent = '';
  isEditingNotes = false;
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


  archive(item: Subject): void {
    if (confirm(`Deseja arquivar a matéria "${item.name}"? Ela não aparecerá mais nas listas principais.`)) {
      this.api.archiveSubject(item.id).subscribe({
        next: () => {
          this.toast.success('Matéria arquivada com sucesso.');
          this.load();
        },
        error: () => this.toast.error('Erro ao arquivar matéria.')
      });
    }
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

  toggleNotes(subject: Subject): void {
    if (this.activeNotesSubjectId === subject.id) {
      this.activeNotesSubjectId = null;
      this.notesContent = '';
      this.isEditingNotes = false;
    } else {
      this.activeNotesSubjectId = subject.id;
      this.notesContent = subject.notes || '';
      this.isEditingNotes = false;
    }
  }

  saveNotes(subject: Subject): void {
    this.saving.set(true);
    const req = {
      name: subject.name,
      description: subject.description,
      color: subject.color,
      notes: this.notesContent
    };

    this.api.updateSubject(subject.id, req).subscribe({
      next: (updated) => {
        this.toast.success('Notas atualizadas com sucesso!');
        subject.notes = updated.notes;
        this.isEditingNotes = false;
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Erro ao atualizar notas.');
      }
    });
  }

  renderMarkdown(md: string): string {
    if (!md) {
      return '<p style="color: var(--text-muted, #9ca3af); font-style: italic; font-size: 0.85rem; margin: 0;">Nenhum resumo anotado ainda. Clique em Editar para escrever notas em Markdown para esta matéria!</p>';
    }

    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre style="background: var(--bg-hover, #f3f4f6); padding: 0.75rem; border-radius: 6px; font-family: monospace; font-size: 0.85rem; overflow-x: auto; margin: 0.5rem 0; color: var(--text, #1f2937);"><code>$1</code></pre>');
    // Inline code
    html = html.replace(/`(.*?)`/g, '<code style="background: var(--bg-hover, #f3f4f6); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 0.85rem; color: var(--text, #1f2937);">$1</code>');
    // Headers
    html = html.replace(/^### (.*?)$/gm, '<h3 style="margin-top:1rem; margin-bottom:0.5rem; color: var(--text, #1f2937);">$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 style="margin-top:1.25rem; margin-bottom:0.5rem; color: var(--text, #1f2937);">$2</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1 style="margin-top:1.5rem; margin-bottom:0.5rem; color: var(--text, #1f2937);">$1</h1>');
    // List items
    html = html.replace(/^\* (.*?)$/gm, '<li style="margin-left: 1rem; color: var(--text, #1f2937);">$1</li>');
    html = html.replace(/^- (.*?)$/gm, '<li style="margin-left: 1rem; color: var(--text, #1f2937);">$1</li>');
    // Newlines to <br/>
    html = html.replace(/\n/g, '<br/>');
    
    return html;
  }

  hasUnsavedChanges(): boolean {
    return this.showForm() && (this.name.trim() !== '' || this.description.trim() !== '');
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }
}
