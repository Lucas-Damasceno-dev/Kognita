import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, of, timeout, tap, EMPTY } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Skeleton } from '../skeleton/skeleton';
import { Task } from '../models/task';
import { Subject } from '../models/subject';

@Component({
  selector: 'app-practice',
  imports: [FormsModule, RouterLink, Skeleton],
  templateUrl: './practice.html',
  styleUrl: './practice.css',
})
export class Practice implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  subjects: Subject[] = [];
  allTasks: Task[] = [];
  tasks: Task[] = [];
  currentIndex = 0;
  timeLeft = 30 * 60;
  private timer: any;
  started = signal(false);
  finished = signal(false);
  paused = signal(false);

  loading = signal(false);
  selectedSubjectId = '';

  get currentTask(): Task | null {
    return this.tasks[this.currentIndex] ?? null;
  }

  get totalTasks(): number {
    return this.tasks.length;
  }

  ngOnInit(): void {
    this.auth
      .waitForUser()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        timeout(20_000),
        catchError(() => EMPTY),
        tap((user) => {
          if (user) this.load();
        }),
      )
      .subscribe();
  }

  private load(): void {
    const user = this.auth.user();
    if (!user) return;
    this.loading.set(true);
    this.api
      .getSubjects(user.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        timeout(15_000),
        catchError(() => of([])),
      )
      .subscribe((subjects) => {
        this.subjects = Array.isArray(subjects) ? subjects : [];
        this.loadTasks();
      });
  }

  loadTasks(): void {
    const user = this.auth.user();
    if (!user) return;
    this.api
      .getPracticeTasks()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        timeout(15_000),
        catchError(() => of([])),
      )
      .subscribe({
        next: (tasks) => {
          this.allTasks = tasks;
          this.filterTasks();
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  filterTasks(): void {
    if (this.selectedSubjectId) {
      this.tasks = this.allTasks.filter((t) => t.subjectId === this.selectedSubjectId);
    } else {
      this.tasks = [...this.allTasks];
    }
    this.currentIndex = 0;
  }

  onSubjectChange(): void {
    this.filterTasks();
  }

  get formattedTime(): string {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  get progress(): number {
    const total = 30 * 60;
    return total > 0 ? ((total - this.timeLeft) / total) * 100 : 0;
  }

  start(): void {
    if (this.tasks.length === 0) {
      this.toast.error('Nenhuma tarefa disponível para praticar');
      return;
    }
    this.started.set(true);
    this.paused.set(false);
    this.resumeTimer();
  }

  private resumeTimer(): void {
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.finish();
      }
    }, 1000);
  }

  pause(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.paused.set(true);
  }

  resume(): void {
    this.paused.set(false);
    this.resumeTimer();
  }

  previous(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  next(): void {
    if (this.currentIndex < this.tasks.length - 1) {
      this.currentIndex++;
    } else {
      this.finish();
    }
  }

  finish(): void {
    clearInterval(this.timer);
    this.timer = null;
    this.started.set(false);
    this.finished.set(true);
    this.toast.success('Simulação concluída!');

    const user = this.auth.user();
    if (user) {
      this.tasks.forEach((task) => {
        this.api
          .createChallengeAttempt({ taskId: task.id, usedAi: false }, user.id)
          .pipe(catchError(() => of(null)))
          .subscribe();
      });
    }
  }

  reset(): void {
    this.started.set(false);
    this.finished.set(false);
    this.currentIndex = 0;
    this.timeLeft = 30 * 60;
    this.filterTasks();
  }
}
