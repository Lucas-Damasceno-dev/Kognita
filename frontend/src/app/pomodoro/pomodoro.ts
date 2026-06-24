import { Component, OnInit, inject, signal, DestroyRef, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { catchError, of, timeout } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Subject } from '../models/subject';
import { Task } from '../models/task';

@Component({
  selector: 'app-pomodoro',
  imports: [FormsModule],
  templateUrl: './pomodoro.html',
  styleUrl: './pomodoro.css',
})
export class Pomodoro implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);

  subjects: Subject[] = [];
  tasks: Task[] = [];
  selectedSubjectId = '';
  selectedTaskId = '';

  workDuration = 25;
  breakDuration = 5;
  timeLeft = 0;
  isRunning = signal(false);
  isBreak = signal(false);
  sessionCount = 0;
  private intervalId: any = null;

  saving = signal(false);

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['subjectId']) {
        this.selectedSubjectId = params['subjectId'];
      }
    });

    this.auth.waitForUser().pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => of(null)),
    ).subscribe(user => {
      if (user) {
        this.loadSubjects();
      }
    });
  }

  private loadSubjects(): void {
    const user = this.auth.user();
    if (!user) return;
    this.api.getSubjects(user.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout(15_000),
      catchError(() => of([])),
    ).subscribe(s => {
      this.subjects = Array.isArray(s) ? s : [];
      if (this.selectedSubjectId) {
        this.onSubjectChange();
      }
    });
  }

  onSubjectChange(): void {
    this.selectedTaskId = '';
    if (!this.selectedSubjectId) {
      this.tasks = [];
      return;
    }
    const user = this.auth.user();
    if (!user) return;
    this.api.getTasks(user.id, 'pending', undefined, undefined).pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout(15_000),
      catchError(() => of([])),
    ).subscribe(tasks => {
      this.tasks = (Array.isArray(tasks) ? tasks : []).filter(t => t.subjectId === this.selectedSubjectId && t.status !== 'completed');
    });
  }

  get displayTime(): string {
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  get progress(): number {
    const total = (this.isBreak() ? this.breakDuration : this.workDuration) * 60;
    return total > 0 ? ((total - this.timeLeft) / total) * 100 : 0;
  }

  private permissionRequested = false;

  private sendNotification(title: string, body: string): void {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    } else if (Notification.permission !== 'denied' && !this.permissionRequested) {
      this.permissionRequested = true;
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body, icon: '/favicon.ico' });
        }
      });
    }
  }

  private playBeep(): void {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);

      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1100;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.5);
      }, 200);
    } catch {
      // Audio not available
    }
  }

  start(): void {
    if (!this.selectedSubjectId) {
      this.toast.error('Selecione uma matéria');
      return;
    }
    if (this.isRunning()) return;

    if (this.timeLeft <= 0) {
      this.timeLeft = this.workDuration * 60;
      this.isBreak.set(false);
    }

    this.isRunning.set(true);
    this.intervalId = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.stop();
        this.onTimerComplete();
      }
    }, 1000);
  }

  pause(): void {
    this.isRunning.set(false);
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset(): void {
    this.pause();
    this.timeLeft = this.workDuration * 60;
    this.isBreak.set(false);
  }

  @HostListener('document:keydown.space', ['$event'])
  handleSpace(event: Event): void {
    const tag = (event.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    event.preventDefault();
    if (this.isRunning()) {
      this.pause();
    } else {
      this.start();
    }
  }

  @HostListener('document:keydown.r', ['$event'])
  handleR(event: Event): void {
    const tag = (event.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    event.preventDefault();
    this.reset();
  }

  private stop(): void {
    this.isRunning.set(false);
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private onTimerComplete(): void {
    this.playBeep();

    const user = this.auth.user();
    if (!user || !this.selectedSubjectId) return;

    if (this.isBreak()) {
      this.toast.success('Pausa finalizada! Pronto para o próximo foco.');
      this.sendNotification('Kognita — Pausa finalizada', 'Hora de voltar ao foco!');
      return;
    }

    this.saving.set(true);
    const duration = this.workDuration;
    const now = new Date().toISOString().split('T')[0];

    this.api.createSession({
      subjectId: this.selectedSubjectId,
      durationMinutes: duration,
      notes: this.selectedTaskId ? `Pomodoro: foco em tarefa` : `Sessão Pomodoro #${this.sessionCount + 1}`,
      date: now,
    }, user.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout(15_000),
        catchError(() => of(null)),
    ).subscribe({
      next: (res) => {
        if (res) {
          this.sessionCount++;
          this.toast.success(`Sessão salva! (${duration} min)`);
          this.sendNotification('Kognita — Foco concluído! 🎯', `${duration} min de estudo registrados. Hora da pausa!`);
          this.saving.set(false);
          this.timeLeft = this.breakDuration * 60;
          this.isBreak.set(true);
        }
      },
    });
  }
}
