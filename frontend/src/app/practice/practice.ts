import { Component, OnInit, inject, DestroyRef, signal, HostListener } from '@angular/core';
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
  zenMode = signal(false);

  loading = signal(false);
  selectedSubjectId = '';

  get currentTask(): Task | null {
    return this.tasks[this.currentIndex] ?? null;
  }

  get totalTasks(): number {
    return this.tasks.length;
  }

  get selectedSubjectName(): string {
    const sub = this.subjects.find((s) => s.id === this.selectedSubjectId);
    return sub ? sub.name : 'Todas as matérias';
  }

  private triggerHaptic(type: 'start' | 'pause' | 'reset' | 'complete'): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (type === 'start') {
          navigator.vibrate(40);
        } else if (type === 'pause') {
          navigator.vibrate([30, 50, 30]);
        } else if (type === 'reset') {
          navigator.vibrate([50, 30, 50]);
        } else if (type === 'complete') {
          navigator.vibrate([100, 50, 100, 50, 200]);
        }
      } catch {
        // Haptics not supported or blocked
      }
    }
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
    this.triggerHaptic('start');
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
    this.triggerHaptic('pause');
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.paused.set(true);
  }

  resume(): void {
    this.triggerHaptic('start');
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
    this.triggerHaptic('complete');
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
    this.triggerHaptic('reset');
    this.started.set(false);
    this.finished.set(false);
    this.currentIndex = 0;
    this.timeLeft = 30 * 60;
    this.filterTasks();
  }

  toggleZenMode(): void {
    const nextState = !this.zenMode();
    this.zenMode.set(nextState);
    if (nextState) {
      this.triggerHaptic('start');
      if (typeof document !== 'undefined' && document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      this.triggerHaptic('pause');
      if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  @HostListener('document:keydown.space', ['$event'])
  handleSpace(event: Event): void {
    if (!this.started() || this.finished()) return;
    const tag = (event.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    event.preventDefault();
    if (this.paused()) {
      this.resume();
    } else {
      this.pause();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(event: Event): void {
    if (this.zenMode()) {
      event.preventDefault();
      this.toggleZenMode();
    }
  }

  @HostListener('document:keydown.arrowleft', ['$event'])
  handleArrowLeft(event: Event): void {
    if (!this.started() || this.finished() || !this.zenMode()) return;
    const tag = (event.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    event.preventDefault();
    this.previous();
  }

  @HostListener('document:keydown.arrowright', ['$event'])
  handleArrowRight(event: Event): void {
    if (!this.started() || this.finished() || !this.zenMode()) return;
    const tag = (event.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    event.preventDefault();
    this.next();
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    if (typeof document !== 'undefined' && !document.fullscreenElement && this.zenMode()) {
      this.zenMode.set(false);
    }
  }
}
