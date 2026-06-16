import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, forkJoin, of, timeout, tap, EMPTY } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Loading } from '../loading/loading';
import { Task } from '../models/task';
import { Subject } from '../models/subject';

@Component({
  selector: 'app-tasks',
  imports: [FormsModule, Loading],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
})
export class Tasks implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  tasks: Task[] = [];
  subjects: Subject[] = [];
  title = '';
  description = '';
  priority = 'medium';
  subjectId = '';
  dueDate = '';
  showForm = false;
  editingId: string | null = null;
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
    forkJoin({
      tasks: this.api.getTasks(user.id).pipe(
        timeout(15_000),
        catchError(() => of([] as Task[])),
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
        this.tasks = Array.isArray(r.tasks) ? r.tasks : [];
        this.subjects = Array.isArray(r.subjects) ? r.subjects : [];
      },
      error: () => { 
        this.toast.error('Failed to load data'); 
      },
    });
  }

  edit(item: Task): void {
    this.editingId = item.id;
    this.title = item.title;
    this.description = item.description || '';
    this.priority = item.priority;
    this.subjectId = item.subjectId || '';
    this.dueDate = item.dueDate || '';
    this.showForm = true;
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
    this.dueDate = '';
    this.showForm = false;
    this.saving = false;
  }

  save(): void {
    if (!this.title.trim()) return;
    this.saving = true;

    const req = {
      title: this.title,
      description: this.description || undefined,
      priority: this.priority,
      subjectId: this.subjectId || undefined,
      dueDate: this.dueDate || undefined,
    };
    const obs = this.editingId
      ? this.api.updateTask(this.editingId, req)
      : this.api.createTask(req, this.auth.user()!.id);

    obs.subscribe({
      next: () => {
        this.toast.success(this.editingId ? 'Task updated' : 'Task created');
        this.resetForm();
        this.load();
      },
      error: () => {
        this.toast.error(this.editingId ? 'Failed to update task' : 'Failed to create task');
        this.saving = false;
      },
    });
  }

  updateStatus(id: string, status: string): void {
    this.api.updateTaskStatus(id, status).subscribe({
      next: () => {
        this.toast.success('Status updated');
        this.load();
      },
      error: () => this.toast.error('Failed to update status'),
    });
  }

  toggleStatus(task: any): void {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    this.updateStatus(task.id, newStatus);
  }

  remove(id: string): void {
    this.api.deleteTask(id).subscribe({
      next: () => {
        this.toast.success('Task deleted');
        this.tasks = this.tasks.filter(t => t.id !== id);
      },
      error: () => this.toast.error('Failed to delete task'),
    });
  }
}
