import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, forkJoin, of, timeout, tap, EMPTY } from 'rxjs';
import { ConfigService } from '../services/config.service';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';
import { Skeleton } from '../skeleton/skeleton';
import { Subject } from '../models/subject';
import { Task } from '../models/task';
import { StudyGoal } from '../models/study-goal';
import { StudySession } from '../models/study-session';
import { ChallengeStats } from '../models/challenge-attempt';
import { ChallengeGoal } from '../models/challenge-goal';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, Skeleton, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private auth = inject(AuthService);
  protected config = inject(ConfigService);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  subjects: Subject[] = [];
  allTasks: Task[] = [];
  pendingTasks: Task[] = [];
  goals: StudyGoal[] = [];
  sessions: StudySession[] = [];

  hoursPerSubject: { name: string; hours: number; color: string }[] = [];
  weeklyProgress: { day: string; hours: number }[] = [];
  taskCompletionRate = 0;

  loading = signal(true);
  challengeStats = signal<ChallengeStats | null>(null);
  challengeGoals = signal<ChallengeGoal[]>([]);
  pendingPageSize = 5;
  pendingShowAll = signal(false);

  get maxHours(): number {
    return Math.max(...this.hoursPerSubject.map(s => s.hours), 1);
  }

  get maxWeekly(): number {
    return Math.max(...this.weeklyProgress.map(w => w.hours), 1);
  }

  get confidenceSkills() {
    return this.challengeStats()?.skills?.sort((a, b) => b.confidencePercent - a.confidencePercent) ?? [];
  }

  get streak() {
    return this.challengeStats()?.currentStreak ?? 0;
  }

  get totalWithoutAi() {
    return this.challengeStats()?.totalWithoutAi ?? 0;
  }

  get isNewUser(): boolean {
    return !this.loading() && this.subjects.length === 0 && this.allTasks.length === 0 && this.sessions.length === 0;
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
        this.loadDashboard(user);
      }),
    ).subscribe();
  }

  private loadDashboard(user: { id: string }): void {
    forkJoin({
      subjects: this.api.getSubjects(user.id).pipe(
        timeout(15_000),
        catchError(() => of([] as Subject[])),
      ),
      tasks: this.api.getTasks(user.id).pipe(
        timeout(15_000),
        catchError(() => of([] as Task[])),
      ),
      goals: this.api.getGoals(user.id).pipe(
        timeout(15_000),
        catchError(() => of([] as StudyGoal[])),
      ),
      sessions: this.api.getSessions().pipe(
        timeout(15_000),
        catchError(() => of([] as StudySession[])),
      ),
      challengeStats: this.api.getChallengeStats().pipe(
        timeout(15_000),
        catchError(() => of(null)),
      ),
      challengeGoals: this.api.getChallengeGoals().pipe(
        timeout(15_000),
        catchError(() => of([] as ChallengeGoal[])),
      ),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (r) => {
        this.subjects = Array.isArray(r.subjects) ? r.subjects : [];
        this.allTasks = Array.isArray(r.tasks) ? r.tasks : [];
        this.pendingTasks = this.allTasks.filter((x) => x && x.status !== 'completed');
        this.goals = Array.isArray(r.goals) ? r.goals : [];
        this.sessions = Array.isArray(r.sessions) ? r.sessions : [];
        this.challengeStats.set(r.challengeStats);
        this.challengeGoals.set(Array.isArray(r.challengeGoals) ? r.challengeGoals : []);
        this.computeCharts();
        this.checkGoalReminders();
      },
      error: () => {},
    });
  }

  get upcomingTasks(): Task[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    return this.allTasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      const due = new Date(t.dueDate);
      due.setHours(0, 0, 0, 0);
      return due >= today && due <= threeDaysFromNow;
    }).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  }

  private computeCharts(): void {
    const subjectMap = new Map<string, { name: string; hours: number; color: string }>();
    for (const subj of this.subjects) {
      subjectMap.set(subj.id, { name: subj.name, hours: 0, color: subj.color });
    }
    for (const ses of this.sessions) {
      const entry = subjectMap.get(ses.subjectId);
      if (entry) {
        entry.hours += ses.durationMinutes / 60;
      }
    }
    this.hoursPerSubject = Array.from(subjectMap.values()).filter(s => s.hours > 0);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weekMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      weekMap.set(key, 0);
    }
    for (const ses of this.sessions) {
      if (weekMap.has(ses.date)) {
        weekMap.set(ses.date, weekMap.get(ses.date)! + ses.durationMinutes / 60);
      }
    }
    this.weeklyProgress = Array.from(weekMap.entries()).map(([dateStr, hours]) => {
      const d = new Date(dateStr + 'T00:00:00');
      return { day: dayNames[d.getDay()], hours: Math.round(hours * 10) / 10 };
    });

    const completed = this.allTasks.filter(t => t.status === 'completed').length;
    const total = this.allTasks.length;
    this.taskCompletionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  // Quick-add session
  quickSubjectId = '';
  quickDuration = 25;
  saving = signal(false);
  completingTaskId = signal<string | null>(null);

  quickAddSession(): void {
    if (!this.quickSubjectId || !this.quickDuration) {
      this.toast.error('Selecione uma matéria e duração');
      return;
    }
    const user = this.auth.user();
    if (!user) return;
    this.saving.set(true);
    const now = new Date().toISOString().split('T')[0];
    this.api.createSession({
      subjectId: this.quickSubjectId,
      durationMinutes: this.quickDuration,
      notes: '',
      date: now,
    }, user.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success(`Sessão de ${this.quickDuration}min registrada!`);
        this.saving.set(false);
        this.refreshAfterSession(user.id);
      },
      error: () => { this.saving.set(false); },
    });
  }

  quickCompleteTask(task: Task): void {
    this.completingTaskId.set(task.id);
    this.api.updateTaskStatus(task.id, 'completed').pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.completingTaskId.set(null)),
    ).subscribe({
      next: () => {
        this.toast.success('Tarefa concluída!');
        const user = this.auth.user();
        if (user) this.refreshAfterTask(user.id);
      },
      error: () => {},
    });
  }

  private refreshAfterSession(userId: string): void {
    forkJoin({
      sessions: this.api.getSessions().pipe(catchError(() => of([] as StudySession[]))),
      challengeStats: this.api.getChallengeStats().pipe(catchError(() => of(null))),
      challengeGoals: this.api.getChallengeGoals().pipe(catchError(() => of([] as ChallengeGoal[]))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => {
      this.sessions = Array.isArray(r.sessions) ? r.sessions : [];
      this.challengeStats.set(r.challengeStats);
      this.challengeGoals.set(Array.isArray(r.challengeGoals) ? r.challengeGoals : []);
      this.computeCharts();
    });
  }

  private refreshAfterTask(userId: string): void {
    forkJoin({
      tasks: this.api.getTasks(userId).pipe(catchError(() => of([] as Task[]))),
      challengeStats: this.api.getChallengeStats().pipe(catchError(() => of(null))),
      challengeGoals: this.api.getChallengeGoals().pipe(catchError(() => of([] as ChallengeGoal[]))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => {
      this.allTasks = Array.isArray(r.tasks) ? r.tasks : [];
      this.pendingTasks = this.allTasks.filter(x => x.status !== 'completed');
      this.challengeStats.set(r.challengeStats);
      this.challengeGoals.set(Array.isArray(r.challengeGoals) ? r.challengeGoals : []);
      this.computeCharts();
    });
  }

  startPomodoro(task: Task): void {
    this.router.navigate(['/pomodoro'], { queryParams: { subjectId: task.subjectId } });
  }

  isTaskOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(task.dueDate) < today;
  }

  private checkGoalReminders(): void {
    const today = new Date();
    for (const goal of this.challengeGoals()) {
      const deadline = new Date(goal.deadlineDate);
      const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDeadline >= 0 && daysUntilDeadline <= 3) {
        if (goal.currentCount < goal.targetCount) {
          this.toast.info(`Meta de desafio quase vencendo: ${goal.currentCount}/${goal.targetCount} concluídos. Faltam ${daysUntilDeadline} dias.`);
        }
      }
    }
  }
}
