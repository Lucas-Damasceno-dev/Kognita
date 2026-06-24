import { Component, OnInit, inject, DestroyRef, signal, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, finalize, forkJoin, of, timeout, tap, EMPTY } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Skeleton } from '../skeleton/skeleton';
import { Confirm } from '../confirm/confirm';
import { Checkin } from '../checkin/checkin';
import { Task } from '../models/task';
import { Subject } from '../models/subject';
import { PageResponse } from '../models/page-response';

@Component({
  selector: 'app-tasks',
  imports: [FormsModule, Skeleton, Confirm, Checkin],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
})
export class Tasks implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  tasks: Task[] = [];
  subjects: Subject[] = [];
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  title = '';
  description = '';
  priority = 'medium';
  subjectId = '';
  skillCategory = '';
  dueDate = '';
  showForm = signal(false);
  editingId: string | null = null;
  loading = signal(false);
  saving = signal(false);
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

  get sortedTasks(): Task[] {
    const arr = [...this.tasks];
    if (!this.sortBy) return arr;
    arr.sort((a, b) => {
      const aVal = (a as any)[this.sortBy];
      const bVal = (b as any)[this.sortBy];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string') {
        return this.sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return this.sortDir === 'asc' ? (aVal < bVal ? -1 : 1) : (bVal < aVal ? -1 : 1);
    });
    return arr;
  }

  get pendingTasks(): Task[] {
    return this.sortedTasks.filter(t => t.status === 'pending');
  }

  get inProgressTasks(): Task[] {
    return this.sortedTasks.filter(t => t.status === 'in_progress');
  }

  get completedTasks(): Task[] {
    return this.sortedTasks.filter(t => t.status === 'completed');
  }

  filterStatus = '';
  filterPriority = '';
  filterSearch = '';
  showConfirm = signal(false);
  confirmMessage = '';
  pendingDeleteId: string | null = null;
  savingDelete = signal(false);
  loadingTaskId = signal<string | null>(null);

  showCheckin = signal(false);
  pendingCheckinTask: Task | null = null;

  // Batch selection
  selectMode = signal(false);
  selectedIds = signal<Set<string>>(new Set());
  batchProcessing = signal(false);

  toggleSelect(id: string): void {
    this.selectedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  toggleSelectAll(status: string): void {
    const columnTasks = this.sortedTasks.filter(t => t.status === status);
    const allSelected = columnTasks.every(t => this.selectedIds().has(t.id));
    this.selectedIds.update(set => {
      const next = new Set(set);
      for (const t of columnTasks) {
        if (allSelected) next.delete(t.id); else next.add(t.id);
      }
      return next;
    });
  }

  allSelectedIn(status: string): boolean {
    const column = this.sortedTasks.filter(t => t.status === status);
    return column.length > 0 && column.every(t => this.selectedIds().has(t.id));
  }

  exitSelectMode(): void {
    this.selectMode.set(false);
    this.selectedIds.set(new Set());
  }

  batchComplete(): void {
    const ids = [...this.selectedIds()].filter(id => {
      const t = this.tasks.find(x => x.id === id);
      return t && t.status !== 'completed';
    });
    if (!ids.length) return;
    this.batchProcessing.set(true);
    forkJoin(ids.map(id => this.api.updateTaskStatus(id, 'completed').pipe(
      catchError(() => of(null)),
    ))).pipe(finalize(() => {
      this.batchProcessing.set(false);
      this.selectedIds.set(new Set());
    })).subscribe(() => {
      this.toast.success(`${ids.length} tarefa(s) concluída(s)`);
      this.load();
    });
  }

  batchDeleteConfirm(): void {
    this.confirmMessage = `Excluir ${this.selectedIds().size} tarefa(s)? Esta ação não pode ser desfeita.`;
    this.showConfirm.set(true);
  }

  batchDelete(): void {
    if (!this.selectedIds().size) return;
    this.savingDelete.set(true);
    forkJoin([...this.selectedIds()].map(id => this.api.deleteTask(id).pipe(
      catchError(() => of(null)),
    ))).pipe(finalize(() => {
      this.savingDelete.set(false);
      this.showConfirm.set(false);
      this.selectedIds.set(new Set());
      this.selectMode.set(false);
    })).subscribe(() => {
      this.toast.success('Tarefas excluídas');
      this.load();
    });
  }

  // Drag-and-drop
  dragTaskId = signal<string | null>(null);
  dropTargetId = signal<string | null>(null);

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
      tasks: this.api.getTasksPage(user.id, this.currentPage, this.pageSize, this.filterStatus || undefined, this.filterPriority || undefined, this.filterSearch || undefined).pipe(
        timeout(15_000),
        catchError(() => of({ content: [], totalPages: 0 } as any as PageResponse<Task>)),
      ),
      subjects: this.api.getSubjects(user.id).pipe(
        timeout(15_000),
        catchError(() => of([] as Subject[])),
      ),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (r) => {
        this.tasks = r.tasks.content;
        this.totalPages = r.tasks.totalPages;
        this.subjects = Array.isArray(r.subjects) ? r.subjects : [];
      },
      error: () => {},
    });
  }

  edit(item: Task): void {
    this.editingId = item.id;
    this.title = item.title;
    this.description = item.description || '';
    this.priority = item.priority;
    this.subjectId = item.subjectId || '';
    this.skillCategory = item.skillCategory || '';
    this.dueDate = item.dueDate || '';
    this.showForm.set(true);
  }

  cancel(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.editingId = null;
    this.title = '';
    this.description = '';
    this.priority = 'medium';
    this.subjectId = '';
    this.skillCategory = '';
    this.dueDate = '';
    this.showForm.set(false);
    this.saving.set(false);
  }

  save(): void {
    if (!this.title.trim()) return;
    this.saving.set(true);

    const req = {
      title: this.title,
      description: this.description || undefined,
      priority: this.priority,
      subjectId: this.subjectId || undefined,
      skillCategory: this.skillCategory || undefined,
      dueDate: this.dueDate || undefined,
    };
    const obs = this.editingId
      ? this.api.updateTask(this.editingId, req)
      : this.api.createTask(req, this.auth.user()!.id);

    obs.subscribe({
      next: () => {
        this.toast.success(this.editingId ? 'Tarefa atualizada' : 'Tarefa criada');
        this.resetForm();
        this.load();
      },
      error: () => { this.saving.set(false); },
    });
  }

  @HostListener('document:keydown.n', ['$event'])
  handleN(event: Event): void {
    const tag = (event.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    event.preventDefault();
    if (!this.showForm()) {
      this.editingId = null;
      this.showForm.set(true);
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(event: Event): void {
    if (this.showForm()) {
      this.cancel();
    }
    if (this.showConfirm()) {
      this.handleCancel();
    }
  }

  updateStatus(id: string, status: string): void {
    this.loadingTaskId.set(id);
    this.api.updateTaskStatus(id, status).pipe(finalize(() => this.loadingTaskId.set(null))).subscribe({
      next: () => {
        this.toast.success('Status atualizado');
        this.load();
      },
      error: () => {},
    });
  }

  completeTask(task: Task): void {
    if (task.status === 'completed') {
      this.updateStatus(task.id, 'pending');
      return;
    }
    this.pendingCheckinTask = task;
    this.showCheckin.set(true);
  }

  handleCheckin(usedAi: boolean): void {
    if (!this.pendingCheckinTask) return;
    const task = this.pendingCheckinTask;
    const user = this.auth.user();
    if (!user) return;

    this.api.createChallengeAttempt({ taskId: task.id, usedAi }, user.id).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.toast.success(usedAi ? 'Registrado (com IA)' : 'Desafio concluído sem IA!');
        this.updateStatus(task.id, 'completed');
        this.showCheckin.set(false);
        this.pendingCheckinTask = null;
      },
      error: () => {
        this.showCheckin.set(false);
        this.pendingCheckinTask = null;
      },
    });
  }

  handleCheckinCancel(): void {
    this.showCheckin.set(false);
    this.pendingCheckinTask = null;
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.load();
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.load();
    }
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(task.dueDate) < today;
  }

  // Drag-and-drop handlers
  onDragStart(task: Task): void {
    this.dragTaskId.set(task.id);
  }

  onDragOver(event: DragEvent, columnId: string): void {
    event.preventDefault();
    this.dropTargetId.set(columnId);
  }

  onDragLeave(columnId: string): void {
    if (this.dropTargetId() === columnId) {
      this.dropTargetId.set(null);
    }
  }

  onDrop(event: DragEvent, columnId: string): void {
    event.preventDefault();
    const taskId = this.dragTaskId();
    this.dropTargetId.set(null);
    this.dragTaskId.set(null);

    if (!taskId) return;

    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    const targetStatus = columnId;
    if (targetStatus === task.status) return;

    if (targetStatus === 'completed') {
      this.completeTask(task);
    } else {
      this.moveTask(task, targetStatus);
    }
  }

  onDragEnd(): void {
    this.dragTaskId.set(null);
    this.dropTargetId.set(null);
  }

  applyFilter(): void {
    this.load();
  }

  confirmDelete(id: string, name: string): void {
    this.pendingDeleteId = id;
    this.confirmMessage = `Delete task "${name}"? This action cannot be undone.`;
    this.showConfirm.set(true);
  }

  handleConfirm(): void {
    if (this.selectedIds().size > 0) {
      this.batchDelete();
    } else if (this.pendingDeleteId) {
      this.savingDelete.set(true);
      this.api.deleteTask(this.pendingDeleteId).subscribe({
        next: () => {
          this.toast.success('Tarefa excluída');
          this.tasks = this.tasks.filter(t => t.id !== this.pendingDeleteId);
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

  moveTask(task: Task, newStatus: string): void {
    this.updateStatus(task.id, newStatus);
  }

  startPomodoro(task: Task): void {
    this.router.navigate(['/pomodoro'], { 
      queryParams: { subjectId: task.subjectId } 
    });
  }

  hasUnsavedChanges(): boolean {
    return this.showForm() && (this.title.trim() !== '' || this.description.trim() !== '');
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }
}
