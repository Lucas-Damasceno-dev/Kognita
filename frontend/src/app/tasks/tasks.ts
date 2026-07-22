import { Component, OnInit, inject, DestroyRef, signal, HostListener, ChangeDetectionStrategy, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, finalize, forkJoin, of, timeout, tap, EMPTY } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { ConfettiService } from '../services/confetti.service';
import { Skeleton } from '../skeleton/skeleton';
import { Confirm } from '../confirm/confirm';
import { Checkin } from '../checkin/checkin';
import { EmptyState } from '../empty-state/empty-state';
import { Task } from '../models/task';
import { Subject } from '../models/subject';
import { PageResponse } from '../models/page-response';

@Component({
  selector: 'app-tasks',
  imports: [FormsModule, Skeleton, Confirm, Checkin, EmptyState],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tasks implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private confetti = inject(ConfettiService);

  tasks = signal<Task[]>([]);
  subjects = signal<Subject[]>([]);
  currentPage = signal(0);
  pageSize = signal(100);
  totalPages = signal(0);
  
  title = signal('');
  description = signal('');
  priority = signal<'low' | 'medium' | 'high'>('medium');
  subjectId = signal('');
  skillCategory = signal('');
  dueDate = signal('');
  difficulty = signal<'easy' | 'medium' | 'hard'>('easy');
  
  showForm = signal(false);
  editingId = signal<string | null>(null);
  
  loading = signal(false);
  saving = signal(false);
  
  sortBy = signal<keyof Task | ''>('');
  sortDir = signal<'asc' | 'desc'>('asc');

  setSort(field: keyof Task): void {
    if (this.sortBy() === field) {
      this.sortDir.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortBy.set(field);
      this.sortDir.set('asc');
    }
  }

  sortedTasks = computed(() => {
    const arr = [...this.tasks()];
    const field = this.sortBy();
    if (!field) return arr;
    
    arr.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return this.sortDir() === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return this.sortDir() === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
    return arr;
  });

  activeFilterTags = signal<string[]>([]);

  uniqueTags = computed(() => {
    const set = new Set<string>();
    for (const t of this.tasks()) {
      if (t.skillCategory) {
        const tags = t.skillCategory.split(/[\s,]+/).map(x => x.trim()).filter(Boolean);
        for (const tag of tags) {
          const cleaned = tag.startsWith('#') ? tag : '#' + tag;
          set.add(cleaned);
          if (cleaned.includes('/')) {
            const parts = cleaned.split('/');
            set.add(parts[0]);
          }
        }
      }
    }
    return Array.from(set).sort();
  });

  filteredAndSortedTasks = computed(() => {
    const list = this.sortedTasks();
    const activeFilters = this.activeFilterTags();
    if (activeFilters.length === 0) return list;

    return list.filter(t => {
      if (!t.skillCategory) return false;
      const taskTags = t.skillCategory.split(/[\s,]+/).map(x => {
        const trimmed = x.trim();
        return trimmed.startsWith('#') ? trimmed : '#' + trimmed;
      }).filter(Boolean);

      return activeFilters.some(filter => {
        return taskTags.some(taskTag => {
          return taskTag === filter || taskTag.startsWith(filter + '/');
        });
      });
    });
  });

  toggleFilterTag(tag: string): void {
    this.activeFilterTags.update(curr => {
      if (curr.includes(tag)) {
        return curr.filter(x => x !== tag);
      } else {
        return [...curr, tag];
      }
    });
  }

  pendingTasks = computed(() => this.filteredAndSortedTasks().filter((t) => t.status === 'pending'));
  inProgressTasks = computed(() => this.filteredAndSortedTasks().filter((t) => t.status === 'in_progress'));
  completedTasks = computed(() => this.filteredAndSortedTasks().filter((t) => t.status === 'completed'));


  filterStatus = signal('');
  filterPriority = signal('');
  filterSearch = signal('');
  showConfirm = signal(false);
  confirmMessage = signal('');
  pendingDeleteId = signal<string | null>(null);
  savingDelete = signal(false);
  loadingTaskId = signal<string | null>(null);

  showBatchCompleteConfirm = signal(false);

  showCheckin = signal(false);
  pendingCheckinTask = signal<Task | null>(null);

  // Batch selection
  selectMode = signal(false);
  selectedIds = signal<Set<string>>(new Set());
  batchProcessing = signal(false);

  toggleSelect(id: string): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  toggleSelectAll(status: string): void {
    const columnTasks = this.sortedTasks().filter((t) => t.status === status);
    const allSelected = columnTasks.every((t) => this.selectedIds().has(t.id));
    this.selectedIds.update((set) => {
      const next = new Set(set);
      for (const t of columnTasks) {
        if (allSelected) next.delete(t.id);
        else next.add(t.id);
      }
      return next;
    });
  }

  allSelectedIn(status: string): boolean {
    const column = this.sortedTasks().filter((t) => t.status === status);
    return column.length > 0 && column.every((t) => this.selectedIds().has(t.id));
  }

  exitSelectMode(): void {
    this.selectMode.set(false);
    this.selectedIds.set(new Set());
  }

  confirmBatchComplete(): void {
    this.showBatchCompleteConfirm.set(true);
  }

  batchComplete(): void {
    const ids = [...this.selectedIds()].filter((id) => {
      const t = this.tasks().find((x) => x.id === id);
      return t && t.status !== 'completed';
    });
    if (!ids.length) return;
    this.showBatchCompleteConfirm.set(false);
    this.batchProcessing.set(true);
    forkJoin(
      ids.map((id) => this.api.updateTaskStatus(id, 'completed').pipe(catchError(() => of(null)))),
    )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.batchProcessing.set(false);
          this.selectedIds.set(new Set());
        }),
      )
      .subscribe(() => {
        this.toast.success(`${ids.length} tarefa(s) concluída(s)`);
        this.confetti.fireStreakCelebration();
        this.load();
      });
  }

  batchDeleteConfirm(): void {
    this.confirmMessage.set(`Excluir ${this.selectedIds().size} tarefa(s)? Esta ação não pode ser desfeita.`);
    this.showConfirm.set(true);
  }

  batchDelete(): void {
    if (!this.selectedIds().size) return;
    this.savingDelete.set(true);
    forkJoin(
      [...this.selectedIds()].map((id) => this.api.deleteTask(id).pipe(catchError(() => of(null)))),
    )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.savingDelete.set(false);
          this.showConfirm.set(false);
          this.selectedIds.set(new Set());
          this.selectMode.set(false);
        }),
      )
      .subscribe(() => {
        this.toast.success('Tarefas excluídas');
        this.load();
      });
  }

  // Drag-and-drop
  dragTaskId = signal<string | null>(null);
  dropTargetId = signal<string | null>(null);

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
    forkJoin({
      tasks: this.api
        .getTasksPage(
          user.id,
          this.currentPage(),
          this.pageSize(),
          this.filterStatus() || undefined,
          this.filterPriority() || undefined,
          this.filterSearch() || undefined,
        )
        .pipe(
          timeout(15_000),
          catchError(() => of({ content: [], totalPages: 0 })),
        ),
      subjects: this.api.getSubjects(user.id).pipe(
        timeout(15_000),
        catchError(() => of([])),
      ),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (r) => {
          this.tasks.set(r.tasks.content);
          this.totalPages.set(r.tasks.totalPages);
          this.subjects.set(Array.isArray(r.subjects) ? r.subjects : []);
        },
        error: () => {},
      });
  }

  edit(item: Task): void {
    this.editingId.set(item.id);
    this.title.set(item.title);
    this.description.set(item.description || '');
    this.priority.set(item.priority as 'low' | 'medium' | 'high');
    this.subjectId.set(item.subjectId || '');
    this.skillCategory.set(item.skillCategory || '');
    this.dueDate.set(item.dueDate || '');
    this.difficulty.set(item.difficulty || 'easy');
    this.showForm.set(true);
  }

  toggleForm(): void {
    this.editingId.set(null);
    this.showForm.update((v) => !v);
    if (!this.showForm()) {
      this.resetForm();
    }
  }

  cancel(): void {
    this.resetForm();
  }

  isWeeklySubject(id?: string): boolean {
    if (!id) return false;
    const list = this.subjects();
    if (!list || list.length === 0) return false;
    const sorted = [...list].sort((a, b) => a.id.localeCompare(b.id));
    const now = new Date();
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    const weekOfYear = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
    const weeklySub = sorted[weekOfYear % sorted.length];
    return weeklySub ? weeklySub.id === id : false;
  }

  resetForm(): void {
    this.editingId.set(null);
    this.title.set('');
    this.description.set('');
    this.priority.set('medium');
    this.subjectId.set('');
    this.skillCategory.set('');
    this.dueDate.set('');
    this.difficulty.set('easy');
    this.showForm.set(false);
    this.saving.set(false);
  }

  getTaskTags(category?: string): string[] {
    if (!category) return [];
    return category.split(/[\s,]+/).map(x => {
      const trimmed = x.trim();
      return trimmed.startsWith('#') ? trimmed : '#' + trimmed;
    }).filter(Boolean);
  }

  save(): void {
    if (!this.title().trim()) return;
    this.saving.set(true);

    const req: any = {
      title: this.title(),
      description: this.description() || undefined,
      priority: this.priority(),
      subjectId: this.subjectId() || undefined,
      skillCategory: this.skillCategory() || undefined,
      dueDate: this.dueDate() || undefined,
      difficulty: this.difficulty(),
    };
    const obs = this.editingId()
      ? this.api.updateTask(this.editingId()!, req)
      : this.api.createTask(req, this.auth.user()!.id);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success(this.editingId() ? 'Tarefa atualizada' : 'Tarefa criada');
        this.resetForm();
        this.load();
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  @HostListener('document:keydown.n', ['$event'])
  handleN(event: Event): void {
    const tag = (event.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    event.preventDefault();
    if (!this.showForm()) {
      this.editingId.set(null);
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
    this.api
      .updateTaskStatus(id, status)
      .pipe(finalize(() => this.loadingTaskId.set(null)))
      .subscribe({
        next: () => {
          this.toast.success('Status atualizado');
          if (status === 'completed') {
            this.confetti.fireConfetti();
          }
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
    this.pendingCheckinTask.set(task);
    this.showCheckin.set(true);
  }

  handleCheckin(usedAi: boolean): void {
    if (!this.pendingCheckinTask()) return;
    const task = this.pendingCheckinTask()!;
    const user = this.auth.user();
    if (!user) return;

    this.api
      .createChallengeAttempt({ taskId: task.id, usedAi }, user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success(usedAi ? 'Registrado (com IA)' : 'Desafio concluído sem IA!');
          if (!usedAi) {
            this.confetti.fireStreakCelebration();
          } else {
            this.confetti.fireConfetti();
          }
          this.updateStatus(task.id, 'completed');
          this.showCheckin.set(false);
          this.pendingCheckinTask.set(null);
        },
        error: () => {
          this.showCheckin.set(false);
          this.pendingCheckinTask.set(null);
        },
      });
  }

  handleCheckinCancel(): void {
    this.showCheckin.set(false);
    this.pendingCheckinTask.set(null);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(v => v + 1);
      this.load();
    }
  }

  prevPage() {
    if (this.currentPage() > 0) {
      this.currentPage.update(v => v - 1);
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
  onDragStart(event: DragEvent, task: Task): void {
    this.dragTaskId.set(task.id);
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', task.id);
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent, columnId: string): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
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

    const task = this.tasks().find((t) => t.id === taskId);
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
    this.pendingDeleteId.set(id);
    this.confirmMessage.set(`Delete task "${name}"? This action cannot be undone.`);
    this.showConfirm.set(true);
  }

  handleConfirm(): void {
    if (this.selectedIds().size > 0) {
      this.batchDelete();
    } else if (this.pendingDeleteId()) {
      this.savingDelete.set(true);
      this.api.deleteTask(this.pendingDeleteId()!).subscribe({
        next: () => {
          this.toast.success('Tarefa excluída');
          this.tasks.set(this.tasks().filter((t) => t.id !== this.pendingDeleteId()));
          this.showConfirm.set(false);
          this.pendingDeleteId.set(null);
          this.savingDelete.set(false);
        },
        error: () => {
          this.showConfirm.set(false);
          this.pendingDeleteId.set(null);
          this.savingDelete.set(false);
        },
      });
    }
  }

  handleCancel(): void {
    this.showConfirm.set(false);
    this.pendingDeleteId.set(null);
  }

  moveTask(task: Task, newStatus: string): void {
    this.updateStatus(task.id, newStatus);
  }

  startPomodoro(task: Task): void {
    this.router.navigate(['/pomodoro'], {
      queryParams: { subjectId: task.subjectId },
    });
  }

  hasUnsavedChanges(): boolean {
    return this.showForm() && (this.title().trim() !== '' || this.description().trim() !== '');
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }
}
