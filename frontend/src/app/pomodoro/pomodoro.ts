import { Component, OnInit, inject, signal, DestroyRef, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { catchError, of, timeout } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { ConfettiService } from '../services/confetti.service';
import { Checkin } from '../checkin/checkin';
import { Confirm } from '../confirm/confirm';
import { Subject } from '../models/subject';
import { Task } from '../models/task';

@Component({
  selector: 'app-pomodoro',
  imports: [FormsModule, Checkin, Confirm],
  templateUrl: './pomodoro.html',
  styleUrl: './pomodoro.css',
})
export class Pomodoro implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private confetti = inject(ConfettiService);

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
  showCheckin = signal(false);
  showConfirmTaskComplete = signal(false);

  // Zen Mode
  zenMode = signal(false);
  selectedAmbientSound = 'none';
  zenParticles = Array.from({ length: 20 }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 6,
    size: 1 + Math.random() * 2,
  }));
  private audioContext: AudioContext | null = null;
  private whiteNoiseNode: AudioBufferSourceNode | null = null;
  private noiseFilterNode: BiquadFilterNode | null = null;

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => {
      this.stopAmbientSound();
    });

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params['subjectId']) {
        this.selectedSubjectId = params['subjectId'];
      }
    });

    this.auth
      .waitForUser()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of(null)),
      )
      .subscribe((user) => {
        if (user) {
          this.loadSubjects();
        }
      });
  }

  private loadSubjects(): void {
    const user = this.auth.user();
    if (!user) return;
    this.api
      .getSubjects(user.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        timeout(15_000),
        catchError(() => of([])),
      )
      .subscribe((s) => {
        this.subjects = Array.isArray(s) ? s : [];
        if (this.selectedSubjectId) {
          this.onSubjectChange();
        }
      });
  }

  isWeeklySubject(id: string): boolean {
    if (!this.subjects || this.subjects.length === 0) return false;
    const sorted = [...this.subjects].sort((a, b) => a.id.localeCompare(b.id));
    const now = new Date();
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    const weekOfYear = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
    const weeklySub = sorted[weekOfYear % sorted.length];
    return weeklySub ? weeklySub.id === id : false;
  }

  onSubjectChange(): void {
    this.selectedTaskId = '';
    if (!this.selectedSubjectId) {
      this.tasks = [];
      return;
    }
    const user = this.auth.user();
    if (!user) return;
    this.api
      .getTasks(user.id, 'pending', undefined, undefined)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        timeout(15_000),
        catchError(() => of([])),
      )
      .subscribe((tasks) => {
        this.tasks = (Array.isArray(tasks) ? tasks : []).filter(
          (t) => t.subjectId === this.selectedSubjectId && t.status !== 'completed',
        );
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
    try {
      if (!('Notification' in window)) return;

      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      } else if (Notification.permission !== 'denied' && !this.permissionRequested) {
        this.permissionRequested = true;
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            try {
              new Notification(title, { body, icon: '/favicon.ico' });
            } catch {}
          }
        }).catch(() => {});
      }
    } catch {}
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

  get selectedSubjectName(): string {
    const sub = this.subjects.find((s) => s.id === this.selectedSubjectId);
    return sub ? sub.name : 'Sessão Livre';
  }

  get selectedTaskTitle(): string | null {
    const task = this.tasks.find((t) => t.id === this.selectedTaskId);
    return task ? task.title : null;
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

  private targetEndTime: number | null = null;
  private originalDocumentTitle = typeof document !== 'undefined' ? document.title : 'Kognita';

  start(): void {
    if (!this.selectedSubjectId) {
      this.toast.error('Selecione uma matéria');
      return;
    }
    if (this.isRunning()) return;

    if (this.timeLeft <= 0) {
      this.timeLeft = (this.isBreak() ? this.breakDuration : this.workDuration) * 60;
    }

    this.targetEndTime = Date.now() + this.timeLeft * 1000;
    this.triggerHaptic('start');
    this.isRunning.set(true);

    this.intervalId = setInterval(() => {
      if (!this.targetEndTime) return;
      const remaining = Math.max(0, Math.ceil((this.targetEndTime - Date.now()) / 1000));
      this.timeLeft = remaining;
      this.updateDocumentTitle();

      if (this.timeLeft <= 0) {
        this.stop();
        this.onTimerComplete();
      }
    }, 500);
  }

  private updateDocumentTitle(): void {
    if (typeof document === 'undefined') return;
    if (this.isRunning()) {
      const emoji = this.isBreak() ? '☕' : '🎯';
      document.title = `(${this.displayTime}) ${emoji} Kognita - ${this.isBreak() ? 'Pausa' : 'Foco'}`;
    } else {
      document.title = this.originalDocumentTitle;
    }
  }

  pause(): void {
    if (this.isRunning()) {
      this.triggerHaptic('pause');
    }
    this.stop();
  }

  reset(): void {
    this.triggerHaptic('reset');
    this.stop();
    this.timeLeft = this.workDuration * 60;
    this.isBreak.set(false);
    this.targetEndTime = null;
    this.updateDocumentTitle();
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

  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(event: Event): void {
    if (this.zenMode()) {
      event.preventDefault();
      this.toggleZenMode();
    }
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    if (typeof document !== 'undefined' && !document.fullscreenElement && this.zenMode()) {
      this.zenMode.set(false);
    }
  }

  private stop(): void {
    this.isRunning.set(false);
    this.targetEndTime = null;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.updateDocumentTitle();
  }

  private onTimerComplete(): void {
    this.triggerHaptic('complete');
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

    this.api
      .createSession(
        {
          subjectId: this.selectedSubjectId,
          durationMinutes: duration,
          notes: this.selectedTaskId
            ? `Pomodoro: foco em tarefa`
            : `Sessão Pomodoro #${this.sessionCount + 1}`,
          date: now,
        },
        user.id,
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        timeout(15_000),
        catchError(() => of(null)),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (res) => {
          if (res) {
            this.sessionCount++;
            this.toast.success(`Sessão salva! (${duration} min)`);
            this.confetti.fireConfetti();
            this.sendNotification(
              'Kognita — Foco concluído! 🎯',
              `${duration} min de estudo registrados. Hora da pausa!`,
            );
            this.timeLeft = this.breakDuration * 60;
            if (this.selectedTaskId) {
              this.showConfirmTaskComplete.set(true);
            } else {
              this.isBreak.set(true);
            }
          }
        },
      });
  }

  
  handleTaskCompleteConfirm(): void {
    this.showConfirmTaskComplete.set(false);
    this.showCheckin.set(true);
  }

  handleTaskCompleteCancel(): void {
    this.showConfirmTaskComplete.set(false);
    this.isBreak.set(true);
    // User didn't complete it, just go to break.
  }

  handleCheckin(usedAi: boolean): void {
    if (!this.selectedTaskId) return;
    const user = this.auth.user();
    if (!user) return;
    
    this.saving.set(true);
    this.api
      .createChallengeAttempt({ taskId: this.selectedTaskId, usedAi }, user.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: () => {
          this.toast.success(usedAi ? 'Registrado (com IA)' : 'Desafio concluído sem IA!');
          this.api.updateTaskStatus(this.selectedTaskId, 'completed').subscribe(() => {
            this.selectedTaskId = ''; // Clear task
            this.onSubjectChange(); // Refresh task list
            this.showCheckin.set(false);
            this.isBreak.set(true); // Now we start the break
          });
        },
        error: () => {
          this.showCheckin.set(false);
          this.isBreak.set(true);
        },
      });
  }

  handleCheckinCancel(): void {
    this.showCheckin.set(false);
    this.isBreak.set(true);
  }

  toggleZenMode(): void {
    this.zenMode.update((v) => !v);
  }

  onAmbientSoundChange(): void {
    this.stopAmbientSound();
    if (this.selectedAmbientSound !== 'none') {
      this.playAmbientSound(this.selectedAmbientSound);
    }
  }

  private playAmbientSound(type: string): void {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const bufferSize = 2 * this.audioContext.sampleRate;
      const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.whiteNoiseNode = this.audioContext.createBufferSource();
      this.whiteNoiseNode.buffer = noiseBuffer;
      this.whiteNoiseNode.loop = true;

      this.noiseFilterNode = this.audioContext.createBiquadFilter();
      this.noiseFilterNode.type = 'lowpass';

      if (type === 'brown') {
        this.noiseFilterNode.frequency.value = 250; // Deep Ocean / Waterfall
      } else if (type === 'pink') {
        this.noiseFilterNode.frequency.value = 650; // Rain / Wind
      } else {
        this.noiseFilterNode.frequency.value = 1500; // Bright Static Noise
      }

      const gainNode = this.audioContext.createGain();
      gainNode.gain.setValueAtTime(0.04, this.audioContext.currentTime); // Low background volume

      this.whiteNoiseNode.connect(this.noiseFilterNode);
      this.noiseFilterNode.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      this.whiteNoiseNode.start(0);
    } catch {
      // AudioContext not supported or blocked
    }
  }

  private stopAmbientSound(): void {
    try {
      if (this.whiteNoiseNode) {
        this.whiteNoiseNode.stop();
        this.whiteNoiseNode.disconnect();
        this.whiteNoiseNode = null;
      }
      if (this.noiseFilterNode) {
        this.noiseFilterNode.disconnect();
        this.noiseFilterNode = null;
      }
    } catch {
      // Ignore errors stopping audio nodes
    }
  }
}
